import React, { useState, useEffect, useMemo, useCallback } from 'react';
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



export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, logout } = useAuth();
  const MASTER_ADMIN_EMAIL = (import.meta.env.VITE_MASTER_ADMIN_EMAIL as string || 'swmcapital@gmail.com').trim().toLowerCase();
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string || '';

  const { isLoaded, loadError: mapsLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry']
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
      isDynamicActive: true
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
    serviceFee: 2,
    smsNotifications: true,
    emailNotifications: true,
    iziBlackFee: 29.90,
    iziBlackCashback: 5,
    iziBlackMinOrderFreeShipping: 50,
    flashOfferTitle: 'Burgers Gourmet',
    flashOfferDiscount: 50,
    flashOfferExpiry: '',
    iziCoinRate: 1.0
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
           iziBlackFee: Number(appSettings.iziBlackFee || 0),
           iziBlackCashback: Number(appSettings.iziBlackCashback || 0),
           iziBlackMinOrderFreeShipping: Number(appSettings.iziBlackMinOrderFreeShipping || 0),
           radius: Number(appSettings.radius || 0),
           baseFee: Number(appSettings.baseFee || 0),
           appCommission: Number(appSettings.appCommission || 0),
           serviceFee: Number(appSettings.serviceFee || 0),
           flashOfferDiscount: Number(appSettings.flashOfferDiscount || 0),
           iziCoinRate: Number(appSettings.iziCoinRate || 0),
           updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('app_settings_delivery')
          .upsert(cleanSettings);
        
        if (error) throw error;
        setLastSavedHash(JSON.stringify(appSettings));
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('AutoSave Error:', err);
        setAutoSaveStatus('error');
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
  const [editType, setEditType] = useState<'user' | 'driver' | 'my_driver' | 'my_product' | 'category' | 'promotion' | 'merchant' | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [activePreviewTab, setActivePreviewTab] = useState<'info' | 'products' | 'categories' | 'sales' | 'dedicated_slots' | 'promotions'>('info');
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
  const [isWalletLoading] = useState(false);
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
  const [establishmentTypes, setEstablishmentTypes] = useState<EstablishmentType[]>([
    { id: '1', name: 'Restaurante / Lanchonete', value: 'restaurant', icon: 'restaurant', is_active: true },
    { id: '2', name: 'Farmácia', value: 'pharmacy', icon: 'medical_services', is_active: true },
    { id: '3', name: 'Mercado / Conveniência', value: 'market', icon: 'shopping_cart', is_active: true },
    { id: '4', name: 'Bebidas', value: 'beverages', icon: 'liquor', is_active: true },
    { id: '5', name: 'Pet Shop', value: 'pet', icon: 'pets', is_active: true },
    { id: '6', name: 'Suplementos / Fitness', value: 'fitness', icon: 'fitness_center', is_active: true },
    { id: '7', name: 'Presentes / Variedades', value: 'gift', icon: 'featured_seasonal', is_active: true },
    
    // Sub-categorias embutidas para exemplo/teste
    { id: 'sub-1', name: 'Hambúrguer', value: 'burguer', icon: 'lunch_dining', is_active: true, parent_id: '1' },
    { id: 'sub-2', name: 'Pizza', value: 'pizza', icon: 'local_pizza', is_active: true, parent_id: '1' },
    { id: 'sub-3', name: 'Japonesa', value: 'japonesa', icon: 'set_meal', is_active: true, parent_id: '1' },
    { id: 'sub-4', name: 'Açaí', value: 'acai', icon: 'icecream', is_active: true, parent_id: '1' },
    { id: 'sub-5', name: 'Saúde & Bem Estar', value: 'health', icon: 'health_and_safety', is_active: true, parent_id: '2' },
  ]);

  const fetchEstablishmentTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('establishment_types').select('*').order('name');
      if (error) throw error;
      if (data && data.length > 0) setEstablishmentTypes(data as EstablishmentType[]);
    } catch (err) {
      console.log('Usando tipos de estabelecimento padrão');
    }
  }, []);

  const handleUpdateEstablishmentType = useCallback(async (type: any) => {
    setIsSaving(true);
    try {
      // Tentar salvar no banco, se falhar (tabela não existe), apenas atualiza localmente para esta sessão
      const { error } = await supabase.from('establishment_types').upsert(type);
      if (error) {
        console.warn('Erro ao salvar no banco (tabela pode não existir):', error);
        // Atualização otimista local
        setEstablishmentTypes(prev => {
          const exists = prev.find(p => p.id === type.id);
          if (exists) return prev.map(p => p.id === type.id ? type : p);
          return [...prev, type];
        });
      } else {
        toastSuccess('Tipo de estabelecimento salvo!');
        fetchEstablishmentTypes();
      }
    } catch (err: any) {
      toastError(err.message);
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
          
          // Only reset to 'orders' if the current tab is invalid for a merchant or not set
          setActiveTab(prev => {
            const validMerchantTabs = ['orders', 'my_studio', 'my_drivers', 'promotions', 'financial', 'settings', 'support'];
            if (!prev || !validMerchantTabs.includes(prev)) {
              return 'orders';
            }
            return prev;
          });
        } else {
          setMerchantProfile(null);
          // Only reset to 'dashboard' if the current tab is invalid for an admin
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

  const logAction = useCallback(async (action: string, module: string, details: any = {}) => {
    await supabase.from('audit_logs_delivery').insert({
      user_id: session?.user?.id,
      action,
      module,
      metadata: details
    });
  }, [session]);

  // Data Fetchers
  const fetchStats = useCallback(async () => {
    try {
      const { data: userData } = await supabase.from('users_delivery').select('id');
      const { data: driverData } = await supabase.from('drivers_delivery').select('id');
      const { data: orderData } = await supabase.from('orders_delivery').select('total_price, status, merchant_id, created_at, service_type');
      const { data: onlineData } = await supabase.from('drivers_delivery').select('id').eq('is_online', true);
      const { data: merchantData } = await supabase.from('admin_users').select('id').eq('role', 'merchant');
      const { data: promoData } = await supabase.from('promotions_delivery').select('*');

      const completedOrders = orderData?.filter(o => o.status === 'concluido') || [];
      const canceledOrders = orderData?.filter(o => o.status === 'cancelado') || [];
      const coupons = promoData?.filter(p => p.type === 'coupon') || [];

      if (orderData) {
        // Filtra ordens para o dashboard
        let filtered = orderData as Order[];
        if (userRole === 'merchant' && merchantProfile?.merchant_id) {
          filtered = filtered.filter(o => o.merchant_id === merchantProfile.merchant_id);
        }
        setDashboardOrders(filtered);
      }

      const totalRevenue = completedOrders.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
      const cancelationImpact = canceledOrders.reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);
      const totalCouponsValue = coupons.reduce((acc: number, curr: any) => acc + (curr.discount_value || 0), 0);
      const activeOffers = promoData?.filter((p: any) => p.is_active).length || 0;

      setStats({
        users: userData?.length || 0,
        drivers: driverData?.length || 0,
        orders: orderData?.length || 0,
        onlineDrivers: onlineData?.length || 0,
        revenue: totalRevenue,
        merchants: merchantData?.length || 0,
        promotions: promoData?.length || 0,
        totalCoupons: coupons.length,
        canceledOrders: canceledOrders.length,
        cancelationImpact: cancelationImpact,
        activeOffers: activeOffers,
        couponInvestment: totalCouponsValue
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }, [userRole, merchantProfile]);

  const fetchUsers = useCallback(async () => {
    setIsLoadingList(true);
    try {
      let query = supabase.from('users_delivery').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      if (userStatusFilter !== 'all') {
        if (userStatusFilter === 'active') query = query.eq('is_active', true);
        else if (userStatusFilter === 'suspended') query = query.eq('is_active', false);
      }
      const { data } = await query;
      if (data) setUsersList(data as User[]);
    } finally {
      setIsLoadingList(false);
    }
  }, [userStatusFilter]);

  const fetchDrivers = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('drivers_delivery').select('*').eq('is_deleted', false).order('name', { ascending: true });
      if (data) setDriversList(data as Driver[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchMyDrivers = useCallback(async () => {
    if (!merchantProfile?.merchant_id) return;
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('drivers_delivery').select('*').eq('merchant_id', merchantProfile.merchant_id).eq('is_deleted', false);
      if (data) setMyDriversList(data as Driver[]);
    } finally {
      setIsLoadingList(false);
    }
  }, [merchantProfile]);

  const fetchProducts = useCallback(async (explicitMerchantId?: string) => {
    const idToUse = explicitMerchantId || merchantProfile?.merchant_id;
    if (!idToUse) return;
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('products_delivery').select('*').eq('merchant_id', idToUse);
      if (data) setProductsList(data as Product[]);
    } finally {
      setIsLoadingList(false);
    }
  }, [merchantProfile]);

  const fetchMenuCategories = useCallback(async (explicitMerchantId?: string) => {
    const idToUse = explicitMerchantId || merchantProfile?.merchant_id;
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

  const fetchAllOrders = useCallback(async (page = 1) => {
    setIsLoadingList(true);
    try {
      const from = (page - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      if (userRole === 'merchant' && merchantProfile?.merchant_id) {
        const { data, error, count } = await supabase
          .from('orders_delivery')
          .select('*, user:users_delivery(*)', { count: 'exact' })
          .eq('merchant_id', merchantProfile.merchant_id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (data) setAllOrders(data as Order[]);
        if (count !== null) setMerchantOrdersTotalCount(count);
        setMerchantOrdersPage(page);
      } else {
        const { data, error, count } = await supabase
          .from('orders_delivery')
          .select('*, user:users_delivery(*)', { count: 'exact' })
          .neq('service_type', 'subscription')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (data) setAllOrders(data as Order[]);
        if (count !== null) setOrdersTotalCount(count);
        setOrdersPage(page);
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  }, [userRole, merchantProfile]);

  // Realtime Listeners for Merchant
  useEffect(() => {
    if (userRole !== 'merchant' || !merchantProfile?.merchant_id) return;

    const channel = supabase
      .channel('merchant_orders_realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders_delivery',
          filter: `merchant_id=eq.${merchantProfile.merchant_id}`
        },
        (payload) => {
          console.log('Evento de pedido em tempo real:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            // Se o pedido for inserido como pendente_pagamento, não notifica o lojista ainda
            if (payload.new.status !== 'pendente_pagamento') {
              playIziSound('merchant');
              setNewOrderNotification({ show: true, orderId: payload.new.id });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Se o status mudou de pendente_pagamento para um status que o lojista deva agir (novo ou waiting_merchant)
            const wasPending = payload.old?.status === 'pendente_pagamento';
            const isNowActionable = payload.new.status === 'novo' || payload.new.status === 'waiting_merchant';
            
            if (wasPending && isNowActionable) {
              playIziSound('merchant');
              setNewOrderNotification({ show: true, orderId: payload.new.id });
            }
          }

          // Atualizar lista e estatísticas em qualquer mudança relevante
          fetchAllOrders(merchantOrdersPage);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, merchantProfile, merchantOrdersPage, fetchAllOrders]);

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
        const peakHours = data.filter(r => r.type === 'peak_hour');
        const zones = data.filter(r => r.type === 'zone');
        const equilibriumRow = data.find(r => r.type === 'equilibrium');
        const baseValuesRow = data.find(r => r.type === 'base_values');
        const weatherRulesRow = data.find(r => r.type === 'weather_rules');
        const flowControlRow = data.find(r => r.type === 'flow_control');

        setDynamicRatesState(prev => ({
          ...prev,
          peakHours,
          zones,
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
            isDynamicActive: (baseValuesRow.metadata as any).isDynamicActive ?? true
          } : prev.baseValues
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
      
      if (userRole === 'merchant' && merchantProfile?.merchant_id) {
        query = query.eq('merchant_id', merchantProfile.merchant_id);
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

  const fetchAppSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    try {
      const { data } = await supabase.from('app_settings_delivery').select('*').single();
      if (data) {
        setAppSettings(data as AppSettings);
        setLastSavedHash(JSON.stringify(data));
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setIsFetchingSettings(false);
    }
  }, []);

  const fetchMyDedicatedSlots = useCallback(async () => {
    if (!merchantProfile?.merchant_id) return;
    try {
      const { data } = await supabase.from('dedicated_slots_delivery').select('*').eq('merchant_id', merchantProfile.merchant_id);
      if (data) setMyDedicatedSlots(data as DedicatedSlot[]);
    } catch (err) {
      console.error('Erro ao buscar vagas dedicadas:', err);
    }
  }, [merchantProfile]);

  const openMerchantPreview = useCallback(async (merchant: any) => {
    setSelectedMerchantPreview(merchant);
    setActivePreviewTab('info');
    // Fetch related data
    try {
      const { data: prods } = await supabase.from('products_delivery').select('*').eq('merchant_id', merchant.id);
      setPreviewProducts(prods || []);
      const { data: cats } = await supabase.from('merchant_categories_delivery').select('*').eq('merchant_id', merchant.id);
      setPreviewCategories(cats || []);
    } catch (err) {
      console.error('Erro ao carregar preview do lojista:', err);
    }
  }, []);

  // Global data loading once userRole is determined
  useEffect(() => {
    if (!userRole) return;

    // Common fetches
    fetchAppSettings();
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
    }
  }, [userRole, fetchAppSettings, fetchStats, fetchUsers, fetchDrivers, fetchMerchants, fetchCategories, fetchPromotions, fetchDynamicRates, fetchAllOrders, fetchSubscriptionOrders, fetchMyDrivers, fetchProducts, fetchMenuCategories, fetchMyDedicatedSlots]);


  // Handlers
  const handleAddCredit = async () => {
    setShowAddCreditModal(true);
  };

  const handleApplyCredit = useCallback(async (userId: string, amount: number, description: string = 'Crédito administrativo') => {
    if (amount <= 0) return toastError('O valor deve ser positivo.');
    setIsSaving(true);
    try {
      const { data: user, error: fetchErr } = await supabase.from('users_delivery').select('wallet_balance').eq('id', userId).single();
      if (fetchErr) throw fetchErr;

      const newBalance = (user?.wallet_balance || 0) + amount;
      const { error: updateErr } = await supabase.from('users_delivery').update({ wallet_balance: newBalance }).eq('id', userId);
      if (updateErr) throw updateErr;

      await supabase.from('wallet_transactions_delivery').insert({
        user_id: userId,
        amount,
        type: 'credit',
        description,
        status: 'completed'
      });

      toastSuccess(`Crédito de R$ ${amount.toFixed(2)} aplicado!`);
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
        merchant_id: merchantProfile.merchant_id
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
    
    const targetMerchantId = userRole === 'merchant' ? merchantProfile?.merchant_id : selectedMerchantPreview?.id;
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
      
      // Mapear is_available se necessário
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
  }, [editingItem, merchantProfile, fetchProducts]);

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
    const targetMerchantId = userRole === 'merchant' ? merchantProfile?.merchant_id : selectedMerchantPreview?.id;
    
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
      const { error } = await supabase.from('drivers_delivery').update({ is_active: newStatus === 'active' }).eq('id', id);
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

  const handleExportDrivers = useCallback(() => {
    // CSV Export Logic
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
      const { error } = await supabase.from('orders_delivery').update({ status: 'concluido' }).eq('id', orderId);
      if (error) throw error;
      toastSuccess('Pedido concluído!');
      fetchAllOrders(ordersPage);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsCompletingOrder(null);
    }
  }, [ordersPage, fetchAllOrders]);

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
        { type: 'flow_control', metadata: dynamicRatesState.flowControl }
      ];

      // Upsert multiple configurations
      const { error: batchError } = await supabase
        .from('dynamic_rates_delivery')
        .upsert(rows.map(r => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: 'type' });

      if (batchError) throw batchError;

      // Handle Peak Hours and Zones (They are multiple rows)
      // For simplicity, we just hope they are handled by their own handlers or we can batch them too if they had IDs.
      // Actually peakHours and Zones usually have IDs, so we can upsert them directly.
      if (dynamicRatesState.peakHours.length > 0) {
        await supabase.from('dynamic_rates_delivery').upsert(
          dynamicRatesState.peakHours.map(r => ({ ...r, type: 'peak_hour', updated_at: new Date().toISOString() }))
        );
      }
      if (dynamicRatesState.zones.length > 0) {
        await supabase.from('dynamic_rates_delivery').upsert(
          dynamicRatesState.zones.map(r => ({ ...r, type: 'zone', updated_at: new Date().toISOString() }))
        );
      }

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
      const { data, error } = await supabase.from('dynamic_rates_delivery').insert({
        type: 'peak_hour',
        label: newPeakRule.label || 'Novo Horário',
        multiplier: newPeakRule.multiplier,
        is_active: true
      }).select().single();
      
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
    // Basic zone adding logic
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


  const handleUpdateDispatchSettings = async (field: string, value: string) => {};
  const handleSeedCategories = async () => {};

  const handleSaveAppSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      const cleanSettings = {
         ...appSettings,
         iziBlackFee: Number(appSettings.iziBlackFee || 0),
         iziBlackCashback: Number(appSettings.iziBlackCashback || 0),
         iziBlackMinOrderFreeShipping: Number(appSettings.iziBlackMinOrderFreeShipping || 0),
         radius: Number(appSettings.radius || 0),
         baseFee: Number(appSettings.baseFee || 0),
         appCommission: Number(appSettings.appCommission || 0),
         serviceFee: Number(appSettings.serviceFee || 0),
         flashOfferDiscount: Number(appSettings.flashOfferDiscount || 0),
         iziCoinRate: Number(appSettings.iziCoinRate || 0)
      };

      const { error } = await supabase
        .from('app_settings_delivery')
        .upsert(cleanSettings);
      
      if (error) throw error;
      setAppSettings(cleanSettings as AppSettings);
      toastSuccess('Configurações salvas com sucesso!');
      logAction('Update Settings', 'System', cleanSettings);
    } catch (err: any) {
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
    // Apenas atualiza o estado local do formulário para persistência durante a edição
    setPromoForm(updatedPromo);
  };

  const dashboardData = useMemo(() => {
    // Se não há pedidos, retorna zerado
    if (!dashboardOrders || dashboardOrders.length === 0) {
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
        topMerchants: []
      };
    }

    const completed = dashboardOrders.filter(o => o.status === 'concluido');
    const totalRevenue = completed.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
    const totalOrders = dashboardOrders.length;
    const completedOrdersCount = completed.length;
    const avgTicket = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;
    const deliverySuccessRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0;

    // Cálculo de Lucro / Comissão
    // Se for Lojista, o "Lucro Líquido" é o que sobra após a comissão da IZI
    // Se for Admin, o Lucro Líquido é a soma das comissões
    let netProfit = 0;
    let totalCommission = 0;

    // Receita diária dos últimos 7 dias baseada no Lucro Líquido / Receita
    const dailyRev = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();

    completed.forEach(order => {
      // Tenta achar o merchant específico pra pegar a taxa dele
      const m = merchantsList.find(ml => ml.id === order.merchant_id);
      const commissionRate = m?.commission_percent ?? appSettings.appCommission ?? 12;
      const commission = (order.total_price || 0) * (commissionRate / 100);
      
      totalCommission += commission;
      
      let orderNetProfit = 0;
      if (userRole === 'merchant') {
        orderNetProfit = (order.total_price || 0) - commission;
        netProfit += orderNetProfit;
      } else {
        orderNetProfit = commission; // Lucro do Admin é a comissão
        netProfit += orderNetProfit;
      }

      const orderDate = new Date(order.created_at);
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        // Daily revenue chart shows the 'net profit' (revenue for admin, profit for merchant)
        // or we can show total gross revenue. As it's "Receita" usually Admin wants to see his commission daily.
        // E lojista sua receita liquida ou bruta. Vamos colocar o orderNetProfit para ser mais condizente com o "Lucro" no chart.
        // Wait, for merchant, let's keep it as total_price (faturamento bruto) because usually daily revenue is gross.
        // And for Admin, maybe also gross? Let's use order.total_price for Merchant, and commission for Admin.
        dailyRev[6 - diffDays] += userRole === 'merchant' ? (order.total_price || 0) : commission;
      }
    });

    // Pedidos de hoje
    const totalOrdersToday = dashboardOrders.filter(o => {
      const d = new Date(o.created_at);
      return d.toDateString() === today.toDateString();
    }).length;

    // Categorias (Desempenho)
    const categoryMap: Record<string, { label: string, val: number, revenue: number }> = {};
    completed.forEach(o => {
      const cat = o.service_type || 'Geral';
      if (!categoryMap[cat]) categoryMap[cat] = { label: cat, val: 0, revenue: 0 };
      categoryMap[cat].val++;
      categoryMap[cat].revenue += (o.total_price || 0);
    });

    const categories = Object.values(categoryMap).map(c => ({
      ...c,
      percent: totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

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
      topMerchants: []
    };
  }, [dashboardOrders, merchantsList, appSettings, userRole]);

  const value: AdminContextType = {
    session,
    activeTab,
    setActiveTab,
    userRole,
    merchantProfile,
    setMerchantProfile,
    handleLogout,
    isLoadingList, isInitialLoading, stats, recentOrders, usersList, driversList, 
    allOrders, dashboardOrders, setDashboardOrders, myDriversList, merchantsList, productsList, menuCategoriesList, 
    categoriesState, setCategoriesState, promotionsList, auditLogsList, myDedicatedSlots, 
    subscriptionOrders, dynamicRatesState, setDynamicRatesState, ordersPage, setOrdersPage, 
    ordersTotalCount, merchantOrdersPage, setMerchantOrdersPage, merchantOrdersTotalCount, 
    subscriptionOrdersPage, setSubscriptionOrdersPage, subscriptionOrdersTotalCount, 
    driversPage, setDriversPage, filteredDrivers: [], paginatedDrivers: [], 
    driverSearch, setDriverSearch, driverFilter, setDriverFilter, userStatusFilter, 
    setUserStatusFilter, promoFilter, setPromoFilter, promoSearch, setPromoSearch, 
    categoryGroupFilter, setCategoryGroupFilter, appSettings, setAppSettings, autoSaveStatus, 
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
    fetchPromotions, fetchAuditLogs, fetchMerchants, fetchAppSettings, fetchMyDedicatedSlots, 
    openMerchantPreview, handleAddCredit, handleApplyCredit, handleUpdateDriver, 
    handleUpdateCategory, handleUpdateMyDriver, handleDeleteMyDriver, handleUpdateUser, 
    handleUpdateMyProduct, handleUpdateMenuCategory, handleDeleteMenuCategory, handleDeleteProduct, handleCreateNewProduct, 
    handleUpdatePromotion, handleUpdateMerchant, handleUpdateMerchantStatus, handleDeleteMerchant, 
    handleUpdateDriverStatus, handleDeleteDriver, handleExportDrivers, handleUpdateUserStatus, 
    handleDeleteUser, handleUpdateDedicatedSlot, handleCreateDedicatedSlot, handleDeleteDedicatedSlot, 
    handleNotifyUser, handleResetPassword, handleCompleteOrder, handleDeleteOrder, 
    handleConfirmSubscriptionPayment, handleAddPeakRule, handleRemovePeakRule, 
    saveDynamicRates, saveSpecificRateMetadata, handleAddZone, handleRemoveZone, 
    handleFileUpload, handleUpdateDispatchSettings, handleSeedCategories, savePromotion, 
    autoSavePromo,
    handleSaveAppSettings
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
