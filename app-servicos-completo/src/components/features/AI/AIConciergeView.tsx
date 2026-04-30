import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../../../hooks/useApp";

export const AIConciergeView = () => {
  const { setSubView, userName } = useApp();
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: `Olá ${userName}! Sou o Izi Concierge, seu assistente pessoal de IA. Como posso ajudar você hoje? Posso sugerir restaurantes, ajudar com um envio ou tirar dúvidas sobre o app.` }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulação de resposta da IA
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Entendi perfeitamente! Estou processando sua solicitação com nossos algoritmos avançados. Por ser uma versão beta, estou limitado a sugestões baseadas no seu histórico recente." 
      }]);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-hidden">
      <header className="bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubView("none")} 
            className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
          </motion.button>
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="material-symbols-outlined text-white animate-pulse">auto_awesome</span>
             </div>
             <div>
                <h1 className="font-black text-xl text-white tracking-tighter uppercase leading-none">Izi Concierge</h1>
                <div className="flex items-center gap-2 mt-2">
                   <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">IA Conectada</p>
                </div>
             </div>
          </div>
        </div>
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32"
      >
        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-5 rounded-[30px] text-sm leading-relaxed shadow-xl
                ${msg.role === 'user' 
                  ? 'bg-yellow-400 text-black font-bold rounded-tr-none' 
                  : 'bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-none'
                }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-zinc-900 p-5 rounded-[30px] rounded-tl-none border border-white/5 flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="size-1.5 bg-zinc-500 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="size-1.5 bg-zinc-500 rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="size-1.5 bg-zinc-500 rounded-full" />
             </div>
          </div>
        )}
      </main>

      <footer className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte qualquer coisa..."
            className="w-full bg-zinc-900 border-2 border-white/5 rounded-[35px] py-6 px-8 pr-20 text-white text-sm placeholder:text-zinc-700 outline-none focus:border-indigo-500/30 transition-all shadow-2xl"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-3 bottom-3 w-14 rounded-[25px] bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined font-black">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
