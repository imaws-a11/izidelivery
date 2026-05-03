import React from "react";
import { motion } from "framer-motion";

export const ChatsListView = ({ onBack, setSubView }: { onBack: () => void, setSubView?: (view: string) => void }) => {
  const chats = [
    { id: 1, name: "Izi Burger", order: "Pedido #4582", time: "12:30", msg: "Seu pedido está a caminho!", unread: 2, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80" },
    { id: 2, name: "Pizza Hut", order: "Pedido #4580", time: "Ontem", msg: "Obrigado pela preferência.", unread: 0, img: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=100&q=80" },
    { id: 3, name: "Suporte Izi", order: "Ajuda", time: "Segunda", msg: "Como podemos ajudar hoje?", unread: 0, img: "https://api.dicebear.com/7.x/bottts/svg?seed=support" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Conversas</h1>
        <div className="size-10" />
      </header>

      <main className="px-4 py-4 space-y-3">
        {chats.map((chat) => (
          <motion.div 
            key={chat.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSubView?.("order_chat")}
            className="bg-white rounded-[24px] p-4 border border-zinc-100 flex gap-4 items-center shadow-sm cursor-pointer"
          >
            <div className="size-14 rounded-full overflow-hidden bg-zinc-100 shrink-0">
               <img src={chat.img} alt={chat.name} className="size-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-zinc-900 truncate pr-2">{chat.name}</h3>
                  <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{chat.time}</span>
               </div>
               <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500 truncate font-medium mr-4">{chat.order} • {chat.msg}</p>
                  {chat.unread > 0 && (
                    <div className="size-5 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-black text-black">{chat.unread}</span>
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
};
