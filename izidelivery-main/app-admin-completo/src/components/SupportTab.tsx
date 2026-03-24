import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Central de Suporte
export default function SupportTab() {
  const {
    usersList, allOrders, fetchUsers
  } = useAdmin();

  return (
  {/* Support Header & Stats */}
  <div className="flex flex-wrap justify-between items-end gap-6">
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Suporte Central</h1>
      <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie tickets e responda em tempo real para manter a alta satisfação.</p>
    </div>
    <div className="flex gap-3">
      <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
        <span className="material-symbols-outlined text-lg mr-2">download</span>
        Exportar Relatório
      </button>
      <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-primary text-slate-900 hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
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
          {['Todos', 'Pagamentos', 'Entrega', 'Conta'].map((st, i) => (
            <button key={st} className={`flex items-center justify-center border-b-2 h-16 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${i === 0 ? 'border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-400 hover:text-primary'}`}>
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
              {[
                { id: '#1024', name: 'João Silva', cat: 'Pagamento', prio: 'Alta', status: 'Pendente', time: '2h', color: 'bg-red-50 text-red-600' },
                { id: '#1023', name: 'Maria Souza', cat: 'Entrega', prio: 'Média', status: 'Aberto', time: '4h', color: 'bg-amber-50 text-amber-600' },
                { id: '#1021', name: 'Ana Oliveira', cat: 'Pagamento', prio: 'Crítica', status: 'Urgente', time: '6h', color: 'bg-red-500 text-white' },
              ].map((tk, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-black text-sm dark:text-white">{tk.id}</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">há {tk.time}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black uppercase">{tk.name.split(' ').map(n => n[0]).join('')}</div>
                      <span className="text-sm font-bold dark:text-slate-200">{tk.name}</span>
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
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-primary/5 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4 ativos de 128 totais</p>
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
</div>
            )}

  );
}
