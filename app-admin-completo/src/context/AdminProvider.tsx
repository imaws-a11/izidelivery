import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '../lib/supabase';
import { AdminContext } from './AdminContext';
import type { AdminContextType } from './AdminContext';
import type { 
  Order, Driver, User, Merchant, MerchantProfile, 
  Product, Category, Promotion, DedicatedSlot,
  AuditLog, WalletTransaction, MenuCategory, DynamicRatesState,
  Tab, UserRole, AppSettings, DashboardData, EstablishmentType
} from '../lib/types';
import { useAuth } from './AuthContext';
import { toastSuccess, toastError, toastWarning, showConfirm } from '../lib/useToast';
import { playIziSound } from '../lib/iziSounds';
import { countOnlineDrivers, removeDriverFromList, sortDriversByPresence, upsertDriverInList } from '../lib/driverPresence';



const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ['places', 'geometry'];

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, logout } = useAuth();
  const MASTER_ADMIN_EMAIL = (import.meta.env.VITE_MASTER_ADMIN_EMAIL as string || 'swmcapital@gmail.com').trim().toLowerCase();
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || '';

  const { isLoaded, loadError: mapsLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
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
    
    // Gera um hash simples do conteúdo para evitar salvar se nada mudou de fato (ex: após o fetch inicial)
    const currentHash = JSON.stringify(appSettings);
    if (lastSavedHash === currentHash) return;
    if (lastSavedHash === '') {
      setLastSavedHash(currentHash);
      return;
    }

    setAutoSaveStatus('pending');
    const timer = setTimeout(async () => {
      try {
        const cleanSettings = {
          ...appSettings,
          id: appSettings.id || '00000000-0000-0000-0000-000000000000',
          iziBlackFee: Number(appSettings.iziBlackFee ?? 0),
          iziBlackCashback: Number(appSettings.iziBlackCashback ?? 0),
          iziBlackMinOrderFreeShipping: Number(appSettings.iziBlackMinOrderFreeShipping ?? 0),
          izi_black_cashback_multiplier: Number(appSettings.izi_black_cashback_multiplier ?? 2),
          izi_black_xp_multiplier: Number(appSettings.izi_black_xp_multiplier ?? 2),
          radius: Number(appSettings.radius ?? 0),
          baseFee: Number(appSettings.baseFee ?? 0),
          appCommission: Number(appSettings.appCommission ?? 0),
          driverFreightCommission: Number(appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
          privateDriverCommission: Number(appSettings.privateDriverCommission ?? appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
          serviceFee: Number(appSettings.serviceFee ?? 0),
          flashOfferDiscount: Number(appSettings.flashOfferDiscount ?? 0),
          iziCoinRate: Number(appSettings.iziCoinRate ?? 0),
          withdrawalfeepercent: Number(appSettings.withdrawalfeepercent ?? 0),
          withdrawal_period_h: Number(appSettings.withdrawal_period_h ?? 12),
          withdrawal_day: String(appSettings.withdrawal_day || 'Quarta-feira'),
          minwithdrawalamount: Number(appSettings.minwithdrawalamount ?? 0.0),
          loan_interest_rate: Number(appSettings.loan_interest_rate ?? 12.0),
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('app_settings_delivery')
          .upsert(cleanSettings);
        
        if (error) {
          toastError('Erro ao salvar configurações automáticas: ' + error.message);
          throw error;
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
    await logout();
     setMerchantProfile(null);
     setDashboardOrders([]);
     setActiveTab('dashboard');
     localStorage.removeItem('izi_admin_active_tab');
     localStorage.removeItem('izi_admin_role');
     localStorage.removeItem('izi_admin_profile');
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
            store_type: data.store_type || 'restaurant'
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
    if (session?.user?.email) {
      fetchUserRole(session.user.email);
    } else {
      setIsInitialLoading(false);
    }
  }, [session, fetchUserRole]);

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
      const { data } = await supabase.from('products_delivery').select('*').eq('merchant_id', idToUse);
      if (data) setProductsList(data as Product[]);
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
      const from = (targetPage - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      if (userRole === 'merchant' && merchantProfile?.id) {
        // Caso seja Lojista, fazemos um fetch padrão + um fetch de segurança para pedidos pendentes
        const { data, error, count } = await supabase
          .from('orders_delivery')
          .select('*, user:users_delivery(*)', { count: 'exact' })
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
            .select('*, user:users_delivery(*)')
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
  }, [userRole, merchantProfile, merchantOrdersPage, ordersPage]);

  // Mapeamento de refs para funções voláteis usadas no Realtime (evita reconnect do canal)
  const fetchAllOrdersRef = useRef(fetchAllOrders);
  const fetchStatsRef = useRef(fetchStats);
  const fetchDriversRef = useRef(fetchDrivers);
  const fetchMyDriversRef = useRef(fetchMyDrivers);

  useEffect(() => { fetchAllOrdersRef.current = fetchAllOrders; }, [fetchAllOrders]);
  useEffect(() => { fetchStatsRef.current = fetchStats; }, [fetchStats]);
  useEffect(() => { fetchDriversRef.current = fetchDrivers; }, [fetchDrivers]);
  useEffect(() => { fetchMyDriversRef.current = fetchMyDrivers; }, [fetchMyDrivers]);

  // Canal Global de Tempo Real (Admin e Lojista)
  useEffect(() => {
    if (!session?.user?.id || !userRole) return;

    const channelName = `admin_sync_${userRole}`;
    console.log(`[REALTIME] Ativando subscrição: ${channelName}`);
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders_delivery' },
        (payload) => {
          console.log('⚡ PEDIDO REALTIME:', payload.eventType, payload);
          
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const updatedOrder = payload.new as Order;
            
            // Ignorar se não for deste merchant (segurança adicional)
            if (userRole === 'merchant' && updatedOrder.merchant_id !== merchantProfile?.id) return;

            setAllOrders(prev => {
              const exists = prev.find(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
              }
              // Se é novo ou mudou para um status relevante, adiciona no topo
              return [updatedOrder, ...prev];
            });

            setDashboardOrders(prev => {
              const exists = prev.find(o => o.id === updatedOrder.id);
              if (exists) {
                return prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
              }
              return [updatedOrder, ...prev];
            });

            // Notificação Sonora e Visual
            const isActionable = updatedOrder.status === 'novo' || updatedOrder.status === 'waiting_merchant';
            
            if (isActionable) {
              console.log(`[REALTIME] Pedido acionável detectado (${payload.eventType}):`, updatedOrder.id);
              setNewOrderNotification({ show: true, orderId: updatedOrder.id });
              playIziSound('merchant');
            }
          }

          fetchStatsRef.current(true);
          fetchAllOrdersRef.current(undefined, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers_delivery' },
        (payload) => {
          console.log('⚡ ENTREGADOR REALTIME:', payload.eventType, payload);
          
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Driver;
            const old = payload.old as Driver;

            setDriversList(prev => {
              const nextDrivers = upsertDriverInList(prev, updated);
              syncDriverStats(nextDrivers);
              return nextDrivers;
            });

            if (userRole === 'merchant') {
              const belongsToMerchant = updated.merchant_id === merchantProfile?.id && !updated.is_deleted;
              const belongedToMerchant = old?.merchant_id === merchantProfile?.id;

              if (belongsToMerchant) {
                setMyDriversList(prev => upsertDriverInList(prev, updated));
              } else if (belongedToMerchant) {
                setMyDriversList(prev => removeDriverFromList(prev, updated.id));
              }
            }

            // Só re-busca pesado se houver mudança estrutural/cadastral
            if (
              old?.is_active !== updated.is_active ||
              old?.is_deleted !== updated.is_deleted ||
              old?.merchant_id !== updated.merchant_id
            ) {
              fetchStatsRef.current(true);
              fetchDriversRef.current(true);
              if (userRole === 'merchant') fetchMyDriversRef.current(true);
            }
          } else if (payload.eventType === 'INSERT') {
            const inserted = payload.new as Driver;

            setDriversList(prev => {
              const nextDrivers = upsertDriverInList(prev, inserted);
              syncDriverStats(nextDrivers);
              return nextDrivers;
            });

            if (userRole === 'merchant' && inserted.merchant_id === merchantProfile?.id && !inserted.is_deleted) {
              setMyDriversList(prev => upsertDriverInList(prev, inserted));
            }
          } else if (payload.eventType === 'DELETE') {
            const removed = payload.old as Driver;

            setDriversList(prev => {
              const nextDrivers = removeDriverFromList(prev, removed.id);
              syncDriverStats(nextDrivers);
              return nextDrivers;
            });

            if (userRole === 'merchant' && removed.merchant_id === merchantProfile?.id) {
              setMyDriversList(prev => removeDriverFromList(prev, removed.id));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions_delivery' },
        (payload) => {
          const newTx = payload.new as any;
          const idToUse = userRole === 'merchant' ? merchantProfile?.id : selectedMerchantPreview?.id;
          
          if (newTx.user_id === idToUse) {
            if (newTx.type === 'deposito' || newTx.type === 'venda') {
              toastSuccess(`Pagamento Recebido: R$ ${parseFloat(newTx.amount).toFixed(2)} - ${newTx.description}`);
              fetchMerchantFinance();
              playIziSound('payment');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Status Realtime [${channelName}]:`, status);
      });

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
      console.log(`[REALTIME] Fechando canal: ${channelName}`);
      supabase.removeChannel(channel);
      supabase.removeChannel(settingsChannel);
    };
  }, [session?.user?.id, userRole, merchantProfile?.id]);

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
          baseValues: baseValuesRow?.metadata ? {
            mototaxi_min: (baseValuesRow.metadata as any).mototaxi_min?.toString().replace('.', ',') || '6,00',
            mototaxi_km: (baseValuesRow.metadata as any).mototaxi_km?.toString().replace('.', ',') || '2,50',
            carro_min: (baseValuesRow.metadata as any).carro_min?.toString().replace('.', ',') || '14,00',
            carro_km: (baseValuesRow.metadata as any).carro_km?.toString().replace('.', ',') || '4,50',
            van_min: (baseValuesRow.metadata as any).van_min?.toString().replace('.', ',') || '20,00',
            van_km: (baseValuesRow.metadata as any).van_km?.toString().replace('.', ',') || '6,00',
            utilitario_min: (baseValuesRow.metadata as any).utilitario_min?.toString().replace('.', ',') || '12,00',
            utilitario_km: (baseValuesRow.metadata as any).utilitario_km?.toString().replace('.', ',') || '4,00',
            logistica_min: (baseValuesRow.metadata as any).logistica_min?.toString().replace('.', ',') || '45,00',
            logistica_km: (baseValuesRow.metadata as any).logistica_km?.toString().replace('.', ',') || '8,00',
            logistica_stairs: (baseValuesRow.metadata as any).logistica_stairs?.toString().replace('.', ',') || '30,00',
            logistica_helper: (baseValuesRow.metadata as any).logistica_helper?.toString().replace('.', ',') || '35,00',
            fiorino_min: (baseValuesRow.metadata as any).fiorino_min?.toString().replace('.', ',') || '40,00',
            fiorino_km: (baseValuesRow.metadata as any).fiorino_km?.toString().replace('.', ',') || '4,00',
            caminhonete_min: (baseValuesRow.metadata as any).caminhonete_min?.toString().replace('.', ',') || '50,00',
            caminhonete_km: (baseValuesRow.metadata as any).caminhonete_km?.toString().replace('.', ',') || '5,00',
            bau_p_min: (baseValuesRow.metadata as any).bau_p_min?.toString().replace('.', ',') || '60,00',
            bau_p_km: (baseValuesRow.metadata as any).bau_p_km?.toString().replace('.', ',') || '6,00',
            bau_m_min: (baseValuesRow.metadata as any).bau_m_min?.toString().replace('.', ',') || '80,00',
            bau_m_km: (baseValuesRow.metadata as any).bau_m_km?.toString().replace('.', ',') || '8,00',
            bau_g_min: (baseValuesRow.metadata as any).bau_g_min?.toString().replace('.', ',') || '100,00',
            bau_g_km: (baseValuesRow.metadata as any).bau_g_km?.toString().replace('.', ',') || '10,00',
            aberto_min: (baseValuesRow.metadata as any).aberto_min?.toString().replace('.', ',') || '50,00',
            aberto_km: (baseValuesRow.metadata as any).aberto_km?.toString().replace('.', ',') || '5,00',
            isDynamicActive: (baseValuesRow.metadata as any).isDynamicActive ?? true
          } : prev.baseValues,
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
        const mergedSettings = {
          ...appSettings,
          ...data,
          minwithdrawalamount: data.minwithdrawalamount !== undefined ? Number(data.minwithdrawalamount) : appSettings.minwithdrawalamount,
          withdrawalfeepercent: data.withdrawalfeepercent !== undefined ? Number(data.withdrawalfeepercent) : appSettings.withdrawalfeepercent,
          withdrawal_period_h: data.withdrawal_period_h !== undefined ? Number(data.withdrawal_period_h) : appSettings.withdrawal_period_h,
          driverFreightCommission: Number((data as any).driverFreightCommission ?? (data as any).appCommission ?? appSettings.driverFreightCommission),
          privateDriverCommission: Number((data as any).privateDriverCommission ?? (data as any).driverFreightCommission ?? (data as any).appCommission ?? appSettings.privateDriverCommission),
        } as AppSettings;
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
    if (!merchantProfile?.id) return;
    try {
      const { data } = await supabase.from('dedicated_slots_delivery').select('*').eq('merchant_id', merchantProfile.id);
      if (data) setMyDedicatedSlots(data as DedicatedSlot[]);
    } catch (err) {
      console.error('Erro ao buscar vagas dedicadas:', err);
    }
  }, [merchantProfile]);

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
    if (!userRole) return;

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
  }, [userRole, fetchAppSettings, fetchStats, fetchUsers, fetchDrivers, fetchMerchants, fetchCategories, fetchPromotions, fetchDynamicRates, fetchAllOrders, fetchSubscriptionOrders, fetchMyDrivers, fetchProducts, fetchMenuCategories, fetchMyDedicatedSlots, fetchMerchantFinance]);

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

      await supabase.from('wallet_transactions').insert({
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
      const { error } = await supabase.from('drivers_delivery').upsert({
        ...editingItem,
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
      const merchantData: any = {
        store_name: editingItem.store_name,
        store_description: editingItem.store_description,
        store_address: editingItem.store_address,
        store_phone: editingItem.store_phone,
        store_type: editingItem.store_type || 'restaurant',
        food_category: editingItem.food_category || 'all',
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
        role: 'merchant'
      };

      if (editingItem.password && editingItem.password.trim() !== '') {
        merchantData.password = editingItem.password;
      }

      let error;
      if (editingItem.id && typeof editingItem.id === 'string' && !editingItem.id.startsWith('new-')) {
        const { error: updateError } = await supabase.from('admin_users').update(merchantData).eq('id', editingItem.id);
        error = updateError;
      } else {
        const { error: upsertError } = await supabase.from('admin_users').upsert({
          ...merchantData,
          id: editingItem.id || undefined
        });
        error = upsertError;
      }
      
      if (error) throw error;
      
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
      const { id, created_at, ...cleanItem } = editingItem;
      const { error } = await supabase
        .from('partner_stores_delivery')
        .upsert({
          ...(id ? { id } : {}),
          ...cleanItem,
          updated_at: new Date().toISOString()
        });

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
      const { error } = await supabase.from('dedicated_slots_delivery').upsert(slot);
      if (error) throw error;
      fetchMyDedicatedSlots();
    } catch (err: any) {
      toastError(err.message);
    }
  }, [fetchMyDedicatedSlots]);

  const handleCreateDedicatedSlot = useCallback(() => {
    if (!merchantProfile) return;
    setEditingItem({
      merchant_id: merchantProfile.id,
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
      const cleanBaseValues = {
        ...dynamicRatesState.baseValues,
        mototaxi_min: parseFloat(dynamicRatesState.baseValues.mototaxi_min.replace(',', '.')),
        mototaxi_km: parseFloat(dynamicRatesState.baseValues.mototaxi_km.replace(',', '.')),
        carro_min: parseFloat(dynamicRatesState.baseValues.carro_min.replace(',', '.')),
        carro_km: parseFloat(dynamicRatesState.baseValues.carro_km.replace(',', '.')),
        van_min: parseFloat(dynamicRatesState.baseValues.van_min.replace(',', '.')),
        van_km: parseFloat(dynamicRatesState.baseValues.van_km.replace(',', '.')),
        utilitario_min: parseFloat(dynamicRatesState.baseValues.utilitario_min.replace(',', '.')),
        utilitario_km: parseFloat(dynamicRatesState.baseValues.utilitario_km.replace(',', '.')),
        logistica_min: parseFloat(dynamicRatesState.baseValues.logistica_min.replace(',', '.')),
        logistica_km: parseFloat(dynamicRatesState.baseValues.logistica_km.replace(',', '.')),
        logistica_stairs: parseFloat((dynamicRatesState.baseValues.logistica_stairs as string || '30').replace(',', '.')),
        logistica_helper: parseFloat((dynamicRatesState.baseValues.logistica_helper as string || '35').replace(',', '.')),
      };

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


  const handleUpdateDispatchSettings = async (_field: string, _value: string) => {};
  const handleSeedCategories = async () => {};

  const handleSaveAppSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      const cleanSettings = {
         ...appSettings,
         iziBlackFee: Number(appSettings.iziBlackFee ?? 0),
         iziBlackCashback: Number(appSettings.iziBlackCashback ?? 0),
         iziBlackMinOrderFreeShipping: Number(appSettings.iziBlackMinOrderFreeShipping ?? 0),
         radius: Number(appSettings.radius ?? 0),
         baseFee: Number(appSettings.baseFee ?? 0),
         appCommission: Number(appSettings.appCommission ?? 0),
         driverFreightCommission: Number(appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
         privateDriverCommission: Number(appSettings.privateDriverCommission ?? appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0),
         serviceFee: Number(appSettings.serviceFee ?? 0),
         flashOfferDiscount: Number(appSettings.flashOfferDiscount ?? 0),
         iziCoinRate: Number(appSettings.iziCoinRate ?? 0),
         minwithdrawalamount: Number(appSettings.minwithdrawalamount ?? 0),
         withdrawalfeepercent: Number(appSettings.withdrawalfeepercent ?? 0),
         withdrawal_period_h: Number(appSettings.withdrawal_period_h ?? 24),
         withdrawal_day: appSettings.withdrawal_day || 'Quarta-feira',
         loan_interest_rate: Number(appSettings.loan_interest_rate ?? 12.0),
         paymentmethodsactive: appSettings.paymentmethodsactive || { pix: true, card: true, lightning: false, wallet: true },
         updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings_delivery')
        .upsert(cleanSettings);
      
      if (error) throw error;
      setAppSettings(cleanSettings as AppSettings);
      setLastSavedHash(JSON.stringify(cleanSettings));
      setAutoSaveStatus('saved');
      toastSuccess('Configurações salvas com sucesso!');
      logAction('Update Settings', 'System', cleanSettings);
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
    fetchPromotions, fetchAuditLogs, fetchMerchants, fetchPartners, fetchAppSettings, fetchGlobalSettings, saveGlobalSettings, fetchMyDedicatedSlots, 
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
    fetchMerchantFinance, handleRequestWithdrawal, handleUpdateMerchantBankInfo, handleSyncMerchantBalance,
    partnerTransactions, partnerBalance, fetchPartnerFinance, handleRequestPartnerWithdrawal
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
