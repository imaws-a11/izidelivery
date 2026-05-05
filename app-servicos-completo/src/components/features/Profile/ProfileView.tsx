import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { uploadToCloudinary } from "../../../lib/cloudinary";
import { toastError, toastSuccess } from "../../../lib/useToast";

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchProfile();
  }, [userId]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        const { error } = await supabase
          .from("users_delivery")
          .update({ avatar_url: url })
          .eq("id", userId);

        if (error) {
          toastError("Erro ao salvar a foto de perfil.");
        } else {
          setAvatarUrl(url);
          toastSuccess("Foto de perfil atualizada!");
        }
      } else {
        toastError("Erro ao fazer upload da imagem.");
      }
    } catch (e) {
      toastError("Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDecolarClick = () => {
    toastSuccess("Em breve! Acúmulo de pontos Decolar nas suas compras Izi.");
  };
  const menuItems = [
    { icon: "emoji_events", label: "Missões", action: () => setSubView?.("user_missions") },
    { icon: "chat_bubble", label: "Conversas", action: () => setSubView?.("chats") },
    { icon: "notifications", label: "Notificações", action: () => setSubView?.("notifications_center") },
    { icon: "description", label: "Dados da conta", action: () => setSubView?.("account_details") },
    { icon: "credit_card", label: "Pagamentos", action: () => setSubView?.("payments") },
    { icon: "star", label: "Clube Izi", action: () => setSubView?.("izi_black_purchase") },
    { icon: "confirmation_number", label: "Cupons", action: () => setSubView?.("coupons") },
    { icon: "lock", label: "Código de entrega", action: () => setSubView?.("delivery_code") },
    { icon: "workspace_premium", label: "Fidelidade", action: () => setSubView?.("loyalty") },
    { icon: "favorite", label: "Favoritos", action: () => setSubView?.("favorites") },
    { icon: "volunteer_activism", label: "Doações", action: () => setSubView?.("donations") },
    { icon: "location_on", label: "Endereços", action: () => setSubView?.("addresses") },
    { icon: "moped", label: "Seja um entregador", action: () => setSubView?.("driver_registration") },
    { icon: "help", label: "Ajuda", action: () => setSubView?.("help") },
    { icon: "settings", label: "Configurações", action: () => setSubView?.("settings") },
    { icon: "security", label: "Segurança", action: () => setSubView?.("security") },
    { icon: "share_reviews", label: "Contas conectadas", action: () => setSubView?.("connected_accounts") },
    { icon: "store", label: "Sugerir restaurantes", action: () => setSubView?.("suggest_restaurant") },
  ];

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] text-zinc-900 pb-32">
      {/* HEADER */}
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100">
        <h1 className="text-xl font-black tracking-tight">Perfil</h1>
      </header>

      {/* USER INFO */}
      <section className="bg-white px-6 py-6 flex items-center gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="size-20 rounded-full overflow-hidden bg-yellow-100 border-2 border-white shadow-xl relative cursor-pointer group shrink-0"
        >
           <img 
             src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`} 
             alt="Avatar" 
             className={`size-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`}
           />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
           </div>
           {isUploading && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                <div className="size-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
             </div>
           )}
           <input 
             type="file" 
             ref={fileInputRef}
             className="hidden" 
             accept="image/*"
             onChange={handlePhotoUpload}
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
