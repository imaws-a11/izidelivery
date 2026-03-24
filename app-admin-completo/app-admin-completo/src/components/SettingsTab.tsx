import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Configurações do Sistema
export default function SettingsTab() {
  const {
    appSettings, setAppSettings, autoSaveStatus, fetchAppSettings
  } = useAdmin();

  return (
  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-primary">settings_applications</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Configurações Globais</h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-1">Controles operacionais, financeiros e de notificações da plataforma.</p>
    </div>
    <div className="flex items-center gap-3">
      {/* Auto-save status indicator */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
        autoSaveStatus === 'saved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30' :
        autoSaveStatus === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/30' :
        autoSaveStatus === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/30' :
        'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
      }`}>
        <span className={`material-symbols-outlined text-sm ${autoSaveStatus === 'pending' ? 'animate-spin' : ''}`}>
          {autoSaveStatus === 'saved' ? 'check_circle' : autoSaveStatus === 'pending' ? 'sync' : autoSaveStatus === 'error' ? 'error' : 'cloud_done'}
        </span>
        {autoSaveStatus === 'saved' ? 'Salvo' : autoSaveStatus === 'pending' ? 'Salvando...' : autoSaveStatus === 'error' ? 'Erro ao salvar' : 'Auto-save ativo'}
      </div>
      <button
        onClick={() => playIziSound('merchant')}
        className="px-6 py-3 bg-primary/10 text-primary font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/20 transition-all border border-primary/20 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">volume_up</span>
        Testar Som Izi
      </button>
      <button
        onClick={() => fetchAppSettings()}
        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">refresh</span>
        Recarregar
      </button>
    </div>
  </div>

{/* â â Identidade da Plataforma â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
      <span className="material-symbols-outlined text-[120px]">store</span>
    </div>
    <div className="flex items-center gap-3 mb-8">
      <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
        <span className="material-symbols-outlined">storefront</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Identidade da Plataforma</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações públicas do app</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Plataforma</label>
        <input
          className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white transition-all"
          type="text"
          value={appSettings.appName}
          onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Suporte</label>
        <input
          className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white transition-all"
          type="email"
          value={appSettings.supportEmail}
          onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
        />
      </div>
    </div>
  </section>

{/* â â Â Operacional: Plataforma Global â â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
        <span className="material-symbols-outlined">schedule</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Horário Global da Plataforma</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controla quando o app inteiro aceita pedidos</p>
      </div>
    </div>

    {/* Alert */}
    <div className="mb-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
      <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
      <div>
        <p className="text-xs font-black text-amber-700 dark:text-amber-400">Este é o teto global da plataforma</p>
        <p className="text-[11px] font-bold text-amber-600/80 dark:text-amber-400/70 mt-0.5">
          Fora deste horário, <strong>nenhum cliente consegue fazer pedidos</strong>, independentemente do horário individual de cada estabelecimento. Cada lojista pode restringir ainda mais seu próprio horário nas configurações do seu perfil.
        </p>
      </div>
    </div>

    <div className="flex flex-col gap-2 mb-6">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Janela de Atendimento da Plataforma</label>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-lg">wb_sunny</span>
          <input
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-300 text-sm font-bold dark:text-white"
            type="time"
            value={appSettings.openingTime}
            onChange={(e) => setAppSettings({ ...appSettings, openingTime: e.target.value })}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-black text-slate-300 uppercase">até</span>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg">bedtime</span>
          <input
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-300 text-sm font-bold dark:text-white"
            type="time"
            value={appSettings.closingTime}
            onChange={(e) => setAppSettings({ ...appSettings, closingTime: e.target.value })}
          />
        </div>
      </div>
    </div>

    {/* Visual timeline */}
    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
      <span className="material-symbols-outlined text-sm text-slate-300">info</span>
      O app estará <span className="text-emerald-500 mx-1">aberto</span> das <span className="text-blue-500 mx-1">{appSettings.openingTime}</span> até <span className="text-indigo-500 mx-1">{appSettings.closingTime}</span> todos os dias
    </div>
  </section>

{/* â â Â Operacional: Raio e Defaults para Novos Lojistas â â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-3 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20">
        <span className="material-symbols-outlined">delivery_dining</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Raio Global de Entrega</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite máximo para qualquer entrega na plataforma</p>
      </div>
    </div>

    {/* Alert */}
    <div className="mb-8 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl">
      <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
      <div>
        <p className="text-xs font-black text-blue-700 dark:text-blue-400">Raio máximo absoluto da plataforma</p>
        <p className="text-[11px] font-bold text-blue-600/80 dark:text-blue-400/70 mt-0.5">
          Nenhum entregador pode aceitar pedidos além deste limite, independentemente da configuração do lojista. Lojistas podem definir raios <strong>menores</strong> em seus perfis, mas nunca maiores que este valor.
        </p>
      </div>
    </div>

    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-6">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Raio Máximo de Entrega</label>
          <div className="relative">
            <input
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white pr-14"
              type="number"
              min="1"
              max="100"
              value={appSettings.radius}
              onChange={(e) => setAppSettings({ ...appSettings, radius: parseInt(e.target.value) })}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">km</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl px-8 py-4 min-w-[120px] text-center">
          <span className="text-3xl font-black text-violet-500">{appSettings.radius}</span>
          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">km máx.</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>1 km</span>
          <span>50 km</span>
          <span>100 km</span>
        </div>
        <input
          type="range" min="1" max="100" value={appSettings.radius}
          onChange={(e) => setAppSettings({ ...appSettings, radius: parseInt(e.target.value) })}
          className="w-full accent-violet-500 h-2"
        />
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[5, 15, 30].map(r => (
            <button
              key={r}
              onClick={() => setAppSettings({ ...appSettings, radius: r })}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appSettings.radius === r ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>
    </div>
  </section>

{/* â â Regras Financeiras â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
        <span className="material-symbols-outlined">payments</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Regras Financeiras Globais</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxas padrão aplicadas a todos os lojistas da plataforma</p>
      </div>
    </div>

    {/* Info banner */}
    <div className="mb-8 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl">
      <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">info</span>
      <div>
        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">Valores padrão da plataforma</p>
        <p className="text-[11px] font-bold text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
          Esses valores são aplicados a <strong>todos os lojistas por padrão</strong>. Lojistas com contratos especiais podem ter taxas negociadas individualmente no perfil de cada estabelecimento (seção Merchants).
        </p>
      </div>
    </div>

    {/* 3 financial rule cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {/* Taxa Base */}
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[28px] p-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="material-symbols-outlined text-emerald-500">local_shipping</span>
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-center">Cobrada do cliente</span>
        </div>
        <div>
          <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Taxa Base de Entrega</label>
<p className="text-[10px] text-emerald-600/70 font-bold mb-3">Valor mínimo fixo por entrega, independente da distância</p>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">R$</span>
          <input
            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-300 shadow-inner"
            type="text"
            value={appSettings.baseFee}
            onChange={(e) => setAppSettings({ ...appSettings, baseFee: e.target.value })}
          />
        </div>
      </div>

      {/* Comissão App */}
      <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="material-symbols-outlined text-primary">percent</span>
          <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-full text-center">Retida da venda</span>
        </div>
        <div>
          <label className="block text-[10px] font-black text-primary/80 uppercase tracking-widest mb-1">Comissão da Plataforma</label>
          <p className="text-[10px] text-primary/60 font-bold mb-3">Percentual do valor do pedido que fica com a plataforma</p>
        </div>
        <div className="relative">
          <input
            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-primary focus:ring-2 focus:ring-primary/30 shadow-inner"
            type="number" min="0" max="50"
            value={appSettings.appCommission}
            onChange={(e) => setAppSettings({ ...appSettings, appCommission: parseInt(e.target.value) || 0 })}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">%</span>
        </div>
      </div>

      {/* Taxa de Serviço */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[28px] p-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="material-symbols-outlined text-blue-500">receipt_long</span>
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-100 dark:bg-blue-500/20 rounded-full text-center">Cobrada do cliente</span>
        </div>
        <div>
          <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Taxa de Serviço</label>
          <p className="text-[10px] text-blue-600/70 font-bold mb-3">Percentual adicional no total do pedido, visível ao cliente</p>
        </div>
        <div className="relative">
          <input
            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-blue-600 focus:ring-2 focus:ring-blue-300 shadow-inner"
            type="number" min="0" max="20"
            value={appSettings.serviceFee}
            onChange={(e) => setAppSettings({ ...appSettings, serviceFee: parseInt(e.target.value) || 0 })}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-sm">%</span>
        </div>
      </div>
    </div>
  </section>

  {/* Oferta Flash Global Section */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
    {/* Background Glow Effect */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 -mr-32 -mt-32 rounded-full blur-[100px] group-hover:bg-rose-500/10 transition-colors duration-1000"></div>
    
    <div className="flex items-center gap-4 mb-8 relative z-10">
      <div className="p-4 rounded-[22px] bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5">
        <span className="material-symbols-outlined text-2xl">bolt</span>
      </div>
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Banner de Oferta Flash</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle o banner de destaque da home do app</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título do Banner</label>
        <div className="relative group/input">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-rose-500 transition-colors text-lg">edit_note</span>
          <input 
            type="text"
            value={appSettings.flashOfferTitle}
            onChange={e => setAppSettings({...appSettings, flashOfferTitle: e.target.value})}
            placeholder="Ex: Burgers Gourmet"
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Desconto (%)</label>
        <div className="relative group/input">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-rose-500 transition-colors text-lg">percent</span>
          <input 
            type="number"
            value={appSettings.flashOfferDiscount}
            onChange={e => setAppSettings({...appSettings, flashOfferDiscount: parseInt(e.target.value) || 0})}
            placeholder="50"
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expira em</label>
        <div className="relative group/input">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-rose-500 transition-colors text-lg">calendar_today</span>
          <input 
            type="datetime-local"
            value={appSettings.flashOfferExpiry}
            onChange={e => setAppSettings({...appSettings, flashOfferExpiry: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
        </div>
      </div>
    </div>
  </section>


{/* â â Notificações â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-8">
      <div className="p-3 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20">
        <span className="material-symbols-outlined">notifications_active</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notificações Inteligentes</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canais de comunicação ativos</p>
      </div>
    </div>
    <div className="space-y-4">
      {[
        { key: 'smsNotifications', label: 'Alertas de Pedido (SMS)', desc: 'Confirmações e atualizações em tempo real para clientes via SMS', icon: 'sms', color: 'text-emerald-500' },
        { key: 'emailNotifications', label: 'Faturas & Relatórios (E-mail)', desc: 'Disparo automático de comprovantes, notas e documentos fiscais', icon: 'email', color: 'text-blue-500' },
      ].map(({ key, label, desc, icon }) => {
        const isOn = (appSettings as any)[key];
        return (
          <div key={key} className={`flex items-center justify-between p-6 rounded-[28px] border transition-all ${isOn ? 'bg-primary/[0.03] border-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isOn ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <span className={`material-symbols-outlined ${isOn ? 'text-primary' : 'text-slate-400'}`}>{icon}</span>
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 dark:text-white block">{label}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</span>
              </div>
            </div>
            <button
              onClick={() => setAppSettings({ ...appSettings, [key]: !isOn })}
              className={`w-14 h-8 rounded-full relative transition-all ${isOn ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1.5 size-5 bg-white rounded-full shadow-md transition-all ${isOn ? 'right-1.5' : 'left-1.5'}`}></div>
            </button>
          </div>
        );
      })}
    </div>
  </section>

{/* â â Â Status Sistema (Manutenção) â â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-8">
      <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
        <span className="material-symbols-outlined">build</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Status da Plataforma</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles de manutenção e visibilidade</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { label: 'App ao Vivo', desc: 'Plataforma acessível aos usuários', icon: 'public', color: 'emerald', active: true },
        { label: 'Modo Manutenção', desc: 'Suspender temporariamente o serviço', icon: 'construction', color: 'amber', active: false },
        { label: 'Novos Cadastros', desc: 'Permitir registro de novos usuários', icon: 'person_add', color: 'blue', active: true },
      ].map((item, i) => (
        <div key={i} className={`p-6 rounded-[28px] border flex flex-col gap-4 ${item.active ? 'bg-' + item.color + '-50 dark:bg-' + item.color + '-500/10 border-' + item.color + '-100 dark:border-' + item.color + '-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <span className={`material-symbols-outlined text-${item.color}-500`}>{item.icon}</span>
            <span className={`text-[9px] font-black px-2 py-1 rounded-full ${item.active ? 'bg-' + item.color + '-100 dark:bg-' + item.color + '-500/20 text-' + item.color + '-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
              {item.active ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.desc}</p>
          </div>
          <button className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${item.active ? 'bg-' + item.color + '-500 text-white hover:bg-' + item.color + '-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}>
            {item.active ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      ))}
    </div>
  </section>

{/* â â Segurança â Â */}
  <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-8">
      <div className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
        <span className="material-symbols-outlined">security</span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Segurança & Acesso</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autenticação e proteção dos dados</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-50 dark:bg-slate-800 rounded-[28px] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400">lock</span>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white">Alterar Senha Admin</p>
            <p className="text-[10px] font-bold text-slate-400">Credenciais do painel administrativo</p>
          </div>
        </div>
        <input type="password" placeholder="Nova senha (mín. 8 caracteres)" className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white" />
        <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 dark:hover:bg-slate-100 transition-all">
          Atualizar Senha
        </button>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Autenticação em 2 Etapas (2FA)', active: true },
          { label: 'Login por Biometria (App)', active: false },
          { label: 'Alertas de Login Suspeito', active: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</p>
            <div className={`w-11 h-6 rounded-full relative transition-all ${item.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${item.active ? 'right-1' : 'left-1'}`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
</div>
            )}


  );
}
