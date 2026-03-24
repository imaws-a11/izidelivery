import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Logs de Auditoria
export default function AuditLogsTab() {
  const {
    auditLogsList, expandedLogId, setExpandedLogId, fetchAuditLogs
  } = useAdmin();

  return (
  {/* Audit Logs Header */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Logs de Auditoria</h1>
      <p className="text-slate-500 dark:text-slate-400 font-medium">Rastreie todas as atividades e alterações realizadas no sistema em tempo real.</p>
    </div>
    <div className="flex gap-4">
      <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400">
        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
        Exportar PDF
      </button>
      <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400">
        <span className="material-symbols-outlined text-lg">csv</span>
        Exportar CSV
      </button>
    </div>
  </div>

  {/* Filters */}
  <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Buscar</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
          <input className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold placeholder:text-slate-300 dark:text-white" placeholder="Usuário ou palavra-chave..." type="text" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Módulo</label>
        <select className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white cursor-pointer px-4">
          <option>Todos os Módulos</option>
<option>Taxas Dinâmicas</option>
          <option>Usuários</option>
          <option>Promoções</option>
          <option>Categorias</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Papel</label>
        <select className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white cursor-pointer px-4">
          <option>Todos os Papéis</option>
          <option>Super Admin</option>
          <option>Gerente Operacional</option>
          <option>Suporte</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Período</label>
        <select className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white cursor-pointer px-4">
          <option>Últimos 7 dias</option>
          <option>Últimos 30 dias</option>
          <option>Este mês</option>
          <option>Personalizado</option>
        </select>
      </div>
    </div>
  </div>

  {/* Audit Table */}
  <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
            <th className="px-8 py-6 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {auditLogsList.map((log) => (
            <React.Fragment key={log.id}>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-sm font-black text-slate-900 dark:text-white">{new Date(log.created_at).toLocaleDateString()}</div>
                  <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xs font-black border border-primary/20">
                      {(log.user_id || 'AD').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Sistema / Admin</div>
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Admin Mod</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${log.action.includes('Delete') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">{log.module}</span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-[10px] font-mono font-bold text-slate-500 tracking-tight">{log.source_ip || 'Internal'}</div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    className={`size-10 flex items-center justify-center rounded-xl shadow-lg transition-all ${expandedLogId === log.id ? 'bg-primary text-slate-900 shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined">{expandedLogId === log.id ? 'expand_less' : 'visibility'}</span>
                  </button>
                </td>
              </tr>
              {expandedLogId === log.id && (
                <tr className="bg-primary/[0.03] dark:bg-primary/[0.05]">
                  <td className="px-8 pb-10" colSpan={6}>
                    <div className="animate-in slide-in-from-top-4 duration-500">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">database</span> Metadados da Ação
                        </h4>
                        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 font-mono text-[10px] overflow-x-auto shadow-inner text-slate-600 dark:text-slate-400">
                          <code>{JSON.stringify(log.metadata, null, 2)}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="px-8 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando 1 a 15 de 2,450 logs registrados</p>
      <div className="flex gap-3">
        <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button className="size-12 rounded-2xl bg-primary text-slate-900 font-black text-xs shadow-lg shadow-primary/25">1</button>
        <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-black text-xs hover:border-primary transition-all">2</button>
        <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-black text-xs hover:border-primary transition-all">3</button>
        <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
</div>
            )}

  );
}
