import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sender_type: 'user' | 'merchant' | 'admin';
  created_at: string;
}

interface OrderSupportViewProps {
  order: any;
  onBack: () => void;
}

export const OrderSupportView: React.FC<OrderSupportViewProps> = ({ order, onBack }) => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<'merchant' | 'admin'>('merchant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Verificação defensiva logo no início
  if (!order) {
    return (
      <div className="fixed inset-0 bg-white z-[600] flex items-center justify-center">
        <div className="size-8 border-4 border-zinc-200 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  const receiverId = activeTab === 'merchant' ? order.merchant_id : '00000000-0000-0000-0000-000000000000'; 

  // Carregar mensagens iniciais
  useEffect(() => {
    if (!userId || !order?.id) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages_delivery')
        .select('*')
        .eq('order_id', order.id)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      } else {
        setMessages([]);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Inscrição Realtime
    const channel = supabase
      .channel(`chat_${order.id}_${activeTab}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages_delivery', filter: `order_id=eq.${order.id}` },
        (payload) => {
          const msg = payload.new as Message;
          // Verifica se a mensagem pertence a esta conversa ativa
          if ((msg.sender_id === userId && msg.receiver_id === receiverId) || 
              (msg.sender_id === receiverId && msg.receiver_id === userId)) {
            
            setMessages(prev => [...prev, msg]);

            // Tocar som se a mensagem não for do próprio usuário
            if (msg.sender_id !== userId) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
              audio.play().catch(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, userId, receiverId, activeTab]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    const msgData = {
      order_id: order.id,
      sender_id: userId,
      receiver_id: receiverId,
      content: newMessage.trim(),
      sender_type: 'user'
    };

    const { error } = await supabase.from('messages_delivery').insert([msgData]);
    if (!error) {
      setNewMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-50 z-[600] flex flex-col">
      {/* Header Premium */}
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10 border-b border-zinc-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="size-10 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-all">
            <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
          </button>
          <div>
            <h1 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Suporte do Pedido</h1>
            <p className="text-[10px] font-bold text-zinc-400">ID: #{order.id.slice(-6)}</p>
          </div>
        </div>
        <div className="size-10 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-100">
          <span className="material-symbols-rounded text-zinc-900 text-xl">support_agent</span>
        </div>
      </header>

      {/* Seletor de Chat */}
      <div className="p-4 bg-white flex gap-2 border-b border-zinc-100">
        <button 
          onClick={() => setActiveTab('merchant')}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'merchant' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-zinc-50 text-zinc-400'}`}
        >
          Lojista
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-zinc-50 text-zinc-400'}`}
        >
          Suporte IZI
        </button>
      </div>

      {/* Chat Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
             <div className="size-8 border-4 border-zinc-200 border-t-yellow-400 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest">Carregando mensagens...</p>
          </div>
        ) : (!messages || messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 text-center px-10">
             <span className="material-symbols-rounded text-5xl">chat_bubble</span>
             <div>
                <p className="text-xs font-black uppercase tracking-widest">Nenhuma mensagem ainda</p>
                <p className="text-[10px] font-medium text-zinc-500 mt-1">
                   {activeTab === 'merchant' 
                    ? "Tire suas dúvidas sobre o preparo ou itens com o lojista." 
                    : "Fale com nossa equipe técnica para problemas no app ou pagamento."}
                </p>
             </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] px-4 py-3 rounded-3xl text-sm font-medium ${
                msg.sender_id === userId 
                  ? 'bg-zinc-900 text-white rounded-tr-none' 
                  : 'bg-white text-zinc-800 shadow-sm border border-zinc-100 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
              <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </main>

      {/* Input Area */}
      <footer className="bg-white p-6 pb-10 border-t border-zinc-100">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 h-14 bg-zinc-50 border-none rounded-2xl px-6 text-sm font-bold placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-400 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="size-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-100 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-rounded text-zinc-900 text-2xl">send</span>
          </button>
        </form>
      </footer>
    </div>
  );
};
