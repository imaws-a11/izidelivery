import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../ui/Icon";

export const OrderSupportView = () => {
  const { 
    subView, 
    setSubView, 
    selectedItem,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput
  } = useApp();

  const [supportTopic, setSupportTopic] = useState<string | null>(null);

  const topics = [
    { icon: "local_shipping", label: "Meu pedido está atrasado" },
    { icon: "cancel", label: "Quero cancelar meu pedido" },
    { icon: "swap_horiz", label: "Item errado ou faltando" },
    { icon: "payments", label: "Problema com pagamento" },
    { icon: "help", label: "Outro problema" },
  ];

  const handleOpenChat = (topic?: string) => {
    if (topic) {
      setChatMessages((prev: any) => [
        ...prev,
        { id: `sys-${Date.now()}`, sender: "system", text: `Suporte iniciado para: ${topic}`, time: "agora" }
      ]);
    }
    setSubView("order_chat");
  };

  const sendMsg = () => {
    if (!chatInput.trim()) return;

    setChatMessages((prev: any) => [
      ...prev,
      {
        id: `chat-user-${Date.now()}`,
        sender: "user",
        text: chatInput,
        time: "agora",
      },
    ]);
    setChatInput("");
  };

  const renderSupportList = () => (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
        <button onClick={() => setSubView("active_order")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
          <Icon name="arrow_back" />
        </button>
        <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Suporte</h1>
      </header>

      <main className="px-5 py-8 space-y-10">
        <div>
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-2">Central de Ajuda</p>
          <h2 className="text-2xl font-extrabold text-white tracking-tighter">Como podemos<br/>te ajudar?</h2>
        </div>

        <div className="flex flex-col">
          {topics.map((topic, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => handleOpenChat(topic.label)}
              className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0 active:opacity-60 transition-all text-left group w-full"
            >
              <Icon name={topic.icon} className="text-zinc-600 group-hover:text-yellow-400 transition-colors text-xl" />
              <p className="font-black text-sm text-white flex-1">{topic.label}</p>
              <Icon name="chevron_right" className="text-zinc-800 group-hover:text-yellow-400/50 transition-colors text-lg" />
            </motion.button>
          ))}
        </div>

        <div className="pt-4">
          <p className="text-zinc-700 text-xs text-center mb-4">Ou fale diretamente com nosso time</p>
          <button
            onClick={() => handleOpenChat()}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 border border-zinc-900 text-zinc-400 hover:border-yellow-400/20 hover:text-yellow-400"
          >
            <Icon name="chat_bubble" className="text-xl" />
            Iniciar Chat com Suporte
          </button>
        </div>
      </main>
    </div>
  );

  const renderChat = () => {
    const backView = selectedItem ? "active_order" : "none";

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col">
        <header className="bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView("order_support")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <Icon name="arrow_back" />
          </button>
          <div>
            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Chat</h1>
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">
              {selectedItem?.driver_name || selectedItem?.merchant_name || "Suporte Izi"} Online
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-4">
          {chatMessages.map((message: any, index: number) => (
            <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium ${
                message.sender === "user" ? "bg-yellow-400 text-black" : 
                message.sender === "system" ? "bg-zinc-800/50 text-zinc-500 text-[10px] uppercase text-center w-full" : 
                "bg-zinc-900 text-zinc-300"
              }`}>
                <p>{message.text}</p>
                {message.sender !== "system" && <p className={`text-[9px] mt-1 ${message.sender === "user" ? "text-black/50" : "text-zinc-600"} text-right`}>{message.time}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-zinc-900 flex items-center gap-3">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-zinc-900/50 border-b border-zinc-900 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/20 transition-all"
          />
          <button onClick={sendMsg} className="size-11 rounded-full bg-yellow-400 flex items-center justify-center active:scale-90 transition-all shrink-0">
            <Icon name="send" className="text-black" style={{ fontVariationSettings: "'FILL' 1" }} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {subView === "order_support" && (
        <motion.div key="support-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {renderSupportList()}
        </motion.div>
      )}
      {subView === "order_chat" && (
        <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {renderChat()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
