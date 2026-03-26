import React from "react";
import { motion } from "framer-motion";

interface ProfileViewProps {
  user: any;
  userName: string | null;
  setUserName: (name: string) => void;
  userLevel: number;
  userXP: number;
  walletBalance: number;
  savedAddresses: any[];
  logout: () => Promise<void>;
  fetchSavedAddresses: (uid: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  userName,
  userLevel,
  userXP,
  walletBalance,
  logout,
}) => {
  const nextLevelXP = (userLevel + 1) * 1000;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32 pt-14">
      <div className="px-5 pb-8 border-b border-zinc-900">
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900">
             <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "izi"}`}
                alt="User"
                className="size-full"
              />
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
        <button className="w-full flex items-center gap-4 py-4 text-left border-b border-zinc-900 last:border-0 group">
          <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400">location_on</span>
          <span className="font-black text-sm">Meus Endereços</span>
        </button>
        <button className="w-full flex items-center gap-4 py-4 text-left border-b border-zinc-900 last:border-0 group">
          <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400">payments</span>
          <span className="font-black text-sm">Métodos de Pagamento</span>
        </button>
        <button className="w-full flex items-center gap-4 py-4 text-left border-b border-zinc-900 last:border-0 group">
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

export default ProfileView;
