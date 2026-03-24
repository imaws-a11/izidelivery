import { toast, toastSuccess, toastError, toastWarning, showConfirm, showPrompt } from './lib/useToast';
import type { Order, Driver, User, Merchant, MerchantProfile, Product, Category, Promotion, DedicatedSlot, AuditLog, WalletTransaction, DynamicRate, MenuCategory } from './lib/types';
import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playIziSound } from './lib/iziSounds';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Polygon } from '@react-google-maps/api';
import { supabase } from './lib/supabase';
import FlashOffersSection from './components/FlashOffersSection';
import { mapContainerStyle, darkMapStyle, wazeMapStyle } from './constants/mapStyles';
import { AdminContext } from './context/AdminContext';

// Lazy-loaded tab components (carregam sob demanda, melhorando performance inicial)
const DashboardTab      = React.lazy(() => import('./components/DashboardTab'));
const TrackingTab       = React.lazy(() => import('./components/TrackingTab'));
const OrdersMerchantTab = React.lazy(() => import('./components/OrdersMerchantTab'));
const OrdersAdminTab    = React.lazy(() => import('./components/OrdersAdminTab'));
const DriversTab        = React.lazy(() => import('./components/DriversTab'));
const UsersTab          = React.lazy(() => import('./components/UsersTab'));
const MerchantsTab      = React.lazy(() => import('./components/MerchantsTab'));
const SupportTab        = React.lazy(() => import('./components/SupportTab'));
const FinancialTab      = React.lazy(() => import('./components/FinancialTab'));
const PromotionsTab     = React.lazy(() => import('./components/PromotionsTab'));
const IziBlackTab       = React.lazy(() => import('./components/IziBlackTab'));
const CategoriesTab     = React.lazy(() => import('./components/CategoriesTab'));
const DynamicRatesTab   = React.lazy(() => import('./components/DynamicRatesTab'));
const AuditLogsTab      = React.lazy(() => import('./components/AuditLogsTab'));
const SettingsTab       = React.lazy(() => import('./components/SettingsTab'));
const MyStoreTab        = React.lazy(() => import('./components/MyStoreTab'));
const MyDriversTab      = React.lazy(() => import('./components/MyDriversTab'));
const MyStudioTab       = React.lazy(() => import('./components/MyStudioTab'));

const TabFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      <p className="text-xs font-black uppercase tracking-widest">Carregando...</p>
    </div>
  </div>
);

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? '';
const libraries: ("places" | "geometry")[] = ["places"];

type Tab = 'dashboard' | 'tracking' | 'orders' | 'drivers' | 'users' | 'financial' | 'settings' | 'support' | 'promotions' | 'categories' | 'dynamic_rates' | 'audit_logs' | 'my_store' | 'my_drivers' | 'my_studio' | 'merchants' | 'izi_black';
type UserRole = 'admin' | 'merchant';
const MASTER_ADMIN_EMAIL = (import.meta.env.VITE_MASTER_ADMIN_EMAIL as string ?? '').trim().toLowerCase();

// ─── Flash Offers Section ────────────────────────────────────────────────────
const FlashOffersSection = ({ supabase, userRole, merchantId }: { supabase: any, userRole: string, merchantId?: string }) => {
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [merchants, setMerchants] = React.useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [form, setForm] = React.useState({ product_name: '', product_image: '', original_price: '', discounted_price: '', merchant_id: '', expires_at: '', description: '' });

  const fetchOffers = async () => {
    let query = supabase.from('flash_offers').select('*, admin_users(store_name)');
    if (userRole === 'merchant' && merchantId) {
      query = query.eq('merchant_id', merchantId);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setOffers(data);
  };
  const fetchMerchants = async () => {
    if (userRole === 'admin') {
      const { data } = await supabase.from('admin_users').select('id, store_name').eq('role', 'merchant').eq('is_active', true);
      if (data) setMerchants(data);
    } else if (merchantId) {
      const { data } = await supabase.from('admin_users').select('id, store_name').eq('id', merchantId).single();
      if (data) {
        setMerchants([data]);
        setForm(prev => ({ ...prev, merchant_id: merchantId }));
      }
    }
  };

  React.useEffect(() => { fetchOffers(); fetchMerchants(); }, [userRole, merchantId]);

  const handleSave = async () => {
    if (!form.product_name || !form.original_price || !form.discounted_price || !form.expires_at) { alert('Preencha todos os campos obrigatórios.'); return; }
    const discountPct = Math.round((1 - Number(form.discounted_price) / Number(form.original_price)) * 100);
    if (discountPct < 20) { alert('Desconto mínimo é 20%.'); return; }
    setLoading(true);
    const { error } = await supabase.from('flash_offers').insert({ title: form.product_name, description: form.description, merchant_id: form.merchant_id || null, product_name: form.product_name, product_image: form.product_image || null, original_price: Number(form.original_price), discounted_price: Number(form.discounted_price), discount_percent: discountPct, expires_at: new Date(form.expires_at).toISOString(), is_active: true });
    setLoading(false);
    if (!error) { setShowForm(false); setForm({ product_name: '', product_image: '', original_price: '', discounted_price: '', merchant_id: '', expires_at: '', description: '' }); fetchOffers(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('flash_offers').update({ is_active: !current }).eq('id', id);
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    if (!confirm('Excluir esta oferta flash?')) return;
    await supabase.from('flash_offers').delete().eq('id', id);
    fetchOffers();
  };

  return (
    <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="material-symbols-outlined text-rose-500">flash_on</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Izi Flash</h2>
            <p className="text-xs text-slate-400">Ofertas com tempo limitado e desconto mínimo de 20%</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-5 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all">
          <span className="material-symbols-outlined text-lg">add</span>Nova Oferta Flash
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-6 space-y-5">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Nova Oferta Flash</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto *</label>
              <input value={form.product_name} onChange={e => setForm({...form, product_name: e.target.value})} placeholder="Nome do produto" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lojista</label>
              <select value={form.merchant_id} onChange={e => setForm({...form, merchant_id: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400">
                <option value="">Selecionar lojista</option>
                {merchants.map((m: any) => <option key={m.id} value={m.id}>{m.store_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Original (R$) *</label>
              <input type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço com Desconto (R$) *</label>
              <input type="number" value={form.discounted_price} onChange={e => setForm({...form, discounted_price: e.target.value})} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
              {form.original_price && form.discounted_price && (
                <p className={`text-[10px] font-black ${Math.round((1 - Number(form.discounted_price)/Number(form.original_price))*100) >= 20 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Desconto: {Math.round((1 - Number(form.discounted_price)/Number(form.original_price))*100)}% {Math.round((1 - Number(form.discounted_price)/Number(form.original_price))*100) < 20 ? '(mínimo 20%)' : '✓'}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expira em *</label>
              <input type="datetime-local" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Imagem do Produto (URL)</label>
              <input value={form.product_image} onChange={e => setForm({...form, product_image: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold dark:text-white focus:outline-none focus:border-rose-400" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? 'Salvando...' : 'Publicar Oferta Flash'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          </div>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-dashed border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">flash_off</span>
          <p className="text-sm font-black text-slate-400">Nenhuma oferta flash criada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer: any) => {
            const isExpired = new Date(offer.expires_at) < new Date();
            const diffMs = new Date(offer.expires_at).getTime() - Date.now();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return (
              <div key={offer.id} className={`bg-white dark:bg-slate-900 border rounded-[24px] overflow-hidden shadow-sm ${isExpired || !offer.is_active ? 'opacity-50 border-slate-200 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                {offer.product_image && <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800"><img src={offer.product_image} className="w-full h-full object-cover" alt={offer.product_name} /></div>}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{offer.admin_users?.store_name || 'Sem lojista'}</p>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{offer.product_name}</h4>
                    </div>
                    <span className="text-[10px] font-black text-white bg-rose-500 px-2.5 py-1 rounded-xl shrink-0">-{offer.discount_percent}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 line-through">R$ {Number(offer.original_price).toFixed(2)}</span>
                    <span className="text-sm font-black text-rose-500">R$ {Number(offer.discounted_price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-slate-400">timer</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-500' : diffHrs < 2 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {isExpired ? 'Expirada' : diffHrs > 0 ? `${diffHrs}h ${diffMins}m restantes` : `${diffMins}min restantes`}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => toggleActive(offer.id, offer.is_active)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${offer.is_active ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {offer.is_active ? '● Ativa' : '○ Pausada'}
                    </button>
                    <button onClick={() => deleteOffer(offer.id)} className="px-3 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl border border-red-100 dark:border-red-500/20 text-[9px] font-black uppercase tracking-widest">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('merchant');
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [stats, setStats] = useState({
    users: 0,
    drivers: 0,
    orders: 0,
    onlineDrivers: 0,
    revenue: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [myDriversList, setMyDriversList] = useState<Driver[]>([]);
  const [merchantsList, setMerchantsList] = useState<Merchant[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [driverSearch, setDriverSearch] = useState('');
  const [driverFilter, setDriverFilter] = useState('Todos');
  const [driversPage, setDriversPage] = useState(1);
  const DRIVERS_PER_PAGE = 10;

  const filteredDrivers = useMemo(() => {
    setDriversPage(1); // Auto-reset page when filter/search changes
    return driversList.filter(d => {
      const matchesSearch = (d.name || '').toLowerCase().includes(driverSearch.toLowerCase()) || 
                           (d.id || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
                           (d.phone || '').includes(driverSearch);
      
      const matchesFilter = driverFilter === 'Todos' || 
                           (driverFilter === 'Ativos' && (d.is_active || d.status === 'active')) ||
                           (driverFilter === 'Offline' && !d.is_online) ||
                           (driverFilter === 'Pendentes' && (!d.is_active || d.status !== 'active') && d.status !== 'suspended');
                           
      return matchesSearch && matchesFilter;
    });
  }, [driversList, driverSearch, driverFilter]);

  const paginatedDrivers = useMemo(() => {
    const start = (driversPage - 1) * DRIVERS_PER_PAGE;
    return filteredDrivers.slice(start, start + DRIVERS_PER_PAGE);
  }, [filteredDrivers, driversPage]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Paginação de pedidos
  const ORDERS_PER_PAGE = 50;
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [merchantOrdersPage, setMerchantOrdersPage] = useState(1);
  const [merchantOrdersTotalCount, setMerchantOrdersTotalCount] = useState(0);

  const [subscriptionOrders, setSubscriptionOrders] = useState<Order[]>([]);
  const [subscriptionOrdersPage, setSubscriptionOrdersPage] = useState(1);
  const [subscriptionOrdersTotalCount, setSubscriptionOrdersTotalCount] = useState(0);

  const [appSettings, setAppSettings] = useState({
    appName: 'Izi - Hub de Negócios',
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
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRenderRef = useRef(true);

  const [menuCategoriesList, setMenuCategoriesList] = useState<MenuCategory[]>([]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('all');

  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMerchantPreview, setSelectedMerchantPreview] = useState<Merchant | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewCategories, setPreviewCategories] = useState<MenuCategory[]>([]);
  const [selectedDriverStudio, setSelectedDriverStudio] = useState<Driver | null>(null);
  const [selectedUserStudio, setSelectedUserStudio] = useState<User | null>(null);
  const [editType, setEditType] = useState<'user' | 'driver' | 'my_driver' | 'my_product' | 'category' | 'promotion' | 'merchant' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showActiveOrdersModal, setShowActiveOrdersModal] = useState(false);
  const [showCategoryListModal, setShowCategoryListModal] = useState(false);
  const [categoryGroupFilter, setCategoryGroupFilter] = useState<'all' | 'mobility' | 'service'>('all');
  const [isCompletingOrder, setIsCompletingOrder] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'info' | 'products' | 'categories' | 'sales' | 'dedicated_slots'>('info');

  const [isAddingPeakRule, setIsAddingPeakRule] = useState(false);
  const [selectedZoneForMap, setSelectedZoneForMap] = useState<any>(null);
  const [newPeakRule, setNewPeakRule] = useState({ label: '', multiplier: 1.2, is_active: true });
  const [newZoneData, setNewZoneData] = useState({ label: '', fee: '5,00', lat: -23.5505, lng: -46.6333, radius: 2000, is_active: true });
  const [mapSearch, setMapSearch] = useState<any>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [mapCenterView, setMapCenterView] = useState({ lat: -23.5505, lng: -46.6333 });
  const [fixedGridCenter, setFixedGridCenter] = useState({ lat: -23.5505, lng: -46.6333 });
  const zoneMapRef = useRef<google.maps.Map | null>(null);
  const [, setZoneSelectionMode] = useState<'circle' | 'hex'>('hex');
  const [selectedHexagons, setSelectedHexagons] = useState<string[]>([]);
  const HEX_SIZE = 450;

  // Hexagon helpers
  const getHexPath = useCallback((center: { lat: number, lng: number }, size: number) => {
    const path = [];
    for (let i = 0; i < 6; i++) {
      const angle_deg = 60 * i + 30;
      const angle_rad = (Math.PI / 180) * angle_deg;
      const lat = center.lat + (size * Math.sin(angle_rad)) / 111320;
      const lng = center.lng + (size * Math.cos(angle_rad)) / (111320 * Math.cos((center.lat * Math.PI) / 180));
      path.push({ lat, lng });
    }
    return path;
  }, []);

  const hexToLatLng = useCallback((q: number, r: number, size: number, origin: { lat: number, lng: number }) => {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * (1.5 * r);
    const lat = origin.lat + y / 111320;
    const lng = origin.lng + x / (111320 * Math.cos((origin.lat * Math.PI) / 180));
    return { lat, lng };
  }, []);

  useEffect(() => {
    if (selectedZoneForMap === 'new') {
      setFixedGridCenter(mapCenterView);
      setSelectedHexagons([]); // Limpa seleções anteriores ao abrir nova zona
    }
  }, [selectedZoneForMap, mapCenterView]);

  const hexGrid = useMemo(() => {
    const grid = [];
    const range = 15; // reduzido de 40 para evitar ~7k polígonos no mapa
    for (let q = -range; q <= range; q++) {
      for (let r = -range; r <= range; r++) {
        if (Math.abs(q + r) <= range) {
          const center = hexToLatLng(q, r, HEX_SIZE, fixedGridCenter);
          grid.push({ q, r, center, id: `${q},${r}` });
        }
      }
    }
    return grid;
  }, [fixedGridCenter, HEX_SIZE, hexToLatLng]);

  const [categoriesState, setCategoriesState] = useState<Category[]>([]);
  const [selectedCategoryStudio, setSelectedCategoryStudio] = useState<Category | null>(null);
  const [promotionsList, setPromotionsList] = useState<Promotion[]>([]);
  const [promoFilter, setPromoFilter] = useState<'all' | 'banner' | 'coupon' | 'active' | 'expired'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended' | 'blocked' | 'inactive'>('all');
  const [activeStudioTab, setActiveStudioTab] = useState<'personal' | 'vehicle' | 'finance' | 'documents' | 'wallet' | 'security' | 'general' | 'subcategories'>('personal');
  const [promoSearch, setPromoSearch] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoFormType, setPromoFormType] = useState<'banner' | 'coupon'>('coupon');
  const [promoForm, setPromoForm] = useState({
    title: '', description: '', image_url: '', coupon_code: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: 10, min_order_value: 0, max_usage: 100,
    expires_at: '', is_active: true, is_vip: false
  });
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoSaveStatus, setPromoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const promoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [myDedicatedSlots, setMyDedicatedSlots] = useState<DedicatedSlot[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const [selectedTrackingItem, setSelectedTrackingItem] = useState<any>(null);
  const [trackingListTab, setTrackingListTab] = useState<'orders' | 'drivers'>('orders');

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [creditToAdd, setCreditToAdd] = useState('');
  const [isAddingCredit, setIsAddingCredit] = useState(false);
  const [showWalletStatementModal, setShowWalletStatementModal] = useState(false);

  const [newOrderNotification, setNewOrderNotification] = useState<{show: boolean, orderId?: string}>({show: false});

  const playOrderNotification = () => {
    playIziSound('merchant');
  };

  useEffect(() => {
    if (selectedUserStudio && activeStudioTab === 'wallet') {
      const fetchWallet = async () => {
        setIsWalletLoading(true);
        try {
          const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', selectedUserStudio.id)
            .order('created_at', { ascending: false });
          if (!error && data) {
            setWalletTransactions(data);
          }
        } finally {
          setIsWalletLoading(false);
        }
      };
      fetchWallet();
    }
  }, [selectedUserStudio, activeStudioTab]);

  const handleAddCredit = async () => {
    if (!selectedUserStudio) return;
    const amount = Number(creditToAdd.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast('Digite um valor válido maior que zero.');
      return;
    }
    setIsAddingCredit(true);
    try {
      const { error: txError } = await supabase.from('wallet_transactions').insert({
        user_id: selectedUserStudio.id,
        type: 'deposito',
        amount: amount,
        description: 'Aporte de Saldo (Admin)'
      });
      if (txError) throw txError;

      const newBalance = (selectedUserStudio.wallet_balance || 0) + amount;
      const { error: userError } = await supabase.from('users_delivery')
        .update({ wallet_balance: newBalance })
        .eq('id', selectedUserStudio.id);
      if (userError) throw userError;

      setSelectedUserStudio({ ...selectedUserStudio, wallet_balance: newBalance });
      setWalletTransactions([{
        id: 'new-' + Date.now(),
        type: 'deposito',
        amount: amount,
        description: 'Aporte de Saldo (Admin)',
        created_at: new Date().toISOString()
      }, ...walletTransactions]);

      
      setShowAddCreditModal(false);
      setCreditToAdd('');
      // Optional: fetchUsers() or refresh whole list if needed, but local state is fine.
    } catch (err: any) {
      toastError('Erro ao adicionar crédito: ' + err.message);
    } finally {
      setIsAddingCredit(false);
    }
  };

  const [dynamicRatesState, setDynamicRatesState] = useState({
    peakHours: [] as any[],
    zones: [] as any[],
    weather: {
      rain: { multiplier: 1.3, active: true },
      storm: { multiplier: 1.8, active: true },
      snow: { multiplier: 2.5, active: false }
    },
    equilibrium: {
      threshold: 1.2,
      sensitivity: 2.0,
      maxSurge: 4.0
    },
    baseValues: {
      mototaxi_min: '6,00',
      mototaxi_km: '2,50',
      carro_min: '14,00',
      carro_km: '4,50',
      van_min: '35,00',
      van_km: '8,00',
      utilitario_min: '10,00',
      utilitario_km: '3,00',
      isDynamicActive: true
    },
    flowControl: {
      mode: 'auto' as 'auto' | 'manual',
      highDemandActive: false
    }
  });

  const [mapsLoadError, setMapsLoadError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    if (loadError) setMapsLoadError(loadError.message);
  }, [loadError]);

  const mapCenter = { lat: -23.5505, lng: -46.6333 };

  const fetchUserRole = async (userEmail: string) => {
    const cleanEmail = userEmail.trim().toLowerCase();
    
    // Hard check for Master Admin
    if (cleanEmail === MASTER_ADMIN_EMAIL) {
      setUserRole('admin');
      setMerchantProfile(null);
      setActiveTab('dashboard');
      setIsInitialLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, role, merchant_id, store_name, store_logo, store_description, store_banner, store_phone, delivery_radius, dispatch_priority, scheduling_priority, opening_hours, store_address, is_open, is_active, store_type, free_delivery')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) {
        setUserRole('merchant');
        setIsInitialLoading(false);
        return;
      }

      if (data) {
        const role = (data.role as UserRole) || 'merchant';
        setUserRole(role);
        
        if (role === 'merchant') {
          setMerchantProfile({
            merchant_id: data.id,
            store_name: data.store_name || 'Meu Estabelecimento',
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
          });
          setActiveTab('my_store');
        } else {
          setMerchantProfile(null);
          setActiveTab('dashboard');
        }
      } else {
        setUserRole('merchant');
        setMerchantProfile(null);
        setActiveTab('my_store');
      }
    } catch (err) {
      console.error('Falha crítica no RBAC:', err);
      setUserRole('merchant');
      setActiveTab('my_store');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        fetchUserRole(currentSession.user.email);
      }
      if (!currentSession) setIsInitialLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        fetchUserRole(session.user.email);
      }
      if (!session || !session.user) {
        setIsInitialLoading(false);
        setUserRole('merchant');
        setMerchantProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const loadInitialData = async () => {
      await fetchStats();
      await fetchAppSettings();
      if (activeTab === 'users') await fetchUsers();
      if (activeTab === 'merchants') await fetchMerchants();
      if (activeTab === 'drivers' || activeTab === 'tracking' || activeTab === 'dashboard') await fetchDrivers();
      if (activeTab === 'orders' || activeTab === 'tracking' || activeTab === 'dashboard') {
        setOrdersPage(1);
        setMerchantOrdersPage(1);
        await fetchAllOrders(1);
      }
      if (activeTab === 'izi_black') {
        setSubscriptionOrdersPage(1);
        await fetchSubscriptionOrders(1);
      }
      if (activeTab === 'categories') await fetchCategories();
      if (activeTab === 'dynamic_rates') await fetchDynamicRates();
      if (activeTab === 'promotions' || activeTab === 'my_store') {
        await fetchPromotions();
        if (activeTab === 'my_store') {
          await fetchProducts();
          await fetchMenuCategories();
          await fetchMyDedicatedSlots();
        }
      }
      if (activeTab === 'my_studio') {
        await fetchProducts();
        await fetchMenuCategories();
        await fetchMyDedicatedSlots();
      }
      if (activeTab === 'audit_logs') await fetchAuditLogs();
      if (activeTab === 'my_drivers') await fetchMyDrivers();
      setIsInitialLoading(false);
    };

    loadInitialData();

    // Auto-geolocation for Dynamic Rates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenterView(coords);
          // Only update newZoneData if it's still at default SP
          setNewZoneData(prev => {
            if (prev.lat === -23.5505 && prev.lng === -46.6333) {
              return { ...prev, ...coords };
            }
            return prev;
          });
        },
        null,
        { enableHighAccuracy: true }
      );
    }

    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30s backup polling

    return () => {
      clearInterval(interval);
    };
  }, [session]);

  // Canal realtime separado: não recria ao trocar de aba
  // Usa ref para acessar activeTab sem colocá-lo nas deps
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_delivery' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playOrderNotification();
          setNewOrderNotification({ show: true, orderId: payload.new.id?.toString() });
          setTimeout(() => {
            setNewOrderNotification({ show: false });
          }, 5000);
        }
        fetchStats();
        const tab = activeTabRef.current;
        if (tab === 'dashboard' || tab === 'orders' || tab === 'tracking') fetchAllOrders(1);
        if (tab === 'izi_black') fetchSubscriptionOrders(1);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers_delivery' }, () => {
        fetchStats();
        const tab = activeTabRef.current;
        if (tab === 'dashboard' || tab === 'drivers' || tab === 'tracking') fetchDrivers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_delivery' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_users' }, () => {
        if (activeTabRef.current === 'merchants') fetchMerchants();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions_delivery' }, () => {
        const tab = activeTabRef.current;
        if (tab === 'promotions' || tab === 'my_store') fetchPromotions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    if (activeTab === 'my_studio' && userRole === 'merchant' && merchantProfile) {
      if (!selectedMerchantPreview || selectedMerchantPreview.id !== merchantProfile.merchant_id) {
        openMerchantPreview({ ...merchantProfile, id: merchantProfile.merchant_id });
      }
    }
  }, [activeTab, userRole, merchantProfile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err) {
      setAuthError('Falha na comunicação com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole('merchant');
    setMerchantProfile(null);
    setActiveTab('my_store');
  };

  const fetchStats = async () => {
    try {
      const isAdmin = userRole === 'admin';
      let adminId = null;

      if (!isAdmin && session?.user?.email) {
        const { data } = await supabase.from('admin_users').select('id').eq('email', session.user.email).maybeSingle();
        adminId = data?.id;
      }

      const results = await Promise.all([
        supabase.from('users_delivery').select('*', { count: 'exact', head: true }),
        isAdmin
          ? supabase.from('drivers_delivery').select('*', { count: 'exact', head: true })
          : adminId 
            ? supabase.from('drivers_delivery').select('*', { count: 'exact', head: true }).eq('merchant_id', adminId)
            : Promise.resolve({ count: 0, data: null, error: null }),
        isAdmin
          ? supabase.from('orders_delivery').select('*', { count: 'exact', head: true })
          : supabase.from('orders_delivery').select('id', { count: 'exact', head: true }).order('created_at', { ascending: false }),
        isAdmin
          ? supabase.from('drivers_delivery').select('*', { count: 'exact', head: true }).eq('is_online', true)
          : adminId
            ? supabase.from('drivers_delivery').select('*', { count: 'exact', head: true }).eq('merchant_id', adminId).eq('is_online', true)
            : Promise.resolve({ count: 0, data: null, error: null }),
        isAdmin
          ? supabase.from('orders_delivery').select('*').order('created_at', { ascending: false }).limit(5)
          : supabase.from('orders_delivery').select('*').limit(5),
        // Receita real: soma de total_price dos pedidos concluídos
        isAdmin
          ? supabase.from('orders_delivery').select('total_price').eq('status', 'concluido')
          : adminId
            ? supabase.from('orders_delivery').select('total_price').eq('status', 'concluido').eq('merchant_id', adminId)
            : Promise.resolve({ count: 0, data: [], error: null })
      ]);

      const revenueData = results[5].data ?? [];
      const revenue = revenueData.reduce((sum: number, o: { total_price?: number }) => sum + (Number(o.total_price) || 0), 0);

      setStats({
        users: results[0].count || 0,
        drivers: results[1].count || 0,
        orders: results[2].count || 0,
        onlineDrivers: results[3].count || 0,
        revenue
      } as any);

      if (results[4].data) setRecentOrders(results[4].data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('users_delivery').select('*').order('created_at', { ascending: false });
      if (data) setUsersList(data);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchDrivers = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('drivers_delivery').select('*').order('created_at', { ascending: false });
      if (data) setDriversList(data);
    } catch (err) {
      console.error('Drivers fetch error:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchMyDrivers = async () => {
    if (!session?.user?.email) return;
    setIsLoadingList(true);
    try {
      // Get the admin_user record for the current session to get the ID for merchant_id
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (adminData) {
        const { data } = await supabase
          .from('drivers_delivery')
          .select('*')
          .eq('merchant_id', adminData.id)
          .order('created_at', { ascending: false });
        if (data) setMyDriversList(data);
      }
    } catch (err) {
      console.error('My drivers fetch error:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchProducts = async () => {
    if (!session?.user?.email) return;
    setIsLoadingList(true);
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (adminData) {
        const { data } = await supabase
          .from('products_delivery')
          .select('*')
          .eq('merchant_id', adminData.id)
          .order('created_at', { ascending: false });
        if (data) setProductsList(data);
      }
    } catch (err) {
      console.error('Products fetch error:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchMenuCategories = async () => {
    if (!session?.user?.email) return;
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (adminData) {
        const { data } = await supabase
          .from('merchant_categories_delivery')
          .select('*')
          .eq('merchant_id', adminData.id)
          .order('sort_order', { ascending: true });
        if (data) setMenuCategoriesList(data || []);
      }
    } catch (err) {
      console.error('Menu categories fetch error:', err);
    }
  };

  const fetchMyDedicatedSlots = async () => {
    if (!session?.user?.email) return;
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email)
        .single();
      
      if (adminData) {
        const { data, error } = await supabase
          .from('dedicated_slots_delivery')
          .select('*')
          .eq('merchant_id', adminData.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setMyDedicatedSlots(data || []);
      }
    } catch (err) {
    }
  };

  const fetchAllOrders = async (page = 1) => {
    setIsLoadingList(true);
    try {
      const from = (page - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      if (userRole === 'merchant' && merchantProfile?.merchant_id) {
        // Paginação para lojista
        const { data, error, count } = await supabase
          .from('orders_delivery')
          .select('*', { count: 'exact' })
          .eq('merchant_id', merchantProfile.merchant_id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (data) setAllOrders(data);
        if (count !== null) setMerchantOrdersTotalCount(count);
        setMerchantOrdersPage(page);
      } else {
        // Paginação para admin - EXCLUINDO assinaturas (serviço digital)
        const { data, error, count } = await supabase
          .from('orders_delivery')
          .select('*', { count: 'exact' })
          .neq('service_type', 'subscription')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (data) setAllOrders(data);
        if (count !== null) setOrdersTotalCount(count);
        setOrdersPage(page);
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchSubscriptionOrders = async (page = 1) => {
    setIsLoadingList(true);
    try {
      const from = (page - 1) * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      // Buscar APENAS assinaturas
      const { data, error, count } = await supabase
        .from('orders_delivery')
        .select('*', { count: 'exact' })
        .eq('service_type', 'subscription')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (data) setSubscriptionOrders(data);
      if (count !== null) setSubscriptionOrdersTotalCount(count);
      setSubscriptionOrdersPage(page);
    } catch (err: any) {
      console.error('Erro ao carregar assinaturas:', err.message);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('categories_delivery').select('*').order('name', { ascending: true });
      if (data) setCategoriesState(data);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchDynamicRates = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('dynamic_rates_delivery').select('*');
      if (data) {
        const peakHours = data.filter(r => r.type === 'peak_hour');
        const zones = data.filter(r => r.type === 'zone');
        
        // Novas linhas estruturadas
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
            van_min: (baseValuesRow.metadata as any).van_min?.toString().replace('.', ',') || '35,00',
            van_km: (baseValuesRow.metadata as any).van_km?.toString().replace('.', ',') || '8,00',
            utilitario_min: (baseValuesRow.metadata as any).utilitario_min?.toString().replace('.', ',') || '10,00',
            utilitario_km: (baseValuesRow.metadata as any).utilitario_km?.toString().replace('.', ',') || '3,00',
            isDynamicActive: (baseValuesRow.metadata as any).isDynamicActive !== undefined ? (baseValuesRow.metadata as any).isDynamicActive : true
          } : prev.baseValues
        }));
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  const saveSpecificRateMetadata = async (type: string, metadata: Record<string, unknown>) => {
    try {
      await supabase.from('dynamic_rates_delivery')
        .update({ metadata })
        .eq('type', type);
    } catch (err) {
      console.error(`Erro ao salvar ${type}:`, err);
    }
  };

  const saveDynamicRates = async () => {
    setIsSaving(true);
    try {
      const promises = [
        ...dynamicRatesState.peakHours.map(r => supabase.from('dynamic_rates_delivery').update({ multiplier: r.multiplier, is_active: r.active, label: r.label }).eq('id', r.id)),
        ...dynamicRatesState.zones.map(z => supabase.from('dynamic_rates_delivery').update({ fee: parseFloat(z.fee), is_active: z.active, label: z.label }).eq('id', z.id)),
        // Salvar via Metadata
        supabase.from('dynamic_rates_delivery').update({ 
          metadata: dynamicRatesState.equilibrium 
        }).eq('type', 'equilibrium'),
        supabase.from('dynamic_rates_delivery').update({ 
          metadata: dynamicRatesState.weather 
        }).eq('type', 'weather_rules'),
        supabase.from('dynamic_rates_delivery').update({ 
          metadata: dynamicRatesState.flowControl 
        }).eq('type', 'flow_control'),
        supabase.from('dynamic_rates_delivery').update({ 
          metadata: {
            mototaxi_min: parseFloat(dynamicRatesState.baseValues.mototaxi_min.replace(',', '.')),
            mototaxi_km: parseFloat(dynamicRatesState.baseValues.mototaxi_km.replace(',', '.')),
            carro_min: parseFloat(dynamicRatesState.baseValues.carro_min.replace(',', '.')),
            carro_km: parseFloat(dynamicRatesState.baseValues.carro_km.replace(',', '.')),
            van_min: parseFloat(dynamicRatesState.baseValues.van_min.replace(',', '.')),
            van_km: parseFloat(dynamicRatesState.baseValues.van_km.replace(',', '.')),
            utilitario_min: parseFloat(dynamicRatesState.baseValues.utilitario_min.replace(',', '.')),
            utilitario_km: parseFloat(dynamicRatesState.baseValues.utilitario_km.replace(',', '.')),
            isDynamicActive: dynamicRatesState.baseValues.isDynamicActive
          }
        }).eq('type', 'base_values')
      ];
      await Promise.all(promises);
toastSuccess('Configurações de precificação dinâmica publicadas com sucesso!');
      logAction('Update Multi-Factor Pricing', 'Dynamic Rates', dynamicRatesState);
    } catch (err) {
      console.error('Erro ao salvar taxas:', err);
      toastError('Erro ao salvar algumas configurações. Verifique os logs.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPromotions = async () => {
    setIsLoadingList(true);
    try {
      let query = supabase.from('promotions_delivery').select('*');
      
      // Filter by merchant if user is merchant (assuming promotions have merchant_id)
      if (userRole === 'merchant' && merchantProfile?.merchant_id) {
        query = query.eq('merchant_id', merchantProfile.merchant_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPromotionsList(data);
    } catch (err: any) {
      console.error("Erro ao buscar promoções:", err.message);
    } finally {
      setIsLoadingList(false);
    }
  };

  const savePromotion = async (promo: any) => {
    setPromoSaving(true);
    if (promoSaveTimer.current) clearTimeout(promoSaveTimer.current);
    try {
      const payload: Record<string, unknown> = {
        title: promo.title,
        description: promo.description,
        image_url: promo.image_url || null,
        coupon_code: promo.coupon_code || null,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_order_value: promo.min_order_value,
        max_usage: promo.max_usage,
        expires_at: promo.expires_at ? new Date(promo.expires_at + 'T23:59:59').toISOString() : null,
        is_active: promo.is_active,
        is_vip: promo.is_vip || false,
        updated_at: new Date().toISOString()
      };

      if (userRole === 'merchant' && merchantProfile?.merchant_id) {
        payload.merchant_id = merchantProfile.merchant_id;
      }

      const { error } = promo.id
        ? await supabase.from('promotions_delivery').update(payload).eq('id', promo.id)
        : await supabase.from('promotions_delivery').insert([payload]);
      
      if (error) { 
        console.error("Erro ao salvar promoção:", error);
        setPromoSaveStatus('error'); 
      }
      else {
        setPromoSaveStatus('saved');
        fetchPromotions();
        // Se era uma nova promoção (sem ID), fecha o formulário após 1s
        if (!promo.id) {
          setTimeout(() => {
            setShowPromoForm(false);
            setPromoForm({ title: '', description: '', image_url: '', coupon_code: '', discount_type: 'percent', discount_value: 10, min_order_value: 0, max_usage: 100, expires_at: '', is_active: true, is_vip: false });
          }, 1000);
        }
        setTimeout(() => setPromoSaveStatus('idle'), 2500);
      }
    } finally { setPromoSaving(false); }
  };

  const autoSavePromo = (updatedPromo: typeof promoForm & { id?: string }) => {
    setPromoForm(updatedPromo);
    if (updatedPromo.id) {
      setPromoSaveStatus('saving');
      if (promoSaveTimer.current) clearTimeout(promoSaveTimer.current);
      promoSaveTimer.current = setTimeout(() => savePromotion(updatedPromo), 1500);
    }
  };

  const handleAddPeakRule = async () => {
    if (!newPeakRule.label) return;
    const { data, error: _error } = await supabase.from('dynamic_rates_delivery').insert({
      type: 'peak_hour',
      label: newPeakRule.label,
      multiplier: newPeakRule.multiplier,
      is_active: true
    }).select().single();
    if (data) {
      setDynamicRatesState(prev => ({ ...prev, peakHours: [...prev.peakHours, data] }));
      setIsAddingPeakRule(false);
      setNewPeakRule({ label: '', multiplier: 1.2, is_active: true });
    }
  };

  const handleRemovePeakRule = async (id: string) => {
    await supabase.from('dynamic_rates_delivery').delete().eq('id', id);
    setDynamicRatesState(prev => ({ ...prev, peakHours: prev.peakHours.filter(r => r.id !== id) }));
  };

  const handleAddZone = async () => {
    
    if (!newZoneData.label) {
      toast('Por favor, insira um nome para a zona.');
      return;
    }

    if (selectedHexagons.length === 0) {
      toastError('ERRO: Selecione pelo menos um hexágono no mapa!');
      return;
    }

    try {
      const numericFee = typeof newZoneData.fee === 'string' 
        ? parseFloat(newZoneData.fee.replace(',', '.')) 
        : (typeof newZoneData.fee === 'number' ? newZoneData.fee : 0);

      const { data, error } = await supabase.from('dynamic_rates_delivery').insert({
        type: 'zone',
        label: newZoneData.label,
        fee: numericFee,
        is_active: true,
        metadata: { 
          lat: newZoneData.lat, 
          lng: newZoneData.lng, 
          radius: newZoneData.radius,
          selectionMode: 'hex',
          selectedHexes: selectedHexagons,
          gridCenter: fixedGridCenter
        }
      }).select().single();

      if (error) {
        console.error('Erro ao salvar zona no Supabase:', error);
        toastError('Erro ao salvar zona: ' + error.message);
        return;
      }

      if (data) {
        setDynamicRatesState(prev => ({ ...prev, zones: [...prev.zones, data] }));
        setSelectedZoneForMap(null);
        setSelectedHexagons([]);
        setZoneSelectionMode('hex');
      }
    } catch (err) {
      console.error('Exceção ao salvar zona:', err);
      toastError('Ocorreu um erro inesperado ao salvar a zona.');
    }
  };

  const handleRemoveZone = async (id: string) => {
    await supabase.from('dynamic_rates_delivery').delete().eq('id', id);
    setDynamicRatesState(prev => ({ ...prev, zones: prev.zones.filter(z => z.id !== id) }));
  };

  const fetchAuditLogs = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase.from('audit_logs_delivery').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setAuditLogsList(data);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchMerchants = async () => {
    setIsLoadingList(true);
    try {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('role', 'merchant')
        .order('created_at', { ascending: false });
      if (data) setMerchantsList(data);
    } catch (err) {
      console.error('Merchants fetch error:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const openMerchantPreview = async (merchant: any) => {
    setSelectedMerchantPreview(merchant);
    setIsLoadingList(true);
    setActiveTab('my_studio');
    try {
      const { data, error } = await supabase
        .from('products_delivery')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPreviewProducts(data || []);

      // Fetch Categories
      const { data: catData } = await supabase
        .from('merchant_categories_delivery')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('sort_order', { ascending: true });
      
      setPreviewCategories(catData || []);
    } catch (err) {
      console.error('Error fetching preview data:', err);
      setPreviewProducts([]);
      setPreviewCategories([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleFileUpload = async (file: File, bucket: string = 'logos'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toastError('Erro ao fazer upload da imagem: ' + (error.message || 'Erro desconhecido.'));
      return null;
    }
  };

  const fetchAppSettings = async () => {
    const { data } = await supabase.from('admin_settings_delivery').select('*').eq('id', '00000000-0000-0000-0000-000000000000' as any).single();
    if (data) {
      setAppSettings({
        appName: data.app_name,
        supportEmail: data.support_email,
        openingTime: data.opening_time,
        closingTime: data.closing_time,
        radius: data.radius_km,
        baseFee: data.base_fee.toString().replace('.', ','),
        appCommission: data.commission_percent,
        serviceFee: data.service_fee_percent,
        smsNotifications: data.sms_enabled,
        emailNotifications: data.email_enabled,
        iziBlackFee: data.izi_black_fee || 29.90,
        iziBlackCashback: data.izi_black_cashback || 5,
        iziBlackMinOrderFreeShipping: data.izi_black_min_order_free_shipping || 50,
        flashOfferTitle: data.flash_offer_title || 'Burgers Gourmet',
        flashOfferDiscount: data.flash_offer_discount || 50,
        flashOfferExpiry: data.flash_offer_expiry ? new Date(data.flash_offer_expiry).toISOString().slice(0, 16) : ''
      });
    }
  };

  const logAction = async (action: string, module: string, metadata: Record<string, unknown> = {}) => {
    await supabase.from('audit_logs_delivery').insert({
      user_id: session?.user?.id,
      action,
      module,
      metadata
    });
  };



  // Auto-save effect: debounce 1.5s after any appSettings change
  useEffect(() => {
    if (isFirstRenderRef.current) { isFirstRenderRef.current = false; return; }
    setAutoSaveStatus('pending');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('admin_settings_delivery').update({
          app_name: appSettings.appName,
          support_email: appSettings.supportEmail,
          opening_time: appSettings.openingTime,
          closing_time: appSettings.closingTime,
          radius_km: appSettings.radius,
          base_fee: parseFloat(appSettings.baseFee.replace(',', '.')),
          commission_percent: appSettings.appCommission,
          service_fee_percent: appSettings.serviceFee,
          sms_enabled: appSettings.smsNotifications,
          email_enabled: appSettings.emailNotifications,
          izi_black_fee: appSettings.iziBlackFee,
          izi_black_cashback: appSettings.iziBlackCashback,
          izi_black_min_order_free_shipping: appSettings.iziBlackMinOrderFreeShipping,
          flash_offer_title: appSettings.flashOfferTitle,
          flash_offer_discount: appSettings.flashOfferDiscount,
          flash_offer_expiry: appSettings.flashOfferExpiry ? new Date(appSettings.flashOfferExpiry).toISOString() : null,
          updated_at: new Date().toISOString()
        }).eq('id', '00000000-0000-0000-0000-000000000000' as any);
        if (error) { setAutoSaveStatus('error'); }
        else { setAutoSaveStatus('saved'); setTimeout(() => setAutoSaveStatus('idle'), 3000); }
      } catch { setAutoSaveStatus('error'); }
    }, 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [appSettings]);

  // Consolidating merchant update - Duplicate removed

  const handleUpdateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('drivers_delivery').upsert({
        id: editingItem.id || undefined,
        name: editingItem.name,
        phone: editingItem.phone,
        vehicle_type: editingItem.vehicle_type,
        license_plate: editingItem.license_plate,
        is_active: true
      });
      if (error) throw error;
      setEditingItem(null);
      fetchDrivers();
    } catch (err) {
      console.error('Update driver error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Consolidating category update
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: editingItem.name,
        description: editingItem.desc || editingItem.description || null,
        icon: editingItem.icon || null,
        type: editingItem.type || 'service',
        parent_id: editingItem.parent_id || null,
        is_active: editingItem.is_active !== undefined ? editingItem.is_active : true
      };

      const { error } = editingItem.id
        ? await supabase.from('categories_delivery').update(payload).eq('id', editingItem.id)
        : await supabase.from('categories_delivery').insert([payload]);

      if (error) {
        console.error('Supabase category error:', error);
        toastError(error.message);
        throw error;
      }
      setEditingItem(null);
      setEditType(null);
      fetchCategories();
      logAction(editingItem.id ? 'Update Category' : 'Create Category', 'Categories', editingItem);
    } catch (err: any) {
      console.error('Update category error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedCategories = async () => {
    if (!await showConfirm({ message: 'Deseja gerar as categorias e subcategorias padrão agora?' })) return;
    setIsLoadingList(true);
    try {
      // 1. Inserir Categorias Principais
      const mainCategories = [
        // SERVIÇOS
        { name: "Restaurantes", icon: "restaurant", type: "service", description: "Peça o melhor da cidade", is_active: true },
        { name: "Mercado", icon: "shopping_cart", type: "service", description: "Compras do dia a dia", is_active: true },
        { name: "Farmácia", icon: "medical_services", type: "service", description: "Medicamentos e saúde", is_active: true },
        { name: "Bebidas", icon: "sports_bar", type: "service", description: "Distribuidoras e adegas", is_active: true },
        { name: "Petshop", icon: "pets", type: "service", description: "Cuidados para seu pet", is_active: true },
        // MOBILIDADE
        { name: "Mobilidade", icon: "directions_car", type: "mobility", description: "Transporte de passageiros", is_active: true },
        { name: "Entregas Express", icon: "local_shipping", type: "mobility", description: "Transporte de volumes e fretes", is_active: true }
      ];

      const { data: insertedMains, error: mainError } = await supabase.from('categories_delivery').insert(mainCategories).select();
      if (mainError) throw mainError;

      // 2. Inserir Subcategorias para os IDs criados
      if (insertedMains) {
        const subCategories = [];
        
        const beverages = insertedMains.find(c => c.name === "Bebidas");
        if (beverages) {
          subCategories.push(
            { name: "Cervejas", parent_id: beverages.id, type: "service", is_active: true },
            { name: "Vinhos", parent_id: beverages.id, type: "service", is_active: true },
            { name: "Destilados", parent_id: beverages.id, type: "service", is_active: true },
            { name: "Refrigerantes", parent_id: beverages.id, type: "service", is_active: true }
          );
        }

        const mobility = insertedMains.find(c => c.name === "Mobilidade");
        if (mobility) {
          subCategories.push(
            { name: "Carro Particular", parent_id: mobility.id, type: "mobility", is_active: true },
            { name: "Mototáxi", parent_id: mobility.id, type: "mobility", is_active: true },
            { name: "Premium / Black", parent_id: mobility.id, type: "mobility", is_active: true }
          );
        }

        const freight = insertedMains.find(c => c.name === "Entregas Express");
        if (freight) {
          subCategories.push(
            { name: "Fiorino / Van", parent_id: freight.id, type: "mobility", is_active: true },
            { name: "Caminhão 3/4", parent_id: freight.id, type: "mobility", is_active: true },
            { name: "Entregas com Moto", parent_id: freight.id, type: "mobility", is_active: true }
          );
        }

        if (subCategories.length > 0) {
          await supabase.from('categories_delivery').insert(subCategories);
        }
      }
      
      toastSuccess('Ecossistema de categorias gerado com sucesso!');
      fetchCategories();
    } catch (err: any) {
      // Se o erro for de coluna inexistente, vamos tentar inserir sem a coluna 'type' primeiro
      if (err.message.includes('column "type" of relation "categories_delivery" does not exist')) {
        try {
           const mainCategoriesSimple = [
             { name: "Restaurantes", icon: "restaurant", description: "Peça o melhor da cidade", is_active: true },
             { name: "Mercado", icon: "shopping_cart", description: "Compras do dia a dia", is_active: true },
             { name: "Farmácia", icon: "medical_services", description: "Medicamentos e saúde", is_active: true },
             { name: "Bebidas", icon: "sports_bar", description: "Distribuidoras e adegas", is_active: true },
             { name: "Petshop", icon: "pets", description: "Cuidados para seu pet", is_active: true },
             { name: "Mobilidade", icon: "directions_car", description: "Transporte de passageiros", is_active: true },
             { name: "Entregas Express", icon: "local_shipping", description: "Transporte de volumes e fretes", is_active: true }
           ];
           await supabase.from('categories_delivery').insert(mainCategoriesSimple);
           toast('Categorias básicas criadas! (Note: A coluna "type" ainda não existe no seu banco de dados, mas as categorias foram criadas como serviço por padrão).');
           fetchCategories();
           return;
        } catch (innerErr: any) {
           toastError('Erro persistente: ' + innerErr.message);
        }
      }
      toastError('Erro ao gerar categorias: ' + err.message);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleUpdateDispatchSettings = async (field: 'dispatch_priority' | 'scheduling_priority', value: string) => {
    if (!session?.user?.email) return;
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ [field]: value })
        .eq('email', session.user.email);

      if (error) throw error;

      // Update local state
      setMerchantProfile((prev) => ({
        ...prev,
        [field]: value
      }));
    } catch (err) {
      console.error('Update dispatch settings error:', err);
    }
  };

  const handleUpdateMyDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;
    setIsSaving(true);
    try {
      // Get the merchant's internal ID
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (adminData) {
        const { error } = await supabase.from('drivers_delivery').upsert({
          id: editingItem.id || undefined,
          name: editingItem.name,
          phone: editingItem.phone,
          vehicle_type: editingItem.vehicle_type,
          license_plate: editingItem.license_plate,
          merchant_id: adminData.id,
          is_active: true
        });
        if (error) throw error;
        setEditingItem(null);
        fetchMyDrivers();
      }
    } catch (err) {
      console.error('Update my driver error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMyDriver = async (id: string) => {
    if (!await showConfirm({ message: 'Deseja realmente remover este motoboy da sua frota?' })) return;
    try {
      await supabase.from('orders_delivery').update({ driver_id: null }).eq('driver_id', id); const { error } = await supabase.from('drivers_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchMyDrivers();
    } catch (err) {
      console.error('Delete my driver error:', err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
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
      
      if (error) toastError(error.message);
      else {
        toastSuccess('Cliente atualizado com sucesso!');
        fetchUsers();
        logAction('Update User', 'Users', editingItem);
        setEditingItem(null);
        setEditType(null);
        if (selectedUser?.id === editingItem.id) {
          setSelectedUser({ ...selectedUser, ...editingItem });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleIziBlack = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users_delivery')
        .update({ is_izi_black: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toastSuccess(`Status Izi Black ${!currentStatus ? 'ativado' : 'desativado'}!`);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_izi_black: !currentStatus });
      }
    } catch (err: any) {
      toastError('Erro ao atualizar status Izi Black: ' + err.message);
    }
  };

  // Removed duplicate handleUpdateCategory manually by replacing it with a comment
  // Duplicate at 568 removed.

  const handleUpdateMyProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email || !editingItem) return;
    setIsSaving(true);
    try {
      const { data: adminData } = await supabase.from('admin_users').select('id').eq('email', session.user.email).single();
      if (!adminData) {
        toastError('Sessão inválida. Recarregue a página e tente novamente.');
        return;
      }
      const productData = {
        name: editingItem.name,
        description: editingItem.description,
        price: parseFloat(editingItem.price),
        category: editingItem.category,
        image_url: editingItem.image_url,
        merchant_id: adminData.id,
        is_available: editingItem.is_active ?? true
      };
      let res;
      if (editingItem.id) res = await supabase.from('products_delivery').update(productData).eq('id', editingItem.id);
      else res = await supabase.from('products_delivery').insert([productData]);
      if (res.error) throw res.error;
      toastSuccess(editingItem.id ? 'Produto atualizado!' : 'Produto criado!');
      setEditingItem(null); setEditType(null); fetchProducts();
      logAction(editingItem.id ? 'Update Product' : 'Create Product', 'Products', productData);
    } catch (err: any) {
      toastError('Erro: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMenuCategory = async (cat: any) => {
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session?.user?.email)
        .single();
      
      if (!adminData) return;

      const payload = {
        id: cat.id || crypto.randomUUID(),
        name: cat.name,
        merchant_id: adminData.id,
        sort_order: cat.sort_order || 0,
        is_active: cat.is_active ?? true,
        parent_id: cat.parent_id ?? null
      };

      const { error } = cat.id 
        ? await supabase.from('merchant_categories_delivery').update(payload).eq('id', cat.id)
        : await supabase.from('merchant_categories_delivery').insert([payload]);

      if (error) throw error;
      fetchMenuCategories();
    } catch (err: any) {
      console.error('Menu category update error:', err);
      toastError('Erro ao criar categoria: ' + err.message);
    }
  };

   const handleDeleteMenuCategory = async (id: string, name: string) => {
     if (!id || id === 'undefined') return;
     if (!await showConfirm({ message: `Excluir a categoria "${name || 'selecionada'}"? Todos os produtos vinculados ficarão sem categoria.` })) return;
     try {
       // 1. Update products to clear category
       if (name) {
         await supabase.from('products_delivery').update({ category: '' }).eq('category', name);
       }
       
       // 2. Delete category
       const { error } = await supabase.from('merchant_categories_delivery').delete().eq('id', id);
       if (error) throw error;
       
       fetchMenuCategories();
       if (name && selectedMenuCategory === name) setSelectedMenuCategory('all');
     } catch (err) {
       console.error('Delete menu category error:', err);
     }
   };



  const handleDeleteProduct = async (id: string, name: string) => {
    if (!await showConfirm({ message: `Tem certeza que deseja excluir o produto "${name}"?` })) return;
    try {
      const { error } = await supabase.from('products_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
      setEditingItem(null);
      setEditType(null);
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const handleCreateNewProduct = async () => {
    try {
      const { data: adminData } = await supabase.from('admin_users').select('id').eq('email', session?.user?.email).single();
      if (!adminData) return;

      const newProduct = {
          name: 'Novo Produto',
          description: '',
          price: 0,
          category: menuCategoriesList[0]?.name || '',
          merchant_id: adminData.id,
          is_available: false
      };

      const { error } = await supabase.from('products_delivery').insert([newProduct]).select().single();
      if (error) throw error;

      fetchProducts();
    } catch (err) {
      console.error('Create product error:', err);
    }
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const data = {
        title: editingItem.title,
        discount_text: editingItem.discount_text,
        discount_value: parseFloat(editingItem.discount_value),
        coupon_code: editingItem.coupon_code,
        is_active: editingItem.is_active,
        expires_at: editingItem.expires_at,
        max_usage: parseInt(editingItem.max_usage),
        banner_url: editingItem.banner_url
      };

      let error;
      if (editingItem.id) {
        ({ error } = await supabase.from('promotions_delivery').update(data).eq('id', editingItem.id));
      } else {
        ({ error } = await supabase.from('promotions_delivery').insert([data]));
      }

      if (error) toastError(error.message);
      else {
        toast(editingItem.id ? 'Promoção atualizada!' : 'Promoção criada!');
        fetchPromotions();
        logAction(editingItem.id ? 'Update Promotion' : 'Create Promotion', 'Promotions', editingItem);
        setEditingItem(null);
        setEditType(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('admin_users').upsert({
        id: editingItem.id || undefined,
        email: editingItem.email,
        store_name: editingItem.store_name,
        role: 'merchant',
        is_active: editingItem.is_active ?? (editingItem.status === 'active' ? true : false),
        status: editingItem.status || 'active',
        store_type: editingItem.store_type || 'restaurant',
        store_phone: editingItem.store_phone,
        store_description: editingItem.store_description,
        store_logo: editingItem.store_logo,
        store_banner: editingItem.store_banner,
        commission_percent: editingItem.commission_percent || appSettings.appCommission,
        service_fee: editingItem.service_fee || appSettings.serviceFee,
        store_address: editingItem.store_address,
        document: editingItem.document,
        password: editingItem.password,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      
      try {
        if (editingItem.email && editingItem.password) {
          const callerEmail = session?.user?.email || '';
          const { data, error: fnError } = await supabase.functions.invoke('manage-merchant-auth', {
            body: {
              targetEmail: editingItem.email,
              targetPassword: editingItem.password,
              name: editingItem.store_name || 'Lojista',
              callerEmail: callerEmail,
            }
          });
          if (fnError || (data && data.success === false)) {
            const errMessage = fnError ? fnError.message : data.error;
            toastError('Lojista salvo em tabela, mas erro no login: ' + errMessage);
          }
        }
      } catch (e) {
        console.error('Falha de sincronização Edge Function', e);
      }

      setEditingItem(null);
      setEditType(null);
      fetchMerchants();
      logAction(editingItem.id ? 'Update Merchant' : 'Create Merchant', 'Merchants', editingItem);
    } catch (err) {
      console.error('Update merchant error:', err);
      toastError('Erro ao salvar lojista: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMerchantStatus = async (id: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          status: newStatus,
          is_active: newStatus === 'active' 
        })
        .eq('id', id);
      if (error) throw error;
      fetchMerchants();
      logAction(`Merchant Status: ${newStatus}`, 'Merchants', { id });
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleDeleteMerchant = async (id: string) => {
    if (!await showConfirm({ message: 'Deseja realmente EXCLUIR este lojista permanentemente?' })) return;
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw error;
      fetchMerchants();
      logAction('Delete Merchant', 'Merchants', { id });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleUpdateDriverStatus = async (id: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('drivers_delivery')
        .update({ 
          status: newStatus,
          is_active: newStatus === 'active' 
        })
        .eq('id', id);
      if (error) throw error;
      fetchDrivers();
      logAction(`Driver Status: ${newStatus}`, 'Drivers', { id });
    } catch (err) {
      console.error('Update driver status error:', err);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!await showConfirm({ message: 'Deseja realmente EXCLUIR este entregador permanentemente?' })) return;
    try {
      await supabase.from('orders_delivery').update({ driver_id: null }).eq('driver_id', id); const { error } = await supabase.from('drivers_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchDrivers();
      logAction('Delete Driver', 'Drivers', { id });
    } catch (err) {
      console.error('Delete driver error:', err);
    }
  };

  const handleExportDrivers = () => {
    if (filteredDrivers.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }
    
    // Preparar cabeçalhos em português
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Status', 'Veículo', 'Placa', 'Avaliação', 'Online', 'Data de Cadastro'];
    const csvContent = [
      headers.join(','),
      ...filteredDrivers.map(d => [
        d.id,
        `"${d.name}"`,
        d.email || '',
        d.phone || '',
        d.status === 'active' ? 'Ativo' : d.status === 'suspended' ? 'Suspenso' : 'Inativo',
        d.vehicle_type || 'Moto',
        d.license_plate || '',
        d.rating || '5.0',
        d.is_online ? 'Sim' : 'Não',
        new Date(d.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `izi_entregadores_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAction('Export Drivers', 'Drivers', { count: filteredDrivers.length });
  };

  const handleUpdateUserStatus = async (id: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('users_delivery')
        .update({ 
          status: newStatus,
          is_active: newStatus === 'active' 
        })
        .eq('id', id);
      if (error) throw error;
      fetchUsers();
      logAction(`User Status: ${newStatus}`, 'Users', { id });
    } catch (err) {
      console.error('Update user status error:', err);
    }
  };
  const handleApplyCredit = async (userId: string, amount: number, description: string = 'Crédito administrativo') => {
    if (amount <= 0) return toast('O valor deve ser positivo.');
    
    try {
      setIsSaving(true);
      // 1. Get current balance
      const { data: user, error: userErr } = await supabase
        .from('users_delivery')
        .select('wallet_balance')
        .eq('id', userId)
        .single();
      
      if (userErr) throw userErr;

      const newBalance = (Number(user.wallet_balance) || 0) + amount;

      // 2. Update balance
      const { error: updateErr } = await supabase
        .from('users_delivery')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);
      
      if (updateErr) throw updateErr;

      // 3. Log transaction
      const { error: txErr } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: userId,
          type: 'deposito',
          amount: amount,
          description: description
        }]);
      
      if (txErr) throw txErr;

      toastSuccess('Crédito aplicado com sucesso!');
      fetchUsers();
      logAction('Apply Credit', 'Wallet', { userId, amount, description });
      
      // Update selectedUser if open
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, wallet_balance: newBalance });
      }
    } catch (err: any) {
      console.error('Apply credit error:', err);
      toastError('Erro ao aplicar crédito: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!await showConfirm({ message: 'Deseja realmente EXCLUIR este cliente permanentemente?' })) return;
    try {
      const { error } = await supabase.from('users_delivery').delete().eq('id', id);
      if (error) throw error;
      fetchUsers();
      logAction('Delete User', 'Users', { id });
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users_delivery')
        .update({ 
          is_active: !currentStatus,
          status: !currentStatus ? 'active' : 'inactive' 
        })
        .eq('id', id);
      
      if (error) throw error;
      
      fetchUsers();
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser({ ...selectedUser, is_active: !currentStatus, status: !currentStatus ? 'active' : 'inactive' });
      }
      logAction(currentStatus ? 'Block User' : 'Activate User', 'Users', { id });
    } catch (err: any) {
      toastError('Erro ao alterar status: ' + err.message);
    }
  };

  const handleUpdateDedicatedSlot = async (slot: any) => {
    try {
      let merchantId = merchantProfile?.merchant_id;
      
      if (!merchantId) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', session?.user?.email)
          .single();
        merchantId = adminData?.id;
      }
      
      if (!merchantId) {
        toastError('Erro: Perfil de lojista não encontrado.');
        return;
      }

      const payload = {
        id: slot.id || crypto.randomUUID(),
        merchant_id: merchantId,
        title: slot.title || 'Nova Vaga',
        description: slot.description || '',
        fee_per_day: slot.fee_per_day || 0,
        working_hours: slot.working_hours || '',
        is_active: slot.is_active ?? true
      };

      const { error } = slot.id && myDedicatedSlots.some(s => s.id === slot.id)
        ? await supabase.from('dedicated_slots_delivery').update(payload).eq('id', slot.id)
        : await supabase.from('dedicated_slots_delivery').insert([payload]);

      if (error) throw error;
      
      toastSuccess('Vaga salva com sucesso!');
      setEditingSlotId(null);
      fetchMyDedicatedSlots();
    } catch (err: any) {
      toastError('Erro ao salvar vaga: ' + err.message);
    }
  };

  const handleCreateDedicatedSlot = () => {
    const newId = crypto.randomUUID();
    setEditingSlotId(newId);
    setMyDedicatedSlots(prev => [{
      id: newId,
      title: '',
      description: '',
      fee_per_day: 0,
      working_hours: '',
      is_active: true,
      _isNew: true
    }, ...prev]);
  };

  const handleDeleteDedicatedSlot = async (slotId: string) => {
    if (!await showConfirm({ message: 'Deseja excluir esta vaga?' })) return;
    try {
      const { error } = await supabase
        .from('dedicated_slots_delivery')
        .delete()
        .eq('id', slotId);
      if (error) throw error;
      setMyDedicatedSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err: any) {
      toastError('Erro ao excluir vaga: ' + err.message);
    }
  };

  const handleNotifyUser = async (userId: string) => {
    const message = await showPrompt('Digite a mensagem da notificação para o cliente:');
    if (!message) return;

    try {
      setIsSaving(true);
      logAction('Notify User', 'Notifications', { userId, message });

      const { error: notifyErr } = await supabase
        .from('notifications_delivery')
        .insert([{
          user_id: userId,
          title: 'Mensagem do Administrador',
          message: message,
          read: false,
          created_at: new Date()
        }]);

      if (notifyErr && notifyErr.code === '42P01') {
        // Tabela não existe ainda — apenas o log foi salvo
        toastWarning('Notificação registrada no log. Crie a tabela notifications_delivery para envio real.');
      } else if (notifyErr) {
        throw notifyErr;
      } else {
        toastSuccess('Notificação enviada ao cliente com sucesso!');
      }
    } catch (err: any) {
      toastError('Erro ao enviar notificação: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!await showConfirm({
      title: 'Resetar senha do cliente',
      message: 'Um e-mail de redefinição de senha será enviado para o cliente. Deseja continuar?',
      confirmLabel: 'Enviar e-mail',
    })) return;

    try {
      setIsSaving(true);

      // Buscar e-mail do usuário
      const targetUser = usersList.find(u => u.id === userId) || selectedUser;
      const targetEmail = targetUser?.email || targetUser?.phone;

      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { userId, userEmail: targetEmail ?? undefined },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toastSuccess('E-mail de redefinição enviado com sucesso!');
      logAction('Password Reset Sent', 'Auth', { userId, targetEmail });
    } catch (err: any) {
      // Se a Edge Function ainda não foi deployada, avisa o admin
      if (err.message?.includes('not found') || err.message?.includes('FunctionNotFound')) {
        toastWarning('Edge Function não deployada ainda. Siga as instruções em supabase/functions/reset-password/README.md');
      } else {
        toastError('Erro ao enviar reset: ' + err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    setIsCompletingOrder(orderId);
    try {
      const { error } = await supabase
        .from('orders_delivery')
        .update({ status: 'concluido' })
        .eq('id', orderId);

      if (error) throw error;
      fetchAllOrders(userRole === 'merchant' ? merchantOrdersPage : ordersPage);
      toastSuccess('Pedido finalizado como entregue!');
    } catch (err: any) {
      toastError('Erro ao finalizar pedido: ' + err.message);
    } finally {
      setIsCompletingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!await showConfirm({ message: 'Deseja realmente excluir este pedido permanentemente? Esta ação não pode ser desfeita.' })) return;
    
    setIsLoadingList(true);
    try {
      // 0. Deletar mensagens do chat relacionadas para evitar erro de FK (ForeignKey Constraint)
      await supabase.from('order_messages').delete().eq('order_id', orderId);

      // 1. Deletar o pedido propriamente dito
      const { error } = await supabase
        .from('orders_delivery')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      toastSuccess('Registro excluído com sucesso!');
      
      // 2. Atualizar as listas necessárias
      if (activeTab === 'izi_black') {
        fetchSubscriptionOrders(subscriptionOrdersPage);
      } else {
        fetchAllOrders(userRole === 'merchant' ? merchantOrdersPage : ordersPage);
      }
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      toastError('Erro ao excluir: ' + (err.message || 'Erro inesperado'));
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleConfirmSubscriptionPayment = async (order: Order) => {
    if (!await showConfirm({ message: `Confirmar pagamento manual da assinatura para ${order.user_name}?` })) return;
    
    setIsSaving(true);
    try {
      // 1. Atualizar pedido para concluído
      const { error: orderErr } = await supabase
        .from('orders_delivery')
        .update({ status: 'concluido' })
        .eq('id', order.id);

      if (orderErr) throw orderErr;

      // 2. Ativar Izi Black para o usuário
      if (order.user_id) {
        const { error: userErr } = await supabase
          .from('users_delivery')
          .update({ is_izi_black: true })
          .eq('id', order.user_id);
        
        if (userErr) throw userErr;
      }

      toastSuccess('Pagamento confirmado e VIP ativado!');
      fetchSubscriptionOrders(subscriptionOrdersPage);
      fetchUsers(); // Atualizar lista de usuários para refletir novo VIP
    } catch (err: any) {
      toastError('Erro ao confirmar pagamento: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

// â â Â Dashboard Real-Time Calculations â â Â
  const dashboardData = useMemo(() => {
    if (!allOrders || allOrders.length === 0) return {
      dailyRevenue: [0, 0, 0, 0, 0, 0, 0],
      dayLabels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      categories: [] as any[],
      topMerchants: [] as any[],
      avgTicket: 0,
      totalCommission: 0,
      deliverySuccessRate: 0,
      revenuePath: "M0,120 L400,120"
    };

    // 1. Daily Revenue (Last 7 Days)
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return {
        dateStr: d.toISOString().split('T')[0],
        dayLabel: days[d.getDay()]
      };
    });

    const revenueByDay = last7Days.map(day => {
      const dayTotal = allOrders
        .filter(o => o.created_at.startsWith(day.dateStr) && o.status === 'concluido')
        .reduce((sum, o) => sum + (o.total_price || 0), 0);
      return dayTotal;
    });

    // Generate SVG path for revenue
    const maxRev = Math.max(...revenueByDay, 1);
    const points = revenueByDay.map((rev, i) => {
      const x = (i / 6) * 400;
      const y = 140 - (rev / maxRev) * 120; // 140 is bottom, 20 is top margin
      return `${x},${y}`;
    });
    const revenuePath = `M${points.join(' L')}`;

    // 2. Categories breakdown
    const categoryStats = allOrders.reduce((acc: Record<string, { count: number; revenue: number }>, o) => {
      const type = o.service_type || 'delivery';
      if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
      acc[type].count++;
      if (o.status === 'concluido') {
        acc[type].revenue += (o.total_amount || o.total_price || 0);
      }
      return acc;
    }, {});
    
// Mapeamento dinâmico baseado nas categorias reais e service_type
    const categoriesBreakdown = Object.entries(categoryStats).map(([type, stats]: [string, any]) => {
      // Tenta encontrar o nome amigável na lista de categorias do estado
      const categoryInfo = categoriesState.find(c => c.id === type || c.name.toLowerCase() === type.toLowerCase());
      return {
        label: categoryInfo?.name || type.charAt(0).toUpperCase() + type.slice(1),
        val: stats.count,
        revenue: stats.revenue,
        percent: (Number(stats.count) / (allOrders.length || 1)) * 100
      };
    }).sort((a, b) => b.val - a.val);

    const totalOrdersToday = allOrders.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      return orderDate === todayStr;
    }).length;

    // 3. Top Merchants
    const merchantPerformance = allOrders.reduce((acc: Record<string, { id: string; name: string; orders: number; revenue: number }>, o) => {
      if (o.merchant_id) {
        if (!acc[o.merchant_id]) acc[o.merchant_id] = { id: o.merchant_id, name: o.merchant_name || 'Lojista', orders: 0, revenue: 0 };
        acc[o.merchant_id].orders++;
        if (o.status === 'concluido') acc[o.merchant_id].revenue += (o.total_price || 0);
      }
      return acc;
    }, {});

    const topMerchants: { id: string; name: string; orders: number; revenue: number }[] = Object.values(merchantPerformance)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Global KPIs
    const completedOrders = allOrders.filter(o => o.status === 'concluido');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const avgTicket = totalRevenue / (completedOrders.length || 1);
    const totalCommission = totalRevenue * (appSettings.appCommission / 100);
    const deliverySuccessRate = (completedOrders.length / (allOrders.filter(o => o.status !== 'cancelado').length || 1)) * 100;

    // 5. 30-Day Revenue Trend (for Financial Tab)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    const revenue30Days = last30Days.map(dateStr => {
      return allOrders
        .filter(o => o.created_at.startsWith(dateStr) && o.status === 'concluido')
        .reduce((sum, o) => sum + (o.total_price || 0), 0);
    });

    const totalOrders = allOrders.length;
    const canceledOrders = allOrders.filter(o => o.status === 'cancelado').length;
    const netProfit = totalCommission; // Simplification: platform profit is commission

    return {
      dailyRevenue: revenueByDay,
      dayLabels: last7Days.map(d => d.dayLabel),
      categories: categoriesBreakdown,
      topMerchants,
      avgTicket,
      totalCommission,
      deliverySuccessRate,
      revenuePath,
      revenue30Days,
      totalRevenue,
      totalOrders,
      canceledOrders,
      netProfit,
      completedOrdersCount: completedOrders.length,
      totalOrdersToday
    };
  }, [allOrders, appSettings.appCommission, categoriesState]);

  const renderDevicePreview = (targetItem: Merchant | MerchantProfile | null, targetProducts: Product[], targetCategories: any[]) => (
    <div className="hidden lg:flex w-[400px] bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col items-center justify-center p-10 select-none">
      <div className="relative w-full max-w-[320px] aspect-[9/19] bg-white dark:bg-slate-900 rounded-[50px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-900 dark:border-slate-800 overflow-hidden">
        {/* Status Bar */}
        <div className="absolute top-0 w-full h-8 flex items-center justify-between px-8 z-20">
          <span className="text-[10px] font-black dark:text-white">9:41</span>
          <div className="flex gap-1.5">
            <span className="material-symbols-outlined text-xs dark:text-white">signal_cellular_4_bar</span>
            <span className="material-symbols-outlined text-xs dark:text-white">wifi</span>
            <span className="material-symbols-outlined text-xs dark:text-white">battery_full</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pt-4">
          {/* Banner */}
          <div className="relative h-40 bg-slate-200 dark:bg-slate-800">
            <img 
              src={targetItem?.store_banner || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000'} 
              className="w-full h-full object-cover"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <div className="size-14 rounded-2xl bg-white p-0.5 shadow-lg border-2 border-white overflow-hidden">
                <img className="w-full h-full object-cover rounded-[14px]" src={targetItem?.store_logo || 'https://via.placeholder.com/150'} />
              </div>
              <div className="text-white">
                <h4 className="text-sm font-black truncate max-w-[150px]">{targetItem?.store_name || 'Minha Loja'}</h4>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] fill-1 text-primary">star</span>
                  <span className="text-[10px] font-black">4.9 • 30-40 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
               {targetItem?.store_description || 'Bem-vindo ao nosso estabelecimento! Qualidade e sabor em cada pedido.'}
             </p>
          </div>

          <div className="flex gap-3 px-6 pb-4 overflow-x-auto scrollbar-hide">
             {targetCategories && targetCategories.filter(c => !c.parent_id).length > 0 ? (
               targetCategories.filter(c => !c.parent_id).map((cat, i) => (
                 <span key={cat.id} className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                   {cat.name}
                 </span>
               ))
             ) : (
                ['Destaques', 'Combos', 'Bebidas'].map((c, i) => (
                  <span key={i} className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {c}
                  </span>
                ))
             )}
          </div>

          <div className="px-6 space-y-3 pb-20">
            {(targetProducts && targetProducts.length > 0 ? targetProducts : [1,2,3]).map((p: any, i: number) => (
              <div key={p.id || i} className="flex gap-4 bg-white dark:bg-slate-800 p-3 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="size-20 rounded-[18px] bg-slate-50 dark:bg-slate-900 shrink-0 overflow-hidden">
                  <img src={p.image_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h5 className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name || `Produto Exemplo ${i+1}`}</h5>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{p.description || 'Descrição deliciosa...'}</p>
                  <div className="flex justify-between items-end mt-2">
                     <span className="text-xs font-black text-primary">R$ {p.price || '0,00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 dark:bg-slate-800 rounded-b-[20px] z-30"></div>
      </div>
    </div>
  );

  const renderStudioPanel = (targetItem: Merchant | MerchantProfile, updateItem: (updatedItem: Merchant | MerchantProfile) => void) => (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden min-h-0">
      <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex gap-6 overflow-x-auto scrollbar-hide">
        {[
          { id: 'info', label: 'Estande & Geral', icon: 'style' },
          { id: 'sales', label: 'Vendas & Performance', icon: 'monitoring' },
          { id: 'products', label: 'Cardápio Digital', icon: 'restaurant_menu' },
          { id: 'categories', label: 'Categorias', icon: 'grid_view' },
          { id: 'dedicated_slots', label: 'Vagas Dedicadas', icon: 'stars' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActivePreviewTab(t.id as any)}
            className={`flex items-center gap-3 py-4 px-2 border-b-2 transition-all whitespace-nowrap group ${activePreviewTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <span className={`material-symbols-outlined text-xl ${activePreviewTab === t.id ? 'font-fill text-primary' : 'group-hover:scale-110 transition-transform'}`}>{t.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8F9FA]/50 dark:bg-slate-950/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePreviewTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto w-full"
          >
            {activePreviewTab === 'info' && (
              <div className="space-y-12 pb-20">
                <section className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl font-bold">domain</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Identidade Visual</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Como sua marca aparece no aplicativo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Banner do Estabelecimento</label>
                      <div className="relative aspect-video rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-800 group border-4 border-white dark:border-slate-800 shadow-xl">
                        <img src={targetItem.store_banner || 'https://via.placeholder.com/800x400'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Alterar Banner</button>
                        </div>
                        <input 
                          type="file" accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const url = await handleFileUpload(file, 'banners');
                               if (url) updateItem({...targetItem, store_banner: url});
                             }
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Logotipo</label>
                      <div className="relative size-44 rounded-[40px] overflow-hidden bg-slate-100 dark:bg-slate-800 group border-4 border-white dark:border-slate-800 shadow-xl">
                        <img src={targetItem.store_logo || 'https://via.placeholder.com/200'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">photo_camera</span>
                        </div>
                        <input 
                          type="file" accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const url = await handleFileUpload(file, 'logos');
                               if (url) updateItem({...targetItem, store_logo: url});
                             }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome da Loja</label>
                      <input 
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                        value={targetItem.store_name || ''}
                        onChange={e => updateItem({...targetItem, store_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone Público</label>
                       <input 
                         className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm"
                         value={targetItem.store_phone || ''}
                         onChange={e => updateItem({...targetItem, store_phone: e.target.value})}
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição curta</label>
                       <textarea 
                         rows={2}
                         className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-6 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white shadow-sm resize-none"
                         value={targetItem.store_description || ''}
                         onChange={e => updateItem({...targetItem, store_description: e.target.value})}
                       />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activePreviewTab === 'sales' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Vendas Hoje', val: 'R$ 0,00', icon: 'payments', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                    { label: 'Pedidos Ativos', val: '0', icon: 'receipt_long', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                    { label: 'Avaliação Média', val: '4.9', icon: 'star', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                  ].map(s => (
                    <div key={s.label} className={`${s.bg} p-8 rounded-[40px] border border-white/10`}>
                      <span className={`material-symbols-outlined ${s.color} text-3xl mb-4`}>{s.icon}</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePreviewTab === 'products' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-3xl">restaurant_menu</span>
                          Cardápio & Produtos
                       </h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie os itens da sua loja organizados por categorias</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                         className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                         onClick={userRole === 'merchant' ? handleCreateNewProduct : () => {
                            const newP = { id: `new-${Date.now()}`, name: 'Novo Produto', price: '0.00', description: '', image_url: '', category: '', is_active: true, featured: false };
                            setPreviewProducts([newP, ...previewProducts]);
                         }}
                       >
                          <span className="material-symbols-outlined text-lg">add_circle</span>
                          Novo Produto
                       </button>
                    </div>
                 </div>

                 <div className="space-y-12">
                   {(() => {
                      const currentProducts = userRole === 'merchant' ? productsList : previewProducts;
                      const grouped: Record<string, any[]> = {};
                      currentProducts.forEach(p => {
                        const cat = p.category || 'Sem Categoria';
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(p);
                      });

                      const catNames = Object.keys(grouped).sort((a, b) => {
                        if (a === 'Sem Categoria') return 1;
                        if (b === 'Sem Categoria') return -1;
                        return a.localeCompare(b);
                      });

                      if (catNames.length === 0) {
                        return (
                          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                             <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory</span>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum produto cadastrado</p>
                          </div>
                        );
                      }

                      return catNames.map(catName => (
                        <div key={catName} className="space-y-6">
                           <div className="flex items-center gap-4 px-2">
                              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{catName}</h4>
                              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 opacity-50"></div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {grouped[catName].map((p: any) => (
                                <div 
                                  key={p.id} 
                                  className="bg-white dark:bg-slate-800 p-4 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4 items-center group hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
                                  onClick={() => {
                                    if (userRole === 'merchant') {
                                       setEditingItem(p);
                                       setEditType('my_product');
                                    }
                                  }}
                                >
                                  {p.featured && (
                                    <div className="absolute -top-1 -right-1">
                                      <div className="bg-amber-400 text-amber-900 text-[8px] font-black px-3 py-1 scale-75 rounded-bl-xl uppercase tracking-tighter">Destaque</div>
                                    </div>
                                  )}
                                  <div className="size-20 rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                                    <img src={p.image_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt={p.name} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">{p.subcategory || p.category}</span>
                                      <div className={`flex items-center gap-1.5`}>
                                        <span className={`size-1.5 rounded-full ${p.is_available ?? p.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{(p.is_available ?? p.is_active) ? 'Ativo' : 'Indisp.'}</span>
                                      </div>
                                    </div>
                                    <h5 className="text-sm font-black text-slate-900 dark:text-white truncate">{p.name || 'Novo Produto'}</h5>
                                    <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{p.description || 'Sem descrição'}</p>
                                    <div className="flex justify-between items-end mt-2">
                                       <span className="text-xs font-black text-primary">R$ {parseFloat((p.price || 0).toString()).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                  </div>
                                  <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-primary transition-all group-hover:bg-primary/10">
                                    <span className="material-symbols-outlined text-lg">edit_square</span>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ));
                   })()}
                 </div>
              </div>
            )}

            {activePreviewTab === 'categories' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">category</span>
                      Categorias & Seções
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Organize seu cardápio em seções principais e subcategorias</p>
                  </div>
                  <button 
                    onClick={() => {
                      const list = userRole === 'merchant' ? menuCategoriesList : previewCategories;
                      const updateFn = userRole === 'merchant' ? handleUpdateMenuCategory : (newCat: any) => setPreviewCategories([...previewCategories, { ...newCat, id: `new-${Date.now()}` }]);
                      updateFn({ name: 'Nova Categoria', sort_order: list.length, is_active: true, parent_id: null });
                    }}
                    className="bg-primary text-slate-900 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Nova Categoria
                  </button>
                </div>

                <div className="space-y-6">
                  {(userRole === 'merchant' ? menuCategoriesList : previewCategories).filter(c => !c.parent_id).map((cat, i) => (
                    <div key={cat.id || i} className="bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden group">
                       <div className="p-6 md:p-8 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex items-center gap-6 flex-1">
                             <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700">
                               <span className="material-symbols-outlined text-2xl">folder</span>
                             </div>
                             <div className="flex-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome da Categoria</label>
                                <input 
                                   className="bg-transparent font-black text-lg text-slate-900 dark:text-white focus:outline-none w-full border-b border-transparent focus:border-primary/30 transition-all pb-1"
                                   defaultValue={cat.name}
                                   onBlur={(e) => {
                                     if (e.target.value !== cat.name) {
                                       const updateFn = userRole === 'merchant' ? handleUpdateMenuCategory : (updated: any) => {
                                          const idx = previewCategories.findIndex(i => i.id === cat.id);
                                          const up = [...previewCategories];
                                          up[idx] = updated;
                                          setPreviewCategories(up);
                                       };
                                       updateFn({ ...cat, name: e.target.value });
                                     }
                                   }}
                                />
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <button 
                                onClick={() => {
                                   const updateFn = userRole === 'merchant' ? handleUpdateMenuCategory : (newSub: any) => setPreviewCategories([...previewCategories, { ...newSub, id: `new-sub-${Date.now()}` }]);
                                   updateFn({ name: 'Nova Subcategoria', is_active: true, parent_id: cat.id, sort_order: 0 });
                                }}
                                className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 text-[9px] font-black uppercase text-slate-500 hover:text-primary transition-all border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-2"
                             >
                               <span className="material-symbols-outlined text-sm">add_box</span>
                               Subcategoria
                             </button>
                             <button 
                                onClick={async () => {
                                   if (await showConfirm({ message: `Excluir categoria "${cat.name}" e todas as suas subcategorias?` })) {
                                      const delFn = userRole === 'merchant' ? handleDeleteMenuCategory : (id: string) => setPreviewCategories(previewCategories.filter(item => item.id !== id && item.parent_id !== id));
                                      delFn(cat.id, cat.name);
                                   }
                                }}
                                className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                             >
                               <span className="material-symbols-outlined">delete</span>
                             </button>
                          </div>
                       </div>
                       
                       {/* Subcategories */}
                       <div className="p-6 md:p-8 bg-white dark:bg-slate-900/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {(userRole === 'merchant' ? menuCategoriesList : previewCategories).filter(s => s.parent_id === cat.id).map(sub => (
                                <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 group/sub hover:border-primary/50 transition-all">
                                   <div className="flex items-center gap-3 flex-1">
                                      <span className="material-symbols-outlined text-slate-300 text-sm">subdirectory_arrow_right</span>
                                      <div className="flex-1">
                                        <input 
                                           className="bg-transparent font-bold text-sm text-slate-600 dark:text-slate-400 focus:outline-none w-full"
                                           defaultValue={sub.name}
                                           onBlur={(e) => {
                                              if (e.target.value !== sub.name) {
                                                 const updateFn = userRole === 'merchant' ? handleUpdateMenuCategory : (updated: any) => {
                                                    const idx = previewCategories.findIndex(i => i.id === sub.id);
                                                    const up = [...previewCategories];
                                                    up[idx] = updated;
                                                    setPreviewCategories(up);
                                                 };
                                                 updateFn({ ...sub, name: e.target.value });
                                              }
                                           }}
                                        />
                                      </div>
                                   </div>
                                   <button 
                                      onClick={async () => {
                                         if (await showConfirm({ message: `Excluir subcategoria "${sub.name}"?` })) {
                                            const delFn = userRole === 'merchant' ? handleDeleteMenuCategory : (id: string) => setPreviewCategories(previewCategories.filter(item => item.id !== id));
                                            delFn(sub.id, sub.name);
                                         }
                                      }}
                                      className="size-8 rounded-xl bg-rose-50 dark:bg-rose-500/5 text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover/sub:opacity-100"
                                   >
                                      <span className="material-symbols-outlined text-base">close</span>
                                   </button>
                                </div>
                             ))}
                             {(userRole === 'merchant' ? menuCategoriesList : previewCategories).filter(s => s.parent_id === cat.id).length === 0 && (
                                <div className="col-span-full py-4 text-center">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Nenhuma subcategoria definida</p>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
                  {(userRole === 'merchant' ? menuCategoriesList : previewCategories).filter(c => !c.parent_id).length === 0 && (
                     <div className="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">category</span>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma categoria ativa</p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {activePreviewTab === 'dedicated_slots' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">stars</span>
                      Vagas Dedicadas (Exclusivas)
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contrate motoboys exclusivos para o seu estabelecimento</p>
                  </div>
                  <button 
                    onClick={handleCreateDedicatedSlot}
                    className="bg-primary text-slate-900 px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Criar Nova Vaga
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {myDedicatedSlots.map((slot, i) => {
                    const isEditing = editingSlotId === slot.id;
                    return (
                        <div key={slot.id || i} className={`bg-white dark:bg-slate-800 rounded-[48px] border ${isEditing ? 'border-primary shadow-[0_0_40px_rgba(255,217,0,0.1)]' : 'border-slate-100 dark:border-slate-800'} shadow-2xl overflow-hidden group flex flex-col transition-all duration-500`}>
                           <div className="p-8 pb-4 flex-1">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="flex-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título da Vaga / Cargo</label>
                                    {isEditing ? (
                                       <input 
                                          className="bg-transparent font-black text-xl text-slate-900 dark:text-white focus:outline-none w-full border-b border-white/10 focus:border-primary transition-all pb-1"
                                          defaultValue={slot.title}
                                          placeholder="Ex: Entregador Noturno"
                                          onChange={(e) => {
                                             slot._tempTitle = e.target.value;
                                          }}
                                          autoFocus
                                       />
                                    ) : (
                                       <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">{slot.title || 'Novo Entregador Dedicado'}</h3>
                                    )}
                                 </div>
                                 <div className="flex gap-2">
                                  {!isEditing && (
                                    <button 
                                      onClick={() => setEditingSlotId(slot.id)}
                                      className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                                      title="Editar esta vaga"
                                    >
                                      <span className="material-symbols-outlined">edit</span>
                                    </button>
                                   )}
                                   <button 
                                     onClick={() => handleDeleteDedicatedSlot(slot.id)}
                                     className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
                                     title="Excluir esta vaga"
                                   >
                                     <span className="material-symbols-outlined">delete</span>
                                   </button>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 gap-6 mb-6">
                                 <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border ${isEditing ? 'border-primary/10' : 'border-slate-100 dark:border-slate-800'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                       <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                          <span className="material-symbols-outlined text-xl">store</span>
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estabelecimento</h4>
                                          <p className="text-sm font-bold text-slate-900 dark:text-white">{merchantProfile?.store_name}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                       <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                          <span className="material-symbols-outlined text-xl">location_on</span>
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Coleta</h4>
                                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{merchantProfile?.store_address || 'Não informado'}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                          <span className="material-symbols-outlined text-xl">chat</span>
                                       </div>
                                       <div className="flex-1">
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp de Contato</h4>
                                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{merchantProfile?.store_phone || 'Não informado'}</p>
                                       </div>
                                    </div>
                                 </div>

                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Descrição e Requisitos</label>
                                    {isEditing ? (
                                      <textarea 
                                         className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none border border-slate-100 dark:border-slate-800 focus:border-primary/30 min-h-[120px]"
                                         defaultValue={slot.description}
                                         placeholder="Descreva as funções, benefícios e requisitos da vaga..."
                                         onChange={(e) => {
                                            slot._tempDesc = e.target.value;
                                         }}
                                      />
                                    ) : (
                                      <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 min-h-[120px]">
                                        {slot.description || 'Nenhuma descrição informada.'}
                                      </div>
                                    )}
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-6">
                                    <div>
                                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor Diária (R$)</label>
                                       {isEditing ? (
                                         <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                            <input 
                                               type="number"
                                               className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl py-4 pl-10 pr-4 text-xs font-black text-slate-900 dark:text-white focus:outline-none border border-slate-100 dark:border-slate-800 focus:border-primary/30"
                                               defaultValue={slot.fee_per_day}
                                               onChange={(e) => {
                                                  slot._tempFee = parseFloat(e.target.value);
                                               }}
                                            />
                                         </div>
                                       ) : (
                                         <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl py-4 px-6 text-xs font-black text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800">
                                            R$ {parseFloat(slot.fee_per_day || 0).toFixed(2).replace('.', ',')}
                                         </div>
                                       )}
                                    </div>
                                    <div>
                                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Horário de Trabalho</label>
                                       {isEditing ? (
                                         <input 
                                            type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 text-xs font-black text-slate-900 dark:text-white focus:outline-none border border-slate-100 dark:border-slate-800 focus:border-primary/30"
                                            defaultValue={slot.working_hours}
                                            placeholder="Ex: 18h às 23h"
                                            onChange={(e) => {
                                               slot._tempHours = e.target.value;
                                            }}
                                         />
                                       ) : (
                                          <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl py-4 px-6 text-xs font-black text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 italic uppercase">
                                            {slot.working_hours || 'Não informado'}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="bg-slate-50 dark:bg-slate-900/80 p-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                                <button
                                  onClick={() => handleUpdateDedicatedSlot({ 
                                    ...slot, 
                                    is_active: !slot.is_active 
                                  })}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${slot.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}
                                >
                                  <span className="material-symbols-outlined text-sm">{slot.is_active ? 'visibility' : 'visibility_off'}</span>
                                  {slot.is_active ? 'Ativa' : 'Pausada'}
                                </button>
                              </div>

                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (slot._isNew) {
                                        setMyDedicatedSlots(prev => prev.filter(s => s.id !== slot.id));
                                      }
                                      setEditingSlotId(null);
                                    }}
                                    className="bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updatedSlot = {
                                        ...slot,
                                        title: slot._tempTitle !== undefined ? slot._tempTitle : slot.title,
                                        description: slot._tempDesc !== undefined ? slot._tempDesc : slot.description,
                                        fee_per_day: slot._tempFee !== undefined ? slot._tempFee : slot.fee_per_day,
                                        working_hours: slot._tempHours !== undefined ? slot._tempHours : slot.working_hours
                                      };
                                      handleUpdateDedicatedSlot(updatedSlot);
                                    }}
                                    className="bg-primary text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                                  >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Salvar Alterações
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingSlotId(slot.id)}
                                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                  Editar Vaga
                                </button>
                              )}
                           </div>
                        </div>
                    );
                  })}
                  {myDedicatedSlots.length === 0 && (
                    <div className="col-span-2 py-20 text-center">
                       <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-800 block mb-4">stars</span>
                       <p className="text-sm font-black text-slate-400 italic">Nenhuma vaga dedicada ativa.</p>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Crie uma vaga para atrair entregadores exclusivos.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const SidebarItem = ({ icon, label, id }: { icon: string, label: string, id: Tab }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-semibold text-sm group ${activeTab === id
        ? 'bg-primary text-slate-900 shadow-soft'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
    >
      <span className={`material-symbols-outlined transition-transform ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );

  const contextValue = {
    // Auth
    session, userRole, merchantProfile, setMerchantProfile,
    // Navigation
    activeTab, setActiveTab,
    // Lists
    stats, recentOrders, usersList, driversList, allOrders, myDriversList,
    merchantsList, productsList, menuCategoriesList, categoriesState, setCategoriesState,
    promotionsList, auditLogsList, myDedicatedSlots, subscriptionOrders, dynamicRatesState,
    // Loading
    isLoadingList, isInitialLoading,
    // Pagination
    ordersPage, setOrdersPage, ordersTotalCount,
    merchantOrdersPage, setMerchantOrdersPage, merchantOrdersTotalCount,
    subscriptionOrdersPage, setSubscriptionOrdersPage, subscriptionOrdersTotalCount,
    driversPage, setDriversPage, filteredDrivers, paginatedDrivers,
    // Filters
    driverSearch, setDriverSearch, driverFilter, setDriverFilter,
    userStatusFilter, setUserStatusFilter,
    promoFilter, setPromoFilter, promoSearch, setPromoSearch,
    categoryGroupFilter, setCategoryGroupFilter,
    // Settings
    appSettings, setAppSettings, autoSaveStatus,
    // Selected items
    selectedUser, setSelectedUser,
    selectedMerchantPreview, setSelectedMerchantPreview,
    selectedDriverStudio, setSelectedDriverStudio,
    selectedUserStudio, setSelectedUserStudio,
    selectedCategoryStudio, setSelectedCategoryStudio,
    selectedZoneForMap, setSelectedZoneForMap,
    selectedTrackingItem, setSelectedTrackingItem,
    selectedMenuCategory, setSelectedMenuCategory,
    // Edit state
    editingItem, setEditingItem, editType, setEditType,
    editingSlotId, setEditingSlotId, isSaving, setIsSaving,
    // UI state
    activePreviewTab, setActivePreviewTab,
    activeStudioTab, setActiveStudioTab,
    trackingListTab, setTrackingListTab,
    showActiveOrdersModal, setShowActiveOrdersModal,
    showCategoryListModal, setShowCategoryListModal,
    showPromoForm, setShowPromoForm,
    promoFormType, setPromoFormType, promoForm, setPromoForm,
    promoSaving, promoSaveStatus,
    expandedLogId, setExpandedLogId,
    isCompletingOrder, setIsCompletingOrder,
    newOrderNotification, setNewOrderNotification,
    // Wallet
    walletTransactions, isWalletLoading,
    showAddCreditModal, setShowAddCreditModal,
    creditToAdd, setCreditToAdd, isAddingCredit,
    showWalletStatementModal, setShowWalletStatementModal,
    // Dynamic rates / map
    isAddingPeakRule, setIsAddingPeakRule,
    newPeakRule, setNewPeakRule, newZoneData, setNewZoneData,
    mapSearch, setMapSearch, isGeolocating, setIsGeolocating,
    mapCenterView, setMapCenterView, fixedGridCenter, setFixedGridCenter,
    selectedHexagons, setSelectedHexagons, hexGrid, getHexPath,
    // Preview
    previewProducts, setPreviewProducts,
    previewCategories, setPreviewCategories,
    // Computed
    dashboardData, mapsLoadError, isLoaded,
    // Fetch functions
    fetchStats, fetchUsers, fetchDrivers, fetchMyDrivers, fetchProducts,
    fetchMenuCategories, fetchAllOrders, fetchSubscriptionOrders,
    fetchCategories, fetchDynamicRates, fetchPromotions, fetchAuditLogs,
    fetchMerchants, fetchAppSettings, fetchMyDedicatedSlots, openMerchantPreview,
    // Handlers
    handleAddCredit, handleApplyCredit, handleUpdateDriver, handleUpdateCategory,
    handleUpdateMyDriver, handleDeleteMyDriver, handleUpdateUser, handleUpdateMyProduct,
    handleUpdateMenuCategory, handleDeleteProduct, handleCreateNewProduct,
    handleUpdatePromotion, handleUpdateMerchant, handleUpdateMerchantStatus,
    handleDeleteMerchant, handleUpdateDriverStatus, handleDeleteDriver,
    handleExportDrivers, handleUpdateUserStatus, handleDeleteUser,
    handleUpdateDedicatedSlot, handleCreateDedicatedSlot, handleDeleteDedicatedSlot,
    handleNotifyUser, handleResetPassword, handleCompleteOrder, handleDeleteOrder,
    handleConfirmSubscriptionPayment, handleAddPeakRule, handleRemovePeakRule,
    handleAddZone, handleRemoveZone, handleFileUpload, handleUpdateDispatchSettings,
    handleSeedCategories, renderDevicePreview, renderStudioPanel,
  } as any;

  return (
    <AdminContext.Provider value={contextValue}>
    <div className="min-h-[100dvh] w-full bg-[#F4F5F7] font-display overflow-hidden relative">
      {/* Session/Auth Screen */}
      {!session && (
        <div className="fixed inset-0 z-[100] bg-[#111] flex items-center justify-center p-6 overflow-hidden font-display">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 blur-[100px]">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-white rounded-full animate-pulse delay-1000"></div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">E-mail Administrativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@delivery.com"
                  className="w-full bg-white/5 border border-white/5 rounded-full px-8 py-5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-inner placeholder:text-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Senha de Acesso</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 rounded-full px-8 py-5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-inner placeholder:text-slate-700"
                />
              </div>
              {authError && <p className="text-red-500 text-xs font-bold text-center mt-4">⚠️ {authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-6 rounded-full shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all uppercase tracking-widest text-sm mt-8"
              >
                {authLoading ? 'Autenticando...' : 'Acessar Painel'}
              </button>
            </form>
            <p className="text-center text-[9px] font-bold text-slate-700 mt-10 uppercase tracking-[0.1em]">© 2026 Delivery de Tudo • Console Privada</p>
          </motion.div>
        </div>
      )}

      {/* Synchronizing Data Overlay */}
      {session && isInitialLoading && (
        <div className="fixed inset-0 z-[90] bg-[#F4F5F7] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Sistema...</p>
        </div>
      )}

      {session && !isInitialLoading && (
        <div className="flex h-screen overflow-hidden w-full">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex w-full overflow-hidden"
          >
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 z-20 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 px-2 py-4">
              <div className="bg-primary size-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-slate-900 font-bold">local_shipping</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-slate-900 dark:text-white text-base font-black leading-tight tracking-tight">Delivery de Tudo</h1>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Painel Admin</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
{/* â â Merchant Sidebar â Â */}
              {userRole === 'merchant' ? (
                <>
                  <SidebarItem id="my_store" icon="dashboard" label="Dashboard & Loja" />
                  <SidebarItem id="my_drivers" icon="delivery_dining" label="Motoboys Próprios" />
                  <SidebarItem id="orders" icon="shopping_cart" label="Meus Pedidos" />
                  <SidebarItem id="my_studio" icon="inventory_2" label="Estúdio do Lojista" />
                  <SidebarItem id="promotions" icon="percent" label="Minhas Promoções" />
                  <SidebarItem id="financial" icon="bar_chart" label="Meu Financeiro" />
                </>
              ) : (
                <>
{/* â â Admin Sidebar â Â */}
                  <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Principal</p>
                  <SidebarItem id="dashboard" icon="dashboard" label="Dashboard" />
                  <SidebarItem id="merchants" icon="storefront" label="Lojistas" />
                  <SidebarItem id="my_studio" icon="inventory_2" label="Estúdio do Lojista" />
                  <SidebarItem id="tracking" icon="map" label="Rastreamento" />
                  <SidebarItem id="orders" icon="shopping_cart" label="Pedidos" />
                  <SidebarItem id="drivers" icon="person_pin_circle" label="Entregadores" />
                  <SidebarItem id="users" icon="group" label="Clientes" />

                  <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-6">Operacional</p>
                  <SidebarItem id="categories" icon="layers" label="Categorias" />
                  <SidebarItem id="promotions" icon="percent" label="Promoções" />
                  <SidebarItem id="izi_black" icon="workspace_premium" label="Izi Black VIP" />
<SidebarItem id="dynamic_rates" icon="payments" label="Taxas Dinâmicas" />
                  <SidebarItem id="financial" icon="bar_chart" label="Financeiro" />
                  <SidebarItem id="support" icon="support_agent" label="Suporte" />
                  <SidebarItem id="audit_logs" icon="history_toggle_off" label="Logs do Sistema" />
                  <SidebarItem id="settings" icon="settings" label="Configurações" />
                </>
              )}
            </nav>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="size-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                {userRole === 'merchant' && merchantProfile?.store_logo ? (
                  <img alt="Store Logo" className="w-full h-full object-cover" src={merchantProfile.store_logo} />
                ) : (
                  <img alt="User Avatar" className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${userRole === 'merchant' ? (merchantProfile?.store_name || 'L') : 'ADM'}&background=${userRole === 'merchant' ? '10b981' : 'ffd900'}&color=fff&size=128&bold=true`} />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {userRole === 'merchant' ? (merchantProfile?.store_name || 'Lojista') : 'Admin Sistema'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block size-1.5 rounded-full ${userRole === 'admin' ? 'bg-primary' : 'bg-emerald-500'}`}></span>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${userRole === 'admin' ? 'text-primary' : 'text-emerald-500'}`}>
                    {userRole === 'admin' ? 'Gerente Geral' : 'Lojista'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sair do Sistema
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark relative">
          {/* Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {activeTab === 'dashboard' ? 'Visão Geral do Dashboard' :
                  activeTab === 'tracking' ? 'Rastreamento em Tempo Real' :
                    activeTab === 'orders' ? 'Gestão de Pedidos' :
                      activeTab === 'drivers' ? 'Gestão de Entregadores' :
                        activeTab === 'users' ? 'Gestão de Clientes' :
                          activeTab === 'categories' ? 'Gestão de Categorias' :
                            activeTab === 'promotions' ? 'Promoções e Banners' :
                              activeTab === 'izi_black' ? 'Membros Izi Black VIP' :
                                activeTab === 'dynamic_rates' ? 'Configurações de Taxas Dinâmicas' :
                                  activeTab === 'financial' ? 'Relatórios Financeiros' :
                                    activeTab === 'support' ? 'Central de Suporte' :
                                      activeTab === 'audit_logs' ? 'Logs de Auditoria' :
                                        activeTab === 'my_store' ? 'Meu Estabelecimento' :
                                          activeTab === 'my_drivers' ? 'Gestão de Motoboys Próprios' :
                                            activeTab === 'my_studio' ? 'Estúdio do Lojista' : 'Configurações do Sistema'}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {activeTab === 'dashboard' ? 'Bem-vindo de volta! Veja o que está acontecendo hoje.' : 
                  activeTab === 'izi_black' ? 'Gerenciamento de benefícios e recompensas exclusivas.' : 'Acompanhamento em tempo real dos seus dados.'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary w-64 transition-all placeholder:text-slate-400"
                  placeholder="Buscar pedidos, clientes..."
                  type="text"
                />
              </div>
              <button className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </button>
            </div>
          </header>

          <div className="p-8 space-y-8 min-h-screen">


            <Suspense fallback={<TabFallback />}>
              {activeTab === 'dashboard' && userRole !== 'merchant' && <DashboardTab />}
              {activeTab === 'tracking' && <TrackingTab />}
              {activeTab === 'orders' && userRole === 'merchant' && <OrdersMerchantTab />}
              {activeTab === 'orders' && userRole !== 'merchant' && <OrdersAdminTab />}
              {activeTab === 'drivers' && <DriversTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'merchants' && <MerchantsTab />}
              {activeTab === 'support' && <SupportTab />}
              {activeTab === 'financial' && <FinancialTab />}
              {activeTab === 'promotions' && <PromotionsTab />}
              {activeTab === 'izi_black' && <IziBlackTab />}
              {activeTab === 'categories' && <CategoriesTab />}
              {activeTab === 'dynamic_rates' && <DynamicRatesTab />}
              {activeTab === 'audit_logs' && <AuditLogsTab />}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'my_store' && <MyStoreTab />}
              {activeTab === 'my_drivers' && <MyDriversTab />}
              {activeTab === 'my_studio' && <MyStudioTab />}
            </Suspense>
          {/* Global Footer */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-center mt-auto">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Painel de Controle em Tempo Real • Gerenciamento de Pedidos</p>
          </div>
        </div>
      </main>
      </motion.div>
    </div>
      )}

    </div>
    </AdminContext.Provider>
  );
}

export default App;



