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

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">
      {/* Header com Voltar */}
      <header className="sticky top-0 z-50 px-5 py-4 bg-black/60 backdrop-blur-xl border-b border-zinc-900 flex items-center gap-4">
        <button 
          onClick={() => { setTab("home"); window.history.back(); }}
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest">Meu Perfil</h1>
      </header>

      <div className="px-5 py-8 border-b border-zinc-900">
        <div className="flex items-center gap-5">
          <div className="relative">
            <button 
              onClick={() => onEditPhoto?.()}
              className="relative group size-20 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl active:scale-95 transition-all"
            >
               <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`}
                  alt="User"
                  className="size-full object-cover group-hover:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                </div>
            </button>
            {isIziBlackMembership && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black size-6 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(255,215,9,0.5)] border-2 border-black z-20">
                <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{userName || "Usuário"}</h1>
            <p className="text-zinc-600 text-xs mt-1">Nível {userLevel} • {userXP} XP</p>
            <div className="mt-2 flex items-center gap-2">
               <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase">
                R$ {walletBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            <span>Progresso</span>
            <span>{userXP} / {nextLevelXP} XP</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(userXP / nextLevelXP) * 100}%` }}
              className="h-full bg-yellow-400"
            />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-1">
        <button 
          onClick={() => setSubView?.("addresses")}
          className="w-full flex items-center gap-4 py-4 text-left border-b border-zinc-900 last:border-0 group"
        >
          <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400">location_on</span>
          <span className="font-black text-sm">Meus Endereços</span>
        </button>
        <button 
          onClick={() => setSubView?.("payments")}
          className="w-full flex items-center gap-4 py-4 text-left border-b border-zinc-900 last:border-0 group"
        >
          <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400">payments</span>
          <span className="font-black text-sm">Métodos de Pagamento</span>
        </button>
        <button 
          onClick={() => setSubView?.("izi_black_purchase")}
          className="w-full flex items-center gap-4 py-4 text-left border-b border-zinc-900 last:border-0 group"
        >
          <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400">workspace_premium</span>
          <span className="font-black text-sm">Izi Black</span>
        </button>
      </div>

      <div className="px-5 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-red-400/60 font-black text-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sair da Conta
        </button>
      </div>
    </div>
  );
};
