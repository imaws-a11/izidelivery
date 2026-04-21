import React from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const progressPct = Math.min((userXP / nextLevelXP) * 100, 100);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {
      icon: "location_on",
      label: "Meus Endereços",
      sub: "Gestão de locais salvos",
      action: () => setSubView?.("addresses"),
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      icon: "payments",
      label: "Métodos de Pagamento",
      sub: "Cartões, PIX e Izi Coin",
      action: () => setSubView?.("payments"),
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      icon: "verified_user",
      label: "Segurança e Privacidade",
      sub: "Proteja seus dados",
      action: () => {},
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      icon: "workspace_premium",
      label: "Izi Black Elite",
      sub: "Acesso total a benefícios VIP",
      action: () => setSubView?.("izi_black_purchase"),
      isPremium: true,
    },
    {
      icon: "support_agent",
      label: "Suporte Prioritário",
      sub: "Fale com nosso Concierge",
      action: () => {},
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-40 relative">
      {/* Background Decorative Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-yellow-400/5 blur-[150px] -mr-64 -mt-64 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-yellow-400/5 blur-[120px] -ml-40 -mb-40 pointer-events-none" />

      {/* STICKY HEADER LUXURY */}
      <header className="sticky top-0 z-[100] px-6 py-8 flex items-center justify-between bg-black/60 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab("home")}
            className="w-12 h-12 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center shadow-[10px_10px_20px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05)] text-white"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
              Elite <span className="text-yellow-400">Profile</span>
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
               <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
               <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em]">Personal Space</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="size-12 rounded-2xl bg-zinc-900/50 border border-red-500/20 flex items-center justify-center text-red-500 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined font-black">power_settings_new</span>
        </motion.button>
      </header>

      <main className="px-6 py-10 space-y-10 relative z-10">

        {/* === HERO PROFILE CARD (DESIGN CATÁLOGO LUXO) === */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[48px] p-1 shadow-[25px_25px_60px_rgba(0,0,0,0.8)]"
          style={{
            background: "linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(20,20,20,1) 40%, rgba(10,10,10,1) 100%)",
          }}
        >
          <div className="bg-zinc-950/40 backdrop-blur-2xl rounded-[46px] p-8 relative overflow-hidden border border-white/5">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/images/pattern-gold.png')" }} />
            
            <div className="flex flex-col items-center relative z-10">
              {/* Avatar Elite Section */}
              <div className="relative mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative size-32 rounded-[42px] p-1.5 bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-2xl"
                >
                  <div className="size-full rounded-[38px] bg-zinc-900 overflow-hidden relative group">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`}
                      alt="Profile"
                      className="size-full object-cover rounded-[38px] group-hover:scale-110 group-hover:rotate-3 transition-all duration-700"
                    />
                    <div 
                      onClick={() => onEditPhoto?.()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 cursor-pointer backdrop-blur-sm"
                    >
                      <span className="material-symbols-outlined text-white text-3xl font-black">edit_square</span>
                    </div>
                  </div>
                </motion.div>

                {/* Status Badge */}
                <div className="absolute -bottom-2 translate-x-1/2 right-1/2 bg-black text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-400/30 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.05)] flex items-center gap-1.5 min-w-[100px] justify-center">
                   <span className="material-symbols-outlined text-[12px] fill-1">verified</span>
                   <span className="text-[10px] font-black uppercase tracking-widest">Vip Elite</span>
                </div>
              </div>

              {/* Identity Section */}
              <div className="text-center space-y-4 w-full">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
                  {userName || "Izi Member"}
                </h2>
                
                {/* ID Badge */}
                <div className="inline-flex flex-col items-center gap-1">
                   <p className="text-zinc-600 font-black text-[8px] uppercase tracking-[0.5em]">Membership ID</p>
                   <p className="text-zinc-400 font-mono text-[10px] bg-white/5 px-4 py-1 rounded-full border border-white/5">#IZI-{String(userId).slice(-6).toUpperCase()}</p>
                </div>
              </div>

              {/* Progress Mastery Elite */}
              <div className="w-full mt-10 space-y-3">
                <div className="flex justify-between items-end px-2">
                  <div className="flex flex-col">
                    <span className="text-yellow-400 font-black text-xs uppercase tracking-tighter">Tier Level {userLevel}</span>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Mastery Evolution</span>
                  </div>
                  <span className="text-sm font-black text-white">{userXP} <span className="text-zinc-600 text-[10px] not-italic">/ {nextLevelXP} XP</span></span>
                </div>
                <div className="h-4 w-full bg-zinc-900 rounded-2xl p-1 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8)] border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="h-full rounded-xl relative overflow-hidden"
                    style={{ background: "linear-gradient(90deg, #ca8a04, #facc15)" }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* === STATS BENTO BOX (PREMIUM) === */}
        <section className="grid grid-cols-2 gap-5">
           <motion.div
             whileHover={{ y: -5 }}
             className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group"
           >
              <div className="absolute top-0 right-0 size-24 bg-emerald-400/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-400/10 transition-all" />
              <div className="flex items-center gap-3 mb-4">
                 <div className="size-10 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 border border-emerald-400/20">
                    <span className="material-symbols-outlined text-xl font-black">payments</span>
                 </div>
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Saldo Atual</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter leading-none">R$ {walletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h3>
           </motion.div>

           <motion.div
             whileHover={{ y: -5 }}
             onClick={() => setTab("wallet")}
             className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group cursor-pointer"
           >
              <div className="absolute top-0 right-0 size-24 bg-blue-400/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-400/10 transition-all" />
              <div className="flex items-center gap-3 mb-4">
                 <div className="size-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400 border border-blue-400/20">
                    <span className="material-symbols-outlined text-xl font-black">account_balance_wallet</span>
                 </div>
                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Izi Wallet</span>
              </div>
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-black text-white tracking-tighter leading-none">Acessar</h3>
                 <span className="material-symbols-outlined text-zinc-700 group-hover:text-blue-400 transition-colors">arrow_forward</span>
              </div>
           </motion.div>
        </section>

        {/* === MENU LIST LUXURY SELECTION === */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Elite Settings</h3>
            <span className="text-[9px] font-black text-yellow-400/50 uppercase tracking-widest">v 4.2.0</span>
          </div>

          <div className="space-y-3">
            {menuItems.map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 8, backgroundColor: "rgba(255,255,255,0.02)" }}
                whileTap={{ scale: 0.98 }}
                onClick={item.action}
                className={`w-full p-6 rounded-[34px] flex items-center justify-between transition-all relative overflow-hidden border ${item.isPremium ? 'bg-yellow-400 border-yellow-500 shadow-[0_20px_40px_rgba(250,204,21,0.15)]' : 'bg-white/[0.03] border-white/5 shadow-xl'}`}
              >
                {item.isPremium && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 opacity-10 animate-pulse" />
                )}
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg ${item.isPremium ? "bg-black/10" : (item.bg || "bg-zinc-800/40")} border ${item.isPremium ? 'border-black/5' : 'border-white/5'}`}>
                    <span className={`material-symbols-outlined text-2xl font-black ${item.isPremium ? "text-black" : (item.color || "text-yellow-400")}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className={`text-base font-black tracking-tight leading-none ${item.isPremium ? "text-black" : "text-white"}`}>
                      {item.label}
                    </h4>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 ${item.isPremium ? "text-black/50" : "text-zinc-600"}`}>
                      {item.sub}
                    </p>
                  </div>
                </div>

                <div className={`size-10 rounded-full flex items-center justify-center ${item.isPremium ? "bg-black/10 shadow-inner" : "bg-zinc-950 border border-white/5"} relative z-10`}>
                   <span className={`material-symbols-outlined text-xs font-black ${item.isPremium ? "text-black" : "text-zinc-700"}`}>arrow_forward_ios</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Brand Footer */}
        <div className="flex flex-col items-center pt-8">
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-px bg-yellow-400/20" />
              <img src="/images/logo-footer.png" className="w-12 opacity-30 grayscale" alt="Izi" />
              <div className="w-8 h-px bg-yellow-400/20" />
           </div>
           <p className="text-[8px] font-black uppercase tracking-[0.6em] text-zinc-700">Digital Luxury Ecosystem</p>
           <p className="text-[7px] font-bold text-zinc-800 mt-2 uppercase tracking-widest">© 2026 Izi Global Technologies</p>
        </div>
      </main>
    </div>
  );
};
