import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';
import { AdminContext } from './AdminContext';
import type { AdminContextType } from './AdminContext';
import type { 
  Order, Driver, User, Merchant, MerchantProfile, 
  Product, Category, Promotion, DedicatedSlot,
  AuditLog, WalletTransaction, MenuCategory, DynamicRatesState,
  Tab, UserRole, AppSettings, DashboardData, EstablishmentType, PartnerStore
} from '../lib/types';
import { useAuth } from './AuthContext';
import { toastSuccess, toastError, toastWarning, showConfirm } from '../lib/useToast';
import { playIziSound } from '../lib/iziSounds';
import { countOnlineDrivers, removeDriverFromList, sortDriversByPresence, upsertDriverInList } from '../lib/driverPresence';



const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, logout, isLoading: isAuthLoading } = useAuth();
  const MASTER_ADMIN_EMAIL = (import.meta.env.VITE_MASTER_ADMIN_EMAIL as string || 'swmcapital@gmail.com').trim().toLowerCase();
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || '';

  const { isLoaded, loadError: mapsLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'pt-BR',
    region: 'BR'
  });

  const ORDERS_PER_PAGE = 50;

  // Navigation & Role
  const [activeTab, setActiveTab] = useState<Tab>(() => (localStorage.getItem('izi_admin_active_tab') as Tab) || 'dashboard');
  const [userRole, setUserRole] = useState<UserRole>(() => (localStorage.getItem('izi_admin_role') as UserRole) || 'merchant');
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(() => {
    try {
      const cached = localStorage.getItem('izi_admin_profile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  // Loading States
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Data Lists
  const [stats, setStats] = useState({ 
    users: 0, 
    drivers: 0, 
    orders: 0, 
    onlineDrivers: 0, 
    revenue: 0,
    merchants: 0,
    promotions: 0,
    totalCoupons: 0,
    canceledOrders: 0,
    cancelationImpact: 0,
    activeOffers: 0,
    couponInvestment: 0
  });
  const [recentOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [dashboardOrders, setDashboardOrders] = useState<Order[]>([]);
  const [myDriversList, setMyDriversList] = useState<Driver[]>([]);
  const [merchantsList, setMerchantsList] = useState<Merchant[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [menuCategoriesList, setMenuCategoriesList] = useState<MenuCategory[]>([]);
  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [promotionsList, setPromotionsList] = useState<Promotion[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);
  const [myDedicatedSlots, setMyDedicatedSlots] = useState<DedicatedSlot[]>([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState<Order[]>([]);
  const [dynamicRatesState, setDynamicRatesState] = useState<DynamicRatesState>({
    baseValues: {
      food_min: '7,00',
      food_km: '1,50',
      market_min: '7,00',
      market_km: '1,50',
      pharmacy_min: '7,00',
      pharmacy_km: '1,50',
      beverages_min: '7,00',
      beverages_km: '1,50',
      mototaxi_min: '6,00',
      mototaxi_km: '2,50',
      carro_min: '14,00',
      carro_km: '4,50',
      van_min: '20,00',
      van_km: '6,00',
      utilitario_min: '12,00',
      utilitario_km: '4,00',
      logistica_min: '45,00',
      logistica_km: '8,00',
      logistica_stairs: '30,00',
      logistica_helper: '35,00',
      fiorino_min: '40,00',
      fiorino_km: '4,00',
      caminhonete_min: '50,00',
      caminhonete_km: '5,00',
      bau_p_min: '60,00',
      bau_p_km: '6,00',
      bau_m_min: '80,00',
      bau_m_km: '8,00',
      bau_g_min: '100,00',
      bau_g_km: '10,00',
      aberto_min: '50,00',
      aberto_km: '5,00',
      isDynamicActive: true
    },
    shippingPriorities: {
      turbo: { multiplier: 1.5, min_fee: 12.00, active: true },
      light: { multiplier: 1.2, min_fee: 9.00, active: true },
      normal: { multiplier: 1.0, min_fee: 6.00, active: true },
      scheduled: { multiplier: 1.1, min_fee: 15.00, active: true }
    },
    flowControl: { mode: 'manual', highDemandActive: false },
    equilibrium: { threshold: 1.2, sensitivity: 0.5, maxSurge: 2.5 },
    weather: { 
      rain: { multiplier: 1.2, active: false },
      storm: { multiplier: 1.5, active: false },
      snow: { multiplier: 2.0, active: false }
    },
    peakHours: [],
    zones: []
  });

  const [partnersList, setPartnersList] = useState<PartnerStore[]>([]);

  const syncDriverStats = useCallback((drivers: Driver[]) => {
    setStats(prev => {
      const nextOnlineDrivers = countOnlineDrivers(drivers);
      const nextDrivers = drivers.filter(driver => !driver.is_deleted).length;

      if (prev.onlineDrivers === nextOnlineDrivers && prev.drivers === nextDrivers) return prev;

      return {
        ...prev,
        onlineDrivers: nextOnlineDrivers,
        drivers: nextDrivers
      };
    });
  }, []);

  // Pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [merchantOrdersPage, setMerchantOrdersPage] = useState(1);
  const [merchantOrdersTotalCount, setMerchantOrdersTotalCount] = useState(0);
  const [subscriptionOrdersPage, setSubscriptionOrdersPage] = useState(1);
  const [subscriptionOrdersTotalCount, setSubscriptionOrdersTotalCount] = useState(0);
  const [driversPage, setDriversPage] = useState(1);

  // Filters
  const [driverSearch, setDriverSearch] = useState('');
  const [driverFilter, setDriverFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'blocked' | 'inactive'>('all');
  const [promoFilter, setPromoFilter] = useState<'all' | 'banner' | 'coupon' | 'active' | 'expired'>('all');
  const [promoSearch, setPromoSearch] = useState('');
  const [categoryGroupFilter, setCategoryGroupFilter] = useState<'all' | 'mobility' | 'service'>('all');

  // Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'IZI Delivery',
    supportEmail: 'ajuda@izi.app',
    openingTime: '08:00',
    closingTime: '23:00',
    radius: 15,
    baseFee: 7.50,
    appCommission: 12,
    driverFreightCommission: 12,
    privateDriverCommission: 12,
    serviceFee: 2,
    smsNotifications: true,
    emailNotifications: true,
    iziBlackFee: 29.90,
    iziBlackCashback: 5,
    iziBlackMinOrderFreeShipping: 50,
    izi_black_cashback_multiplier: 2,
    izi_black_xp_multiplier: 2,
    flashOfferTitle: 'Burgers Gourmet',
    flashOfferDiscount: 50,
    flashOfferExpiry: '',
    iziCoinRate: 1.0,
    minwithdrawalamount: 0,
    withdrawalfeepercent: 2.5,
    withdrawal_period_h: 24,
    withdrawal_day: 'Quarta-feira',
    loan_interest_rate: 12.0,
    mercadopago_public_key: '',
    paymentmethodsactive: { pix: true, card: true, lightning: false, wallet: true }
  });
  const [globalSettings, setGlobalSettings] = useState<any>({
    izi_coin_value: 0.01,
    loan_interest_rate: 12.0,
    min_withdrawal_amount: 50.0,
    withdrawal_period_h: 12,
    withdrawal_day: 'Quarta-feira',
    service_fee_percent: 5.0,
    payment_methods_active: { pix: true, card: true, lightning: false, wallet: true }
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saved' | 'error'>('idle');
  const [isFetchingSettings, setIsFetchingSettings] = useState(false);
  const [lastSavedHash, setLastSavedHash] = useState('');

  // Debounced Auto-save for Settings
  useEffect(() => {
    if (isFetchingSettings) return;
    
    const currentHash = JSON.stringify(appSettings);
    if (lastSavedHash === currentHash) return;
    if (lastSavedHash === '') {
      setLastSavedHash(currentHash);
      return;
    }

    setAutoSaveStatus('pending');
    const timer = setTimeout(async () => {
      try {
        const SETTINGS_ID = appSettings.id || 'c568f69e-1e96-48c3-8e7c-8e8e8e8e8e8e';
        const payload = {
          app_name:                          String(appSettings.appName || 'IZI Delivery'),
          support_email:                     String(appSettings.supportEmail || ''),
          opening_time:                      String(appSettings.openingTime || '08:00'),
          closing_time:                      String(appSettings.closingTime || '23:00'),
          radius:                            Number(appSettings.radius ?? 15),
          base_fee:                          Number(appSettings.baseFee ?? 0),
          app_commission:                    Number(appSettings.appCommission ?? 0),
          driver_freight_commission:         Number(appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
          private_driver_commission:         Number(appSettings.privateDriverCommission ?? appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
          service_fee:                       Number(appSettings.serviceFee ?? 0),
          izi_black_fee:                     Number(appSettings.iziBlackFee ?? 0),
          izi_black_cashback:                Number(appSettings.iziBlackCashback ?? 0),
          izi_black_min_order_free_shipping: Number(appSettings.iziBlackMinOrderFreeShipping ?? 0),
          izi_coin_rate:                     Number(appSettings.iziCoinRate ?? 1.0),
          min_withdrawal_amount:             Number(appSettings.minwithdrawalamount ?? 50),
          withdrawal_fee_percent:            Number(appSettings.withdrawalfeepercent ?? 0),
          withdrawal_period_h:               Number(appSettings.withdrawal_period_h ?? 24),
          withdrawal_day:                    String(appSettings.withdrawal_day || 'Quarta-feira'),
          mercadopago_public_key:            String(appSettings.mercadopago_public_key || ''),
          updated_at:                        new Date().toISOString()
        };

        // Tenta UPDATE primeiro (registro sempre deve existir)
        const { error: updateErr, count } = await supabase
          .from('app_settings_delivery')
          .update(payload)
          .eq('id', SETTINGS_ID)
          .select('id', { count: 'exact', head: true });

        if (updateErr) {
          console.error('AutoSave UPDATE Error:', updateErr);
          throw updateErr;
        }

        // Se nenhuma linha foi afetada, faz INSERT
        if (count === 0) {
          const { error: insertErr } = await supabase
            .from('app_settings_delivery')
            .insert({ id: SETTINGS_ID, ...payload });
          if (insertErr) {
            console.error('AutoSave INSERT Error:', insertErr);
            throw insertErr;
          }
        }
        
        setLastSavedHash(JSON.stringify(appSettings));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err: any) {
        console.error('AutoSave Error:', err);
        setAutoSaveStatus('error');
        toastError('Falha na persistência: As alterações podem não ter sido salvas.');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [appSettings, lastSavedHash, isFetchingSettings]);

  // Selection & UI
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMerchantPreview, setSelectedMerchantPreview] = useState<Merchant | null>(null);
  const [selectedDriverStudio, setSelectedDriverStudio] = useState<Driver | null>(null);
  const [selectedUserStudio, setSelectedUserStudio] = useState<User | null>(null);
  const [selectedCategoryStudio, setSelectedCategoryStudio] = useState<Category | null>(null);
  const [selectedZoneForMap, setSelectedZoneForMap] = useState<any>(null);
  const [selectedTrackingItem, setSelectedTrackingItem] = useState<any>(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('all');

  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'driver' | 'my_driver' | 'my_product' | 'category' | 'promotion' | 'merchant' | 'partner' | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [activePreviewTab, setActivePreviewTab] = useState<'info' | 'products' | 'categories' | 'sales' | 'dedicated_slots' | 'promotions' | 'financial'>('info');
  const [activeStudioTab, setActiveStudioTab] = useState<'personal' | 'vehicle' | 'finance' | 'documents' | 'wallet' | 'security' | 'general' | 'subcategories'>('personal');
  const [trackingListTab, setTrackingListTab] = useState<'orders' | 'drivers'>('orders');

  const [showActiveOrdersModal, setShowActiveOrdersModal] = useState(false);
  const [showCategoryListModal, setShowCategoryListModal] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoFormType, setPromoFormType] = useState<'banner' | 'coupon'>('banner');
  const [promoForm, setPromoForm] = useState<any>(null);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoSaveStatus, setPromoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isCompletingOrder, setIsCompletingOrder] = useState<string | null>(null);
  const [newOrderNotification, setNewOrderNotification] = useState<{ show: boolean; orderId?: string }>({ show: false });

  // Wallet
  const [walletTransactions] = useState<WalletTransaction[]>([]);
  const [merchantTransactions, setMerchantTransactions] = useState<WalletTransaction[]>([]);
  const [merchantBalance, setMerchantBalance] = useState(0);
  const [partnerTransactions, setPartnerTransactions] = useState<WalletTransaction[]>([]);
  const [partnerBalance, setPartnerBalance] = useState(0);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [creditToAdd, setCreditToAdd] = useState('');
  const [isAddingCredit] = useState(false);
  const [showWalletStatementModal, setShowWalletStatementModal] = useState(false);

  // Dynamic Rates & Map
  const [isAddingPeakRule, setIsAddingPeakRule] = useState(false);
  const [newPeakRule, setNewPeakRule] = useState({ label: '', multiplier: 1.2, is_active: true });
  const [newZoneData, setNewZoneData] = useState<any>(null);
  const [mapSearch, setMapSearch] = useState<any>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [mapCenterView, setMapCenterView] = useState({ lat: -23.5505, lng: -46.6333 });
  const [fixedGridCenter, setFixedGridCenter] = useState({ lat: -23.5505, lng: -46.6333 });
  const [selectedHexagons, setSelectedHexagons] = useState<string[]>([]);
  const [hexGrid] = useState<any[]>([]);

  // Preview Data
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewCategories, setPreviewCategories] = useState<MenuCategory[]>([]);

  // SISTEMA DE SOM REDUNDANTE (Vigilante de Pedidos - Alta Confiabilidade)
  const heardOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (userRole !== 'merchant') return;

    // Se a lista estiver vazia, apenas desativamos a flag de primeiro carregamento
    // Isso garante que quando o PRIMEIRA pedido chegar, ele toque o som.
    if (allOrders.length === 0) {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        console.log('[SOM-WATCHER] Vigilante pronto. Lista inicial vazia.');
      }
      return;
    }

    // Se for o primeiro carregamento e já houver pedidos (ex: refresh com pedidos na tela)
    // apenas absorvemos os IDs para não tocar som de pedidos "velhos"
    if (isFirstLoad.current) {
      allOrders.forEach(order => heardOrderIds.current.add(order.id));
      isFirstLoad.current = false;
      console.log(`[SOM-WATCHER] Vigilante inicializado com ${heardOrderIds.current.size} pedidos conhecidos.`);
      return;
    }

    const actionableStatuses = ['novo', 'waiting_merchant', 'waiting_payment', 'pendente', 'pendente_pagamento', 'paid', 'pago', 'confirmed', 'confirmado', 'pago_finalizado'];
    
    // Identificar pedidos que surgiram agora na lista
    const newActionableOrders = allOrders.filter(order => {
      const status = String(order.status || '').toLowerCase();
      const isActionable = actionableStatuses.includes(status);
      const isNew = !heardOrderIds.current.has(order.id);
      return isActionable && isNew;
    });

    if (newActionableOrders.length > 0) {
      console.log(`[SOM-WATCHER] 🔊 Novos pedidos detectados!`, newActionableOrders.length);
      
      // Marcar como ouvidos imediatamente para evitar loop
      newActionableOrders.forEach(order => heardOrderIds.current.add(order.id));
      
      // DISPARA O SOM
      playIziSound('merchant');
      
      if (newActionableOrders.length === 1) {
        setNewOrderNotification({ show: true, orderId: newActionableOrders[0].id });
      }
    }
  }, [allOrders, userRole]);

  // Establishment Types
   const [establishmentTypes, setEstablishmentTypes] = useState<EstablishmentType[]>([]);

  const fetchEstablishmentTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('establishment_types').select('*').order('name');
      if (error) throw error;
      if (data) setEstablishmentTypes(data as EstablishmentType[]);
    } catch (err) {
      console.log('Erro ao buscar tipos de estabelecimento ou tabela inexistente');
    }
  }, []);
  const handleUpdateEstablishmentType = useCallback(async (type: any) => {
    setIsSaving(true);
    try {
      // Remover campos temporários se existirem (ex: se for um novo item sem ID real)
      const dataToSave = { ...type };
      if (typeof dataToSave.id === 'string' && dataToSave.id.startsWith('new-')) {
        delete dataToSave.id;
      }

      const { error } = await supabase.from('establishment_types').upsert(dataToSave);
      if (error) throw error;
      toastSuccess('Categoria atualizada na matriz!');
      fetchEstablishmentTypes();
    } catch (err: any) {
      toastError('Erro ao atualizar taxonomia: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }, [fetchEstablishmentTypes]);

  const handleDeleteEstablishmentType = useCallback(async (id: string) => {
    if (!await showConfirm({ message: 'Excluir este tipo de estabelecimento?' })) return;
    try {
      const { error } = await supabase.from('establishment_types').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar no banco:', error);
        setEstablishmentTypes(prev => prev.filter(p => p.id !== id));
      } else {
        toastSuccess('Removido com sucesso!');
        fetchEstablishmentTypes();
      }
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchEstablishmentTypes]);


  // RBAC & Session Effects
  useEffect(() => {
    localStorage.setItem('izi_admin_active_tab', activeTab);
  }, [activeTab]);

  const handleLogout = useCallback(async () => {
     setMerchantProfile(null);
     setDashboardOrders([]);
     setActiveTab('dashboard');
     
     // Remove chaves específicas do admin
     const adminKeys = [
       'izi_admin_active_tab',
       'izi_admin_role',
       'izi_admin_profile',
       'izi_admin_merchant_id',
       'izi_admin_email'
     ];
     adminKeys.forEach(k => localStorage.removeItem(k));

     await logout();
  }, [logout]);

  const fetchUserRole = useCallback(async (userEmail: string) => {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (cleanEmail === MASTER_ADMIN_EMAIL) {
      setUserRole('admin');
      setMerchantProfile(null);
      localStorage.setItem('izi_admin_role', 'admin');
      setIsInitialLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (!data.is_active) {
          toastWarning('Conta desativada.');
          handleLogout();
          return;
        }

        const role = (data.role as UserRole) || 'merchant';
        setUserRole(role);
        localStorage.setItem('izi_admin_role', role);

        if (role === 'merchant') {
          const profile: MerchantProfile = {
            id: data.id,
            merchant_id: data.id,
            store_name: data.store_name || 'Loja',
            store_logo: data.store_logo || '',
            store_description: data.store_description || '',
            store_banner: data.store_banner || '',
            store_phone: data.store_phone || '',
            delivery_radius: data.delivery_radius || 15,
            opening_hours: data.opening_hours || {},
            store_address: data.store_address || '',
            dispatch_priority: data.dispatch_priority || 'global',
            scheduling_priority: data.scheduling_priority || 'global',
            is_open: data.is_open ?? true,
            free_delivery: data.free_delivery ?? false,
            estimated_time: data.estimated_time || '30-45 min',
            store_type: data.store_type || 'restaurant',
            food_category: Array.isArray(data.food_category) ? data.food_category : [data.food_category || 'all'],
            metadata: data.metadata || {}
          };
          setMerchantProfile(profile);
          localStorage.setItem('izi_admin_profile', JSON.stringify(profile));
          
          setActiveTab(prev => {
            const validMerchantTabs = ['orders', 'my_studio', 'my_drivers', 'promotions', 'financial', 'settings', 'support'];
            if (!prev || !validMerchantTabs.includes(prev)) {
              return 'orders';
            }
            return prev;
          });
        } else {
          setMerchantProfile(null);
          setActiveTab(prev => {
            const merchantOnlyTabs = ['my_studio', 'my_drivers', 'financial'];
            if (merchantOnlyTabs.includes(prev)) {
              return 'dashboard';
            }
            return prev;
          });
        }
      } else {
        toastWarning('Perfil administrativo não encontrado.');
        handleLogout();
      }
    } catch (err: any) {
      console.error('Erro RBAC:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [MASTER_ADMIN_EMAIL, handleLogout]);



  useEffect(() => {
    if (isAuthLoading) return;

    if (session?.user?.email) {
      setIsInitialLoading(true);
      fetchUserRole(session.user.email);
      fetchEstablishmentTypes();
    } else {
      setIsInitialLoading(false);
    }
  }, [session?.user?.email, fetchUserRole, isAuthLoading, fetchEstablishmentTypes]);

  // Sincronização em tempo real "mão-dupla" absoluta (Auto-refresh de stats)
  useEffect(() => {
    if (!driversList.length) return;
    const interval = setInterval(() => {
      syncDriverStats(driversList);
    }, 2000); // Super agressivo: 2s para ser "instantâneo"
    return () => clearInterval(interval);
  }, [driversList, syncDriverStats]);

  const logAction = useCallback(async (action: string, module: string, details: any = {}) => {
    await supabase.from('audit_logs_delivery').insert({
      user_id: session?.user?.id,
      action,
      module,
      metadata: details
    });
  }, [session]);
  

  // Data Fetchers
  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingList(true);
    try {
      const { data: userData } = await supabase.from('users_delivery').select('id').eq('is_deleted', false);
      const { data: driverData } = await supabase.from('drivers_delivery').select('id').eq('is_deleted', false);
      let orderQuery = supabase
        .from('orders_delivery')
        .select('total_price, status, merchant_id, created_at, service_type');
      
      // FILTRAGEM DE SEGURANÇA: Se não for ADMIN mestre, forçamos a filtragem por merchant_id no BANCO
      if (userRole === 'merchant' && merchantProfile?.id) {
        orderQuery = orderQuery.eq('merchant_id', merchantProfile.id);
      }

      const { data: orderData } = await orderQuery;
      const { data: onlineData } = await supabase.from('drivers_delivery').select('id, is_online, last_seen_at').eq('is_online', true).eq('is_deleted', false);
      const onlineDriversCount = countOnlineDrivers((onlineData || []) as Driver[]);

      // Garantir que a driversList esteja populada para que o Realtime funcione no Dashboard
      if (!driversList.length) {
        void fetchDriversRef.current(true);
      }

      const { data: merchantData } = await supabase.from('admin_users').select('id').eq('role', 'merchant');
      const { data: promoData } = await supabase.from('promotions_delivery').select('*');

      const visibleOrders = orderData || [];
      const completedOrders = (orderData || []).filter(o => o.status === 'concluido' || o.status === 'delivered');
      const canceledOrders = (orderData || []).filter(o => o.status === 'cancelado');
      const coupons = promoData?.filter(p => p.type === 'coupon') || [];

      if (orderData) {
        let filtered = visibleOrders as Order[];
        if (userRole === 'merchant' && merchantProfile?.id) {
          filtered = filtered.filter(o => o.merchant_id === merchantProfile.id);
        }
        setDashboardOrders(filtered);
      }

      // Se for lojista, as estatísticas de faturamento devem respeitar apenas os seus pedidos
      const relevantCompleted = userRole === 'merchant' && merchantProfile?.id 
        ? completedOrders.filter(o => o.merchant_id === merchantProfile.id)
        : completedOrders;

      const totalRevenue = relevantCompleted.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
      const cancelationImpact = canceledOrders.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
      const totalCouponsValue = coupons.reduce((acc: number, curr: any) => acc + (curr.discount_value || 0), 0);
      const activeOffers = promoData?.filter((p: any) => p.is_active).length || 0;

      setStats({
        users: userData?.length || 0,
        drivers: driverData?.length || 0,
        orders: visibleOrders.length,
        onlineDrivers: onlineDriversCount,
        revenue: totalRevenue,
        merchants: merchantData?.length || 0,
        promotions: promoData?.length || 0,
        totalCoupons: coupons.length,
        canceledOrders: canceledOrders.length,
        cancelationImpact: cancelationImpact,
        activeOffers: activeOffers,
        couponInvestment: totalCouponsValue
      });
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }, [userRole, merchantProfile, driversList.length]);

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingList(true);
    try {
      let query = supabase.from('users_delivery').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      if (userStatusFilter !== 'all') {
        if (userStatusFilter === 'active') query = query.eq('is_active', true);
        else if (userStatusFilter === 'suspended') query = query.eq('is_active', false);
      }
      const { data } = await query;
      if (data) setUsersList(data as User[]);
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }, [userStatusFilter]);

  const fetchDrivers = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingList(true);
    try {
      const { data } = await supabase
        .from('drivers_delivery')
        .select('*')
        .eq('is_deleted', false)
        .order('is_online', { ascending: false })
        .order('name', { ascending: true });
      if (data) {
        const sortedDrivers = sortDriversByPresence(data as Driver[]);
        setDriversList(sortedDrivers);
        syncDriverStats(sortedDrivers);
      }
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }, [syncDriverStats]);

  const fetchMyDrivers = useCallback(async (silent = false) => {
    if (!merchantProfile?.id) return;
    if (!silent) setIsLoadingList(true);
    try {
      const { data } = await supabase.from('drivers_delivery').select('*').eq('merchant_id', merchantProfile.id).eq('is_deleted', false);
      if (data) setMyDriversList(sortDriversByPresence(data as Driver[]));
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }, [merchantProfile]);

  const fetchProducts = useCallback(async (explicitMerchantId?: string, silent = false) => {
    const idToUse = explicitMerchantId || merchantProfile?.id;
    if (!idToUse) return;
    if (!silent) setIsLoadingList(true);
    try {
      // Busca produtos e ofertas relâmpago ativas em paralelo
      const [productsRes, offersRes] = await Promise.all([
        supabase.from('products_delivery').select('*').eq('merchant_id', idToUse),
        supabase.from('flash_offers').select('*').eq('merchant_id', idToUse).eq('is_active', true)
      ]);

      if (productsRes.data) {
        const productsWithOffers = productsRes.data.map(p => ({
          ...p,
          flashOffer: offersRes.data?.find(o => o.product_id === p.id) || null
        }));

        setProductsList(productsWithOffers as Product[]);
        if (explicitMerchantId) {
          setPreviewProducts(productsWithOffers as Product[]);
        }
      }
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }, [merchantProfile]);

  const fetchMenuCategories = useCallback(async (explicitMerchantId?: string) => {
    const idToUse = explicitMerchantId || merchantProfile?.id;
    if (!idToUse) return;
    try {
      const { data } = await supabase.from('merchant_categories_delivery').select('*').eq('merchant_id', idToUse).order('sort_order', { ascending: true });
      if (data) {
        setMenuCategoriesList(data as MenuCategory[]);
        if (explicitMerchantId) {
          setPreviewCategories(data as MenuCategory[]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar categorias do menu:', err);
    }
  }, [merchantProfile]);

  const fetchAllOrders = useCallback(async (page?: number, silent = false) => {
    const targetPage = page !== undefined ? page : (userRole === 'merchant' ? merchantOrdersPage : ordersPage);
    if (!silent) setIsLoadingList(true);
    try {
      if (!session?.user?.id) {
        return;
      }

      if (userRole === 'merchant' && !merchantProfile?.id) {
        setAllOrders([]);
        setMerchantOrdersTotalCount(0);
        return;
      }

      const from = (targetPage - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      if (userRole === 'merchant' && merchantProfile?.id) {
        // Caso seja Lojista, fazemos um fetch padrão + um fetch de segurança para pedidos pendentes
        const { data, error, count } = await supabase
          .from('orders_delivery')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantProfile.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;

        let finalOrders = data as Order[];

        // SEURANÇA: Se estamos na página 1, buscar TODOS os pedidos que precisam de ação imediata 
        // para garantir que não fiquem "presos" em páginas posteriores ou perdidos por cache
        if (targetPage === 1) {
          const { data: actionableData } = await supabase
            .from('orders_delivery')
            .select('*')
            .eq('merchant_id', merchantProfile.id)
            .in('status', ['novo', 'waiting_merchant', 'paid', 'pago', 'confirmed', 'confirmado'])
            .order('created_at', { ascending: false });

          if (actionableData && actionableData.length > 0) {
            // Mergiar garantindo unicidade por ID
            const actionableIds = new Set(actionableData.map(o => o.id));
            const otherOrders = finalOrders.filter(o => !actionableIds.has(o.id));
            finalOrders = [...actionableData, ...otherOrders];
          }
        }

        if (data) setAllOrders(finalOrders);
        if (count !== null) setMerchantOrdersTotalCount(count);
        setMerchantOrdersPage(targetPage);
      } else {
        let query = supabase
          .from('orders_delivery')
          .select('*, user:users_delivery(*)', { count: 'exact' })
          .neq('service_type', 'subscription');
        
        // Segregação de Dados: Lojistas só buscam seus próprios pedidos
        if (userRole === 'merchant' && merchantProfile?.id) {
          query = query.eq('merchant_id', merchantProfile.id);
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (data) setAllOrders(data as Order[]);
        if (count !== null) setOrdersTotalCount(count);
        setOrdersPage(targetPage);
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, [userRole, merchantProfile, merchantOrdersPage, ordersPage, session?.user?.id]);

  // Mapeamento de refs para funções voláteis usadas no Realtime (evita reconnect do canal)
  const fetchAllOrdersRef = useRef(fetchAllOrders);
  const fetchStatsRef = useRef(fetchStats);
  const fetchDriversRef = useRef(fetchDrivers);
  const fetchMyDriversRef = useRef(fetchMyDrivers);
  const fetchProductsRef = useRef(fetchProducts);
  const fetchMenuCategoriesRef = useRef(fetchMenuCategories);



  const allOrdersRef = useRef(allOrders);

  useEffect(() => { fetchAllOrdersRef.current = fetchAllOrders; }, [fetchAllOrders]);
  useEffect(() => { fetchStatsRef.current = fetchStats; }, [fetchStats]);
  useEffect(() => { fetchDriversRef.current = fetchDrivers; }, [fetchDrivers]);
  useEffect(() => { fetchMyDriversRef.current = fetchMyDrivers; }, [fetchMyDrivers]);
  useEffect(() => { fetchProductsRef.current = fetchProducts; }, [fetchProducts]);
  useEffect(() => { fetchMenuCategoriesRef.current = fetchMenuCategories; }, [fetchMenuCategories]);
  useEffect(() => { allOrdersRef.current = allOrders; }, [allOrders]);

  
  const merchantProfileRef = useRef(merchantProfile);

  useEffect(() => { merchantProfileRef.current = merchantProfile; }, [merchantProfile]);

  const selectedMerchantPreviewRef = useRef(selectedMerchantPreview);
  useEffect(() => { selectedMerchantPreviewRef.current = selectedMerchantPreview; }, [selectedMerchantPreview]);

  // Canal Global de Tempo Real (Admin e Lojista)
  useEffect(() => {
    if (!session?.user?.id || !userRole) return;
    if (userRole === 'merchant' && !merchantProfile?.id) return;

    const channelName = userRole === 'merchant'
      ? `admin_sync_merchant_${merchantProfile?.id}`
      : `admin_sync_admin_${session.user.id}`;
    
    console.log(`[REALTIME] Ativando subscrição: ${channelName}`);
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders_delivery' },
        (payload) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const updatedOrder = payload.new as Order;
            const currentMID = String(merchantProfileRef.current?.merchant_id || merchantProfileRef.current?.id || '');
            const orderMID = String(updatedOrder.merchant_id || '');

            if (userRole === 'merchant') {
              let effectiveOrderMID = orderMID;
              if (!effectiveOrderMID) {
                const existing = allOrdersRef.current.find(o => o.id === updatedOrder.id);
                if (existing) effectiveOrderMID = String(existing.merchant_id || '');
              }
              if (effectiveOrderMID !== currentMID) return;
            }

            // Atualização do Estado
            setAllOrders(prev => {
              const exists = prev.find(o => o.id === updatedOrder.id);
              if (exists) return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
              return [updatedOrder, ...prev];
            });

            setDashboardOrders(prev => {
              const exists = prev.find(o => o.id === updatedOrder.id);
              if (exists) return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
              return [updatedOrder, ...prev];
            });

            // NOTIFICAÇÃO SONORA PARA O LOJISTA
            if (userRole === 'merchant') {
              const isNewOrWaiting = updatedOrder.status === 'waiting_merchant' || updatedOrder.status === 'novo';
              const isStatusUpdate = payload.eventType === 'UPDATE';
              
              if (payload.eventType === 'INSERT' && isNewOrWaiting) {
                playIziSound('merchant');
                toastInfo(`🔔 Novo Pedido Recebido! (#${updatedOrder.id.slice(0, 8).toUpperCase()})`);
              } else if (isStatusUpdate && updatedOrder.status === 'waiting_merchant') {
                playIziSound('merchant');
                toastInfo(`🔔 Pedido Aguardando Aprovação! (#${updatedOrder.id.slice(0, 8).toUpperCase()})`);
              }
            }

            // Atualização de estatísticas após mudança no pedido
            setTimeout(() => {
              fetchStatsRef.current(true);
              fetchAllOrdersRef.current(undefined, true);
            }, 500);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers_delivery' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Driver;
            const old = payload.old as Driver;
            setDriversList(prev => upsertDriverInList(prev, updated));
            if (userRole === 'merchant') {
              const currentMID = String(merchantProfileRef.current?.id || '');
              const updatedMID = String(updated.merchant_id || '');
              if (updatedMID === currentMID && !updated.is_deleted) {
                setMyDriversList(prev => upsertDriverInList(prev, updated));
              } else if (String(old?.merchant_id) === currentMID) {
                setMyDriversList(prev => removeDriverFromList(prev, updated.id));
              }
            }
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new as Driver;
            setDriversList(prev => upsertDriverInList(prev, inserted));
            if (userRole === 'merchant') {
              const currentMID = String(merchantProfileRef.current?.id || '');
              if (String(inserted.merchant_id) === currentMID && !inserted.is_deleted) {
                setMyDriversList(prev => upsertDriverInList(prev, inserted));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const removed = payload.old as Driver;
            setDriversList(prev => removeDriverFromList(prev, removed.id));
            if (userRole === 'merchant') {
              const currentMID = String(merchantProfileRef.current?.id || '');
              if (String(removed.merchant_id) === currentMID) {
                setMyDriversList(prev => removeDriverFromList(prev, removed.id));
              }
            }
          }
          syncDriverStats(driversList);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions_delivery' },
        (payload) => {
          const newTx = payload.new as any;
          const currentMID = String(merchantProfileRef.current?.id || '');
          const previewMID = String(selectedMerchantPreviewRef.current?.id || '');
          const idToUse = userRole === 'merchant' ? currentMID : previewMID;
          if (String(newTx.user_id) === idToUse && (newTx.type === 'deposito' || newTx.type === 'venda')) {
            toastSuccess(`Pagamento Recebido: R$ ${parseFloat(newTx.amount).toFixed(2)}`);
            fetchMerchantFinance();
            playIziSound('payment');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products_delivery' },
        (payload) => {
          const currentMID = String(merchantProfileRef.current?.id || '');
          const previewMID = String(selectedMerchantPreviewRef.current?.id || '');
          const targetMID = userRole === 'merchant' ? currentMID : previewMID;
          
          const changedProduct = (payload.new || payload.old) as any;
          if (String(changedProduct?.merchant_id) === targetMID) {
            console.log('⚡ Produto alterado (Realtime):', payload.eventType);
            fetchProductsRef.current(targetMID, true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'merchant_categories_delivery' },
        (payload) => {
          const currentMID = String(merchantProfileRef.current?.id || '');
          const previewMID = String(selectedMerchantPreviewRef.current?.id || '');
          const targetMID = userRole === 'merchant' ? currentMID : previewMID;
          
          const changedCat = (payload.new || payload.old) as any;
          if (String(changedCat?.merchant_id) === targetMID) {
            console.log('⚡ Categoria alterada (Realtime):', payload.eventType);
            fetchMenuCategoriesRef.current(targetMID);
          }
        }
      )
      .subscribe((status) => {

        console.log(`[REALTIME-STATUS] Canal Pedidos (${channelName}):`, status);
      });

    // Canal dedicado para Vagas e Candidaturas (Isolado para estabilidade)
    const activeMerchantId = merchantProfileRef.current?.id || selectedMerchantPreviewRef.current?.id;
    const slotsChannel = supabase.channel('dedicated_slots_admin_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slot_applications', filter: activeMerchantId ? `merchant_id=eq.${activeMerchantId}` : undefined },
        (payload) => {
          console.log('⚡ MUDANÇA EM CANDIDATURA (Canal Dedicado):', payload);
          fetchMyDedicatedSlotsRef.current();
          
          if (payload.eventType === 'INSERT') {
            playIziSound('candidate');
            toastSuccess('Nova candidatura recebida!');
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            if (updated.status === 'accepted') {
              playIziSound('payment');
              toastSuccess('Vaga preenchida com sucesso!');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME-STATUS] Canal Vagas Dedicadas:', status);
      });
    fetchStatsRef.current(true);
    fetchAllOrdersRef.current(undefined, true);
    if (userRole === 'merchant') {
      fetchMyDriversRef.current(true);
    }

    const settingsChannel = supabase.channel('global_settings_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings_delivery' },
        (payload) => {
          console.log('⚡ SETTINGS REALTIME:', payload);
          if (payload.new) setGlobalSettings(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(settingsChannel);
    };
  }, [session?.user?.id, userRole, merchantProfile?.id]);

  useEffect(() => {
    if (!session?.user?.id || userRole !== 'merchant' || !merchantProfile?.id) return;

    const syncMerchantOrders = () => {
      fetchAllOrdersRef.current(undefined, true);
      fetchStatsRef.current(true);
    };

    const handleFocus = () => {
      syncMerchantOrders();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncMerchantOrders();
      }
    };

    syncMerchantOrders();

    const intervalMs = activeTab === 'orders' ? 5000 : 12000;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncMerchantOrders();
      }
    }, intervalMs);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, merchantProfile?.id, session?.user?.id, userRole]);

  const fetchMerchantFinance = useCallback(async () => {
    const idToUse = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
    if (!idToUse) return;
    
    setIsWalletLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('user_id', idToUse)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) {
        setMerchantTransactions(data as WalletTransaction[]);
        const balance = data.reduce((acc, t) => {
          if (t.status === 'cancelado' || t.status === 'estornado') return acc;
          const amt = Number(t.amount) || 0;
          return acc + (t.type === 'saque' ? -amt : amt);
        }, 0);
        setMerchantBalance(balance);
      }
    } catch (err: any) {
      console.error('Error fetching merchant finance:', err);
    } finally {
      setIsWalletLoading(false);
    }
  }, [userRole, merchantProfile, selectedMerchantPreview]);

  const fetchPartnerFinance = useCallback(async (partnerId: string) => {
    if (!partnerId) return;
    
    setIsWalletLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('user_id', partnerId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) {
        setPartnerTransactions(data as WalletTransaction[]);
        const balance = data.reduce((acc, t) => acc + (t.type === 'saque' ? -Number(t.amount) : Number(t.amount)), 0);
        setPartnerBalance(balance);
      }
    } catch (err: any) {
      console.error('Error fetching partner finance:', err);
    } finally {
      setIsWalletLoading(false);
    }
  }, []);

  const handleRequestWithdrawal = useCallback(async (amount: number, pixKey: string) => {
    const idToUse = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
    if (!idToUse) return;

    // 1. Validar Valor Mínimo Global
    const minAmount = Number(appSettings.minwithdrawalamount ?? 0);
    if (amount < minAmount) {
      return toastError(`O valor mínimo para saque é R$ ${minAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    }

    if (amount > merchantBalance) {
      return toastError('Saldo insuficiente para este saque.');
    }

    // 2. Validar Dia de Saque (opcional, se configurado)
    if (appSettings.withdrawal_day) {
      const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date());
      // Ajuste para ignorar case e acentos se necessário, mas geralmente o DB salva 'Quarta-feira'
      if (!today.toLowerCase().includes(appSettings.withdrawal_day.toLowerCase())) {
        toastWarning(`Atenção: O dia oficial para saques é ${appSettings.withdrawal_day}. Sua solicitação pode demorar mais para ser processada.`);
      }
    }

    // 3. Calcular Taxa
    const feePercent = Number(appSettings.withdrawalfeepercent || 0);
    const feeAmount = amount * (feePercent / 100);
    const netAmount = amount - feeAmount;

    const confirmMessage = feeAmount > 0 
      ? `Deseja solicitar o saque de R$ ${amount.toFixed(2)}?\n\n` +
        `Taxa de processamento (${feePercent}%): R$ ${feeAmount.toFixed(2)}\n` +
        `Valor líquido a receber: R$ ${netAmount.toFixed(2)}\n\n` +
        `Chave PIX: ${pixKey}`
      : `Deseja solicitar o saque de R$ ${amount.toFixed(2)} para a chave PIX: ${pixKey}?`;

    if (!await showConfirm({ 
      title: 'Confirmar Saque',
      message: confirmMessage
    })) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('wallet_transactions_delivery').insert({
        user_id: idToUse,
        amount: amount, // Registramos o valor bruto solicitado
        type: 'saque',
        description: `Saque solicitado via PIX: ${pixKey}${feeAmount > 0 ? ` (Taxa IZI: R$ ${feeAmount.toFixed(2)})` : ''}`,
        status: 'pendente',
        balance_after: merchantBalance - amount
      });

      if (error) throw error;

      toastSuccess('Solicitação de saque enviada com sucesso!');
      fetchMerchantFinance();
      logAction('Withdrawal Request', 'Wallet', { userId: idToUse, amount, feeAmount });
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [userRole, merchantProfile, selectedMerchantPreview, merchantBalance, fetchMerchantFinance, logAction, appSettings]);

  const handleRequestPartnerWithdrawal = useCallback(async (partnerId: string, amount: number, pixKey: string) => {
    if (!partnerId) return;

    if (amount < 1) return toastError('O valor mínimo para saque é R$ 1,00');
    if (amount > partnerBalance) return toastError('Saldo insuficiente.');

    if (!await showConfirm({ 
      title: 'Confirmar Saque de Parceiro',
      message: `Deseja solicitar o saque de R$ ${amount.toFixed(2)} para a chave PIX: ${pixKey}?` 
    })) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('wallet_transactions_delivery').insert({
        user_id: partnerId,
        amount,
        type: 'saque',
        description: `Saque de Parceiro solicitado via PIX: ${pixKey}`,
        status: 'pendente',
        balance_after: partnerBalance - amount
      });

      if (error) throw error;

      toastSuccess('Solicitação enviada!');
      fetchPartnerFinance(partnerId);
      logAction('Partner Withdrawal Request', 'Wallet', { partnerId, amount });
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [partnerBalance, fetchPartnerFinance, logAction]);

  const handleUpdateMerchantBankInfo = useCallback(async (bankInfo: any) => {
    const idToUse = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
    if (!idToUse) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ bank_info: bankInfo })
        .eq('id', idToUse);
      
      if (error) throw error;
      toastSuccess('Dados bancários atualizados com sucesso!');
      logAction('Update Bank Info', 'Merchant', { merchantId: idToUse });
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [userRole, merchantProfile, selectedMerchantPreview, logAction]);
  const handleSyncMerchantBalance = useCallback(async () => {
    const idToUse = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
    if (!idToUse) return;

    setIsWalletLoading(true);
    try {
      // 1. Buscar todos os pedidos concluídos do lojista
      const { data: orders, error: ordersErr } = await supabase
        .from('orders_delivery')
        .select('*')
        .eq('merchant_id', idToUse)
        .eq('status', 'concluido');

      if (ordersErr) throw ordersErr;

      // 2. Buscar transações já existentes para evitar duplicidade
      const { data: txs, error: txsErr } = await supabase
        .from('wallet_transactions_delivery')
        .select('description')
        .eq('user_id', idToUse)
        .eq('type', 'venda');

      if (txsErr) throw txsErr;

      const existingDescriptions = new Set(txs?.map(t => t.description) || []);
      const commRate = merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12;

      let syncedCount = 0;
      let currentBalance = merchantBalance;

      for (const order of (orders || [])) {
        const desc = `Venda Pedido #${order.id.slice(0,8).toUpperCase()} (Líquido)`;
        const legacyDesc = `Venda do Pedido #${order.id.slice(0,8).toUpperCase()}`; // Para compatibilidade com o que criei minutos atrás
        
        if (!existingDescriptions.has(desc) && !existingDescriptions.has(legacyDesc)) {
          const netAmount = order.total_price - (order.total_price * (commRate / 100));
          currentBalance += netAmount;

          await supabase.from('wallet_transactions_delivery').insert({
            user_id: idToUse,
            amount: netAmount,
            type: 'venda',
            description: desc,
            status: 'concluido',
            balance_after: currentBalance,
            created_at: order.created_at // Manter data original
          });
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        toastSuccess(`${syncedCount} transações sincronizadas!`);
        fetchMerchantFinance();
      } else {
        toastSuccess('Seu saldo já está sincronizado.');
      }
    } catch (err: any) {
      toastError('Erro na sincronização: ' + err.message);
    } finally {
      setIsWalletLoading(false);
    }
  }, [userRole, merchantProfile, selectedMerchantPreview, appSettings, merchantBalance, fetchMerchantFinance]);

  const fetchSubscriptionOrders = useCallback(async (page = 1) => {
    setIsLoadingList(true);
    try {
      const from = (page - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('orders_delivery')
        .select('*', { count: 'exact' })
        .eq('service_type', 'subscription')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (data) setSubscriptionOrders(data as Order[]);
      if (count !== null) setSubscriptionOrdersTotalCount(count);
      setSubscriptionOrdersPage(page);
    } catch (err: any) {
      console.error('Erro ao carregar assinaturas:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('categories_delivery').select('*').order('name', { ascending: true });
      if (data) setCategoriesState(data as Category[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchDynamicRates = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('dynamic_rates_delivery').select('*');
      if (data) {
        const peakHoursRow = data.find(r => r.type === 'peak_hour');
        const zonesRow = data.find(r => r.type === 'zone');
        const equilibriumRow = data.find(r => r.type === 'equilibrium');
        const baseValuesRow = data.find(r => r.type === 'base_values');
        const weatherRulesRow = data.find(r => r.type === 'weather_rules');
        const flowControlRow = data.find(r => r.type === 'flow_control');
        const shippingPrioritiesRow = data.find(r => r.type === 'shipping_priorities');

        setDynamicRatesState(prev => ({
          ...prev,
          peakHours: (peakHoursRow?.metadata as any)?.rules || [],
          zones: (zonesRow?.metadata as any)?.rules || [],
          weather: weatherRulesRow?.metadata ? (weatherRulesRow.metadata as any) : prev.weather,
          equilibrium: equilibriumRow?.metadata ? (equilibriumRow.metadata as any) : prev.equilibrium,
          flowControl: flowControlRow?.metadata ? (flowControlRow.metadata as any) : prev.flowControl,
          baseValues: baseValuesRow?.metadata ? (() => {
            const metadata = baseValuesRow.metadata as any;
            const merged = { ...prev.baseValues };
            Object.keys(metadata).forEach(key => {
              const val = metadata[key];
              if (typeof val === 'number') {
                merged[key] = val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              } else {
                merged[key] = val;
              }
            });
            return merged;
          })() : prev.baseValues,
          shippingPriorities: shippingPrioritiesRow?.metadata ? (shippingPrioritiesRow.metadata as any) : prev.shippingPriorities,
        }));
      }
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchPromotions = useCallback(async () => {
    setIsLoadingList(true);
    try {
      let query = supabase.from('promotions_delivery').select('*').order('created_at', { ascending: false });
      
      if (userRole === 'merchant' && merchantProfile?.id) {
        query = query.eq('merchant_id', merchantProfile.id);
      }

      const { data } = await query;
      if (data) setPromotionsList(data as Promotion[]);
    } finally {
      setIsLoadingList(false);
    }
  }, [userRole, merchantProfile]);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('audit_logs_delivery').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) setAuditLogsList(data as AuditLog[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchMerchants = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('admin_users').select('*').eq('role', 'merchant').eq('is_deleted', false).order('store_name', { ascending: true });
      if (data) setMerchantsList(data as Merchant[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchPartners = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('partner_stores_delivery')
        .select('*')
        .order('name');
      if (error) throw error;
      setPartnersList(data || []);
    } catch (err: any) {
      toastError('Erro ao buscar parceiros: ' + err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchAppSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    try {
      const { data } = await supabase.from('app_settings_delivery').select('*').single();
      if (data) {
        const mergedSettings: AppSettings = {
          ...appSettings,
          id: data.id,
          appName: data.app_name || appSettings.appName,
          supportEmail: data.support_email || appSettings.supportEmail,
          openingTime: data.opening_time || appSettings.openingTime,
          closingTime: data.closing_time || appSettings.closingTime,
          radius: data.radius !== undefined ? Number(data.radius) : appSettings.radius,
          baseFee: data.base_fee !== undefined ? Number(data.base_fee) : appSettings.baseFee,
          appCommission: data.app_commission !== undefined ? Number(data.app_commission) : appSettings.appCommission,
          driverFreightCommission: data.driver_freight_commission !== undefined ? Number(data.driver_freight_commission) : appSettings.driverFreightCommission,
          privateDriverCommission: data.private_driver_commission !== undefined ? Number(data.private_driver_commission) : appSettings.privateDriverCommission,
          serviceFee: data.service_fee !== undefined ? Number(data.service_fee) : appSettings.serviceFee,
          iziBlackFee: data.izi_black_fee !== undefined ? Number(data.izi_black_fee) : appSettings.iziBlackFee,
          iziBlackCashback: data.izi_black_cashback !== undefined ? Number(data.izi_black_cashback) : appSettings.iziBlackCashback,
          iziBlackMinOrderFreeShipping: data.izi_black_min_order_free_shipping !== undefined ? Number(data.izi_black_min_order_free_shipping) : appSettings.iziBlackMinOrderFreeShipping,
          iziCoinRate: data.izi_coin_rate !== undefined ? Number(data.izi_coin_rate) : appSettings.iziCoinRate,
          minwithdrawalamount: data.min_withdrawal_amount !== undefined ? Number(data.min_withdrawal_amount) : appSettings.minwithdrawalamount,
          withdrawalfeepercent: data.withdrawal_fee_percent !== undefined ? Number(data.withdrawal_fee_percent) : appSettings.withdrawalfeepercent,
          withdrawal_period_h: data.withdrawal_period_h !== undefined ? Number(data.withdrawal_period_h) : appSettings.withdrawal_period_h,
          withdrawal_day: data.withdrawal_day || appSettings.withdrawal_day,
          mercadopago_public_key: data.mercadopago_public_key || appSettings.mercadopago_public_key,
        };
        setAppSettings(mergedSettings);
        setLastSavedHash(JSON.stringify(mergedSettings));
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setIsFetchingSettings(false);
    }
  }, []);

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('admin_settings_delivery').select('*').single();
      if (data) setGlobalSettings(data);
    } catch (e) {
      console.error('Erro ao buscar global settings:', e);
    }
  }, []);

  const saveGlobalSettings = useCallback(async (newSettings: any) => {
    try {
      // Garantir que temos um ID para o upsert se necessário, mas geralmente é uma linha única
      const { error } = await supabase
        .from('admin_settings_delivery')
        .upsert({ ...newSettings, updated_at: new Date().toISOString() });
      
      if (error) throw error;
      setGlobalSettings(newSettings);
    } catch (err: any) {
      toastError('Erro ao salvar configurações globais: ' + err.message);
      throw err;
    }
  }, []);

  const fetchMyDedicatedSlots = useCallback(async () => {
    const targetId = userRole === 'merchant' ? merchantProfile?.merchant_id : selectedMerchantPreview?.id;
    if (!targetId) {
      setMyDedicatedSlots([]);
      return;
    }
    try {
      const { data } = await supabase.from('dedicated_slots_delivery').select('*').eq('merchant_id', targetId);
      if (data) setMyDedicatedSlots(data as DedicatedSlot[]);
    } catch (err) {
      console.error('Erro ao buscar vagas dedicadas:', err);
    }
  }, [userRole, merchantProfile?.merchant_id, selectedMerchantPreview?.id]);

  const fetchMyDedicatedSlotsRef = useRef(fetchMyDedicatedSlots);
  useEffect(() => { fetchMyDedicatedSlotsRef.current = fetchMyDedicatedSlots; }, [fetchMyDedicatedSlots]);



  const openMerchantPreview = useCallback(async (merchant: any) => {
    setSelectedMerchantPreview(merchant);
    setActivePreviewTab('info');
    try {
      const { data: prods } = await supabase.from('products_delivery').select('*').eq('merchant_id', merchant.id);
      setPreviewProducts(prods || []);
      const { data: cats } = await supabase.from('merchant_categories_delivery').select('*').eq('merchant_id', merchant.id);
      setPreviewCategories(cats || []);
    } catch (err) {
      console.error('Erro ao carregar preview do lojista:', err);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'admin' && selectedMerchantPreview?.id) {
      fetchMyDedicatedSlots();
    }
  }, [userRole, selectedMerchantPreview?.id, fetchMyDedicatedSlots]);

  useEffect(() => {
    if (isAuthLoading || !session?.user?.id || !userRole) return;
    if (userRole === 'merchant' && !merchantProfile?.id) return;

    fetchAppSettings();
    fetchGlobalSettings();
    fetchEstablishmentTypes();
    
    if (userRole === 'admin') {
      fetchStats();
      fetchUsers();
      fetchDrivers();
      fetchMerchants();
      fetchCategories();
      fetchPromotions();
      fetchDynamicRates();
      fetchAllOrders();
      fetchSubscriptionOrders();
    } else if (userRole === 'merchant') {
      fetchStats();
      fetchMyDrivers();
      fetchProducts();
      fetchMenuCategories();
      fetchAllOrders();
      fetchPromotions();
      fetchMyDedicatedSlots();
      fetchMerchantFinance();
    }
  }, [isAuthLoading, session?.user?.id, userRole, merchantProfile?.id, fetchAppSettings, fetchStats, fetchUsers, fetchDrivers, fetchMerchants, fetchCategories, fetchPromotions, fetchDynamicRates, fetchAllOrders, fetchSubscriptionOrders, fetchMyDrivers, fetchProducts, fetchMenuCategories, fetchMyDedicatedSlots, fetchMerchantFinance]);

  // Real-time: App Settings
  useEffect(() => {
    if (!userRole) return;

    const channel = supabase
      .channel('public:app_settings_delivery')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings_delivery' }, () => {
        fetchAppSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, fetchAppSettings]);

  // Polling: a cada 30s limpa entregadores ausentes e atualiza a lista
  useEffect(() => {
    if (!userRole || !session?.user?.id) return;

    const runDriverSync = async () => {
      // Chama a função SQL que força offline entregadores sem heartbeat há +5min
      try { await supabase.rpc('auto_offline_absent_drivers'); } catch (_) {}
      // Atualiza a lista local silenciosamente
      fetchDriversRef.current(true);
      fetchStatsRef.current(true);
    };

    // Roda imediatamente ao montar
    runDriverSync();

    const interval = setInterval(runDriverSync, 30_000); // a cada 30 segundos
    return () => clearInterval(interval);
  }, [userRole, session?.user?.id]);


  const handleAddCredit = async () => {
    setShowAddCreditModal(true);
  };

  const handleApplyCredit = useCallback(async (userId: string, amount: number, description: string = 'Crédito administrativo') => {
    if (amount <= 0) return toastError('O valor deve ser positivo.');
    setIsSaving(true);
    try {
      const { data: user, error: fetchErr } = await supabase.from('users_delivery').select('izi_coins').eq('id', userId).single();
      if (fetchErr) throw fetchErr;

      const newBalance = (user?.izi_coins || 0) + amount;
      const { error: updateErr } = await supabase.from('users_delivery').update({ izi_coins: newBalance }).eq('id', userId);
      if (updateErr) throw updateErr;

      await supabase.from('wallet_transactions_delivery').insert({
        user_id: userId,
        amount,
        type: 'credit',
        description,
        balance_after: newBalance
      });

      toastSuccess(`Crédito de ${amount} IZI Coins aplicado!`);
      fetchUsers();
      logAction('Apply Credit', 'Wallet', { userId, amount });
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [fetchUsers, logAction]);
  

  const handleUpdateDriver = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('drivers_delivery').upsert({
        id: editingItem.id || undefined,
        name: editingItem.name,
        phone: editingItem.phone,
        vehicle_type: editingItem.vehicle_type,
        license_plate: editingItem.license_plate,
        is_active: editingItem.is_active ?? true
      });
      if (error) throw error;
      toastSuccess('Entregador atualizado!');
      setEditingItem(null);
      setEditType(null);
      fetchDrivers();
      logAction('Update Driver', 'Drivers', editingItem);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, fetchDrivers, logAction]);

  const handleUpdateCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('categories_delivery').upsert(editingItem);
      if (error) throw error;
      toastSuccess('Categoria salva!');
      setEditingItem(null);
      setEditType(null);
      fetchCategories();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, fetchCategories]);

  const handleUpdateMyDriver = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !merchantProfile) return;
    setIsSaving(true);
    try {
      const { 
        is_available, // Remove is_available se existir
        title, // Remove title se existir (usado em promotions)
        ...cleanData 
      } = editingItem;

      const { error } = await supabase.from('drivers_delivery').upsert({
        ...cleanData,
        merchant_id: merchantProfile.id
      });
      if (error) throw error;
      toastSuccess('Seu entregador foi salvo!');
      setEditingItem(null);
      setEditType(null);
      fetchMyDrivers();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, merchantProfile, fetchMyDrivers]);

  const handleDeleteMyDriver = useCallback(async (id: string) => {
    if (!await showConfirm({ message: 'Excluir este entregador?' })) return;
    try {
      const { error } = await supabase.from('drivers_delivery').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          await supabase.from('drivers_delivery').update({ is_deleted: true, is_active: false }).eq('id', id);
          toastWarning('Este entregador possui histórico de pedidos e não pode ser completamente removido. Ele foi movido para a lixeira.');
        } else {
          throw error;
        }
      } else {
        toastSuccess('Entregador removido!');
      }
      fetchMyDrivers();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMyDrivers]);

  const handleUpdateUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('users_delivery').update({ 
        name: editingItem.name, 
        phone: editingItem.phone, 
        is_active: editingItem.is_active,
        is_izi_black: editingItem.is_izi_black,
        cashback_earned: editingItem.cashback_earned
      }).eq('id', editingItem.id);
      
      if (error) throw error;
      toastSuccess('Cliente atualizado!');
      setEditingItem(null);
      setEditType(null);
      fetchUsers();
      logAction('Update User', 'Users', editingItem);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, fetchUsers, logAction]);

  const handleUpdateMyProduct = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const targetMerchantId = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
    if (!targetMerchantId) {
      toastError('Erro: Nenhum lojista identificado.');
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        ...editingItem,
        merchant_id: targetMerchantId
      };
      
      if ('is_active' in productData) {
        productData.is_available = productData.is_active;
        delete productData.is_active;
      }

      const { error } = await supabase.from('products_delivery').upsert(productData);
      if (error) throw error;
      toastSuccess('Produto salvo!');
      setEditingItem(null);
      setEditType(null);
      fetchProducts();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, merchantProfile, fetchProducts, userRole, selectedMerchantPreview]);

  const handleUpdateMenuCategory = useCallback(async (cat: any) => {
    try {
      const { error } = await supabase.from('merchant_categories_delivery').upsert(cat);
      if (error) throw error;
      fetchMenuCategories();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMenuCategories]);

  const handleDeleteMenuCategory = useCallback(async (id: string, name: string) => {
    if (!await showConfirm({ message: `Excluir a categoria "${name}"?` })) return;
    try {
      const { error } = await supabase.from('merchant_categories_delivery').delete().eq('id', id);
      if (error) throw error;
      toastSuccess('Categoria removida!');
      fetchMenuCategories();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMenuCategories]);

  const handleDeleteProduct = useCallback(async (id: string, name: string) => {
    if (!await showConfirm({ message: `Excluir "${name}"?` })) return;
    try {
      const { error } = await supabase.from('products_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchProducts]);

  const handleCreateNewProduct = useCallback(async () => {
    const targetMerchantId = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
    
    setEditingItem({
      name: '',
      description: '',
      price: 0,
      is_available: true,
      category: '',
      sub_category: '',
      image_url: '',
      featured: false,
      merchant_id: targetMerchantId
    });
    setEditType('my_product');
  }, [userRole, merchantProfile, selectedMerchantPreview]);

  const handleUpdatePromotion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('promotions_delivery').upsert(editingItem);
      if (error) throw error;
      toastSuccess('Promoção salva!');
      setEditingItem(null);
      setEditType(null);
      fetchPromotions();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, fetchPromotions]);

  const handleUpdateMerchant = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const confirm = await showConfirm({
      title: 'Confirmar Alterações',
      message: editingItem.id ? 'Deseja salvar as alterações deste lojista?' : 'Confirmar o cadastro deste novo lojista?',
      confirmLabel: 'Sim, Salvar',
      cancelLabel: 'Cancelar'
    });
    if (!confirm) return;

    setIsSaving(true);
    try {
      let finalId = editingItem.id;

      // Se for um novo lojista, precisamos criar no Supabase Auth primeiro via Edge Function
      if (!finalId || (typeof finalId === 'string' && finalId.startsWith('new-'))) {
        const { data: authData, error: authError } = await supabase.functions.invoke('create-admin-user', {
          body: {
            email: editingItem.email,
            password: editingItem.password,
            role: 'merchant',
            metadata: {
              store_name: editingItem.store_name
            }
          }
        });

        if (authError) throw authError;
        if (authData?.error) throw new Error(authData.error);
        
        finalId = authData.user.id;
      }

      const merchantData: any = {
        id: finalId,
        store_name: editingItem.store_name,
        store_description: editingItem.store_description,
        store_address: editingItem.store_address,
        store_phone: editingItem.store_phone,
        store_type: editingItem.store_type || 'restaurant',
        food_category: Array.isArray(editingItem.food_category) 
          ? editingItem.food_category 
          : [editingItem.food_category || 'all'],
        store_logo: editingItem.store_logo,
        store_banner: editingItem.store_banner,
        email: editingItem.email,
        document: editingItem.document,
        commission_percent: editingItem.commission_percent,
        service_fee: editingItem.service_fee,
        is_active: editingItem.is_active ?? true,
        latitude: editingItem.latitude,
        longitude: editingItem.longitude,
        google_place_id: editingItem.google_place_id,
        metadata: editingItem.metadata || {},
        role: 'merchant'
      };

      if (editingItem.password && editingItem.password.trim() !== '') {
        merchantData.password = editingItem.password;
      }

      const { error: upsertError } = await supabase.from('admin_users').upsert(merchantData);
      
      if (upsertError) throw upsertError;
      
      await showConfirm({
        title: 'Sucesso!',
        message: 'Os dados do lojista foram salvos com sucesso na plataforma GERAL.',
        confirmLabel: 'Entendido'
      });

      setEditingItem(null);
      setEditType(null);
      fetchMerchants();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, fetchMerchants]);

  const handleUpdateMerchantStatus = useCallback(async (id: string, newStatus: any) => {
    try {
      const { error } = await supabase.from('admin_users').update({ is_active: newStatus === 'active' }).eq('id', id);
      if (error) throw error;
      fetchMerchants();
    } catch (err: any) {
      console.error(err);
    }
  }, [fetchMerchants]);

  const handleDeleteMerchant = useCallback(async (id: string) => {
    if (!await showConfirm({ message: 'Excluir este lojista?' })) return;
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          await supabase.from('admin_users').update({ is_deleted: true, is_active: false }).eq('id', id);
          toastWarning('Este lojista possui registros vinculados e não pode ser excluído. Ele foi arquivado.');
        } else {
          throw error;
        }
      } else {
        toastSuccess('Lojista removido!');
      }
      fetchMerchants();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMerchants]);

  const handleUpdateDriverStatus = useCallback(async (id: string, newStatus: any) => {
    try {
      const { error } = await supabase.from('drivers_delivery').update({ 
        is_active: newStatus === 'active',
        status: newStatus 
      }).eq('id', id);
      if (error) throw error;
      fetchDrivers();
    } catch (err: any) {
      console.error(err);
    }
  }, [fetchDrivers]);

  const handleDeleteDriver = useCallback(async (id: string) => {
    if (!await showConfirm({ message: 'Excluir este entregador?' })) return;
    try {
      const { error } = await supabase.from('drivers_delivery').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          await supabase.from('drivers_delivery').update({ is_deleted: true, is_active: false }).eq('id', id);
          toastWarning('O entregador possui histórico de pedidos e não pode ser removido integralmente. Ele foi arquivado.');
        } else {
          throw error;
        }
      } else {
        toastSuccess('Entregador removido!');
      }
      fetchDrivers();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchDrivers]);

  const handleUpdatePartnerStatus = useCallback(async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_stores_delivery')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
      toastSuccess(`Status do parceiro atualizado!`);
      fetchPartners();
    } catch (err: any) {
      toastError('Erro ao atualizar status: ' + err.message);
    }
  }, [fetchPartners]);

  const handleDeletePartner = useCallback(async (id: string) => {
    if (!await showConfirm({ message: 'Excluir este parceiro da rede click & retire?' })) return;
    try {
      const { error } = await supabase
        .from('partner_stores_delivery')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toastSuccess('Parceiro removido com sucesso!');
      fetchPartners();
    } catch (err: any) {
      toastError('Erro ao remover parceiro: ' + err.message);
    }
  }, [fetchPartners]);

  const handleUpdatePartner = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const { id } = editingItem;

      // Mapeamento explícito: apenas colunas que existem em partner_stores_delivery
      const partnerPayload: any = {
        name:               editingItem.name               || '',
        description:        editingItem.description        || null,
        address:            editingItem.address            || null,
        phone:              editingItem.phone              || null,
        is_active:          editingItem.is_active          ?? true,
        is_deleted:         editingItem.is_deleted         ?? false,
        store_address:      editingItem.store_address      || editingItem.address || null,
        address_number:     editingItem.address_number     || null,
        address_complement: editingItem.address_complement || null,
        neighborhood:       editingItem.neighborhood       || null,
        city:               editingItem.city               || null,
        state:              editingItem.state              || null,
        latitude:           editingItem.latitude  != null ? Number(editingItem.latitude)  : null,
        longitude:          editingItem.longitude != null ? Number(editingItem.longitude) : null,
        google_place_id:    editingItem.google_place_id   || null,
      };

      // Inclui id apenas se for edição de registro existente
      if (id && !String(id).startsWith('new-')) {
        partnerPayload.id = id;
      }

      const { error } = await supabase
        .from('partner_stores_delivery')
        .upsert(partnerPayload);

      if (error) throw error;
      toastSuccess(id ? 'Parceiro atualizado!' : 'Novo parceiro adicionado!');
      setEditingItem(null);
      setEditType(null);
      fetchPartners();
    } catch (err: any) {
      toastError('Erro ao salvar parceiro: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }, [editingItem, fetchPartners]);

  const handleExportDrivers = useCallback(() => {
    const headers = ['Nome', 'Status', 'Telefone', 'Veículo', 'Placa'];
    const rows = driversList.map(d => [d.name, d.status, d.phone, d.vehicle_type, d.license_plate]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "entregadores_izi.csv");
    document.body.appendChild(link);
    link.click();
  }, [driversList]);

  const handleUpdateUserStatus = useCallback(async (id: string, newStatus: any) => {
    try {
      const { error } = await supabase.from('users_delivery').update({ is_active: newStatus === 'active' }).eq('id', id);
      if (error) throw error;
      fetchUsers();
    } catch (err: any) {
      console.error(err);
    }
  }, [fetchUsers]);

  const handleDeleteUser = useCallback(async (id: string) => {
    if (!await showConfirm({ message: 'Excluir este cliente?' })) return;
    try {
      const { error } = await supabase.from('users_delivery').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          await supabase.from('users_delivery').update({ is_deleted: true, is_active: false }).eq('id', id);
          toastWarning('Este cliente possui histórico de pedidos e não pode ser excluído. Ele foi arquivado.');
        } else {
          throw error;
        }
      } else {
        toastSuccess('Cliente removido!');
      }
      fetchUsers();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchUsers]);

  const handleUpdateDedicatedSlot = useCallback(async (slot: any) => {
    try {
      // Remove id 'new' to let database generate a real one
      const { id, ...saveData } = slot;
      const payload = id === 'new' ? saveData : slot;

      const { error } = await supabase.from('dedicated_slots_delivery').upsert(payload);
      if (error) throw error;
      
      toastSuccess(id === 'new' ? 'Vaga criada com sucesso!' : 'Vaga atualizada!');
      fetchMyDedicatedSlots();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMyDedicatedSlots]);

  const handleCreateDedicatedSlot = useCallback(() => {
    if (!merchantProfile) return;
    setEditingItem({
      merchant_id: merchantProfile.merchant_id,
      label: 'Novo Slot',
      is_active: true
    });
    setEditingSlotId('new');
  }, [merchantProfile]);

  const handleDeleteDedicatedSlot = useCallback(async (slotId: string) => {
    if (!await showConfirm({ message: 'Excluir este slot?' })) return;
    try {
      const { error } = await supabase.from('dedicated_slots_delivery').delete().eq('id', slotId);
      if (error) throw error;
      fetchMyDedicatedSlots();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMyDedicatedSlots]);

  const handleNotifyUser = useCallback(async (userId: string) => {
    toastSuccess('Notificação enviada ao usuário!');
    logAction('Notify User', 'Users', { userId });
  }, [logAction]);

  const handleResetPassword = useCallback(async (userId: string) => {
    toastSuccess('Link de redefinição enviado!');
    logAction('Reset Password', 'Users', { userId });
  }, [logAction]);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    setIsCompletingOrder(orderId);
    try {
      // 1. Buscar detalhes do pedido para saber o valor e o lojista
      const { data: order, error: fetchErr } = await supabase
        .from('orders_delivery')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (fetchErr) throw fetchErr;
      if (order.status === 'concluido') return toastWarning('Este pedido já estava concluído.');

      // 2. Atualizar status do pedido
      const { error: updateErr } = await supabase.from('orders_delivery').update({ status: 'concluido' }).eq('id', orderId);
      if (updateErr) throw updateErr;

      // 3. Inserir transação na carteira do lojista (wallet_transactions_delivery)
      if (order.merchant_id && order.total_price > 0) {
        // Calcular comissão sobre o valor dos produtos (Total - Frete - Taxa de Serviço)
        const deliveryFee = Number(order.delivery_fee || 0);
        const serviceFee = Number(order.service_fee || 0);
        const basePrice = order.total_price - deliveryFee - serviceFee;
        
        const commRate = merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12;
        const commissionAmount = basePrice * (commRate / 100);
        const netAmount = basePrice - commissionAmount;

        // Calcular saldo atual para registrar balance_after
        const { data: currentWallet } = await supabase
          .from('wallet_transactions_delivery')
          .select('balance_after')
          .eq('user_id', order.merchant_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const currentBalance = currentWallet?.balance_after || 0;
        const newBalance = currentBalance + netAmount;

        await supabase.from('wallet_transactions_delivery').insert({
          user_id: order.merchant_id,
          amount: netAmount,
          type: 'venda',
          description: `Venda Pedido #${order.id.slice(0,8).toUpperCase()} (Líquido)`,
          status: 'concluido',
          balance_after: newBalance
        });
      }

      toastSuccess('Pedido concluído e saldo creditado!');
      fetchAllOrders(ordersPage);
      fetchMerchantFinance(); // Atualiza o saldo global do contexto
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsCompletingOrder(null);
    }
  }, [ordersPage, fetchAllOrders, fetchMerchantFinance]);

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    if (!await showConfirm({ message: 'Exclusão irreversível! Continuar?' })) return;
    try {
      const { error } = await supabase.from('orders_delivery').delete().eq('id', orderId);
      if (error) throw error;
      toastSuccess('Pedido removido!');
      fetchAllOrders(ordersPage);
    } catch (err: any) {
      toastError(err.message);
    }
  }, [ordersPage, fetchAllOrders]);

  const handleConfirmSubscriptionPayment = useCallback(async (order: Order) => {
    try {
      const { error } = await supabase.from('orders_delivery').update({ status: 'pago' }).eq('id', order.id);
      if (error) throw error;
      toastSuccess('Pagamento aprovado!');
      fetchSubscriptionOrders(subscriptionOrdersPage);
    } catch (err: any) {
      toastError(err.message);
    }
  }, [subscriptionOrdersPage, fetchSubscriptionOrders]);

  const saveSpecificRateMetadata = useCallback(async (type: string, metadata: any) => {
    try {
      const { error } = await supabase
        .from('dynamic_rates_delivery')
        .upsert({ type, metadata, updated_at: new Date().toISOString() }, { onConflict: 'type' });
      if (error) throw error;
    } catch (err: any) {
      console.error('Error saving rate metadata:', err);
    }
  }, []);

  const saveDynamicRates = useCallback(async () => {
    setIsSaving(true);
    try {
      const cleanBaseValues: any = {};
      Object.keys(dynamicRatesState.baseValues).forEach(key => {
        const val = (dynamicRatesState.baseValues as any)[key];
        if (typeof val === 'string' && key !== 'isDynamicActive') {
          cleanBaseValues[key] = parseFloat(val.replace(',', '.'));
        } else {
          cleanBaseValues[key] = val;
        }
      });

      const rows = [
        { type: 'base_values', metadata: cleanBaseValues },
        { type: 'equilibrium', metadata: dynamicRatesState.equilibrium },
        { type: 'weather_rules', metadata: dynamicRatesState.weather },
        { type: 'flow_control', metadata: dynamicRatesState.flowControl },
        { type: 'shipping_priorities', metadata: dynamicRatesState.shippingPriorities },
        { type: 'peak_hour', metadata: { rules: dynamicRatesState.peakHours } },
        { type: 'zone', metadata: { rules: dynamicRatesState.zones } }
      ];

      const { error: batchError } = await supabase
        .from('dynamic_rates_delivery')
        .upsert(rows.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'type' });

      if (batchError) throw batchError;

      toastSuccess('Taxas publicadas com sucesso!');
      logAction('Update Dynamic Rates', 'System', dynamicRatesState);
      fetchDynamicRates();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [dynamicRatesState, logAction, fetchDynamicRates]);

  const handleAddPeakRule = useCallback(async () => {
    try {
      const { error } = await supabase.from('dynamic_rates_delivery').insert({
        type: 'peak_hour',
        label: newPeakRule.label || 'Novo Horário',
        multiplier: newPeakRule.multiplier,
        is_active: true
      });
      
      if (error) throw error;
      toastSuccess('Regra adicionada!');
      setIsAddingPeakRule(false);
      fetchDynamicRates();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [newPeakRule, fetchDynamicRates]);

  const handleRemovePeakRule = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('dynamic_rates_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchDynamicRates();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchDynamicRates]);

  const handleAddZone = useCallback(async () => {
  }, []);

  const handleRemoveZone = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('dynamic_rates_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchDynamicRates();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchDynamicRates]);

  const handleFileUpload = useCallback(async (file: File, bucket = 'products') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toastError('Erro ao fazer upload da imagem.');
      return null;
    }
  }, []);


  const handleUpdateMerchantProfile = useCallback(async (data: Partial<MerchantProfile>) => {
    if (!merchantProfile?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update(data)
        .eq('id', merchantProfile.id);

      if (error) throw error;

      const updatedProfile = { ...merchantProfile, ...data };
      setMerchantProfile(updatedProfile);
      localStorage.setItem('izi_admin_profile', JSON.stringify(updatedProfile));
      toastSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toastError('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }, [merchantProfile]);

  const handleUpdateDispatchSettings = async (_field: string, _value: string) => {};
  const handleSeedCategories = async () => {};

  const handleSaveAppSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      const SETTINGS_ID = appSettings.id || 'c568f69e-1e96-48c3-8e7c-8e8e8e8e8e8e';
      const payload = {
        app_name:                          String(appSettings.appName || 'IZI Delivery'),
        support_email:                     String(appSettings.supportEmail || ''),
        opening_time:                      String(appSettings.openingTime || '08:00'),
        closing_time:                      String(appSettings.closingTime || '23:00'),
        radius:                            Number(appSettings.radius ?? 15),
        base_fee:                          Number(appSettings.baseFee ?? 0),
        app_commission:                    Number(appSettings.appCommission ?? 0),
        driver_freight_commission:         Number(appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
        private_driver_commission:         Number(appSettings.privateDriverCommission ?? appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
        service_fee:                       Number(appSettings.serviceFee ?? 0),
        izi_black_fee:                     Number(appSettings.iziBlackFee ?? 0),
        izi_black_cashback:                Number(appSettings.iziBlackCashback ?? 0),
        izi_black_min_order_free_shipping: Number(appSettings.iziBlackMinOrderFreeShipping ?? 0),
        izi_black_cashback_multiplier:     Number(appSettings.izi_black_cashback_multiplier ?? 2),
        izi_black_xp_multiplier:           Number(appSettings.izi_black_xp_multiplier ?? 2),
        izi_coin_rate:                     Number(appSettings.iziCoinRate ?? 1.0),
        min_withdrawal_amount:             Number(appSettings.minwithdrawalamount ?? 50),
        withdrawal_fee_percent:            Number(appSettings.withdrawalfeepercent ?? 0),
        withdrawal_period_h:               Number(appSettings.withdrawal_period_h ?? 24),
        withdrawal_day:                    String(appSettings.withdrawal_day || 'Quarta-feira'),
        loan_interest_rate:                Number(appSettings.loan_interest_rate ?? 12.0),
        mercadopago_public_key:            String(appSettings.mercadopago_public_key || ''),
        sms_notifications:                 Boolean(appSettings.smsNotifications ?? true),
        email_notifications:               Boolean(appSettings.emailNotifications ?? true),
        payment_methods_active:            appSettings.paymentmethodsactive || { pix: true, card: true, lightning: false, wallet: true },
        updated_at:                        new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings_delivery')
        .update(payload)
        .eq('id', SETTINGS_ID);

      if (error) throw error;
      setLastSavedHash(JSON.stringify(appSettings));
      setAutoSaveStatus('saved');
      toastSuccess('Configurações salvas com sucesso!');
      logAction('Update Settings', 'System', payload);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err: any) {
      setAutoSaveStatus('error');
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [appSettings, logAction]);

  const savePromotion = useCallback(async (promo: any) => {
    setPromoSaving(true);
    setPromoSaveStatus('saving');
    try {
      const cleanPromo = { ...promo };
      if (cleanPromo.expires_at === '') cleanPromo.expires_at = null;
      if (cleanPromo.coupon_code === '') cleanPromo.coupon_code = null;
      if (cleanPromo.image_url === '') cleanPromo.image_url = null;
      if (cleanPromo.merchant_id === '') cleanPromo.merchant_id = null;

      const { error } = await supabase.from('promotions_delivery').upsert(cleanPromo);
      if (error) throw error;
      setPromoSaveStatus('saved');
      toastSuccess('Promoção publicada com sucesso!');
      fetchPromotions();
      setTimeout(() => setPromoSaveStatus('idle'), 2000);
    } catch (err: any) {
      setPromoSaveStatus('error');
      toastError(err.message);
    } finally {
      setPromoSaving(false);
    }
  }, [fetchPromotions]);

  const autoSavePromo = (updatedPromo: any) => {
    setPromoForm(updatedPromo);
  };

  const dashboardData = useMemo(() => {
    let orders = [...dashboardOrders];
    
    // Filtro de segurança absoluto: se for merchant, GARANTIR que só vê suas ordens
    if (userRole === 'merchant' && merchantProfile?.id) {
      orders = orders.filter(o => o.merchant_id === merchantProfile.id);
    } else if (userRole === 'admin') {
      // Admin vê tudo, mas talvez queiramos separar faturamento de sistema vs lojistas depois
    } else {
      // Se não tem role definida ou profile de merchant faltando enquanto deveria ter, retorna vazio por segurança
      if (userRole === 'merchant') orders = [];
    }

    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrdersCount: 0,
        avgTicket: 0,
        netProfit: 0,
        totalCommission: 0,
        deliverySuccessRate: 0,
        dailyRevenue: [0, 0, 0, 0, 0, 0, 0],
        revenuePath: 'M0,120 L400,120',
        dayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
        totalOrdersToday: 0,
        categories: [],
        topProducts: [],
        topMerchants: []
      };
    }

    const completed = orders.filter(o => o.status === 'concluido' || o.status === 'delivered');
    const totalRevenue = completed.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const totalOrders = orders.length;
    const completedOrdersCount = completed.length;
    const avgTicket = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;
    const deliverySuccessRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0;

    let netProfit = 0;
    let totalCommission = 0;
    const merchantMap: Record<string, any> = {};

    const dailyRev = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();

    completed.forEach(order => {
      const m = merchantsList.find(ml => ml.id === order.merchant_id);
      const merchantName = m?.store_name || order.merchant_id || 'Plataforma';
      
      if (!merchantMap[merchantName]) {
        merchantMap[merchantName] = { label: merchantName, orders: 0, revenue: 0, id: order.merchant_id };
      }
      merchantMap[merchantName].orders++;
      merchantMap[merchantName].revenue += (Number(order.total_price) || 0);

      const commissionRate = m?.commission_percent ?? appSettings.appCommission ?? 12;
      const commission = (order.total_price || 0) * (commissionRate / 100);
      
      totalCommission += commission;
      
      let orderNetProfit = 0;
      if (userRole === 'merchant') {
        orderNetProfit = (order.total_price || 0) - commission;
        netProfit += orderNetProfit;
      } else {
        orderNetProfit = commission;
        netProfit += orderNetProfit;
      }

      const orderDate = new Date(order.created_at);
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        dailyRev[6 - diffDays] += userRole === 'merchant' ? (order.total_price || 0) : commission;
      }
    });

    const totalOrdersToday = dashboardOrders.filter(o => {
      const d = new Date(o.created_at);
      return d.toDateString() === today.toDateString();
    }).length;

    const categoryMap: Record<string, { label: string, val: number, revenue: number }> = {};
    const productMap: Record<string, { label: string, sales: number, revenue: number }> = {};

    completed.forEach(o => {
      // Agregação por categoria de serviço
      const cat = o.service_type || 'Geral';
      if (!categoryMap[cat]) categoryMap[cat] = { label: cat, val: 0, revenue: 0 };
      categoryMap[cat].val++;
      categoryMap[cat].revenue += (o.total_price || 0);

      // Agregação por itens do pedido (se disponíveis)
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const itemName = item.name || 'Produto IZI';
          if (!productMap[itemName]) productMap[itemName] = { label: itemName, sales: 0, revenue: 0 };
          productMap[itemName].sales += (item.quantity || 1);
          productMap[itemName].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const categories = Object.values(categoryMap).map(c => ({
      ...c,
      percent: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      completedOrdersCount,
      avgTicket,
      netProfit,
      totalCommission,
      deliverySuccessRate,
      dailyRevenue: dailyRev,
      revenuePath: 'M0,120 L400,120',
      dayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      totalOrdersToday,
      categories,
      topProducts,
      topMerchants
    };
  }, [dashboardOrders, merchantsList, appSettings, userRole, merchantProfile?.id]);

  const value: AdminContextType = {
    session,
    activeTab,
    setActiveTab,
    userRole,
    merchantProfile,
    setMerchantProfile,
    handleLogout,
    isLoadingList, isInitialLoading, stats, recentOrders, usersList, driversList, 
    allOrders, dashboardOrders, setDashboardOrders, myDriversList, merchantsList, partnersList, productsList, menuCategoriesList, 
    categoriesState, setCategoriesState, promotionsList, auditLogsList, myDedicatedSlots, 
    subscriptionOrders, dynamicRatesState, setDynamicRatesState, ordersPage, setOrdersPage, 
    ordersTotalCount, merchantOrdersPage, setMerchantOrdersPage, merchantOrdersTotalCount, 
    subscriptionOrdersPage, setSubscriptionOrdersPage, subscriptionOrdersTotalCount, 
    driversPage, setDriversPage, filteredDrivers: [], paginatedDrivers: [], 
    driverSearch, setDriverSearch, driverFilter, setDriverFilter, userStatusFilter, 
    setUserStatusFilter, promoFilter, setPromoFilter, promoSearch, setPromoSearch, 
    categoryGroupFilter, setCategoryGroupFilter, appSettings, setAppSettings, 
    globalSettings, setGlobalSettings, fetchGlobalSettings, autoSaveStatus, 
    selectedUser, setSelectedUser, selectedMerchantPreview, setSelectedMerchantPreview, 
    selectedDriverStudio, setSelectedDriverStudio, selectedUserStudio, setSelectedUserStudio, 
    selectedCategoryStudio, setSelectedCategoryStudio, selectedHexagons, setSelectedHexagons, 
    selectedZoneForMap, setSelectedZoneForMap, 
    selectedTrackingItem, setSelectedTrackingItem, selectedMenuCategory, setSelectedMenuCategory, 
    editingItem, setEditingItem, editType, setEditType, editingSlotId, setEditingSlotId, 
    isSaving, setIsSaving, activePreviewTab, setActivePreviewTab, activeStudioTab, 
    setActiveStudioTab, trackingListTab, setTrackingListTab, showActiveOrdersModal, 
    setShowActiveOrdersModal, showCategoryListModal, setShowCategoryListModal, 
    showPromoForm, setShowPromoForm, promoFormType, setPromoFormType, promoForm, 
    setPromoForm, promoSaving, promoSaveStatus, expandedLogId, setExpandedLogId, 
    isCompletingOrder, setIsCompletingOrder, newOrderNotification, setNewOrderNotification, 
    isWalletLoading, showAddCreditModal, setShowAddCreditModal, walletTransactions,
    merchantTransactions, merchantBalance,
    isAddingCredit, creditToAdd, setCreditToAdd, showWalletStatementModal, 
    setShowWalletStatementModal, isAddingPeakRule, setIsAddingPeakRule, newPeakRule, 
    setNewPeakRule, newZoneData, setNewZoneData, mapSearch, setMapSearch, isGeolocating, 
    setIsGeolocating, mapCenterView, setMapCenterView, fixedGridCenter, setFixedGridCenter, 
    hexGrid, getHexPath: () => [], 
    previewProducts, setPreviewProducts, previewCategories, setPreviewCategories, 
    establishmentTypes, setEstablishmentTypes, fetchEstablishmentTypes, handleUpdateEstablishmentType, handleDeleteEstablishmentType,
    dashboardData: dashboardData as DashboardData,
    mapsLoadError: mapsLoadError ? mapsLoadError.message : null,
    isLoaded,
    fetchStats, fetchUsers, fetchDrivers, fetchMyDrivers, fetchProducts, fetchMenuCategories, 
    fetchAllOrders, fetchSubscriptionOrders, fetchCategories, fetchDynamicRates, 
    fetchPromotions, fetchAuditLogs, fetchMerchants, fetchPartners, fetchAppSettings, saveGlobalSettings, fetchMyDedicatedSlots, 
    openMerchantPreview, handleAddCredit, handleApplyCredit, handleUpdateDriver, 
    handleUpdateCategory, handleUpdateMyDriver, handleDeleteMyDriver, handleUpdateUser, 
    handleUpdateMyProduct, handleUpdateMenuCategory, handleDeleteMenuCategory, handleDeleteProduct, handleCreateNewProduct, 
    handleUpdatePromotion, handleUpdateMerchant, handleUpdateMerchantStatus, handleDeleteMerchant, 
    handleUpdatePartnerStatus, handleDeletePartner, handleUpdatePartner, 
    handleUpdateDriverStatus, handleDeleteDriver, handleExportDrivers, handleUpdateUserStatus, 
    handleDeleteUser, handleUpdateDedicatedSlot, handleCreateDedicatedSlot, handleDeleteDedicatedSlot, 
    handleNotifyUser, handleResetPassword, handleCompleteOrder, handleDeleteOrder, 
    handleConfirmSubscriptionPayment, handleAddPeakRule, handleRemovePeakRule, 
    saveDynamicRates, saveSpecificRateMetadata, handleAddZone, handleRemoveZone, 
    handleFileUpload, handleUpdateDispatchSettings, handleSeedCategories, savePromotion, 
    autoSavePromo,
    handleSaveAppSettings,
    handleUpdateMerchantProfile,
    fetchMerchantFinance, handleRequestWithdrawal, handleUpdateMerchantBankInfo, handleSyncMerchantBalance,
    partnerTransactions, partnerBalance, fetchPartnerFinance, handleRequestPartnerWithdrawal
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
