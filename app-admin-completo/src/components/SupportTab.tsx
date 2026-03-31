import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

interface Ticket {
  id: string;
  name: string;
  cat: string;
  prio: string;
  status: string;
  time: string;
  color: string;
  created_at: number;
}

const DEFAULT_TICKETS: Ticket[] = [
  { id: '#1024', name: 'João Silva', cat: 'Pagamentos', prio: 'Alta', status: 'Pendente', time: '2h', color: 'bg-red-50 text-red-600', created_at: Date.now() - 7200000 },
  { id: '#1023', name: 'Maria Souza', cat: 'Entrega', prio: 'Média', status: 'Aberto', time: '4h', color: 'bg-amber-50 text-amber-600', created_at: Date.now() - 14400000 },
  { id: '#1021', name: 'Ana Oliveira', cat: 'Pagamentos', prio: 'Crítica', status: 'Urgente', time: '6h', color: 'bg-red-500 text-white', created_at: Date.now() - 21600000 },
];

export default function SupportTab() {
  const { usersList, allOrders } = useAdmin();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '',
    cat: 'Entrega',
    prio: 'Normal',
    description: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('izi_admin_tickets');
    if (saved) {
      setTickets(JSON.parse(saved));
    } else {
      setTickets(DEFAULT_TICKETS);
      localStorage.setItem('izi_admin_tickets', JSON.stringify(DEFAULT_TICKETS));
    }
  }, []);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const ticket: Ticket = {
        id: '#' + Math.floor(1000 + Math.random() * 9000),
        name: newTicket.name || 'Cliente Sem Nome',
        cat: newTicket.cat,
        prio: newTicket.prio,
        status: 'Aberto',
        time: 'Agora',
        color: newTicket.prio === 'Crítica' ? 'bg-red-500 text-white' : newTicket.prio === 'Alta' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600',
        created_at: Date.now()
      };
      
      const updated = [ticket, ...tickets];
      setTickets(updated);
      localStorage.setItem('izi_admin_tickets', JSON.stringify(updated));
      
      setNewTicket({ name: '', cat: 'Entrega', prio: 'Normal', description: '' });
      setIsSubmitting(false);
      setIsModalOpen(false);
      alert('Ticket criado com sucesso!');
    }, 600);
  };

  const filteredTickets = tickets.filter(t => activeFilter === 'Todos' || t.cat === activeFilter);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Suporte Central</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie tickets e responda em tempo real para manter a alta satisfação.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center rounded-2xl h-12 px-6 bg-primary text-slate-900 hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg mr-2">add</span>
            Abrir Novo Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Pendentes</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">24</p>
          <div className="flex items-center text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">
            <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
            12% aumento
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Média de Resposta</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">1h 45m</p>
          <div className="flex items-center text-green-500 text-[10px] font-black uppercase tracking-widest mt-2">
            <span className="material-symbols-outlined text-sm mr-1">timer</span>
            8% melhoria
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">SLA Atendido</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">94.2%</p>
          <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mt-2">
            <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
            Dentro da meta
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets List Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-primary/10 overflow-hidden shadow-sm">
            <div className="flex border-b border-primary/10 px-8 overflow-x-auto gap-8 bg-slate-50/50 dark:bg-slate-800/30">
              {['Todos', 'Pagamentos', 'Entrega', 'Conta'].map((st) => (
                <button 
                  key={st} 
                  onClick={() => setActiveFilter(st)}
                  className={`flex items-center justify-center border-b-2 h-16 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${activeFilter === st ? 'border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-400 hover:text-primary'}`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/5">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prioridade</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filteredTickets.map((tk, i) => (
                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="font-black text-sm dark:text-white">{tk.id}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{tk.time === 'Agora' ? 'Agora mesmo' : `há ${tk.time}`}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black uppercase">
                            {tk.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold dark:text-slate-200">{tk.name}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{tk.cat}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tk.color}`}>
                          {tk.prio}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          {tk.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="text-primary hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest underline transition-all">Visualizar</button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                        Nenhum ticket encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-primary/5 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredTickets.length} ativos de {tickets.length} totais</p>
              <div className="flex gap-2">
                <button className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="size-8 rounded-lg bg-primary text-slate-900 text-xs font-black">1</button>
                <button className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Support Tools */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-primary/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">forum</span>
              Resposta Rápida
            </h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ticket Destino</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 text-xs font-bold focus:ring-primary cursor-pointer">
                  <option>#1024 - João Silva (Pagamento)</option>
                  <option>#1023 - Maria Souza (Entrega)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mensagem</label>
                <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-6 text-xs font-bold focus:ring-primary resize-none placeholder:text-slate-300" rows={4} placeholder="Escreva sua resposta..."></textarea>
              </div>
              <button className="w-full py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg">send</span>
                Enviar Agora
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-primary/10 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history</span>
              Atividades
            </h3>
            <div className="space-y-6">
              {[
                { title: 'Ticket #1022 resolvido', user: 'Admin', time: '15m', icon: 'check_circle', color: 'bg-green-50 text-green-500' },
                { title: 'Novo comentário #1024', user: 'João Silva', time: '42m', icon: 'comment', color: 'bg-blue-50 text-blue-500' },
                { title: 'Criticidade elevada #1021', user: 'Sistema', time: '1h', icon: 'priority_high', color: 'bg-red-50 text-red-500' },
              ].map((act, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className={`size-8 rounded-xl ${act.color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                    <span className="material-symbols-outlined text-sm">{act.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight">{act.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Por: {act.user} • {act.time} atrás</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-8 py-6 border-b border-primary/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Novo Ticket
              </h2>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                disabled={isSubmitting}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Cliente / Identificação</label>
                <input 
                  type="text" 
                  required
                  value={newTicket.name}
                  onChange={(e) => setNewTicket({...newTicket, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categoria</label>
                  <select 
                    value={newTicket.cat}
                    onChange={(e) => setNewTicket({...newTicket, cat: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value="Pagamentos">Pagamentos</option>
                    <option value="Entrega">Entrega</option>
                    <option value="Conta">Conta</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Prioridade</label>
                  <select 
                    value={newTicket.prio}
                    onChange={(e) => setNewTicket({...newTicket, prio: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição do Problema</label>
                <textarea 
                  required
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl p-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary resize-none outline-none" 
                  rows={4} 
                  placeholder="Detalhe o ocorrido..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-5 bg-primary text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="size-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Abrir Ticket
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
