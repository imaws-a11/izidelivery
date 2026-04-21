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
  const progressPct = Math.min((userXP / nextLevelXP) * 100, 100);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {
      icon: "location_on",
      label: "Meus Endereços",
      sub: "Locais salvos",
      action: () => setSubView?.("addresses"),
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      icon: "payments",
      label: "Pagamentos",
      sub: "Cartões e PIX",
      action: () => setSubView?.("payments"),
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      icon: "workspace_premium",
      label: "Clube Izi Black",
      sub: "Benefícios exclusivos",
      action: () => setSubView?.("izi_black_purchase"),
      isPremium: true,
    },
    {
      icon: "help_center",
      label: "Ajuda & Suporte",
      sub: "Fale com o Izi",
      action: () => {},
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 overflow-y-auto no-scrollbar pb-40"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header Clay */}
      <header
        className="sticky top-0 z-50 px-6 py-6 flex items-center justify-between"
        style={{
          background: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setTab("home")}
            style={{
              boxShadow: "8px 8px 20px rgba(0,0,0,0.6), inset 3px 3px 6px rgba(255,255,255,0.07), inset -3px -3px 6px rgba(0,0,0,0.5)",
            }}
            className="w-12 h-12 rounded-[22px] bg-zinc-900 flex items-center justify-center transition-all text-white"
          >
            <span className="material-symbols-outlined font-black">arrow_back_ios_new</span>
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
              Meu <span className="text-yellow-400">Perfil</span>
            </h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Configurações</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          style={{
            boxShadow: "8px 8px 20px rgba(0,0,0,0.6), inset 2px 2px 4px rgba(255,100,100,0.08), inset -2px -2px 4px rgba(0,0,0,0.5)",
          }}
          className="size-12 rounded-full bg-zinc-900 flex items-center justify-center text-red-500 transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
        </motion.button>
      </header>

      <main className="px-5 py-10 space-y-8">

        {/* === CARD PRINCIPAL DO USUÁRIO === */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[45px] p-8"
          style={{
            background: "linear-gradient(145deg, #1a1a1a 0%, #111111 100%)",
            boxShadow: "20px 20px 50px rgba(0,0,0,0.7), inset 4px 4px 10px rgba(255,255,255,0.04), inset -4px -4px 10px rgba(0,0,0,0.5)",
          }}
        >
          {/* Glow decorativo */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="flex flex-col items-center gap-7 relative z-10">
            {/* Avatar clay */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onEditPhoto?.()}
                className="relative size-28 rounded-[40px] overflow-hidden group transition-all"
                style={{
                  boxShadow: "15px 15px 35px rgba(0,0,0,0.7), inset 3px 3px 8px rgba(255,255,255,0.12), inset -3px -3px 8px rgba(0,0,0,0.6), 0 0 0 3px rgba(250,204,21,0.25)",
                }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`}
                  alt="User"
                  className="size-full object-cover rounded-[36px] group-hover:brightness-50 transition-all"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                </div>
              </motion.button>

              {isIziBlackMembership && (
                <div
                  className="absolute -bottom-2 -right-2 bg-yellow-400 text-black size-10 rounded-[18px] flex items-center justify-center border-4 border-zinc-950 z-20"
                  style={{ boxShadow: "0 8px 20px rgba(250,204,21,0.4), inset 2px 2px 4px rgba(255,255,255,0.7)" }}
                >
                  <span className="material-symbols-outlined text-xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                </div>
              )}
            </div>

            {/* Nome e nível */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
                {userName || "Usuário"}
              </h2>
              <div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
                style={{
                  background: "#facc15",
                  boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.6), inset -3px -3px 6px rgba(0,0,0,0.25), 0 8px 20px rgba(250,204,21,0.25)",
                }}
              >
                <span className="material-symbols-outlined text-black text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-[11px] font-black text-black uppercase tracking-widest">Nível {userLevel}</span>
              </div>
            </div>

            {/* Barra de XP */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Mastery XP</p>
                <p className="text-[11px] font-black italic text-white">
                  {userXP} <span className="text-zinc-600 not-italic">/ {nextLevelXP}</span>
                </p>
              </div>
              <div
                className="h-4 w-full rounded-full p-1 overflow-hidden"
                style={{
                  background: "#0a0a0a",
                  boxShadow: "inset 3px 3px 8px rgba(0,0,0,0.7), inset -1px -1px 3px rgba(255,255,255,0.03)",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #ca8a04, #facc15)",
                    boxShadow: "0 0 12px rgba(250,204,21,0.5), inset 1px 1px 3px rgba(255,255,255,0.4)",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* === GRID STATS === */}
        <section className="grid grid-cols-2 gap-4">
          {[
            {
              icon: "payments",
              label: "Saldo Izi",
              value: `R$ ${walletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              iconColor: "text-yellow-400",
              iconBg: "bg-yellow-400/10",
              onClick: undefined,
            },
            {
              icon: "account_balance_wallet",
              label: "Izi Pay",
              value: "Expandir",
              iconColor: "text-blue-400",
              iconBg: "bg-blue-400/10",
              onClick: () => setTab("wallet"),
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              whileTap={stat.onClick ? { scale: 0.96 } : {}}
              onClick={stat.onClick}
              className={`p-7 rounded-[38px] flex flex-col gap-4 ${stat.onClick ? "cursor-pointer" : ""}`}
              style={{
                background: "linear-gradient(145deg, #181818 0%, #111 100%)",
                boxShadow: "15px 15px_35px rgba(0,0,0,0.6), inset 3px 3px 7px rgba(255,255,255,0.04), inset -3px -3px 7px rgba(0,0,0,0.5)".replace(/_/g, " "),
              }}
            >
              <div
                className={`size-12 rounded-[18px] flex items-center justify-center ${stat.iconBg}`}
                style={{ boxShadow: "inset 2px 2px 5px rgba(255,255,255,0.06), inset -2px -2px 5px rgba(0,0,0,0.4)" }}
              >
                <span className={`material-symbols-outlined text-xl ${stat.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-lg font-black text-white italic tracking-tight leading-none">{stat.value}</h4>
              </div>
            </motion.div>
          ))}
        </section>

        {/* === MENU ITEMS === */}
        <section className="space-y-4">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] px-2">Preferências e Conta</p>

          {menuItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={item.action}
              className="w-full p-6 rounded-[38px] flex items-center justify-between group transition-all"
              style={
                item.isPremium
                  ? {
                      background: "#facc15",
                      boxShadow: "inset 4px 4px 10px rgba(255,255,255,0.6), inset -4px -4px 10px rgba(0,0,0,0.2), 0 12px 30px rgba(250,204,21,0.25)",
                    }
                  : {
                      background: "linear-gradient(145deg, #161616 0%, #101010 100%)",
                      boxShadow: "12px 12px 30px rgba(0,0,0,0.6), inset 3px 3px 6px rgba(255,255,255,0.04), inset -3px -3px 6px rgba(0,0,0,0.5)",
                    }
              }
            >
              <div className="flex items-center gap-5">
                <div
                  className={`size-14 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-110 ${item.isPremium ? "bg-black/10" : (item.bg || "bg-zinc-800/50")}`}
                  style={!item.isPremium ? { boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.5), inset -1px -1px 3px rgba(255,255,255,0.04)" } : {}}
                >
                  <span
                    className={`material-symbols-outlined text-2xl font-black ${item.isPremium ? "text-black" : (item.color || "text-yellow-400")}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div className="text-left">
                  <h4 className={`text-base font-black italic tracking-tight leading-none ${item.isPremium ? "text-black" : "text-white"}`}>
                    {item.label}
                  </h4>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 ${item.isPremium ? "text-black/60" : "text-zinc-600"}`}>
                    {item.sub}
                  </p>
                </div>
              </div>
              <div
                className={`size-10 rounded-full flex items-center justify-center ${item.isPremium ? "bg-black/10" : "bg-zinc-950"}`}
                style={!item.isPremium ? { boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.7), inset -1px -1px 3px rgba(255,255,255,0.03)" } : {}}
              >
                <span className={`material-symbols-outlined text-sm font-black ${item.isPremium ? "text-black" : "text-zinc-700 group-hover:text-yellow-400 transition-colors"}`}>
                  arrow_forward_ios
                </span>
              </div>
            </motion.button>
          ))}
        </section>

        {/* Footer */}
        <div className="flex flex-col items-center py-8 opacity-25">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500">Izi Delivery App</p>
          <p className="text-[8px] font-bold text-zinc-600 mt-2">Versão 4.2.0 • Premium Build</p>
        </div>
      </main>
    </div>
  );
};
