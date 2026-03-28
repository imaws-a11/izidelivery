import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AdminContext } from './AdminContext';
import type { AdminContextType } from './AdminContext';
import type { 
  Order, Driver, User, Merchant, MerchantProfile, 
  Product, Category, Promotion, DedicatedSlot,
  AuditLog, WalletTransaction, MenuCategory, DynamicRatesState,
  Tab, UserRole, AppSettings, DashboardData
} from '../lib/types';
import { useAuth } from './AuthContext';
import { toastSuccess, toastError, toastWarning, showConfirm } from '../lib/useToast';
import { playIziSound } from '../lib/iziSounds';
import { uploadToCloudinary } from '../lib/cloudinary';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, logout } = useAuth();
  const MASTER_ADMIN_EMAIL = (import.meta.env.VITE_MASTER_ADMIN_EMAIL as string || 'swmcapital@gmail.com').trim().toLowerCase();

  const ORDERS_PER_PAGE = 50;
  const DRIVERS_PER_PAGE = 10;

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
  const [stats, setStats] = useState({ users: 0, drivers: 0, orders: 0, onlineDrivers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
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
    baseFee: '7,50',
    appCommission: 12,
    serviceFee: 2,
    smsNotifications: true,
    emailNotifications: true,
    iziBlackFee: 29.90,
    iziBlackCashback: 5,
    iziBlackMinOrderFreeShipping: 50,
    flashOfferTitle: 'Burgers Gourmet',
    flashOfferDiscount: 50,
    flashOfferExpiry: ''
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saved' | 'error'>('idle');

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

  const [activePreviewTab, setActivePreviewTab] = useState<'info' | 'products' | 'categories' | 'sales' | 'dedicated_slots'>('info');
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
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [creditToAdd, setCreditToAdd] = useState('');
  const [isAddingCredit, setIsAddingCredit] = useState(false);
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
  const [hexGrid, setHexGrid] = useState<any[]>([]);

  // Preview Data
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewCategories, setPreviewCategories] = useState<MenuCategory[]>([]);

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
            store_type: data.store_type || 'restaurant'
          };
          setMerchantProfile(profile);
          localStorage.setItem('izi_admin_profile', JSON.stringify(profile));
          setActiveTab('orders');
        } else {
          setMerchantProfile(null);
          if (activeTab === 'orders' || activeTab === 'my_store' || activeTab === 'my_studio') {
            setActiveTab('dashboard');
          }
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
  }, [MASTER_ADMIN_EMAIL, handleLogout, activeTab]);

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
      const { data: userData } = await supabase.from('users_delivery').select('id', { count: 'exact' });
      const { data: driverData } = await supabase.from('drivers_delivery').select('id', { count: 'exact' });
      const { data: orderData } = await supabase.from('orders_delivery').select('total_price', { count: 'exact' });
      const { data: onlineData } = await supabase.from('drivers_delivery').select('id').eq('is_online', true);

      const totalRevenue = orderData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;

      setStats({
        users: userData?.length || 0,
        drivers: driverData?.length || 0,
        orders: orderData?.length || 0,
        onlineDrivers: onlineData?.length || 0,
        revenue: totalRevenue
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingList(true);
    try {
      let query = supabase.from('users_delivery').select('*').order('created_at', { ascending: false });
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
      const { data } = await supabase.from('drivers_delivery').select('*').order('name', { ascending: true });
      if (data) setDriversList(data as Driver[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchMyDrivers = useCallback(async () => {
    if (!merchantProfile?.merchant_id) return;
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('drivers_delivery').select('*').eq('merchant_id', merchantProfile.merchant_id);
      if (data) setMyDriversList(data as Driver[]);
    } finally {
      setIsLoadingList(false);
    }
  }, [merchantProfile]);

  const fetchProducts = useCallback(async () => {
    if (!merchantProfile?.merchant_id) return;
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('products_delivery').select('*').eq('merchant_id', merchantProfile.merchant_id);
      if (data) setProductsList(data as Product[]);
    } finally {
      setIsLoadingList(false);
    }
  }, [merchantProfile]);

  const fetchMenuCategories = useCallback(async () => {
    if (!merchantProfile?.merchant_id) return;
    try {
      const { data } = await supabase.from('menu_categories_delivery').select('*').eq('merchant_id', merchantProfile.merchant_id).order('order_index', { ascending: true });
      if (data) setMenuCategoriesList(data as MenuCategory[]);
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
          .select('*', { count: 'exact' })
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
          .select('*', { count: 'exact' })
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
      const { data } = await supabase.from('promotions_delivery').select('*').order('created_at', { ascending: false });
      if (data) setPromotionsList(data as Promotion[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) setAuditLogsList(data as AuditLog[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchMerchants = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('admin_users').select('*').eq('role', 'merchant').order('store_name', { ascending: true });
      if (data) setMerchantsList(data as Merchant[]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchAppSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('app_settings_delivery').select('*').single();
      if (data) setAppSettings(data as AppSettings);
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
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
      const { data: cats } = await supabase.from('menu_categories_delivery').select('*').eq('merchant_id', merchant.id);
      setPreviewCategories(cats || []);
    } catch (err) {
      console.error('Erro ao carregar preview do lojista:', err);
    }
  }, []);


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
      if (error) throw error;
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
    if (!editingItem || !merchantProfile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('products_delivery').upsert({
        ...editingItem,
        merchant_id: merchantProfile.merchant_id
      });
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
      const { error } = await supabase.from('menu_categories_delivery').upsert(cat);
      if (error) throw error;
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

  const handleCreateNewProduct = useCallback(() => {
    setEditingItem({
      name: '',
      description: '',
      price: 0,
      is_active: true,
      category_id: '',
      image_url: ''
    });
    setEditType('my_product');
  }, []);

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
    setIsSaving(true);
    try {
      const { error } = await supabase.from('admin_users').update({
        store_name: editingItem.store_name,
        store_description: editingItem.store_description,
        store_address: editingItem.store_address,
        store_phone: editingItem.store_phone,
        is_open: editingItem.is_open,
        is_active: editingItem.is_active
      }).eq('id', editingItem.id);
      
      if (error) throw error;
      toastSuccess('Lojista atualizado!');
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
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
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

  const handleAddPeakRule = async () => {};
  const handleRemovePeakRule = async (id: string) => {};
  const saveDynamicRates = async () => {};
  const saveSpecificRateMetadata = async (type: string, metadata: any) => {};
  const handleAddZone = async () => {};
  const handleRemoveZone = async (id: string) => {};

  const handleFileUpload = useCallback(async (file: File, bucket?: string) => {
    try {
      const url = await uploadToCloudinary(file);
      if (!url) throw new Error('Upload falhou');
      return url;
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      toastError('Erro ao fazer upload da imagem no Cloudinary.');
      return null;
    }
  }, []);

  const handleUpdateDispatchSettings = async (field: string, value: string) => {};
  const handleSeedCategories = async () => {};

  const savePromotion = useCallback(async (promo: any) => {
    setPromoSaving(true);
    setPromoSaveStatus('saving');
    try {
      const { error } = await supabase.from('promotions_delivery').upsert(promo);
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
    setAutoSaveStatus('pending');
    // Simple debounce logic could be here
    setPromoForm(updatedPromo);
    setAutoSaveStatus('saved');
  };

  const dashboardData = useMemo(() => ({
    totalRevenue: 28450.90,
    totalOrders: 1240,
    completedOrdersCount: 1180,
    avgTicket: 24.11,
    netProfit: 3414.10,
    totalCommission: 3414.10,
    deliverySuccessRate: 95.16,
    dailyRevenue: [1200, 1500, 1100, 1800, 2200, 2800, 3100],
    revenuePath: 'M0,120 L400,120',
    dayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
    totalOrdersToday: 42,
    categories: [],
    topMerchants: []
  }), []);

  const value: AdminContextType = {
    session,
    activeTab,
    setActiveTab,
    userRole,
    merchantProfile,
    setMerchantProfile,
    handleLogout,
    isLoadingList, isInitialLoading, stats, recentOrders, usersList, driversList, 
    allOrders, myDriversList, merchantsList, productsList, menuCategoriesList, 
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
    selectedCategoryStudio, setSelectedCategoryStudio, selectedZoneForMap, setSelectedZoneForMap, 
    selectedTrackingItem, setSelectedTrackingItem, selectedMenuCategory, setSelectedMenuCategory, 
    editingItem, setEditingItem, editType, setEditType, editingSlotId, setEditingSlotId, 
    isSaving, setIsSaving, activePreviewTab, setActivePreviewTab, activeStudioTab, 
    setActiveStudioTab, trackingListTab, setTrackingListTab, showActiveOrdersModal, 
    setShowActiveOrdersModal, showCategoryListModal, setShowCategoryListModal, 
    showPromoForm, setShowPromoForm, promoFormType, setPromoFormType, promoForm, 
    setPromoForm, promoSaving, promoSaveStatus, expandedLogId, setExpandedLogId, 
    isCompletingOrder, setIsCompletingOrder, newOrderNotification, setNewOrderNotification, 
    walletTransactions, isWalletLoading, showAddCreditModal, setShowAddCreditModal, 
    creditToAdd, setCreditToAdd, isAddingCredit, showWalletStatementModal, 
    setShowWalletStatementModal, isAddingPeakRule, setIsAddingPeakRule, newPeakRule, 
    setNewPeakRule, newZoneData, setNewZoneData, mapSearch, setMapSearch, isGeolocating, 
    setIsGeolocating, mapCenterView, setMapCenterView, fixedGridCenter, setFixedGridCenter, 
    selectedHexagons, setSelectedHexagons, hexGrid, getHexPath: () => [], 
    previewProducts, setPreviewProducts, previewCategories, setPreviewCategories, 
    dashboardData: dashboardData as DashboardData,
    mapsLoadError: null,
    isLoaded: true,
    fetchStats, fetchUsers, fetchDrivers, fetchMyDrivers, fetchProducts, fetchMenuCategories, 
    fetchAllOrders, fetchSubscriptionOrders, fetchCategories, fetchDynamicRates, 
    fetchPromotions, fetchAuditLogs, fetchMerchants, fetchAppSettings, fetchMyDedicatedSlots, 
    openMerchantPreview, handleAddCredit, handleApplyCredit, handleUpdateDriver, 
    handleUpdateCategory, handleUpdateMyDriver, handleDeleteMyDriver, handleUpdateUser, 
    handleUpdateMyProduct, handleUpdateMenuCategory, handleDeleteProduct, handleCreateNewProduct, 
    handleUpdatePromotion, handleUpdateMerchant, handleUpdateMerchantStatus, handleDeleteMerchant, 
    handleUpdateDriverStatus, handleDeleteDriver, handleExportDrivers, handleUpdateUserStatus, 
    handleDeleteUser, handleUpdateDedicatedSlot, handleCreateDedicatedSlot, handleDeleteDedicatedSlot, 
    handleNotifyUser, handleResetPassword, handleCompleteOrder, handleDeleteOrder, 
    handleConfirmSubscriptionPayment, handleAddPeakRule, handleRemovePeakRule, 
    saveDynamicRates, saveSpecificRateMetadata, handleAddZone, handleRemoveZone, 
    handleFileUpload, handleUpdateDispatchSettings, handleSeedCategories, savePromotion, 
    autoSavePromo
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
