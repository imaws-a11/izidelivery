/**
 * ServicesContext
 * Centraliza todos os estados e handlers do app de serviços ao cliente,
 * permitindo que as views sejam componentes independentes.
 */
import { createContext, useContext } from 'react';

export type SubView =
  | 'none' | 'restaurant_list' | 'market_list' | 'pharmacy_list'
  | 'restaurant_menu' | 'product_detail' | 'checkout' | 'active_order'
  | 'addresses' | 'payments' | 'transit_selection' | 'generic_list'
  | 'wallet' | 'payment_processing' | 'payment_error' | 'payment_success'
  | 'cart' | 'burger_list' | 'pizza_list' | 'acai_list' | 'japonesa_list'
  | 'store_catalog' | 'all_pharmacies' | 'health_plantao' | 'explore_restaurants'
  | 'brasileira_list' | 'daily_menus' | 'exclusive_offer' | 'explore_mobility'
  | 'shipping_details' | 'beverages_list' | 'explore_category' | 'explore_envios'
  | 'pix_payment' | 'order_chat' | 'quest_center' | 'order_support'
  | 'order_feedback' | 'mobility_payment' | 'waiting_driver' | 'scheduled_order'
  | 'lightning_payment' | 'izi_black_purchase';

export interface ServicesContextType {
  // Auth / User
  view: string;
  setView: (v: string) => void;
  tab: string;
  setTab: (t: string) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  userName: string;
  setUserName: (n: string) => void;
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  phone: string;
  setPhone: (p: string) => void;
  authMode: string;
  setAuthMode: (m: string) => void;
  authInitLoading: boolean;
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
  errorMsg: string;
  setErrorMsg: (m: string) => void;
  rememberMe: boolean;
  setRememberMe: (r: boolean) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  cpf: string;
  setCpf: (c: string) => void;

  // Navigation
  subView: SubView;
  setSubView: (v: SubView) => void;
  navigateSubView: (v: SubView) => void;

  // Cart & Orders
  cart: any[];
  setCart: (c: any[]) => void;
  myOrders: any[];
  setMyOrders: (o: any[]) => void;
  cartAnimations: any[];
  setCartAnimations: (a: any[]) => void;

  // Location & Establishments
  userLocation: any;
  setUserLocation: (l: any) => void;
  ESTABLISHMENTS: any[];
  setESTABLISHMENTS: (e: any[]) => void;
  activeService: any;
  setActiveService: (s: any) => void;
  selectedShop: any;
  setSelectedShop: (s: any) => void;

  // Menu / Products
  activeMenuCategory: string;
  setActiveMenuCategory: (c: string) => void;
  selectedItem: any;
  setSelectedItem: (i: any) => void;
  tempQuantity: number;
  setTempQuantity: (q: number) => void;
  filterTab: string;
  setFilterTab: (t: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Payment
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  walletBalance: number;
  setWalletBalance: (b: number) => void;
  walletTransactions: any[];
  setWalletTransactions: (t: any[]) => void;
  showDepositModal: boolean;
  setShowDepositModal: (s: boolean) => void;
  depositAmount: string;
  setDepositAmount: (a: string) => void;
  depositPixCode: string;
  setDepositPixCode: (c: string) => void;
  showPixPayment: boolean;
  setShowPixPayment: (s: boolean) => void;
  pixData: any;
  setPixData: (d: any) => void;
  lightningData: any;
  setLightningData: (d: any) => void;
  savedCards: any[];
  setSavedCards: (c: any[]) => void;
  isLoadingCards: boolean;
  isAddingCard: boolean;
  setIsAddingCard: (a: boolean) => void;
  newCardData: any;
  setNewCardData: (d: any) => void;
  paymentsOrigin: string;
  setPaymentsOrigin: (o: string) => void;

  // Addresses
  savedAddresses: any[];
  setSavedAddresses: (a: any[]) => void;
  editingAddress: any;
  setEditingAddress: (a: any) => void;
  isAddingAddress: boolean;
  setIsAddingAddress: (a: boolean) => void;

  // Coupons
  availableCoupons: any[];
  setAvailableCoupons: (c: any[]) => void;
  appliedCoupon: any;
  setAppliedCoupon: (c: any) => void;
  couponInput: string;
  setCouponInput: (i: string) => void;
  copiedCoupon: string;
  setCopiedCoupon: (c: string) => void;
  isValidatingCoupon: boolean;
  setIsValidatingCoupon: (v: boolean) => void;

  // Mobility / Transit
  transitData: any;
  setTransitData: (d: any) => void;
  distancePrices: any;
  setDistancePrices: (p: any) => void;
  routeDistance: number;
  setRouteDistance: (d: number) => void;
  isCalculatingPrice: boolean;
  setIsCalculatingPrice: (c: boolean) => void;
  nearbyDrivers: any[];
  setNearbyDrivers: (d: any[]) => void;
  nearbyDriversCount: number;
  setNearbyDriversCount: (c: number) => void;
  transitHistory: any[];
  setTransitHistory: (h: any[]) => void;
  isMobilityExpanded: boolean;
  setIsMobilityExpanded: (e: boolean) => void;
  driverPos: any;
  setDriverPos: (p: any) => void;

  // Flash Offers & Market
  flashOffers: any[];
  setFlashOffers: (o: any[]) => void;
  globalSettings: any;
  setGlobalSettings: (s: any) => void;
  beverageBanners: any[];
  setBeverageBanners: (b: any[]) => void;
  beverageOffers: any[];
  setBeverageOffers: (o: any[]) => void;
  marketConditions: any;
  setMarketConditions: (c: any) => void;
  exploreCategoryState: any;
  setExploreCategoryState: (s: any) => void;
  adIndex: number;
  setAdIndex: (i: number) => void;

  // Izi Black
  isIziBlackMembership: boolean;
  setIsIziBlackMembership: (m: boolean) => void;
  iziBlackOrigin: 'home' | 'checkout';
  setIziBlackOrigin: (o: 'home' | 'checkout') => void;
  iziBlackStep: 'info' | 'payment' | 'pix_qr' | 'success';
  setIziBlackStep: (s: 'info' | 'payment' | 'pix_qr' | 'success') => void;
  iziBlackPixCode: string;
  setIziBlackPixCode: (c: string) => void;
  iziCashbackEarned: number;
  setIziCashbackEarned: (e: number) => void;
  showIziBlackCard: boolean;
  setShowIziBlackCard: (s: boolean) => void;
  showIziBlackWelcome: boolean;
  setShowIziBlackWelcome: (s: boolean) => void;
  showMasterPerks: boolean;
  setShowMasterPerks: (s: boolean) => void;
  activePerkDetail: any;
  setActivePerkDetail: (d: any) => void;

  // Toast / XP / AI
  toast: any;
  setToast: (t: any) => void;
  userXP: number;
  setUserXP: (xp: number) => void;
  isAIOpen: boolean;
  setIsAIOpen: (o: boolean) => void;
  aiMessage: string;
  setAiMessage: (m: string) => void;

  // Feedback & Chat
  timeLeft: number;
  setTimeLeft: (t: number) => void;
  rating: number;
  setRating: (r: number) => void;
  feedbackText: string;
  setFeedbackText: (t: string) => void;
  chatMessages: any[];
  setChatMessages: (m: any[]) => void;
  chatInput: string;
  setChatInput: (i: string) => void;

  // Scheduled orders
  schedObsState: string;
  setSchedObsState: (s: string) => void;
  schedChatInputState: string;
  setSchedChatInputState: (s: string) => void;
  schedMessagesState: any[];
  setSchedMessagesState: (m: any[]) => void;
  isSavingObsState: boolean;
  setIsSavingObsState: (s: boolean) => void;

  // Fetch functions
  fetchMyOrders: () => Promise<void>;
  fetchWalletBalance: () => Promise<void>;
  fetchWalletTransactions?: () => Promise<void>;
  fetchSavedCards: () => Promise<void>;
  fetchSavedAddresses: () => Promise<void>;
  fetchCoupons: () => Promise<void>;
  fetchFlashOffers: () => Promise<void>;
  fetchMarketData: () => Promise<void>;
  fetchGlobalSettings?: () => Promise<void>;
  fetchBeveragePromo?: () => Promise<void>;
  fetchRealEstablishments?: () => Promise<void>;

  // Handlers
  handleAuth: () => Promise<void>;
  handleAddToCart: (item: any, qty?: number) => void;
  handleRemoveFromCart: (itemId: string) => void;
  handlePlaceOrder: () => Promise<void>;
  handleCancelOrder: (orderId: string) => Promise<void>;
  handleShopClick: (shop: any) => void;
  handleConfirmMobility: () => Promise<void>;
  handleRequestTransit: () => Promise<void>;
}

export const ServicesContext = createContext<ServicesContextType | null>(null);

export function useServices(): ServicesContextType {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used inside ServicesContext.Provider');
  return ctx;
}
