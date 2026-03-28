import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useAdmin } from './context/AdminContext';
import NavTab from './components/NavTab';

// Tabs
import DashboardTab from './components/DashboardTab';
import MerchantsTab from './components/MerchantsTab';
import TrackingTab from './components/TrackingTab';
import OrdersAdminTab from './components/OrdersAdminTab';
import OrdersMerchantTab from './components/OrdersMerchantTab';
import DriversTab from './components/DriversTab';
import UsersTab from './components/UsersTab';

import DynamicRatesTab from './components/DynamicRatesTab';
import AuditLogsTab from './components/AuditLogsTab';
import SettingsTab from './components/SettingsTab';
import MyStoreTab from './components/MyStoreTab';
import MyDriversTab from './components/MyDriversTab';
import MyStudioTab from './components/MyStudioTab';

import FinancialTab from './components/FinancialTab';
import IziBlackTab from './components/IziBlackTab';
import SupportTab from './components/SupportTab';
import MerchantDashboardTab from './components/MerchantDashboardTab';


function App() {
  const {
    session,
    userRole,
    isInitialLoading,
    activeTab,
    merchantProfile,
    handleLogout,
    showActiveOrdersModal,
    setShowActiveOrdersModal
  } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao autenticar');
    } finally {
      setAuthLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 z-[120] bg-[#111] flex flex-col items-center justify-center gap-6 font-display">
        <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Izi Delivery</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Sincronizando SessÃ£o...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#111] flex items-center justify-center p-6 overflow-hidden font-display">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#1A1A1A] border border-white/5 rounded-[48px] p-10 pt-12 shadow-2xl relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20">
              <span className="material-symbols-outlined text-4xl text-slate-900 font-black">local_shipping</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Painel Admin</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">GestÃ£o Delivery de Tudo</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@delivery.com"
                className="w-full bg-white/5 border border-white/5 rounded-full px-8 py-5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-inner"
              />
            </div>
            <div className="space-y-1">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-white/5 border border-white/5 rounded-full px-8 py-5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-inner"
              />
            </div>
            {authError && <p className="text-red-400 text-xs font-bold text-center mt-2">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-6 rounded-full shadow-2xl shadow-primary/20 uppercase tracking-widest text-sm mt-8 transition-all"
            >
              {authLoading ? 'Autenticando...' : 'Acessar Painel'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#F4F5F7] font-display overflow-hidden relative">
      <div className="flex flex-col h-screen overflow-hidden w-full bg-background-light dark:bg-background-dark">
        {/* Navigation Bar */}
        <nav className="z-30 h-24 lg:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 lg:px-8 gap-4 lg:gap-8 shadow-sm">
          <div className="hidden md:flex items-center gap-4 shrink-0 pr-4 border-r border-slate-100 dark:border-slate-800">
             <div className="bg-primary size-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-slate-900 font-bold">local_shipping</span>
             </div>
             <div className="flex flex-col">
                <h1 className="text-slate-900 dark:text-white text-base font-black leading-tight tracking-tight uppercase">IZI ADMIN</h1>
             </div>
          </div>

          <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide gap-1">
             {userRole === 'merchant' ? (
               <>
                  <NavTab id="dashboard" icon="dashboard" label="Métricas" />
                 <NavTab id="orders" icon="shopping_cart" label="Pedidos" />
                 <NavTab id="my_studio" icon="inventory_2" label="Minha Loja" />
                 <NavTab id="my_drivers" icon="delivery_dining" label="Motoboys" />
                 <NavTab id="financial" icon="bar_chart" label="Financeiro" />
                 <NavTab id="settings" icon="settings" label="Config" />
               </>
             ) : (
               <>
                  <NavTab id="dashboard" icon="dashboard" label="Home" />
                  <NavTab id="merchants" icon="storefront" label="Lojistas" />
                  <NavTab id="my_studio" icon="inventory_2" label="EstÃºdios" />
                  <NavTab id="drivers" icon="person_pin_circle" label="Entregadores" />
                  <NavTab id="users" icon="group" label="Estúdio" />
                  <NavTab id="dynamic_rates" icon="payments" label="Taxas" />
                  <NavTab id="audit_logs" icon="history" label="Logs" />
                  <NavTab id="support" icon="support_agent" label="Suporte" />
                  <NavTab id="settings" icon="settings" label="Sistema" />
               </>
             )}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto pl-4 border-l border-slate-100 dark:border-slate-800">
             <div className="hidden sm:flex flex-col text-right">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">
                   {userRole === 'merchant' ? (merchantProfile?.store_name || 'Lojista') : 'Administrador'}
                </p>
             </div>
             <button onClick={handleLogout} className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-xl">logout</span>
             </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative scrollbar-hide p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'dashboard' && userRole === 'admin' && <DashboardTab />}
              {activeTab === 'dashboard' && userRole === 'merchant' && <MerchantDashboardTab />}
              {activeTab === 'merchants' && userRole !== 'merchant' && <MerchantsTab />}
              {activeTab === 'tracking' && userRole !== 'merchant' && <TrackingTab />}
              {activeTab === 'orders' && userRole === 'admin' && <OrdersAdminTab />}
              {activeTab === 'orders' && userRole === 'merchant' && <OrdersMerchantTab />}
              {activeTab === 'drivers' && userRole === 'admin' && <DriversTab />}
              {activeTab === 'users' && userRole === 'admin' && <UsersTab />}
              {activeTab === 'dynamic_rates' && userRole === 'admin' && <DynamicRatesTab />}
              {activeTab === 'audit_logs' && userRole === 'admin' && <AuditLogsTab />}
              {activeTab === 'settings' && userRole === 'admin' && <SettingsTab />}
              {activeTab === 'settings' && userRole === 'merchant' && <MyStoreTab />}
              {activeTab === 'my_drivers' && userRole === 'merchant' && <MyDriversTab />}
              {(activeTab === 'my_studio' || (activeTab === 'financial' && userRole === 'merchant')) && <MyStudioTab />}
              {activeTab === 'financial' && userRole === 'admin' && <FinancialTab />}
              {activeTab === 'izi_black' && <IziBlackTab />}
              {activeTab === 'support' && <SupportTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals Portal */}
      <AnimatePresence>
        {showActiveOrdersModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowActiveOrdersModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl relative z-10 border border-white/10 p-10 font-display">
                <h2 className="text-2xl font-black uppercase italic mb-6 tracking-tighter">Monitor de OperaÃ§Ãµes Ativas</h2>
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando fluxo de pedidos...</p>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
