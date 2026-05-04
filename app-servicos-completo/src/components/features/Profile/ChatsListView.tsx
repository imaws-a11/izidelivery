import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";

export const ChatsListView = ({ onBack, setSubView, userId, setSelectedItem }: { onBack: () => void, setSubView?: (view: string) => void, userId?: string | null, setSelectedItem?: (item: any) => void }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchChats = async () => {
      // Busca pedidos que podem ter chat (ativos)
      const { data, error } = await supabase
        .from("orders_delivery")
        .select("*")
        .eq("user_id", userId)
        .not("status", "in", '("concluido","cancelado","recusado")')
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setChats(data);
      }
      setLoading(false);
    };

    fetchChats();
  }, [userId]);

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Conversas</h1>
        <div className="size-10" />
      </header>

      <main className="px-4 py-4 space-y-3">
        {loading ? (
           <div className="flex justify-center py-10">
              <div className="size-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
           </div>
        ) : chats.length === 0 ? (
           <div className="text-center py-10 opacity-50">
              <span className="material-symbols-rounded text-4xl mb-2">speaker_notes_off</span>
              <p className="text-sm font-bold">Nenhuma conversa ativa no momento.</p>
           </div>
        ) : (
          chats.map((chat) => (
            <motion.div 
              key={chat.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedItem?.(chat);
                setSubView?.("order_chat");
              }}
              className="bg-white rounded-[24px] p-4 border border-zinc-100 flex gap-4 items-center shadow-sm cursor-pointer"
            >
              <div className="size-14 rounded-full overflow-hidden bg-zinc-100 shrink-0">
                 <img src={chat.merchant_image || chat.merchant_logo || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.merchant_name || 'Loja'}`} alt={chat.merchant_name} className="size-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-zinc-900 truncate pr-2">{chat.merchant_name || "Estabelecimento"}</h3>
                    <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{new Date(chat.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-xs text-zinc-500 truncate font-medium mr-4">Pedido #{String(chat.id).slice(-4)} • Toque para conversar</p>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};
