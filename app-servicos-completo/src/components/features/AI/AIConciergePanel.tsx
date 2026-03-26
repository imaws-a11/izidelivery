import { useState, useRef } from "react";
import { Icon } from "../../common/Icon";

interface AIConciergePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  walletBalance: number;
  myOrders: any[];
  userLocation: any;
  ESTABLISHMENTS: any[];
}

export const AIConciergePanel = ({ isOpen, onClose, userName, walletBalance, myOrders, userLocation, ESTABLISHMENTS }: AIConciergePanelProps) => {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalGasto = myOrders.filter((o: any) => o.status === 'concluido').reduce((s: number, o: any) => s + (o.total_price || 0), 0).toFixed(2);

  const systemPrompt = `Você é o Izi Concierge, assistente do app IziDelivery. Seja direto e útil.
Contexto: Nome: ${userName || 'Cliente'}, Saldo: R$${walletBalance?.toFixed(2)}, Total gasto: R$${totalGasto}
Responda em português, máx 3 linhas, use emojis com moderação.`;

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = { role: 'user' as const, content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 1000, system: systemPrompt, messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Não consegui processar. Tente novamente.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Problema de conexão. Tente novamente.' }]);
    } finally {
      setIsThinking(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const quickSuggestions = [
    myOrders.length > 0 ? 'Repetir meu último pedido' : 'O que está em promoção?',
    'Quanto gastei esse mês?',
    'Sugestão para jantar de hoje',
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[160] bg-[#020617]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
      <header className="px-8 py-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="size-14 rounded-[22px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shadow-lg shadow-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />
            <Icon name="bolt" size={28} className="text-yellow-400 relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-1">Izi <span className="text-yellow-400">Concierge</span></h2>
            <div className="flex items-center gap-2">
              <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_white]" />
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em]">Sintonizado</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="size-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all shadow-premium">
          <Icon name="close" size={24} />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="space-y-10">
            <div className="flex flex-col items-center text-center mt-12 mb-16">
              <div className="size-20 rounded-full bg-yellow-400/20 border-4 border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                <Icon name="bolt" size={40} className="text-yellow-400" />
              </div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">Olá, {userName?.split(" ")[0]}</h3>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[80%] mx-auto">Sua inteligência logística pessoal. O que deseja agilizar hoje?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 shadow-soft">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Dotação Izi</p>
                <p className="text-2xl font-black text-yellow-400 tracking-tighter">R$ {walletBalance?.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 shadow-soft">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Ciclo Operacional</p>
                <p className="text-2xl font-black text-white tracking-tighter">R$ {totalGasto.replace(".", ",")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-2 mb-4">Comandos Rápidos</p>
              {quickSuggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} className="w-full text-left bg-white/5 border border-white/5 rounded-[22px] px-6 py-4.5 text-sm text-white/60 font-black uppercase tracking-tight hover:bg-white/10 hover:text-white transition-all active:scale-[0.98] flex items-center justify-between group">
                  {s} <Icon name="arrow_forward" className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="size-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                <Icon name="bolt" size={20} className="text-yellow-400" />
              </div>
            )}
            <div className={`px-6 py-4.5 max-w-[85%] shadow-premium ${msg.role === "user" ? "bg-yellow-400 text-slate-950 font-black rounded-[28px] rounded-tr-[4px]" : "bg-white/5 border border-white/10 text-white/90 rounded-[28px] rounded-tl-[4px]"}`}>
              <p className="text-sm leading-relaxed tracking-tight">{msg.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-1">
              <Icon name="bolt" size={20} className="text-yellow-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[28px] rounded-tl-[4px] px-6 py-4.5">
              <div className="flex gap-2 items-center">
                <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
                <div className="size-2 bg-yellow-400/60 rounded-full animate-pulse delay-75" />
                <div className="size-2 bg-yellow-400/30 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-8 pb-10 pt-4 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[30px] px-6 py-3 shadow-inner">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Comando operacional..." className="flex-1 bg-transparent border-none outline-none text-white text-[15px] font-black placeholder:text-white/10 py-3 uppercase tracking-tight" />
          <button onClick={sendMessage} disabled={!input.trim() || isThinking} className="size-12 rounded-[20px] bg-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-10 shrink-0">
            <Icon name="arrow_forward" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
