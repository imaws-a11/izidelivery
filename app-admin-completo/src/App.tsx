import React, { useState } from 'react';
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
import PromotionsTab from './components/PromotionsTab';

import DynamicRatesTab from './components/DynamicRatesTab';
import PartnersTab from './components/PartnersTab';
import AuditLogsTab from './components/AuditLogsTab';
import SettingsTab from './components/SettingsTab';
import MyStoreTab from './components/MyStoreTab';
import MyDriversTab from './components/MyDriversTab';
import MyStudioTab from './components/MyStudioTab';
import MerchantStudio from './components/MerchantStudio';

import FinancialTab from './components/FinancialTab';
import IziBlackTab from './components/IziBlackTab';
import SupportTab from './components/SupportTab';
import MerchantDashboardTab from './components/MerchantDashboardTab';
import CategoriesTab from './components/CategoriesTab';
import NotificationsTab from './components/NotificationsTab';
import GamificationTab from './components/GamificationTab';
import EstablishmentTypesTab from './components/EstablishmentTypesTab';



function App() {
  const {
    session,
    userRole,
    isInitialLoading,
    activeTab,
    merchantProfile,
    handleLogout,
    editType,
    showActiveOrdersModal,
    setShowActiveOrdersModal
  } = useAdmin();



  const [email, setEmail] = useState(() => localStorage.getItem('izi_admin_remember_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('izi_admin_remember_email'));
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (rememberMe) {
        localStorage.setItem('izi_admin_remember_email', email);
      } else {
        localStorage.removeItem('izi_admin_remember_email');
      }

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
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Sincronizando Sessão...</p>
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
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Gestão Delivery de Tudo</p>
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
            <div className="space-y-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full bg-white/5 border border-white/5 rounded-full px-8 py-5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-inner pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-2">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-3 group transition-all"
              >
                <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  rememberMe ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-white/10 bg-white/5 group-hover:border-white/20'
                }`}>
                  {rememberMe && <span className="material-symbols-outlined text-sm text-slate-900 font-black">check</span>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                  rememberMe ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'
                }`}>
                  Salvar dados para mais tarde
                </span>
              </button>
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
             <div className="flex flex-col">
                <h1 className="text-slate-900 dark:text-white text-base font-black leading-tight tracking-tight uppercase">
                  {userRole === 'merchant' ? (merchantProfile?.store_name || 'Lojista') : 'Administrador'}
                </h1>
             </div>
             {userRole === 'merchant' && (
               <div className="ml-4 pl-4 border-l border-slate-100 dark:border-slate-800">
                 <button 
                   className="size-11 rounded-2xl bg-primary text-slate-900 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                   title="Meu QR Code"
                 >
                   <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                 </button>
               </div>
             )}
          </div>

          <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide gap-1">
             {userRole === 'merchant' ? (
               <>
                  <NavTab id="dashboard" icon="dashboard" label="Métricas" />
                 <NavTab id="orders" icon="shopping_cart" label="Pedidos" />
                 <NavTab id="my_studio" icon="inventory_2" label="Minha Loja" />
                 <NavTab id="my_drivers" icon="delivery_dining" label="Motoboys" />
                 <NavTab id="settings" icon="settings" label="Config" />
               </>
             ) : (
               <>
                  <NavTab id="dashboard" icon="dashboard" label="Home" />
                   <NavTab id="orders" icon="shopping_cart" label="Pedidos" />
                  <NavTab id="merchants" icon="storefront" label="Lojistas" />
                  <NavTab id="partners" icon="handshake" label="Parceiros Izi" />
                  <NavTab id="categories" icon="category" label="Taxonomia" />
                   <NavTab id="establishment_types" icon="hub" label="Ecossistema" />
                  <NavTab id="my_studio" icon="inventory_2" label="Estúdios" />
                  <NavTab id="drivers" icon="person_pin_circle" label="Entregadores" />
                  <NavTab id="users" icon="group" label="Usuários" />
                   <NavTab id="izi_black" icon="workspace_premium" label="Izi Black VIP" />
                  <NavTab id="promotions" icon="campaign" label="Promoções" />
                  <NavTab id="gamification" icon="military_tech" label="Gamificação" />
                  <NavTab id="notifications" icon="notifications_active" label="Notificações" />
                   <NavTab id="financial" icon="bar_chart" label="Financeiro" />
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
              {activeTab === 'partners' && userRole === 'admin' && <PartnersTab />}
              {activeTab === 'tracking' && userRole !== 'merchant' && <TrackingTab />}
              {activeTab === 'orders' && userRole === 'admin' && <OrdersAdminTab />}
              {activeTab === 'orders' && userRole === 'merchant' && <OrdersMerchantTab />}
              {activeTab === 'drivers' && userRole === 'admin' && <DriversTab />}
              {activeTab === 'users' && userRole === 'admin' && <UsersTab />}
              {activeTab === 'promotions' && userRole === 'admin' && <PromotionsTab />}
              {activeTab === 'dynamic_rates' && userRole === 'admin' && <DynamicRatesTab />}
              {activeTab === 'audit_logs' && userRole === 'admin' && <AuditLogsTab />}
              {activeTab === 'settings' && userRole === 'admin' && <SettingsTab />}
              {activeTab === 'settings' && userRole === 'merchant' && <MyStoreTab />}
              {activeTab === 'my_drivers' && userRole === 'merchant' && <MyDriversTab />}
              {activeTab === 'merchant_studio' && <MerchantStudio />}
              {activeTab === 'establishment_types' && <EstablishmentTypesTab />}
              {(activeTab === 'financial' && userRole === 'merchant') && <MyStudioTab />}
              {activeTab === 'categories' && userRole === 'admin' && <CategoriesTab />}
              {activeTab === 'financial' && userRole === 'admin' && <FinancialTab />}
              {activeTab === 'izi_black' && <IziBlackTab />}
              {activeTab === 'support' && <SupportTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'gamification' && <GamificationTab />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Studios & Modals Provider (Absolute/Fixed elements only) */}
        <MyStudioTab />

        {/* Estúdio de Novo Lojista (Overlay) */}
        {editType === 'new_merchant' && (
          <div className="fixed inset-0 z-[120]">
            <MerchantStudio />
          </div>
        )}
      </div>

      {/* Global Modals Portal */}
      <AnimatePresence>
        {showActiveOrdersModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowActiveOrdersModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl relative z-10 border border-white/10 p-10 font-display">
                <h2 className="text-2xl font-black uppercase italic mb-6 tracking-tighter">Monitor de Operações Ativas</h2>
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
