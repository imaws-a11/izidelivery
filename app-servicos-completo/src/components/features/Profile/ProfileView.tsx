import React from "react";
import { motion } from "framer-motion";

interface ProfileViewProps {
  userId: string | null;
  userName: string | null;
  userLevel: number;
  userXP: number;
  logout: () => Promise<void>;
  setSubView?: (view: string) => void;
  isIziBlackMembership: boolean;
  setTab: (tab: "home" | "orders" | "wallet" | "profile") => void;
  onEditPhoto?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  userName,
  logout,
  setSubView,
}) => {
  const menuItems = [
    { icon: "chat_bubble", label: "Conversas", action: () => {} },
    { icon: "notifications", label: "Notificações", action: () => setSubView?.("notifications_center"), badge: 1 },
    { icon: "description", label: "Dados da conta", action: () => {} },
    { icon: "credit_card", label: "Pagamentos", action: () => setSubView?.("payments") },
    { icon: "star", label: "Clube Izi", action: () => setSubView?.("izi_black_purchase") },
    { icon: "confirmation_number", label: "Cupons", action: () => {} },
    { icon: "lock", label: "Código de entrega", action: () => setSubView?.("delivery_code") },
    { icon: "workspace_premium", label: "Fidelidade", action: () => {} },
    { icon: "favorite", label: "Favoritos", action: () => {} },
    { icon: "volunteer_activism", label: "Doações", action: () => {} },
    { icon: "location_on", label: "Endereços", action: () => setSubView?.("addresses") },
    { icon: "moped", label: "Seja um entregador", action: () => setSubView?.("driver_registration") },
    { icon: "help", label: "Ajuda", action: () => {} },
    { icon: "settings", label: "Configurações", action: () => {} },
    { icon: "security", label: "Segurança", action: () => {} },
    { icon: "share_reviews", label: "Contas conectadas", action: () => {} },
    { icon: "store", label: "Sugerir restaurantes", action: () => {} },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] text-zinc-900 pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100">
        <h1 className="text-xl font-black tracking-tight">Perfil</h1>
      </header>

      {/* USER INFO */}
      <section className="bg-white px-6 py-6 flex items-center gap-4">
        <div className="size-20 rounded-full overflow-hidden bg-yellow-100 border-2 border-white shadow-xl">
           <img 
             src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`} 
             alt="Avatar" 
             className="size-full object-cover"
           />
        </div>
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-zinc-900 leading-tight">{userName || "Pai"}</h2>
          <button className="flex items-center gap-1 mt-1 group">
            <span className="text-yellow-600 text-sm font-bold group-hover:underline">Clube por 1 mês grátis!</span>
            <span className="material-symbols-outlined text-yellow-600 text-sm">chevron_right</span>
          </button>
        </div>
      </section>

      {/* PROMO BANNER (Decolar Style) */}
      <section className="px-4 mt-4">
         <motion.div 
           whileTap={{ scale: 0.98 }}
           className="w-full h-32 rounded-[24px] bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 relative overflow-hidden shadow-lg cursor-pointer"
         >
            <div className="flex items-center gap-2 mb-3">
               <div className="size-8 rounded-full bg-white flex items-center justify-center p-1.5">
                  <img src="https://cdn.icon-icons.com/icons2/2699/PNG/512/decolar_logo_icon_170362.png" alt="Decolar" className="w-full object-contain" />
               </div>
               <span className="text-white text-xs font-bold uppercase tracking-widest opacity-80">decolar</span>
            </div>
            <h3 className="text-white text-lg font-black leading-tight">R$1 = 1 ponto Decolar</h3>
            <p className="text-white/70 text-[10px] font-medium mt-1">Acumule pontos em cada real gasto no Izi!</p>
            
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
               <span className="material-symbols-outlined text-white text-2xl opacity-50">chevron_right</span>
            </div>
         </motion.div>
      </section>

      {/* MENU LIST */}
      <section className="mt-4 bg-white border-y border-zinc-100">
         {menuItems.map((item, i) => (
           <motion.button
             key={i}
             whileTap={{ backgroundColor: "#FAFAFA" }}
             onClick={item.action}
             className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50 last:border-0"
           >
             <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-zinc-800 text-[22px]">{item.icon}</span>
                <span className="text-base font-bold text-zinc-800">{item.label}</span>
             </div>
             <div className="flex items-center gap-3">
                {item.badge && (
                  <span className="size-5 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/20">
                    {item.badge}
                  </span>
                )}
                <span className="material-symbols-outlined text-zinc-300 text-sm">chevron_right</span>
             </div>
           </motion.button>
         ))}
      </section>

      {/* LOGOUT */}
      <section className="px-6 py-10">
         <button 
           onClick={logout}
           className="w-full h-14 rounded-2xl bg-zinc-100 text-zinc-500 font-bold hover:bg-zinc-200 transition-colors"
         >
           Sair
         </button>
      </section>
    </div>
  );
};
