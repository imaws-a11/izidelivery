import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useAdmin } from './context/AdminContext';
import NavTab from './components/NavTab';
import { QRCodeSVG } from 'qrcode.react';
import { toastSuccess } from './lib/useToast';

// Tabs
import DashboardTab from './components/DashboardTab';
import MerchantsTab from './components/MerchantsTab';
import NetworkManagementTab from './components/NetworkManagementTab';
import TrackingTab from './components/TrackingTab';
import OrdersAdminTab from './components/OrdersAdminTab';
import OrdersMerchantTab from './components/OrdersMerchantTab';
import DriversTab from './components/DriversTab';
import UsersTab from './components/UsersTab';
import PromotionsTab from './components/PromotionsTab';
import DriverApplicationsTab from './components/DriverApplicationsTab';

import DynamicRatesTab from './components/DynamicRatesTab';
import PartnersTab from './components/PartnersTab';
import AuditLogsTab from './components/AuditLogsTab';
import SettingsTab from './components/SettingsTab';
import MyStoreTab from './components/MyStoreTab';
import MyDriversTab from './components/MyDriversTab';
import MyStudioTab from './components/MyStudioTab';
import MerchantStudio from './components/MerchantStudio';
import PartnerStudio from './components/PartnerStudio';

import FinancialTab from './components/FinancialTab';
import IziBlackTab from './components/IziBlackTab';
import SupportTab from './components/SupportTab';
import MerchantDashboardTab from './components/MerchantDashboardTab';
import TaxonomyCenter from './components/TaxonomyCenter';
import NotificationsTab from './components/NotificationsTab';
import GamificationTab from './components/GamificationTab';
import OrderCenterTab from './components/OrderCenterTab';
import StandaloneDeliveryTab from './components/StandaloneDeliveryTab';
import MerchantProfileTab from './components/MerchantProfileTab';
import WalletHistoryTab from './components/WalletHistoryTab';
import GlobalOrderDetailsModal from './components/GlobalOrderDetailsModal';
import LiveOrderTracking from './components/LiveOrderTracking';
// import EstablishmentTypesTab from './components/EstablishmentTypesTab';



export default function App() {
  const { 
    activeTab, setActiveTab, userRole, merchantProfile, isInitialLoading, session,
    showAddCreditModal, setShowAddCreditModal, pixData, setPixData,
    creditToAdd, setCreditToAdd, isAddingCredit, handleRequestMerchantRecharge,
    showRechargeSuccessModal, setShowRechargeSuccessModal, rechargeSuccessData,
    fetchMerchantFinance, handleLogout,
    editType, setEditType, setEditingItem, showActiveOrdersModal, setShowActiveOrdersModal 
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
                   {/* Planos normais (Market/Full) veem tudo */}
                   {merchantProfile?.subscription_plan !== 'avulso' && merchantProfile?.subscription_plan !== 'click_retire' && (
                     <>
                       <NavTab id="dashboard" icon="dashboard" label="Métricas" />
                       <NavTab id="orders" icon="shopping_cart" label="Pedidos" />
                       <NavTab id="live_tracking" icon="monitoring" label="Rastreio" />
                       <NavTab id="my_studio" icon="inventory_2" label="Minha Loja" />
                       <NavTab id="my_drivers" icon="delivery_dining" label="Motoboys" />
                     </>
                   )}

                   {/* Plano Click & Retire (Parceiros) */}
                   {merchantProfile?.subscription_plan === 'click_retire' && (
                     <>
                       <NavTab id="dashboard" icon="dashboard" label="Métricas" />
                       <NavTab id="order_center" icon="local_shipping" label="Entregas" />
                       <NavTab id="live_tracking" icon="monitoring" label="Rastreio" />
                       <NavTab id="my_studio" icon="inventory_2" label="Meu Ponto" />
                     </>
                   )}

                   {/* Plano Avulso (Apenas Entrega) */}
                   {merchantProfile?.subscription_plan === 'avulso' && (
                     <>
                       <NavTab id="dashboard" icon="dashboard" label="Métricas" />
                       <NavTab id="standalone_delivery" icon="two_wheeler" label="Entrega Avulsa" />
                       <NavTab id="live_tracking" icon="monitoring" label="Rastreio" />
                       <NavTab id="my_studio" icon="storefront" label="Meu Estúdio" />
                       <NavTab id="financial" icon="account_balance_wallet" label="Financeiro" />
                       <NavTab id="merchant_profile" icon="person" label="Perfil" />
                       <NavTab id="settings" icon="settings" label="Config" />
                     </>
                   )}

                   {/* Tabs comuns (exceto avulso que é ultra restrito) */}
                   {merchantProfile?.subscription_plan !== 'avulso' && (
                     <>
                        {merchantProfile?.subscription_plan !== 'click_retire' && (
                          <NavTab id="order_center" icon="local_shipping" label="Central de Pedidos" />
                        )}
                        <NavTab id="merchant_profile" icon="person" label="Perfil" />
                        <NavTab id="settings" icon="settings" label="Config" />
                     </>
                   )}
                   
                   {/* Fallback para Avulso ver Config/Logout - Removido pois agora está acima */}
               </>
             ) : (
               <>
                  <NavTab id="dashboard" icon="dashboard" label="Home" />
                   <NavTab id="orders" icon="shopping_cart" label="Pedidos" />
                   <NavTab id="tracking" icon="map" label="Rastreio" />
                   <NavTab id="network" icon="hub" label="Gestão de Rede" />
                  <NavTab id="categories" icon="category" label="Taxonomia" />
                   <NavTab id="establishment_types" icon="hub" label="Ecossistema" />
                  <NavTab id="my_studio" icon="inventory_2" label="Estúdios" />
                  <NavTab id="drivers" icon="person_pin_circle" label="Entregadores" />
                  <NavTab id="driver_applications" icon="how_to_reg" label="Aprovações" />
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
        <main className={`flex-1 ${activeTab === 'tracking' ? 'overflow-hidden p-0' : 'overflow-y-auto p-8'} bg-background-light dark:bg-background-dark relative scrollbar-hide`}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {(activeTab === 'dashboard' || activeTab === ('merchants' as any) || activeTab === ('partners' as any)) && userRole === 'admin' && <DashboardTab />}
              {activeTab === 'dashboard' && userRole === 'merchant' && <MerchantDashboardTab />}
              {(activeTab === 'network' || activeTab === ('merchants' as any) || activeTab === ('partners' as any)) && userRole === 'admin' && <NetworkManagementTab />}
              {activeTab === 'tracking' && userRole !== 'merchant' && <TrackingTab />}
              {activeTab === 'orders' && userRole === 'admin' && <OrdersAdminTab />}
              {activeTab === 'orders' && userRole === 'merchant' && merchantProfile?.subscription_plan !== 'avulso' && <OrdersMerchantTab />}
              {activeTab === 'order_center' && <OrderCenterTab />}
              {activeTab === 'standalone_delivery' && <StandaloneDeliveryTab />}
              {activeTab === 'drivers' && userRole === 'admin' && <DriversTab />}
              {activeTab === 'driver_applications' && userRole === 'admin' && <DriverApplicationsTab />}
              {activeTab === 'users' && userRole === 'admin' && <UsersTab />}
              {activeTab === 'promotions' && userRole === 'admin' && <PromotionsTab />}
              {activeTab === 'dynamic_rates' && userRole === 'admin' && <DynamicRatesTab />}
              {activeTab === 'audit_logs' && userRole === 'admin' && <AuditLogsTab />}
              {activeTab === 'settings' && userRole === 'admin' && <SettingsTab />}
              {activeTab === 'settings' && userRole === 'merchant' && <MyStoreTab />}
              {activeTab === 'merchant_profile' && userRole === 'merchant' && <MerchantProfileTab />}
              {activeTab === 'my_drivers' && userRole === 'merchant' && merchantProfile?.subscription_plan !== 'avulso' && <MyDriversTab />}

              {activeTab === 'establishment_types' && <TaxonomyCenter initialMode="global" />}
              {(activeTab === 'finance' && userRole === 'merchant') && <MyStudioTab initialTab="financial" />}
              {(activeTab === 'my_studio' && userRole === 'merchant') && <MyStudioTab initialTab="info" />}
              {activeTab === 'categories' && userRole === 'admin' && <TaxonomyCenter initialMode="assignment" />}
              {activeTab === 'financial' && userRole === 'admin' && <FinancialTab />}
              {activeTab === 'financial' && userRole === 'merchant' && merchantProfile?.subscription_plan === 'avulso' && <WalletHistoryTab />}
              {activeTab === 'financial' && userRole === 'merchant' && merchantProfile?.subscription_plan !== 'avulso' && <MyStudioTab initialTab="financial" />}
              {activeTab === 'izi_black' && <IziBlackTab />}
              {activeTab === 'support' && <SupportTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'gamification' && <GamificationTab />}
              {activeTab === 'live_tracking' && <LiveOrderTracking />}
            </motion.div>
          </AnimatePresence>
        </main>


        {/* Estúdios de Gestão (Overlay) */}
        {editType === 'new_merchant' && (
          <div className="fixed inset-0 z-[120]">
            <MerchantStudio />
          </div>
        )}
        {editType === 'merchant' && userRole === 'admin' && (
          <div className="fixed inset-0 z-[120]">
            <MerchantStudio onClose={() => {
              setEditingItem(null);
              setEditType(null);
            }} />
          </div>
        )}
        {editType === 'partner' && (
          <div className="fixed inset-0 z-[120]">
            <PartnerStudio onClose={() => { 
              setEditingItem(null); 
              setEditType(null); 
            }} />
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

      {/* Modal Adicionar Créditos (Global) */}
      <AnimatePresence>
        {showAddCreditModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAddCreditModal(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500">add_circle</span>
                  Novo Aporte
                </h3>
                <button onClick={() => setShowAddCreditModal(false)} className="size-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-6">
                {!pixData ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Valor (R$)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                        <input 
                          type="number"
                          step="0.01" 
                          value={creditToAdd}
                          onChange={(e) => setCreditToAdd(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl pl-14 pr-6 py-5 font-black text-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRequestMerchantRecharge(Number(creditToAdd))}
                      disabled={isAddingCredit || !creditToAdd || Number(creditToAdd) <= 0}
                      className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                      {isAddingCredit ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">qr_code_2</span>}
                      {isAddingCredit ? 'Gerando PIX...' : 'Gerar PIX para Recarga'}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="p-6 bg-white rounded-[32px] shadow-inner border border-slate-100 flex items-center justify-center">
                      {pixData.qrCodeBase64 ? (
                        <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="size-48" />
                      ) : (
                        <QRCodeSVG value={pixData.qrCode} size={192} />
                      )}
                    </div>
                    
                    <div className="w-full space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Pix Copia e Cola</p>
                        <p className="text-[10px] font-mono break-all text-slate-600 dark:text-slate-300 line-clamp-2 text-center">{pixData.copyPaste}</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.copyPaste);
                          toastSuccess('Código copiado!');
                        }}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                      >
                        Copiar Código PIX
                      </button>
                      
                      <p className="text-center text-[10px] text-slate-400 font-bold px-6">Após o pagamento, o saldo será creditado automaticamente em sua conta.</p>
                      
                      <button 
                        onClick={() => {
                          setPixData(null);
                          setShowAddCreditModal(false);
                          fetchMerchantFinance();
                        }}
                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:text-slate-600 transition-all"
                      >
                        Já paguei / Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modais Globais */}
      <GlobalOrderDetailsModal />
      
      {/* Modal Sucesso Recarga (Global) */}
      <AnimatePresence>
        {showRechargeSuccessModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowRechargeSuccessModal(false)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[48px] p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] relative z-10 border border-emerald-100 dark:border-emerald-900/30 overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 size-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
              <div className="absolute bottom-0 left-0 size-32 bg-emerald-500/5 blur-3xl -ml-16 -mb-16 rounded-full"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="size-24 rounded-[32px] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 animate-bounce">
                  <span className="material-symbols-outlined text-5xl font-black">check_circle</span>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Recarga Concluída!</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-8">Seu saldo foi atualizado com sucesso.</p>
                
                <div className="w-full bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl p-6 mb-8 border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Valor Creditado</p>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                    R$ {rechargeSuccessData?.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowRechargeSuccessModal(false)}
                  className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-[24px] shadow-xl active:scale-95 transition-all"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

