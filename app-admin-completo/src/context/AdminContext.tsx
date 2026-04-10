import { createContext, useContext } from 'react';
import type {
  Order, Driver, User, Merchant, MerchantProfile,
  Product, Category, Promotion, DedicatedSlot,
  AuditLog, WalletTransaction, MenuCategory, DynamicRatesState,
  Tab, UserRole, AppSettings, DashboardData, EstablishmentType, PartnerStore
} from '../lib/types';

export interface AdminContextType {
  // Auth
  session: any;
  userRole: UserRole;
  merchantProfile: MerchantProfile | null;
  setMerchantProfile: (p: MerchantProfile | null) => void;
  handleLogout: () => Promise<void>;

  // Navigation
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // Lists
  stats: { 
    users: number; 
    drivers: number; 
    orders: number; 
    onlineDrivers: number; 
    revenue: number;
    merchants: number;
    promotions: number;
    totalCoupons: number;
    canceledOrders: number;
    cancelationImpact: number;
    activeOffers: number;
    couponInvestment: number;
  };
  recentOrders: Order[];
  usersList: User[];
  driversList: Driver[];
  allOrders: Order[];
  dashboardOrders: Order[];
  setDashboardOrders: (orders: Order[]) => void;
  myDriversList: Driver[];
  merchantsList: Merchant[];
  productsList: Product[];
  menuCategoriesList: MenuCategory[];
  categoriesState: Category[];
  setCategoriesState: (c: Category[]) => void;
  promotionsList: Promotion[];
  auditLogsList: AuditLog[];
  myDedicatedSlots: DedicatedSlot[];
  subscriptionOrders: Order[];
  dynamicRatesState: DynamicRatesState;
  setDynamicRatesState: (d: any) => void;
  partnersList: PartnerStore[];

  // Loading
  isLoadingList: boolean;
  isInitialLoading: boolean;

  // Pagination
  ordersPage: number;
  setOrdersPage: (p: number) => void;
  ordersTotalCount: number;
  merchantOrdersPage: number;
  setMerchantOrdersPage: (p: number) => void;
  merchantOrdersTotalCount: number;
  subscriptionOrdersPage: number;
  setSubscriptionOrdersPage: (p: number) => void;
  subscriptionOrdersTotalCount: number;
  driversPage: number;
  setDriversPage: (p: number) => void;
  filteredDrivers: Driver[];
  paginatedDrivers: Driver[];

  // Filters/Search
  driverSearch: string;
  setDriverSearch: (s: string) => void;
  driverFilter: string;
  setDriverFilter: (f: string) => void;
  userStatusFilter: 'all' | 'active' | 'suspended' | 'blocked' | 'inactive';
  setUserStatusFilter: (f: 'all' | 'active' | 'suspended' | 'blocked' | 'inactive') => void;
  promoFilter: 'all' | 'banner' | 'coupon' | 'active' | 'expired';
  setPromoFilter: (f: 'all' | 'banner' | 'coupon' | 'active' | 'expired') => void;
  promoSearch: string;
  setPromoSearch: (s: string) => void;
  categoryGroupFilter: 'all' | 'mobility' | 'service';
  setCategoryGroupFilter: (f: 'all' | 'mobility' | 'service') => void;

  // Settings
  appSettings: AppSettings;
  setAppSettings: (s: AppSettings) => void;
  autoSaveStatus: 'idle' | 'pending' | 'saved' | 'error';

  // Selected items
  selectedUser: User | null;
  setSelectedUser: (u: User | null) => void;
  selectedMerchantPreview: Merchant | null;
  setSelectedMerchantPreview: (m: Merchant | null) => void;
  selectedDriverStudio: Driver | null;
  setSelectedDriverStudio: (d: Driver | null) => void;
  selectedUserStudio: User | null;
  setSelectedUserStudio: (u: User | null) => void;
  selectedCategoryStudio: Category | null;
  setSelectedCategoryStudio: (c: Category | null) => void;
  selectedZoneForMap: any;
  setSelectedZoneForMap: (z: any) => void;
  selectedTrackingItem: any;
  setSelectedTrackingItem: (i: any) => void;
  selectedMenuCategory: string;
  setSelectedMenuCategory: (id: string) => void;

  // Edit state
  editingItem: any;
  setEditingItem: (i: any) => void;
  editType: 'user' | 'driver' | 'my_driver' | 'my_product' | 'category' | 'promotion' | 'merchant' | 'partner' | null;
  setEditType: (t: 'user' | 'driver' | 'my_driver' | 'my_product' | 'category' | 'promotion' | 'merchant' | 'partner' | null) => void;
  editingSlotId: string | null;
  setEditingSlotId: (id: string | null) => void;
  isSaving: boolean;
  setIsSaving: (s: boolean) => void;

  // UI state
  activePreviewTab: 'info' | 'products' | 'categories' | 'sales' | 'dedicated_slots' | 'promotions' | 'financial';
  setActivePreviewTab: (t: 'info' | 'products' | 'categories' | 'sales' | 'dedicated_slots' | 'promotions' | 'financial') => void;
  activeStudioTab: 'personal' | 'vehicle' | 'finance' | 'documents' | 'wallet' | 'security' | 'general' | 'subcategories';
  setActiveStudioTab: (t: 'personal' | 'vehicle' | 'finance' | 'documents' | 'wallet' | 'security' | 'general' | 'subcategories') => void;
  trackingListTab: 'orders' | 'drivers';
  setTrackingListTab: (t: 'orders' | 'drivers') => void;
  showActiveOrdersModal: boolean;
  setShowActiveOrdersModal: (s: boolean) => void;
  showCategoryListModal: boolean;
  setShowCategoryListModal: (s: boolean) => void;
  showPromoForm: boolean;
  setShowPromoForm: (s: boolean) => void;
  promoFormType: 'banner' | 'coupon';
  setPromoFormType: (t: 'banner' | 'coupon') => void;
  promoForm: any;
  setPromoForm: (f: any) => void;
  promoSaving: boolean;
  promoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  expandedLogId: string | null;
  setExpandedLogId: (id: string | null) => void;
  isCompletingOrder: string | null;
  setIsCompletingOrder: (id: string | null) => void;
  newOrderNotification: { show: boolean; orderId?: string };
  setNewOrderNotification: (n: { show: boolean; orderId?: string }) => void;

  // Wallet
  walletTransactions: WalletTransaction[];
  merchantTransactions: WalletTransaction[];
  merchantBalance: number;
  isWalletLoading: boolean;
  showAddCreditModal: boolean;
  setShowAddCreditModal: (s: boolean) => void;
  creditToAdd: string;
  setCreditToAdd: (v: string) => void;
  isAddingCredit: boolean;
  showWalletStatementModal: boolean;
  setShowWalletStatementModal: (s: boolean) => void;

  // Wallet Handlers
  fetchMerchantFinance: () => Promise<void>;
  handleRequestWithdrawal: (amount: number, pixKey: string) => Promise<void>;
  handleUpdateMerchantBankInfo: (bankInfo: any) => Promise<void>;
  handleSyncMerchantBalance: () => Promise<void>;

  // Dynamic rates / map
  isAddingPeakRule: boolean;
  setIsAddingPeakRule: (s: boolean) => void;
  newPeakRule: { label: string; multiplier: number; is_active: boolean };
  setNewPeakRule: (r: any) => void;
  newZoneData: any;
  setNewZoneData: (z: any) => void;
  mapSearch: any;
  setMapSearch: (s: any) => void;
  isGeolocating: boolean;
  setIsGeolocating: (s: boolean) => void;
  mapCenterView: { lat: number; lng: number };
  setMapCenterView: (c: { lat: number; lng: number }) => void;
  fixedGridCenter: { lat: number; lng: number };
  setFixedGridCenter: (c: { lat: number; lng: number }) => void;
  selectedHexagons: string[];
  setSelectedHexagons: (h: string[]) => void;
  hexGrid: any[];
  getHexPath: (center: { lat: number; lng: number }, size: number) => any[];

  // Preview (Studio)
  previewProducts: Product[];
  setPreviewProducts: (p: Product[]) => void;
  previewCategories: MenuCategory[];
  setPreviewCategories: (c: MenuCategory[]) => void;

  // Establishment Types
  establishmentTypes: EstablishmentType[];
  setEstablishmentTypes: (t: EstablishmentType[]) => void;
  fetchEstablishmentTypes: () => Promise<void>;
  handleUpdateEstablishmentType: (type: any) => Promise<void>;
  handleDeleteEstablishmentType: (id: string) => Promise<void>;


  // Computed
  dashboardData: DashboardData;
  mapsLoadError: string | null;
  isLoaded: boolean;

  // Fetch functions
  fetchStats: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchDrivers: () => Promise<void>;
  fetchMyDrivers: () => Promise<void>;
  fetchProducts: (explicitMerchantId?: string) => Promise<void>;
  fetchMenuCategories: (explicitMerchantId?: string) => Promise<void>;
  fetchAllOrders: (page?: number) => Promise<void>;
  fetchSubscriptionOrders: (page?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchDynamicRates: () => Promise<void>;
  fetchPromotions: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchMerchants: () => Promise<void>;
  fetchPartners: () => Promise<void>;
  fetchAppSettings: () => Promise<void>;
  fetchMyDedicatedSlots: () => Promise<void>;
  openMerchantPreview: (merchant: any) => Promise<void>;

  // Handlers
  handleAddCredit: () => Promise<void>;
  handleApplyCredit: (userId: string, amount: number, description?: string) => Promise<void>;
  handleUpdateDriver: (e: React.FormEvent) => Promise<void>;
  handleUpdateCategory: (e: React.FormEvent) => Promise<void>;
  handleUpdateMyDriver: (e: React.FormEvent) => Promise<void>;
  handleDeleteMyDriver: (id: string) => Promise<void>;
  handleUpdateUser: (e: React.FormEvent) => Promise<void>;
  handleUpdateMyProduct: (e: React.FormEvent) => Promise<void>;
  handleUpdateMenuCategory: (cat: any) => Promise<void>;
  handleDeleteMenuCategory: (id: string, name: string) => Promise<void>;
  handleDeleteProduct: (id: string, name: string) => Promise<void>;
  handleCreateNewProduct: () => Promise<void>;
  handleUpdatePromotion: (e: React.FormEvent) => Promise<void>;
  handleUpdateMerchant: (e: React.FormEvent) => Promise<void>;
  handleUpdateMerchantStatus: (id: string, newStatus: 'active' | 'inactive' | 'suspended') => Promise<void>;
  handleDeleteMerchant: (id: string) => Promise<void>;
  handleUpdateDriverStatus: (id: string, newStatus: 'active' | 'inactive' | 'suspended') => Promise<void>;
  handleDeleteDriver: (id: string) => Promise<void>;
  handleUpdatePartnerStatus: (id: string, active: boolean) => Promise<void>;
  handleDeletePartner: (id: string) => Promise<void>;
  handleUpdatePartner: (e: React.FormEvent) => Promise<void>;
  handleExportDrivers: () => void;
  handleUpdateUserStatus: (id: string, newStatus: 'active' | 'inactive' | 'suspended') => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  handleUpdateDedicatedSlot: (slot: any) => Promise<void>;
  handleCreateDedicatedSlot: () => void;
  handleDeleteDedicatedSlot: (slotId: string) => Promise<void>;
  handleNotifyUser: (userId: string) => Promise<void>;
  handleResetPassword: (userId: string) => Promise<void>;
  handleCompleteOrder: (orderId: string) => Promise<void>;
  handleDeleteOrder: (orderId: string) => Promise<void>;
  handleConfirmSubscriptionPayment: (order: Order) => Promise<void>;
  handleAddPeakRule: () => Promise<void>;
  handleRemovePeakRule: (id: string) => Promise<void>;
  saveDynamicRates: () => Promise<void>;
  saveSpecificRateMetadata: (type: string, metadata: Record<string, unknown>) => Promise<void>;
  handleAddZone: () => Promise<void>;
  handleRemoveZone: (id: string) => Promise<void>;
  handleFileUpload: (file: File, bucket?: string) => Promise<string | null>;
  handleUpdateDispatchSettings: (field: 'dispatch_priority' | 'scheduling_priority', value: string) => Promise<void>;
  handleSeedCategories: () => Promise<void>;
  savePromotion: (promo: any) => Promise<void>;
  autoSavePromo: (updatedPromo: any) => void;
  handleSaveAppSettings: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminContext.Provider');
  return ctx;
}
