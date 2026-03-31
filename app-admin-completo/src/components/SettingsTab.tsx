import { useAdmin } from '../context/AdminContext';

// Configurações do Sistema
export default function SettingsTab() {
  const {
    appSettings, setAppSettings, autoSaveStatus, fetchAppSettings
  } = useAdmin();
  return (
    <div className="space-y-8 pb-20">
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
            onClick={() => fetchAppSettings()}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Recarregar
          </button>
        </div>
      </div>

      {/* Identidade da plataforma */}
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

      {/* Operacional: Plataforma Global */}
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

        <div className="mb-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
          <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
          <div>
            <p className="text-xs font-black text-amber-700 dark:text-amber-400">Este é o teto global da plataforma</p>
            <p className="text-[11px] font-bold text-amber-600/80 dark:text-amber-400/70 mt-0.5">
              Fora deste horário, <strong>nenhum cliente consegue fazer pedidos</strong>.
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
      </section>

      {/* Raio Global de Entrega */}
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

        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-6">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Raio Máximo (KM)</label>
              <div className="relative">
                <input
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white pr-14"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={appSettings.radius}
                  onChange={(e) => setAppSettings({ ...appSettings, radius: parseFloat(e.target.value) || 1 })}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">km</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl px-8 py-4 min-w-[120px] text-center">
              <span className="text-3xl font-black text-violet-500">{appSettings.radius}</span>
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">km máx.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Regras Financeiras */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Regras Financeiras Globais</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxas padrão da plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Taxa Base de Entrega</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">R$</span>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-300 shadow-inner"
                type="number"
                step="0.01"
                value={appSettings.baseFee}
                onChange={(e) => setAppSettings({ ...appSettings, baseFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-primary/80 uppercase tracking-widest mb-1">Comissão App (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-primary focus:ring-2 focus:ring-primary/30 shadow-inner"
                type="number" min="0" max="50" step="0.01"
                value={appSettings.appCommission}
                onChange={(e) => setAppSettings({ ...appSettings, appCommission: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">%</span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Taxa de Serviço (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-blue-600 focus:ring-2 focus:ring-blue-300 shadow-inner"
                type="number" min="0" max="20" step="0.01"
                value={appSettings.serviceFee}
                onChange={(e) => setAppSettings({ ...appSettings, serviceFee: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-sm">%</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[28px] p-6 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-6xl text-amber-500">toll</span>
            </div>
            <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 relative z-10">Cotação Izi Coin</label>
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs uppercase">IZI</span>
                <input
                  className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-2 py-3.5 font-black text-xl text-amber-600 focus:ring-2 focus:ring-amber-300 shadow-inner text-center"
                  type="number" value={1} disabled
                />
              </div>
              <span className="text-amber-500 font-black text-lg">=</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-xs">R$</span>
                <input
                  className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-9 pr-2 py-3.5 font-black text-xl text-emerald-600 focus:ring-2 focus:ring-amber-300 shadow-inner transition-all hover:bg-amber-50/50 dark:hover:bg-slate-800"
                  type="number" min="0.01" step="0.01"
                  value={appSettings.iziCoinRate || 1.0}
                  onChange={(e) => setAppSettings({ ...appSettings, iziCoinRate: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
            </div>
            <p className="text-[9px] text-amber-600/70 font-bold tracking-widest uppercase mt-4 text-center">DEFINE O VALOR DE MERCADO DA MOEDA</p>
          </div>
        </div>
      </section>

      {/* Configurações de Notificações */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20">
            <span className="material-symbols-outlined">notifications_active</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Canais de Notificação</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativar/Desativar SMS e E-mail</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { key: 'smsNotifications', label: 'SMS para Pedidos', icon: 'sms' },
            { key: 'emailNotifications', label: 'E-mail para Faturas', icon: 'email' },
          ].map(({ key, label, icon }) => {
            const isOn = (appSettings as any)[key];
            return (
              <div key={key} className={`flex items-center justify-between p-6 rounded-[28px] border transition-all ${isOn ? 'bg-primary/[0.03] border-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOn ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <span className={`material-symbols-outlined ${isOn ? 'text-primary' : 'text-slate-400'}`}>{icon}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{label}</span>
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
    </div>
  );
}
