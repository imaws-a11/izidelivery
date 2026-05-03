import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  order_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sender_type: 'user' | 'merchant' | 'admin';
  created_at: string;
}

interface ChatConversation {
  order_id: string;
  user_name: string;
  last_message: string;
  last_time: string;
  status: string;
}

export default function SupportTab() {
  const { allOrders } = useAdmin();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ADMIN_ID = '00000000-0000-0000-0000-000000000000';

  // Carregar lista de conversas únicas para o Admin
  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('messages_delivery')
      .select('*, order:orders_delivery(id, user_name)')
      .or(`receiver_id.eq.${ADMIN_ID},sender_id.eq.${ADMIN_ID}`)
      .order('created_at', { ascending: false });

    const { data: statusData } = await supabase.from('support_status_delivery').select('*').eq('status', 'closed');
    const closedOrderIds = statusData?.map(s => s.order_id) || [];

    if (!error && data) {
      const uniqueChats: Record<string, ChatConversation> = {};
      data.forEach((msg: any) => {
        if (!uniqueChats[msg.order_id] && !closedOrderIds.includes(msg.order_id)) {
          uniqueChats[msg.order_id] = {
            order_id: msg.order_id,
            user_name: msg.order?.user_name || 'Cliente IZI',
            last_message: msg.content,
            last_time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: msg.is_read ? 'Lido' : 'Pendente'
          };
        }
      });
      setConversations(Object.values(uniqueChats));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Realtime para novas mensagens do Admin
    const channel = supabase
      .channel('admin_support_list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages_delivery' }, (payload) => {
        const msg = payload.new as any;
        // Toca som se for para o admin e não vier do admin
        if (msg.receiver_id === ADMIN_ID && msg.sender_type !== 'admin') {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(() => {});
        }
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Carregar mensagens do chat selecionado
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages_delivery')
        .select('*')
        .eq('order_id', selectedChat)
        .or(`receiver_id.eq.${ADMIN_ID},sender_id.eq.${ADMIN_ID}`)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_admin_${selectedChat}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages_delivery', 
        filter: `order_id=eq.${selectedChat}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedChat) return;

    const currentChat = conversations.find(c => c.order_id === selectedChat);
    const lastMsgFromUser = messages.slice().reverse().find(m => m.sender_type === 'user');

    const msgData = {
      order_id: selectedChat,
      sender_id: ADMIN_ID,
      receiver_id: lastMsgFromUser?.sender_id || ADMIN_ID,
      content: reply.trim(),
      sender_type: 'admin'
    };

    const { error } = await supabase.from('messages_delivery').insert([msgData]);
    if (!error) {
      setReply('');
      // Marcar mensagens do usuário como lidas
      await supabase.from('messages_delivery').update({ is_read: true }).eq('order_id', selectedChat).eq('receiver_id', ADMIN_ID);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Suporte Central</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base">Conversas em tempo real com usuários e lojistas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[40px] border border-primary/10 overflow-hidden flex flex-col shadow-sm">
          <div className="p-6 border-b border-primary/5 bg-slate-50 dark:bg-slate-800/30">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Conversas Ativas</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.map((chat) => (
              <button
                key={chat.order_id}
                onClick={() => setSelectedChat(chat.order_id)}
                className={`w-full p-6 flex items-start gap-4 border-b border-primary/5 transition-all text-left ${selectedChat === chat.order_id ? 'bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black uppercase">
                  {chat.user_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-black dark:text-white truncate">{chat.user_name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{chat.last_time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{chat.last_message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`size-2 rounded-full ${chat.status === 'Pendente' ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{chat.status}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-primary/10 overflow-hidden flex flex-col shadow-sm">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
              <span className="material-symbols-outlined text-6xl mb-4">forum</span>
              <h3 className="text-xl font-black uppercase tracking-tight">Selecione uma conversa</h3>
              <p className="text-sm font-bold mt-2">Clique em um chat à esquerda para visualizar as mensagens.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-primary/5 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined font-bold">person</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black dark:text-white uppercase tracking-widest">{conversations.find(c => c.order_id === selectedChat)?.user_name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pedido: #{selectedChat.slice(-6)}</p>
                  </div>
                </div>

                <div className="relative group">
                  <button className="size-10 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-primary/10 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button 
                      onClick={async () => {
                        if (!confirm('Deseja encerrar este atendimento?')) return;
                        await supabase.from('support_status_delivery').upsert({ order_id: selectedChat, status: 'closed' });
                        setSelectedChat(null);
                        fetchConversations();
                      }}
                      className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Encerrar Chat
                    </button>
                    <button className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex items-center gap-3">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Ver Pedido
                    </button>
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#F8F9FA]/30 dark:bg-slate-950/20">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-[24px] text-sm font-bold shadow-sm ${msg.sender_type === 'admin' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white rounded-tl-none border border-primary/5'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest">
                      {msg.sender_type.toUpperCase()} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border-t border-primary/10">
                <div className="flex gap-4">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder="Escreva sua resposta..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-6 text-sm font-bold dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none no-scrollbar h-16"
                  />
                  <button
                    onClick={handleSendReply}
                    className="size-16 rounded-3xl bg-primary text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined font-black">send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
