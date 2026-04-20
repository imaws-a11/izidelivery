import React from "react";
import { motion } from "framer-motion";

interface ProfileViewProps {
  userId: string | null;
  userName: string | null;
  userLevel: number;
  userXP: number;
  walletBalance?: number;
  logout: () => Promise<void>;
  setSubView?: (view: string) => void;
  isIziBlackMembership: boolean;
  setTab: (tab: "home" | "orders" | "wallet" | "profile") => void;
  onEditPhoto?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userId,
  userName,
  userLevel,
  userXP,
  walletBalance = 0,
  logout,
  setSubView,
  isIziBlackMembership,
  setTab,
  onEditPhoto,
}) => {
  const nextLevelXP = (userLevel + 1) * 1000;

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { 
      icon: "location_on", 
      label: "Meus Endereços", 
      sub: "Locais salvos", 
      action: () => setSubView?.("addresses"),
      color: "text-blue-400"
    },
    { 
      icon: "payments", 
      label: "Pagamentos", 
      sub: "Cartões e PIX", 
      action: () => setSubView?.("payments"),
      color: "text-emerald-400"
    },
    { 
      icon: "workspace_premium", 
      label: "Clube Izi Black", 
      sub: "Benefícios exclusivos", 
      action: () => setSubView?.("izi_black_purchase"),
      isPremium: true
    },
    { 
      icon: "help_center", 
      label: "Ajuda & Suporte", 
      sub: "Fale com o Izi", 
      action: () => {}, // Mock ou subview de suporte
      color: "text-zinc-500"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-40 italic">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 px-6 py-8 bg-black/80 backdrop-blur-2xl border-b border-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setTab("home"); window.history.back(); }}
            className="w-12 h-12 rounded-[22px] bg-[#161616] border-2 border-white/5 flex items-center justify-center active:scale-90 transition-all text-white shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
          >
            <span className="material-symbols-outlined font-black">arrow_back_ios_new</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">Meu <span className="text-yellow-400">Perfil</span></h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Configurações</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="size-12 rounded-full border border-red-500/20 flex items-center justify-center text-red-500 active:bg-red-500/10 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>

      <main className="px-6 py-10 space-y-12">
        {/* User Card Claymorphism */}
        <section className="clay-card bg-[#0d0d0d] p-10 rounded-[55px] border-2 border-white/5 relative overflow-hidden shadow-[25px_25px_50px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/5 rounded-full blur-[60px] translate-x-10 -translate-y-10" />
          
          <div className="flex flex-col items-center gap-8 relative z-10">
            <div className="relative">
              <button 
                onClick={() => onEditPhoto?.()}
                className="size-28 rounded-[40px] clay-card bg-zinc-900 p-1.5 border-2 border-yellow-400/30 overflow-hidden group active:scale-95 transition-all shadow-[15px_15px_30px_rgba(0,0,0,0.5)]"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`}
                  alt="User"
                  className="size-full object-cover rounded-[32px] group-hover:brightness-50 transition-all"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                </div>
              </button>
              {isIziBlackMembership && (
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black size-10 rounded-[18px] flex items-center justify-center shadow-[0_8px_20px_rgba(250,204,21,0.4),inset_2px_2px_4px_rgba(255,255,255,0.7)] border-4 border-black z-20">
                  <span className="material-symbols-outlined text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">{userName || "Usuário"}</h2>
              <div className="flex items-center justify-center gap-3">
                 <div className="clay-card-yellow px-4 py-1 rounded-full text-[10px] font-black text-black uppercase tracking-widest">Nível {userLevel}</div>
              </div>
            </div>

            {/* Progress Bar Premium */}
            <div className="w-full space-y-3 mt-4">
              <div className="flex justify-between items-end px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Mastery</p>
                <p className="text-[12px] font-black italic text-white">{userXP} <span className="text-zinc-600 not-italic">/ {nextLevelXP} XP</span></p>
              </div>
              <div className="h-4 w-full bg-black rounded-full border border-white/5 p-1 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(userXP / nextLevelXP) * 100}%` }}
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 gap-6 px-2">
           <div className="clay-card bg-zinc-900/40 p-8 rounded-[40px] border border-white/5 flex flex-col gap-3 shadow-[15px_15px_30px_rgba(0,0,0,0.3)]">
              <span className="material-symbols-outlined text-yellow-400/80 text-xl">payments</span>
              <div>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Saldo Total</p>
                <h4 className="text-xl font-black text-white italic tracking-tight">R$ {walletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h4>
              </div>
           </div>
           <div className="clay-card bg-zinc-900/40 p-8 rounded-[40px] border border-white/5 flex flex-col gap-3 shadow-[15px_15px_30px_rgba(0,0,0,0.3)] cursor-pointer active:scale-95 transition-all" onClick={() => setTab("wallet")}>
              <span className="material-symbols-outlined text-blue-400/80 text-xl">account_balance_wallet</span>
              <div>
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">IZI Pay</p>
                <h4 className="text-xl font-black text-white italic tracking-tight">Expandir <span className="material-symbols-outlined text-xs align-middle">open_in_new</span></h4>
              </div>
           </div>
        </section>

        {/* Navigation Menu Claymorphism */}
        <section className="space-y-5 px-2">
           <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] ml-4">Preferências e Conta</p>
           {menuItems.map((item, i) => (
             <motion.button 
               key={i}
               whileTap={{ scale: 0.97 }}
               onClick={item.action}
               className={`w-full p-6 rounded-[40px] flex items-center justify-between border-2 border-white/5 group transition-all duration-300 ${item.isPremium ? 'clay-card-yellow !border-none' : 'clay-card bg-[#0a0a0a] hover:bg-[#111111] shadow-[12px_12px_25px_rgba(0,0,0,0.4)]'}`}
             >
                <div className="flex items-center gap-5">
                   <div className={`size-14 rounded-3xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110 ${item.isPremium ? 'bg-black/10' : 'bg-black/60 shadow-inner'}`}>
                      <span className={`material-symbols-outlined text-2xl font-black ${item.isPremium ? 'text-black' : item.color || 'text-yellow-400'}`}>{item.icon}</span>
                   </div>
                   <div className="text-left">
                      <h4 className={`text-base font-black italic tracking-tight leading-none ${item.isPremium ? 'text-black' : 'text-white'}`}>{item.label}</h4>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 ${item.isPremium ? 'text-black/60' : 'text-zinc-600'}`}>{item.sub}</p>
                   </div>
                </div>
                <div className={`size-10 rounded-full flex items-center justify-center transition-all ${item.isPremium ? 'bg-black/10' : 'bg-zinc-950 border border-white/5 shadow-inner'}`}>
                   <span className={`material-symbols-outlined text-base font-black ${item.isPremium ? 'text-black' : 'text-zinc-800 group-hover:text-yellow-400'}`}>arrow_forward_ios</span>
                </div>
             </motion.button>
           ))}
        </section>

        {/* App Info Footer */}
        <div className="flex flex-col items-center py-10 opacity-30">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-600">Izi Delivery App</p>
           <p className="text-[8px] font-bold text-zinc-700 mt-2">Versão 4.2.0 • Premium Build</p>
        </div>
      </main>
    </div>
  );
};
