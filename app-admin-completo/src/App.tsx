import { toast, toastSuccess, toastError, toastWarning, showConfirm, showPrompt } from './lib/useToast';
import type { Order, Driver, User, Merchant, MerchantProfile, Product, Category, Promotion, DedicatedSlot, AuditLog, WalletTransaction, DynamicRate, MenuCategory } from './lib/types';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playIziSound } from './lib/iziSounds';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Polygon } from '@react-google-maps/api';
import { supabase } from './lib/supabase';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? '';
const libraries: ("places" | "geometry")[] = ["places"];
const mapContainerStyle = { width: '100%', height: '100%' };
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1c1e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1c1e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2f31" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#001a2c" }] }
];

// Waze-like map style
const wazeMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f0ebe3" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1ee" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9b2a6" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#93817c" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5b076" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#447530" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#f8c967" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fafafb" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#ff8c00" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#e98d58" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.stroke", stylers: [{ color: "#db8555" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#806b63" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#b9d3c2" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#92998d" }] }
];

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

  React.useEffect(() => { fetchOffers(); fetchMerchants(); }, []);

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
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [isSavingSegment, setIsSavingSegment] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryPromptModal, setShowCategoryPromptModal] = useState(false);
  const [categoryPromptType, setCategoryPromptType] = useState<'category' | 'subcategory'>('category');
  const [categoryPromptName, setCategoryPromptName] = useState('');
  const [isSavingCategoryPrompt, setIsSavingCategoryPrompt] = useState(false);
  const [productForm, setProductForm] = useState<any>({
    name: '', description: '', price: '', category: '', sub_category: '', image_url: '', is_available: true
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
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
      if (activeTab === 'categories' || activeTab === 'merchants') await fetchCategories();
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

    // Subscribe to realtime changes with automatic refresh
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
        if (activeTab === 'dashboard' || activeTab === 'orders' || activeTab === 'tracking') fetchAllOrders(ordersPage);
        if (activeTab === 'izi_black') fetchSubscriptionOrders(subscriptionOrdersPage);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers_delivery' }, () => {
        fetchStats();
        if (activeTab === 'dashboard' || activeTab === 'drivers' || activeTab === 'tracking') fetchDrivers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users_delivery' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_users' }, () => {
        if (activeTab === 'merchants') fetchMerchants();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions_delivery' }, () => {
        if (activeTab === 'promotions' || activeTab === 'my_store') fetchPromotions();
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30s backup polling

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [session, activeTab]);

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

  const handleCepFetch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
         setEditingItem((prev: any) => ({
           ...prev,
           zip_code: cep,
           store_address: data.logradouro,
           neighborhood: data.bairro,
           city: data.localidade,
           state: data.uf
         }));
      }
    } catch (error) {
       console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleAddSegment = () => {
    setNewSegmentName('');
    setShowSegmentModal(true);
  };

  const handleSaveNewSegment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSegmentName.trim()) return;
    setIsSavingSegment(true);
    try {
      // Slug simples para o store_type
      const slug = newSegmentName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
      
      const { error } = await supabase.from('categories_delivery').insert({
        name: newSegmentName,
        type: 'service',
        icon: 'storefront',
        is_active: true
      });
      
      if (error) throw error;
      
      await fetchCategories();
      setEditingItem((prev: any) => ({ ...prev, store_type: slug }));
      toastSuccess(`Segmento "${newSegmentName}" criado com sucesso!`);
      setShowSegmentModal(false);
    } catch (err: any) {
      console.error('Add segment error:', err);
      toastError('Erro ao adicionar segmento: ' + err.message);
    } finally {
      setIsSavingSegment(false);
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

  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toastError('Preencha pelo menos Nome e Preço.');
      return;
    }
    setIsSavingProduct(true);
    try {
      let targetMerchantId = productForm.merchant_id;
      if (!targetMerchantId) {
        const { data: adminData } = await supabase.from('admin_users').select('id').eq('email', session?.user?.email).single();
        if (!adminData) throw new Error('Sessão inválida');
        targetMerchantId = adminData.id;
      }

      const dataToSave = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price.toString().replace(',', '.')),
        category: productForm.category,
        sub_category: productForm.sub_category,
        image_url: productForm.image_url,
        merchant_id: targetMerchantId,
        is_available: productForm.is_available,
        featured: !!productForm.featured
      };

      let res;
      if (productForm.id && !productForm.id.startsWith('new-')) {
        res = await supabase.from('products_delivery').update(dataToSave).eq('id', productForm.id).select();
      } else {
        res = await supabase.from('products_delivery').insert([dataToSave]).select();
      }

      if (res.error) throw res.error;
      toastSuccess(productForm.id && !productForm.id.startsWith('new-') ? 'Produto atualizado!' : 'Produto criado!');
      setShowProductModal(false);
      
      if (userRole === 'admin' && selectedMerchantPreview) {
         openMerchantPreview(selectedMerchantPreview);
      } else {
         fetchProducts();
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      toastError('Erro ao salvar produto: ' + err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveCategoryPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!categoryPromptName.trim()) return;

    let targetMerchantId = productForm.merchant_id;
    if (!targetMerchantId) {
      targetMerchantId = (userRole === 'admin' && selectedMerchantPreview) ? selectedMerchantPreview.id : session?.user?.email ? (await supabase.from('admin_users').select('id').eq('email', session?.user?.email).single()).data?.id : null;
    }
    if (!targetMerchantId) return toastError('ID do lojista não encontrado.');

    setIsSavingCategoryPrompt(true);

    let parent_id = null;
    if (categoryPromptType === 'subcategory') {
      const activeCategories = userRole === 'admin' && selectedMerchantPreview ? previewCategories : menuCategoriesList;
      const parent = activeCategories.find(c => c.name === productForm.category && !c.parent_id);
      if (!parent) {
        setIsSavingCategoryPrompt(false);
        return toastError('Selecione uma categoria pai primeiro.');
      }
      parent_id = parent.id;
    }

    const { data, error } = await supabase.from('merchant_categories_delivery').insert([{
      name: categoryPromptName.trim(),
      parent_id,
      merchant_id: targetMerchantId,
      sort_order: 99,
      is_active: true
    }]).select().single();
    
    setIsSavingCategoryPrompt(false);
    if (error) return toastError(`Erro ao criar ${categoryPromptType === 'subcategory' ? 'subcategoria' : 'categoria'}.`);
    
    toastSuccess(`${categoryPromptType === 'subcategory' ? 'Subcategoria' : 'Categoria'} criada!`);
    
    if (userRole === 'admin' && selectedMerchantPreview) {
      setPreviewCategories([...previewCategories, data]);
    } else {
      setMenuCategoriesList([...menuCategoriesList, data]);
    }
    
    if (categoryPromptType === 'subcategory') {
      setProductForm({...productForm, sub_category: categoryPromptName.trim()});
    } else {
      setProductForm({...productForm, category: categoryPromptName.trim(), sub_category: ''});
    }
    
    setShowCategoryPromptModal(false);
  };

  const handleCreateNewProduct = (forcedMerchantId?: string | React.MouseEvent) => {
    const mId = typeof forcedMerchantId === 'string' ? forcedMerchantId : null;
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: menuCategoriesList[0]?.name || '',
      sub_category: '',
      image_url: '',
      is_available: true,
      featured: false,
      merchant_id: mId
    });
    setShowProductModal(true);
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

  const handleEditProduct = (p: any, forcedMerchantId?: string) => {
    setProductForm({
      ...p,
      price: p.price?.toString().replace('.', ',') || '',
      is_available: p.is_available ?? p.is_active ?? true,
      featured: !!p.featured,
      merchant_id: p.merchant_id || (typeof forcedMerchantId === 'string' ? forcedMerchantId : null)
    });
    setShowProductModal(true);
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
        zip_code: editingItem.zip_code,
        address_number: editingItem.address_number,
        address_complement: editingItem.address_complement,
        neighborhood: editingItem.neighborhood,
        city: editingItem.city,
        state: editingItem.state,
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
                               if (url) {
                                  updateItem({...targetItem, store_banner: url});
                                  const { error } = await supabase.from('admin_users').update({ store_banner: url }).eq('id', targetItem.id);
                                  if (!error) toastSuccess('Banner salvo com sucesso!');
                                  else toastError('Erro ao salvar o banner: ' + error.message);
                               }
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
                               if (url) {
                                  updateItem({...targetItem, store_logo: url});
                                  const { error } = await supabase.from('admin_users').update({ store_logo: url }).eq('id', targetItem.id);
                                  if (!error) toastSuccess('Logotipo salvo com sucesso!');
                                  else toastError('Erro ao salvar o logotipo: ' + error.message);
                               }
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

                  <div className="flex justify-end pt-6">
                     <button
                       onClick={async () => {
                          const { error } = await supabase.from('admin_users').update({
                             store_name: targetItem.store_name,
                             store_phone: targetItem.store_phone,
                             store_description: targetItem.store_description,
                             store_logo: targetItem.store_logo,
                             store_banner: targetItem.store_banner
                          }).eq('id', targetItem.id);
                          if (!error) toastSuccess('Dados do estabelecimento salvos com sucesso!');
                          else toastError('Erro ao salvar os dados: ' + error.message);
                       }}
                       className="bg-primary text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                     >
                       <span className="material-symbols-outlined text-lg">save</span>
                       Salvar Informações
                     </button>
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
                         onClick={() => {
                            const merchantId = userRole === 'merchant' ? merchantProfile?.merchant_id : selectedMerchantPreview?.id;
                            handleCreateNewProduct(merchantId);
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
                                    const merchantId = userRole === 'merchant' ? merchantProfile?.merchant_id : selectedMerchantPreview?.id;
                                    handleEditProduct(p, merchantId);
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

  return (
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

{/* â â â â â â â ADMIN DASHBOARD â â â â â â â */}
            {activeTab === 'dashboard' && userRole !== 'merchant' && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Receita Bruta', val: `R$ ${dashboardData.dailyRevenue.reduce((a: number, b: number) => a + b, 0).toFixed(2).replace('.', ',')}`, icon: 'payments', trend: '+12.5%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Ticket Médio', val: `R$ ${dashboardData.avgTicket.toFixed(2).replace('.', ',')}`, icon: 'confirmation_number', trend: 'Estável', color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Comissão Plataforma', val: `R$ ${dashboardData.totalCommission.toFixed(2).replace('.', ',')}`, icon: 'account_balance_wallet', trend: `${appSettings.appCommission}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Sucesso de Entrega', val: `${dashboardData.deliverySuccessRate.toFixed(1)}%`, icon: 'verified', trend: 'Meta 95%', color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((stat: any, i: number) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                          <span className={`material-symbols-outlined ${stat.color} font-bold`}>{stat.icon}</span>
                        </div>
                        <span className="text-slate-400 text-[9px] font-black px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">{stat.trend}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{stat.val}</h3>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Revenue Trend */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Tendência de Receita Diária</h3>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">Desempenho dos últimos 7 dias</p>
                      </div>
                      <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 focus:ring-primary cursor-pointer">
                        <option>Semanal</option>
                        <option>Mensal</option>
                      </select>
                    </div>
                    <div className="h-64 flex flex-col justify-end gap-2 relative">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
                        <defs>
                          <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#ffd900', stopOpacity: 0.4 }} />
                            <stop offset="100%" style={{ stopColor: '#ffd900', stopOpacity: 0 }} />
                          </linearGradient>
                        </defs>
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          d={`${dashboardData.revenuePath} L400,150 L0,150 Z`} 
                          fill="url(#grad1)"
                        ></motion.path>
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          d={dashboardData.revenuePath} 
                          fill="none" 
                          stroke="#ffd900" 
                          strokeLinecap="round" 
                          strokeWidth="4"
                        ></motion.path>
                      </svg>
                      <div className="flex justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                        {dashboardData.dayLabels.map((lbl: string, i: number) => <span key={i}>{lbl}</span>)}
                      </div>
                    </div>
                  </div>

                  {/* Volume by Category */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Volume de Pedidos por Categoria</h3>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">Divisão por tipo de entrega</p>
                      </div>
                      <span className="text-xl font-black text-primary tracking-tighter">
                        {dashboardData.totalOrdersToday} 
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 ml-2">total hoje</span>
                      </span>
                    </div>
                      {dashboardData.categories.map((cat: any, i: number) => (
                        <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-[14px] relative flex items-end overflow-hidden h-44 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${cat.percent}%` }}
                              className="w-full bg-primary rounded-t-[10px] transition-all shadow-inner"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <span className="text-[10px] font-black text-slate-900 bg-primary px-2 py-1 rounded-md shadow-lg">{cat.val}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter text-center leading-none">{cat.label}</span>
                        </div>
                      ))}
                  </div>
                </div>

                 {/* High-Performance Lojistas */}
                 <div className="grid grid-cols-1 gap-8 pb-10">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                       <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Melhores Lojistas da Semana</h3>
                        <span className="material-symbols-outlined text-primary">emoji_events</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData.topMerchants.length === 0 ? (
                           <div className="p-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Aguardando dados de performance...</div>
                        ) : (
                          dashboardData.topMerchants.map((m: any, idx: number) => (
                            <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg border border-slate-200 dark:border-slate-700">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white">{m.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.orders} pedidos finalizados</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-emerald-500">R$ {m.revenue.toFixed(2).replace('.', ',')}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receita Bruta</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                   </div>
                </div>

                {/* Recent Activity Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Atividade Recente</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Ver Todos os Pedidos</button>
                  </div>
                  <div className="overflow-x-auto text-slate-900 dark:text-white">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/30">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentOrders.map((o, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-8 py-5 text-sm font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">#DT-{o.id.slice(0, 4).toUpperCase()}</td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center font-black text-[10px]">
                                  {o.user_id?.slice(0, 2).toUpperCase() || 'US'}
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Cliente #{o.user_id?.slice(0, 5)}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {i % 2 === 0 ? 'Delivery Express' : 'Entrega Padrão'}
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest ${o.status === 'concluido' ? 'bg-green-100 text-green-700 border border-green-200' :
                                o.status === 'cancelado' ? 'bg-red-100 text-red-700 border border-red-200' :
                                  'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}>
                                {o.status === 'pending' ? 'Buscando...' : o.status === 'picked_up' ? 'Em Transito' : o.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white tracking-tighter">R$ {o.total_price.toFixed(2).replace('.', ',')}</td>
                            <td className="px-8 py-5">
                              <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-slate-900 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tracking' && (
              <div className="flex flex-col lg:flex-row h-[calc(100vh-160px)] -mt-2 -mx-4 lg:-mx-8 overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                {/* Map View Section */}
                <div className="relative flex-1 bg-slate-100 dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-slate-800">
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply dark:mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://api.maptiler.com/maps/basic-v2/static/0,0,1/1x1.png')" }}></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-slate-300 dark:text-slate-800 font-black text-6xl uppercase tracking-[1em] rotate-12 opacity-20">Mapa de Operações</span>
                  </div>

                  {/* Driver Markers */}
                  {driversList.filter(d => d.is_online && d.lat && d.lng).map((d) => (
                    <motion.div
                      key={d.id}
                      onClick={() => setSelectedTrackingItem({ type: 'driver', ...d })}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: selectedTrackingItem?.id === d.id ? 1.2 : 1,
                        zIndex: selectedTrackingItem?.id === d.id ? 50 : 30
                      }}
                      style={{
                        top: `${((d.lat + 23.5) * 500) % 80 + 10}%`,
                        left: `${((d.lng + 46.6) * 500) % 80 + 10}%`
                      }}
                      className="absolute group cursor-pointer"
                    >
                      <div className="relative flex flex-col items-center">
                        <div className={`absolute bottom-full mb-3 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all shadow-2xl border border-white/10 uppercase tracking-widest flex items-center gap-2 ${selectedTrackingItem?.id === d.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                          <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                          {d.name} • {d.vehicle_type || 'Moto'}
                        </div>
                        <div className={`size-12 rounded-[20px] flex items-center justify-center shadow-2xl border-4 transition-all duration-500 ${selectedTrackingItem?.id === d.id ? 'bg-primary text-slate-900 border-primary shadow-primary/40 scale-110' : 'bg-slate-900 text-primary border-slate-800 group-hover:border-primary/50'}`}>
                          <span className="material-symbols-outlined text-2xl font-bold">sports_motorsports</span>
                        </div>
                        {d.is_online && <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse -z-10"></div>}
                      </div>
                    </motion.div>
                  ))}

                  {/* Integrated Google Map */}
                  {mapsLoadError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4 p-8 text-center">
                       <span className="material-symbols-outlined text-5xl text-red-400">map_off</span>
                       <p className="text-sm font-black text-white uppercase tracking-widest">Google Maps não autorizado</p>
                       <p className="text-xs text-slate-400 max-w-xs">Verifique se a Maps JavaScript API e Places API estão ativadas no Google Cloud Console e se localhost está na lista de origens permitidas.</p>
                    </div>
                  ) : isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={mapCenter}
                      zoom={13}
                      options={{
                        styles: darkMapStyle,
                        disableDefaultUI: true,
                        zoomControl: false,
                      }}
                    >
                      {/* Driver Markers */}
                      {driversList.filter(d => d.is_online).map((driver, i) => (
                        <Marker
                          key={driver.id}
                          position={{
                            lat: mapCenter.lat + (i * 0.005) * Math.sin(i),
                            lng: mapCenter.lng + (i * 0.005) * Math.cos(i)
                          }}
                          onClick={() => setSelectedTrackingItem({ type: 'driver', ...driver })}
                          icon={typeof google !== 'undefined' ? {
                            url: 'https://cdn-icons-png.flaticon.com/512/3253/3253113.png',
                            scaledSize: new google.maps.Size(40, 40)
                          } : undefined}
                        />
                      ))}

                      {/* Order Markers */}
                      {allOrders.filter(o => ['pending', 'picked_up', 'a_caminho'].includes(o.status)).map((order, i) => (
                        <Marker
                          key={order.id}
                          position={{
                            lat: mapCenter.lat - (i * 0.008) * Math.cos(i),
                            lng: mapCenter.lng + (i * 0.008) * Math.sin(i)
                          }}
                          onClick={() => setSelectedTrackingItem({ type: 'order', ...order })}
                          icon={typeof google !== 'undefined' ? {
                            url: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
                            scaledSize: new google.maps.Size(35, 35)
                          } : undefined}
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center">
                      <span className="text-slate-400 font-black uppercase tracking-widest italic text-xs">Iniciando GIS Google...</span>
                    </div>
                  )}

                  {/* Info Overlay for Selected Item */}
                  {selectedTrackingItem && (
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="absolute top-6 left-6 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl z-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedTrackingItem.type === 'driver' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                          {selectedTrackingItem.type === 'driver' ? 'Entregador' : 'Pedido'}
                        </div>
                        <button onClick={() => setSelectedTrackingItem(null)} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined text-sm">close</span></button>
                      </div>
                      <h4 className="font-black text-lg dark:text-white mb-1">{selectedTrackingItem.name || `Pedido #${selectedTrackingItem.id?.slice(0, 5).toUpperCase()}`}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                        {selectedTrackingItem.type === 'driver' ? `${selectedTrackingItem.vehicle_type || 'Moto'} • ${selectedTrackingItem.license_plate || 'Sem Placa'}` : selectedTrackingItem.delivery_address}
                      </p>

                      <div className="flex flex-col gap-2">
                        <button className="w-full py-3 bg-primary text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-105 transition-all">Ver Detalhes Full</button>
                        <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-center">Notificar</button>
                      </div>
                    </motion.div>
                  )}

                  {/* Map Controls */}
                  <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                    <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all border border-slate-200 dark:border-slate-700">
                      <span className="material-symbols-outlined font-bold">add</span>
                    </button>
                    <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all border border-slate-200 dark:border-slate-700">
                      <span className="material-symbols-outlined font-bold">remove</span>
                    </button>
                  </div>
                </div>

                {/* List Section */}
                <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-slate-950 flex flex-col h-full shrink-0">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-black text-xl tracking-tight">Monitor de Operações</h3>
                      <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        {allOrders.filter(o => !['concluido', 'cancelado'].includes(o.status)).length} Ativos
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { id: 'orders', label: 'Pedidos', icon: 'shopping_bag' },
                        { id: 'drivers', label: 'Entregadores', icon: 'sports_motorsports' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setTrackingListTab(tab.id as any)}
                          className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${trackingListTab === tab.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                            : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                            }`}
                        >
                          <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {trackingListTab === 'orders' ? (
                      allOrders.filter(o => !['concluido', 'cancelado'].includes(o.status)).map((o, i) => {
                        const isPending = o.status === 'pending';
                        const isTransit = o.status === 'picked_up' || o.status === 'a_caminho';
                        const isSelected = selectedTrackingItem?.id === o.id;

                        return (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={o.id}
                            onClick={() => setSelectedTrackingItem({ type: 'order', ...o })}
                            className={`p-5 rounded-[28px] border transition-all cursor-pointer group hover:scale-[1.02] ${isSelected
                              ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-primary/20 text-primary'} group-hover:scale-110 transition-transform`}>
                                  <span className="material-symbols-outlined text-xl">{o.service_type === 'mototaxi' ? 'hail' : 'package_2'}</span>
                                </div>
                                <div>
                                  <h4 className="font-black text-sm tracking-tight dark:text-white">#{o.id.slice(0, 5).toUpperCase()}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.service_type || 'Delivery'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black tracking-tighter dark:text-white">R$ {o.total_price?.toFixed(2)}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Valor</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                                <span className="text-[10px] font-bold text-slate-500 truncate">{o.delivery_address}</span>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className={`size-1.5 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    {isPending ? 'Aguardando Piloto' : isTransit ? 'Em Rota de Entrega' : o.status}
                                  </span>
                                </div>
                                <button className="text-primary group-hover:translate-x-1 transition-transform">
                                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      driversList.filter(d => d.is_online).map((d, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={d.id}
                          onClick={() => setSelectedTrackingItem({ type: 'driver', ...d })}
                          className={`p-5 rounded-[28px] border transition-all cursor-pointer group hover:scale-[1.02] ${selectedTrackingItem?.id === d.id
                            ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800">
                                <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                              </div>
                              <div>
                                <h4 className="font-black text-sm tracking-tight dark:text-white">{d.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="size-1.5 rounded-full bg-green-500"></div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.vehicle_type || 'Moto'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-amber-500">
                                <span className="material-symbols-outlined text-xs">star</span>
                                <span className="text-xs font-black">4.9</span>
                              </div>
                              <p className="text-[8px] font-black text-slate-400 uppercase">Avaliação</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

{/* â â â â â â â MERCHANT ORDERS â â â â â â â */}
{/* ─── MERCHANT ORDERS ─── */}
            {activeTab === 'orders' && userRole === 'merchant' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-3xl text-primary">shopping_cart</span>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Pedidos</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie e aceite pedidos em tempo real para seu estabelecimento.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 shadow-sm">
                    <span className="size-2 rounded-full bg-rose-500 animate-ping"></span>
                    {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'novo' || o.status === 'pending' || o.status === 'waiting_merchant')).length} NOVOS PEDIDOS
                  </span>
                </div>

                {/* SEÇÃO: NOVOS PEDIDOS (AGUARDANDO AÇÃO) */}
                {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'novo' || o.status === 'pending' || o.status === 'waiting_merchant')).length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg animate-bounce">notifications_active</span>
                      Solicitações Pendentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'novo' || o.status === 'pending' || o.status === 'waiting_merchant')).map((o: any) => (
                        <motion.div key={o.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 overflow-hidden rounded-[32px] border-2 border-orange-100 dark:border-orange-500/20 shadow-xl shadow-orange-500/5">
                          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex justify-between items-center">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">DT-{o.id.slice(0, 8).toUpperCase()}</span>
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[8px] font-black uppercase tracking-[0.2em]">{o.payment_method === 'dinheiro' ? 'PAGAMENTO NA ENTREGA' : 'PAGAMENTO DIGITAL'}</span>
                          </div>
                          
                          <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start border-b border-slate-50 dark:border-slate-800 pb-4">
                              <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens do Pedido</h4>
                                <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                                  {o.package_details || 'Nenhum detalhe informado'}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                <p className="text-xl font-black text-orange-500 tracking-tighter">R$ {Number(o.total_price || 0).toFixed(2).replace('.', ',')}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-slate-300 text-lg">location_on</span>
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Endereço de Entrega</p>
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">{o.delivery_address}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-300 text-lg">schedule</span>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(o.created_at).toLocaleString('pt-BR')}</p>
                              </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                              <button 
                                onClick={async () => { 
                                  if (!confirm('Deseja realmente recusar este pedido?')) return;
                                  try { 
                                    await supabase.from('orders_delivery').update({ status: 'cancelado' }).eq('id', o.id); 
                                    fetchAllOrders(); 
                                    toastWarning('Pedido recusado');
                                  } catch(err) { console.error(err); } 
                                }} 
                                className="flex-1 py-4 rounded-2xl border-2 border-red-50 dark:border-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-500/5 transition-all outline-none"
                              >
                                Recusar
                              </button>
                              <button 
                                onClick={async () => { try { 
                                  // Ao aceitar, já deixa em status pendente para o Flash (motoboy) ver na hora
                                  await supabase.from('orders_delivery').update({ status: 'pendente' }).eq('id', o.id); 
                                  fetchAllOrders(); 
                                  toastSuccess('Pedido Aceito! Motoboy Flash em busca...');
                                } catch(err) { console.error(err); } }} 
                                className="flex-[2] py-4 rounded-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/30 transition-all outline-none"
                              >
                                Aceitar e Chamar Flash ⚡
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && ['pendente', 'preparando', 'confirmado', 'picked_up', 'em_rota', 'a_caminho'].includes(o.status)).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-lg">local_shipping</span>Em andamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && ['pendente', 'preparando', 'confirmado', 'picked_up', 'em_rota', 'a_caminho'].includes(o.status)).map((o: any) => (
                        <div key={o.id} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex flex-col">
                              <p className="text-[10px] font-black text-slate-400">#{o.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Flash Em Rota</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest">{o.status === 'pendente' ? 'Em Preparo/Flash' : o.status === 'picked_up' ? 'Pedido Coletado' : 'Em Rota'}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</span>
                            {o.status === 'pendente' && (
                              <button 
                                onClick={async () => { try { await supabase.from('orders_delivery').update({ status: 'pronto' }).eq('id', o.id); fetchAllOrders(); toastSuccess('Pedido pronto! Flash notificado!'); } catch(err) { console.error(err); } }} 
                                className="px-6 py-2 rounded-2xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                              >
                                Marcar Pronto ⚡
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">history</span>Histórico Completo</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pedido</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Destino</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allOrders.map((o: any) => (
                          <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-8 py-5 font-bold text-slate-400 text-sm">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
                            <td className="px-8 py-5 font-black text-slate-900 dark:text-white truncate max-w-[250px]">{o.delivery_address}</td>
                            <td className="px-8 py-5 font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === 'concluido' ? 'bg-green-100 text-green-600 border border-green-200' : o.status === 'cancelado' ? 'bg-red-100 text-red-600 border border-red-200' : o.status === 'preparando' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-primary/20 text-slate-800 dark:text-primary border border-primary/30'}`}>
                                {o.status === 'pending' ? 'Novo' : o.status === 'preparando' ? 'Preparando' : o.status === 'picked_up' ? 'Coletado' : o.status === 'em_rota' ? 'Em Rota' : o.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-500 text-xs">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allOrders.length === 0 && (
                      <div className="px-8 py-16 text-center"><span className="material-symbols-outlined text-5xl text-slate-300 mb-4">inbox</span><p className="text-sm font-black text-slate-400">Nenhum pedido encontrado</p></div>
                    )}
                  </div>
                  {/* Paginação lojista */}
                  {merchantOrdersTotalCount > ORDERS_PER_PAGE && (
                    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Exibindo {((merchantOrdersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(merchantOrdersPage * ORDERS_PER_PAGE, merchantOrdersTotalCount)} de {merchantOrdersTotalCount} pedidos
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={merchantOrdersPage <= 1 || isLoadingList}
                          onClick={() => fetchAllOrders(merchantOrdersPage - 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        {Array.from({ length: Math.min(5, Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE)) }, (_, i) => {
                          const totalPages = Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE);
                          let pageNum: number;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (merchantOrdersPage <= 3) pageNum = i + 1;
                          else if (merchantOrdersPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = merchantOrdersPage - 2 + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => fetchAllOrders(pageNum)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${merchantOrdersPage === pageNum ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/30'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          disabled={merchantOrdersPage >= Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                          onClick={() => fetchAllOrders(merchantOrdersPage + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

{/* â â â â â â â ADMIN ORDERS â â â â â â â */}
            {activeTab === 'orders' && userRole !== 'merchant' && (
              <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                {isLoadingList && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Pedido</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Destino da Entrega</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Total</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data e Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-8 py-6 font-bold text-slate-400 text-sm">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-8 py-6 font-black text-slate-900 dark:text-white truncate max-w-[300px]">{o.delivery_address}</td>
                          <td className="px-8 py-6 font-black text-primary">R$ {o.total_price.toFixed(2).replace('.', ',')}</td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${o.status === 'concluido' ? 'bg-green-100 text-green-600 border border-green-200' :
                              o.status === 'cancelado' ? 'bg-red-100 text-red-600 border border-red-200' :
                                'bg-primary/20 text-slate-800 dark:text-primary border border-primary/30'
                              }`}>
                              {o.status === 'pending' ? 'Buscando Motoboy' : o.status === 'picked_up' ? 'Em Entrega' : o.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-bold text-slate-500 text-xs">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginação real */}
                  <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Exibindo {((ordersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(ordersPage * ORDERS_PER_PAGE, ordersTotalCount)} de {ordersTotalCount} pedidos
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={ordersPage <= 1 || isLoadingList}
                        onClick={() => fetchAllOrders(ordersPage - 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(5, Math.ceil(ordersTotalCount / ORDERS_PER_PAGE)) }, (_, i) => {
                        const totalPages = Math.ceil(ordersTotalCount / ORDERS_PER_PAGE);
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (ordersPage <= 3) {
                          pageNum = i + 1;
                        } else if (ordersPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = ordersPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchAllOrders(pageNum)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${ordersPage === pageNum ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/30'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        disabled={ordersPage >= Math.ceil(ordersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                        onClick={() => fetchAllOrders(ordersPage + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'drivers' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-3xl text-primary">sports_motorsports</span>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Entregadores</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Controle total da frota, aprovações, suspensões e monitoramento de performance.</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <span className="material-symbols-outlined text-slate-400 pl-2">search</span>
                        <input
                          type="text"
                          placeholder="Buscar por nome, id ou telefone..."
                          className="bg-transparent border-none text-xs font-bold px-3 py-2 focus:ring-0 dark:text-white w-64"
                          value={driverSearch}
                          onChange={(e) => setDriverSearch(e.target.value)}
                        />
                     </div>
                  </div>
                </div>

                {/* Statistics Bar - Real & Dynamic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Frota Total', val: driversList.length, icon: 'group', color: 'text-primary', bg: 'bg-primary/10', trend: 'Base Completa', tc: 'text-slate-500' },
                    { label: 'Disponíveis Agora', val: driversList.filter(d => d.is_online).length, icon: 'bolt', color: 'text-green-500', bg: 'bg-green-500/10', trend: 'Online', tc: 'text-green-500' },
                    { label: 'Aguardando Aprovação', val: driversList.filter(d => !d.is_active && d.status !== 'suspended').length, icon: 'pending_actions', color: 'text-orange-500', bg: 'bg-orange-500/10', trend: 'Pendentes', tc: 'text-orange-500' },
                    { label: 'Contas Suspensas', val: driversList.filter(d => d.status === 'suspended').length, icon: 'warning', color: 'text-red-500', bg: 'bg-red-500/10', trend: 'Ação Necessária', tc: 'text-red-500' },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-6xl">{s.icon}</span>
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`material-symbols-outlined ${s.color} p-4 ${s.bg} rounded-3xl font-bold`}>{s.icon}</span>
                        <span className={`text-[10px] font-black ${s.tc} px-3 py-1 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 shadow-sm uppercase tracking-widest`}>{s.trend}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{s.label}</p>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{s.val}</h3>
                    </motion.div>
                  ))}
                </div>

                {/* Filters & Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-2 shadow-sm shrink-0">
                    {['Todos', 'Ativos', 'Offline', 'Pendentes'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setDriverFilter(f)}
                        className={`px-8 py-3.5 text-[10px] font-black rounded-2xl uppercase tracking-[0.15em] transition-all ${driverFilter === f ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20 scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleExportDrivers}
                      className="size-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
                      title="Exportar CSV"
                    >
                      <span className="material-symbols-outlined">download</span>
                    </button>
                    <button
                      onClick={fetchDrivers}
                      className="size-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm active:rotate-180"
                      title="Sincronizar"
                    >
                      <span className="material-symbols-outlined">sync</span>
                    </button>
                    <button
                      onClick={() => setSelectedDriverStudio({ 
                        id: `new-${Date.now()}`, 
                        name: '', 
                        email: '',
                        phone: '', 
                        vehicle_type: 'Moto', 
                        vehicle_model: '',
                        vehicle_color: '',
                        license_plate: '',
                        address: '',
                        document_number: '',
                        is_active: true, 
                        status: 'active', 
                        bank_info: { bank: '', agency: '', account: '', pix_key: '' } 
                      })}
                      className="px-10 py-5 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                    >
                       <span className="material-symbols-outlined text-lg">person_add</span>
                       Novo Entregador
                    </button>
                  </div>
                </div>

                {/* Deliverers Table with Modern Styling */}
                <div className="bg-white dark:bg-slate-900 rounded-[56px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
                  {isLoadingList && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50 uppercase">
                          <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Entregador & ID</th>
                          <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Operacional</th>
                          <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Status Acesso</th>
                          <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400">Rating & Performance</th>
                          <th className="px-10 py-8 text-[10px] font-black tracking-[0.2em] text-slate-400 text-right">Ações de Gestão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                        {paginatedDrivers.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-6">
                                <div className="size-16 rounded-[28px] bg-slate-100 dark:bg-slate-800 p-0.5 border-2 border-white dark:border-slate-700 shadow-xl overflow-hidden shrink-0 relative">
                                  <img className="w-full h-full object-cover rounded-[24px]" src={`https://ui-avatars.com/api/?name=${d.name}&background=ffd900&color=000&size=128&bold=true`} />
                                  {d.is_online && <span className="absolute bottom-0 right-0 size-4 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full" />}
                                </div>
                                <div>
                                  <p className="text-lg font-black tracking-tighter mb-0.5">{d.name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">ID: {d.id.slice(0, 8)}</span>
                                    {d.is_online && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black rounded-full uppercase">Online</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-slate-400 text-base">
                                    {d.vehicle_type?.toLowerCase().includes('moto') ? 'motorcycle' : d.vehicle_type?.toLowerCase().includes('bike') ? 'directions_bike' : 'directions_car'}
                                  </span>
                                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{d.vehicle_type || 'Moto'}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">{d.license_plate?.toUpperCase() || 'SEM PLACA'}</p>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
                                d.status === 'active' || d.is_active
                                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 shadow-sm'
                                : d.status === 'suspended'
                                ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                                }`}>
                                <span className={`size-2 rounded-full ${
                                  (d.status === 'active' || d.is_active) ? 'bg-green-500' : d.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                                } shadow-sm`}></span>
                                {d.status === 'suspended' ? 'Suspenso' : (d.status === 'active' || d.is_active ? 'Conta Ativa' : 'Desativado')}
                              </span>
                            </td>
                            <td className="px-10 py-8">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary">
                                  <span className="material-symbols-outlined text-lg fill-1">star</span>
                                  <span className="text-base font-black text-slate-900 dark:text-white">{d.rating?.toFixed(1) || '5.0'}</span>
                                </div>
                                <div className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                   <div className="h-full bg-primary" style={{ width: `${(d.rating || 5) * 20}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => window.open(`https://wa.me/55${d.phone?.replace(/\D/g, '')}`, '_blank')}
                                  className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-green-500 border border-slate-100 dark:border-slate-800 hover:bg-green-500 hover:text-white transition-all shadow-sm group/btn"
                                  title="Enviar Mensagem"
                                >
                                  <span className="material-symbols-outlined text-xl group-hover/btn:scale-110 transition-transform">chat</span>
                                </button>
                                <button
                                  onClick={() => { setSelectedDriverStudio(d); setActiveStudioTab('personal'); }}
                                  className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-blue-500 border border-slate-100 dark:border-slate-800 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                  title="Editar Perfil"
                                >
                                  <span className="material-symbols-outlined text-xl">manage_accounts</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateDriverStatus(d.id, d.status === 'suspended' ? 'active' : 'suspended')}
                                  className={`size-11 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
                                    d.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-amber-500 border border-slate-100 dark:border-slate-800 hover:bg-amber-500 hover:text-white'
                                  }`}
                                  title={d.status === 'suspended' ? 'Reativar' : 'Suspender'}
                                >
                                  <span className="material-symbols-outlined text-xl">warning</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteDriver(d.id)}
                                  className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-red-500 border border-slate-100 dark:border-slate-800 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                  title="Excluir Permanentemente"
                                >
                                  <span className="material-symbols-outlined text-xl">delete_forever</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredDrivers.length === 0 && (
                      <div className="py-32 text-center">
                         <div className="size-24 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-6 text-slate-300">
                             <span className="material-symbols-outlined text-5xl">sports_motorsports</span>
                         </div>
                         <h4 className="text-xl font-black text-slate-900 dark:text-white">Nenhum entregador encontrado</h4>
                         <p className="text-sm font-bold text-slate-400 mt-2">Ajuste seu filtro ou busque por outro termo.</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Footer */}
                  <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4">
                       Filtro: <span className="text-slate-900 dark:text-white">{driverFilter}</span>
                       <span className="w-1 h-1 rounded-full bg-slate-300" />
                       Exibindo {filteredDrivers.length} de {driversList.length} entregadores
                    </p>
                    <div className="flex items-center gap-3">
                      <button 
                        disabled={driversPage === 1}
                        onClick={() => setDriversPage(prev => prev - 1)}
                        className="h-12 px-5 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                        Anterior
                      </button>
                      
                      <div className="flex items-center gap-2">
                         {Array.from({ length: Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE) }).map((_, i) => {
                             const p = i + 1;
                             const totalP = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
                             if (p === 1 || p === totalP || (p >= driversPage - 1 && p <= driversPage + 1)) {
                                 return (
                                   <button 
                                     key={p}
                                     onClick={() => setDriversPage(p)}
                                     className={`size-12 rounded-2xl font-black text-xs transition-all ${driversPage === p ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary border border-transparent dark:border-slate-800 hover:border-primary/30'}`}
                                   >
                                     {p}
                                   </button>
                                 );
                             }
                             if (p === driversPage - 2 || p === driversPage + 2) return <span key={p} className="text-slate-400 font-bold px-1">...</span>;
                             return null;
                         })}
                      </div>

                      <button 
                        disabled={driversPage >= Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE)}
                        onClick={() => setDriversPage(prev => prev + 1)}
                        className="h-12 px-5 flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest shadow-sm disabled:opacity-40"
                      >
                        Próximo
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && selectedUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <button onClick={() => setSelectedUser(null)} className="hover:text-primary transition-colors">Clientes</button>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-slate-900 dark:text-white">Detalhes do Cliente</span>
                </div>

                {/* Profile Header */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex items-center gap-8">
                      <div className="size-24 md:size-32 rounded-[32px] border-4 border-slate-50 dark:border-slate-800 bg-primary/10 overflow-hidden shadow-inner shrink-0 leading-none">
                        <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${selectedUser.name || 'U'}&background=ffd900&color=000&size=256&bold=true`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-4">
                          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedUser.name || 'Usuário Sem Nome'}</h1>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedUser.is_active
                            ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                            : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                            }`}>
                            {selectedUser.is_active ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">ID: #{selectedUser.id.slice(0, 8)} • {selectedUser.phone || 'S/ Telefone'}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Membro desde {new Date(selectedUser.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                      <button 
                        onClick={async () => {
                          const amount = await showPrompt('Digite o valor do crédito (ex: 50.00):');
                          if (amount) handleApplyCredit(selectedUser.id, parseFloat(amount));
                        }}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                      >
                        <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                        Add Crédito
                      </button>
                      <button 
                        onClick={() => handleNotifyUser(selectedUser.id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-primary text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-lg">notifications</span>
                        Notificar
                      </button>
                      <button 
                        onClick={() => handleResetPassword(selectedUser.id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                        Senha
                      </button>
                      <button
                        onClick={() => toggleUserStatus(selectedUser.id, selectedUser.is_active)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">{selectedUser.is_active ? 'block' : 'check_circle'}</span>
                        {selectedUser.is_active ? 'Bloquear' : 'Ativar'}
                      </button>
                      <button onClick={() => setSelectedUser(null)} className="lg:hidden w-full px-6 h-12 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Voltar</button>
                    </div>
                  </div>
                </div>

                 {/* Stats Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Gasto', val: `R$ ${allOrders.filter(o => o.user_id === selectedUser.id && o.status === 'concluido').reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(2).replace('.', ',')}`, icon: 'payments', trend: 'LTV', color: 'text-emerald-500' },
                     { label: 'Saldo Carteira', val: `R$ ${(selectedUser.wallet_balance || 0).toFixed(2).replace('.', ',')}`, icon: 'account_balance_wallet', trend: 'Disponível', color: 'text-emerald-600' },
                     { label: 'Pedidos Totais', val: allOrders.filter(o => o.user_id === selectedUser.id).length, icon: 'shopping_bag', trend: 'Histórico', color: 'text-primary' },
                     { label: 'Pedidos Ativos', val: allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).length, icon: 'pending_actions', trend: 'Em aberto', color: 'text-blue-500' },
                   ].map((s, i) => (
                     <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group">
                       <div className="flex justify-between items-start mb-4">
                         <span className={`material-symbols-outlined ${s.color} p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl transition-colors`}>{s.icon}</span>
                         <span className="text-[9px] font-black text-slate-400 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-full">{s.trend}</span>
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tighter">{s.val}</h3>
                     </div>
                   ))}
                 </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Personal Info */}
                  <div className="lg:col-span-1 space-y-8">
                    <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Informações Pessoais
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome de Cadastro</label>
                          <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{selectedUser.name || '---'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone de Contato</label>
                          <p className="text-slate-900 dark:text-slate-200 font-black text-base mt-1 tracking-tight">{selectedUser.phone || 'S/ Telefone'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Principal</label>
                          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm mt-1 leading-relaxed italic">Endereço não cadastrado ou não informado pelo usuário.</p>
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setSelectedUserStudio(selectedUser)}
                            className="text-primary hover:text-slate-900 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group"
                          >
                            Editar Informações
                            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Izi Black Management Section */}
                    <section className={`bg-white dark:bg-slate-900 rounded-[40px] p-8 border-2 shadow-sm relative overflow-hidden transition-all ${selectedUser.is_izi_black ? 'border-primary shadow-primary/10' : 'border-slate-100 dark:border-slate-800'}`}>
                      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl ${selectedUser.is_izi_black ? 'bg-primary/20' : 'bg-slate-500/5'}`}></div>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <span className={`material-symbols-outlined ${selectedUser.is_izi_black ? 'text-primary' : 'text-slate-300'}`}>workspace_premium</span>
                          Programa Izi Black
                        </h3>
                        <div 
                          onClick={() => toggleIziBlack(selectedUser.id, !!selectedUser.is_izi_black)}
                          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${selectedUser.is_izi_black ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <div className={`size-4 bg-white rounded-full shadow-sm transition-transform ${selectedUser.is_izi_black ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status de Fidelidade</p>
                          <p className={`text-sm font-black uppercase tracking-widest ${selectedUser.is_izi_black ? 'text-primary' : 'text-slate-500'}`}>
                            {selectedUser.is_izi_black ? 'MEMBRO VIP ATIVO' : 'CLIENTE REGULAR'}
                          </p>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cashback Acumulado</label>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {(selectedUser.cashback_earned || 0).toFixed(2).replace('.', ',')}</p>
                            <button 
                              onClick={async () => {
                                const newVal = await showPrompt('Digite o novo valor do cashback:');
                                if (newVal !== null) {
                                  const { error } = await supabase.from('users_delivery').update({ cashback_earned: parseFloat(newVal) }).eq('id', selectedUser.id);
                                  if (!error) {
                                    toastSuccess('Cashback atualizado!');
                                    fetchUsers();
                                    setSelectedUser({ ...selectedUser, cashback_earned: parseFloat(newVal) });
                                  }
                                }
                              }}
                              className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                          </div>
                        </div>

                        {selectedUser.is_izi_black && (
                          <div className="pt-4 space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Benefícios VIP aplicados
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Right Column: History */}
                  <div className="lg:col-span-2 space-y-8">
                     {/* Active Orders */}
                     <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                       <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                         <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                           <span className="material-symbols-outlined text-primary">pending_actions</span>
                           Pedidos Ativos ({allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).length})
                         </h3>
                       </div>
                       <div className="divide-y divide-slate-50 dark:divide-slate-800">
                         {allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-10">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                                <span className="material-symbols-outlined text-3xl">shopping_cart_off</span>
                              </div>
                              <p className="text-sm font-bold text-slate-500">Nenhum pedido em andamento no momento.</p>
                            </div>
                         ) : (
                           allOrders.filter(o => o.user_id === selectedUser.id && !['concluido', 'cancelado'].includes(o.status)).map((o, idx) => (
                             <div key={idx} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 transition-colors">
                               <div className="flex items-center gap-4">
                                  <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-500">pending</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-slate-900 mt-1">Pedido #DT-{o.id.slice(0, 4).toUpperCase()}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.status}</p>
                                  </div>
                               </div>
                               <p className="text-sm font-black text-slate-900">R$ {o.total_price.toFixed(2).replace('.', ',')}</p>
                             </div>
                           ))
                         )}
                       </div>
                     </section>

                    {/* History Table */}
                    <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">history</span>
                          Histórico de Pedidos
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Pedido</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                              <th className="px-8 py-5"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {allOrders.filter(o => o.user_id === selectedUser.id).length === 0 ? (
                              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                <td colSpan={5} className="px-8 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum registro encontrado</td>
                              </tr>
                            ) : (
                              allOrders.filter(o => o.user_id === selectedUser.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((o, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                  <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 4).toUpperCase()}</p>
                                  </td>
                                  <td className="px-8 py-5">
                                    <p className="text-xs font-bold text-slate-500">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                                  </td>
                                  <td className="px-8 py-5 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                      o.status === 'concluido' ? 'bg-green-50 text-green-700 border-green-100' :
                                      o.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-100' :
                                      'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">
                                    R$ {(o.total_price || 0).toFixed(2).replace('.', ',')}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <button 
                                      onClick={() => setActiveTab('orders')}
                                      className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                                    >
                                      visibility
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && !selectedUser && (
              <div className="space-y-8">
                {/* Page Title & Main Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Clientes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua base de usuários e visualize métricas de engajamento.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-lg">download</span>
                      Exportar CSV
                    </button>
                    <button 
                      onClick={() => setSelectedUserStudio({ id: `new-${Date.now()}`, name: '', phone: '', email: '', is_active: true, status: 'active' })}
                      className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-95 transition-all shadow-lg shadow-primary/20"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      Novo Cliente
                    </button>
                  </div>
                </div>

                {/* Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total de Clientes', val: stats.users, trend: '+0%', color: 'text-primary' },
                    { label: 'Clientes Ativos', val: usersList.filter(u => u.is_active).length, trend: '+0%', color: 'text-green-500' },
                    { label: 'Novos este mês', val: usersList.filter(u => new Date(u.created_at).getMonth() === new Date().getMonth()).length, trend: 'Meta: 1k', color: 'text-blue-500' },
                    { label: 'LTV Médio', val: 'R$ 0,00', trend: '+0%', color: 'text-emerald-500' },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</p>
                      <div className="flex items-baseline gap-3 mt-4">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{m.val}</h3>
                        <span className={`${m.color} text-[10px] font-black px-2 py-0.5 rounded-full border border-current opacity-80`}>{m.trend}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                    <select 
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black uppercase tracking-widest focus:ring-primary py-3 px-6 cursor-pointer"
                    >
                      <option value="all">Todos</option>
                      <option value="active">Ativos</option>
                      <option value="suspended">Suspensos</option>
                      <option value="inactive">Inativos</option>
                    </select>
                  </div>
                  <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período:</span>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-100 dark:border-slate-700">
                      <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                      <input className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-24" type="date" />
                      <span className="text-slate-400 text-[10px] font-black">ATÉ°</span>
                      <input className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-24" type="date" />
                    </div>
                  </div>
                  <button className="ml-auto text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Limpar Filtros</button>
                </div>

                {/* Customers Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                  {isLoadingList && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Cliente</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Registro</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Pedidos</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">LTV</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Saldo</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {usersList.filter(u => {
                          if (userStatusFilter === 'all') return true;
                          if (userStatusFilter === 'active') return u.status === 'active' || u.is_active;
                          return u.status === userStatusFilter;
                        }).map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="size-12 rounded-[20px] bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/10 overflow-hidden shrink-0 shadow-sm">
                                  <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${u.name || 'U'}&background=ffd90033&color=ffd900&size=128&bold=true`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-base dark:text-white tracking-tight truncate">{u.name || 'Usuário Sem Nome'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{u.phone || 'S/ Telefone'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
                              {new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                             <td className="px-8 py-6 text-sm font-black text-center text-slate-900 dark:text-white">
                              {allOrders.filter(o => o.user_id === u.id).length}
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-right text-primary">
                              R$ {allOrders.filter(o => o.user_id === u.id && o.status === 'concluido').reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(2).replace('.', ',')}
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-right text-emerald-600">
                               R$ {(u.wallet_balance || 0).toFixed(2).replace('.', ',')}
                             </td>
                             <td className="px-8 py-6 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                u.status === 'active' || u.is_active
                                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                : u.status === 'suspended'
                                ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                                }`}>
                                <span className={`size-1.5 rounded-full ${
                                  (u.status === 'active' || u.is_active) ? 'bg-green-500' : u.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                                }`}></span>
                                {u.status === 'suspended' ? 'Suspenso' : (u.status === 'active' || u.is_active ? 'Ativo' : 'Inativo')}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {u.phone && (
                                  <button
                                    onClick={() => window.open(`https://wa.me/55${u.phone.replace(/\D/g, '')}`, '_blank')}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-100"
                                    title="Contato WhatsApp"
                                  >
                                    <span className="material-symbols-outlined text-lg">forum</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary hover:text-slate-900 transition-all shadow-sm"
                                  title="Ver Detalhes"
                                >
                                  <span className="material-symbols-outlined text-lg">visibility</span>
                                </button>
                                <button
                                  onClick={() => setSelectedUserStudio(u)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all shadow-sm"
                                  title="Editar Cliente"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateUserStatus(u.id, (u.status === 'active' || u.is_active) ? 'inactive' : 'active')}
                                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                                    (u.status === 'active' || u.is_active) ? 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'
                                  }`}
                                  title={(u.status === 'active' || u.is_active) ? 'Bloquear Acesso' : 'Ativar Acesso'}
                                >
                                  <span className="material-symbols-outlined text-lg">{(u.status === 'active' || u.is_active) ? 'do_not_disturb_on' : 'check_circle'}</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                                    u.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-100'
                                  }`}
                                  title="Suspender Temporariamente"
                                >
                                  <span className="material-symbols-outlined text-lg">pause_circle</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                  title="Excluir Cliente"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exibindo {usersList.length} de {stats.users} clientes</p>
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-slate-900 font-black text-xs">1</button>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'merchants' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Lojistas</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie os estabelecimentos parceiros da plataforma.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingItem({ role: 'merchant', is_active: true });
                      setEditType('merchant');
                    }}
                    className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-95 transition-all shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-lg">add_business</span>
                    Novo Lojista
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
                  {isLoadingList && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estabelecimento</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Administrativo</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Financeiro</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Vendas Totais</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {merchantsList.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-8 py-6">
                              <div 
                                onClick={() => openMerchantPreview(m)}
                                className="flex items-center gap-4 cursor-pointer group/item hover:opacity-80 transition-all"
                              >
                                <div className="size-12 rounded-[20px] bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/10 overflow-hidden shrink-0 shadow-sm leading-none group-hover/item:scale-105 transition-transform text-2xl">
                                  {m.store_logo ? <img className="w-full h-full object-cover" src={m.store_logo} /> : <span className="material-symbols-outlined">storefront</span>}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-base dark:text-white tracking-tight truncate group-hover/item:text-primary transition-colors">{m.store_name || 'Loja Sem Nome'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate group-hover/item:text-slate-500">{m.store_phone || m.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.document || 'S/ DOCUMENTO'}</p>
                              <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{m.store_address ? `${m.store_address}${m.address_number ? `, ${m.address_number}` : ''}${m.city ? ` - ${m.city}` : ''}` : 'Endereço não informado'}</p>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">COMISSÃO {m.commission_percent || appSettings.appCommission}%</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TAXA SERV: R$ {(m.service_fee || appSettings.serviceFee).toString().replace('.', ',')}</p>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <p className="text-sm font-black text-slate-900 dark:text-white">R$ {allOrders.filter(o => o.merchant_id === m.id && o.status === 'concluido').reduce((sum, o) => sum + (o.total_price || 0), 0).toFixed(2).replace('.', ',')}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{allOrders.filter(o => o.merchant_id === m.id).length} pedidos</p>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                m.status === 'active' || m.is_active
                                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                : m.status === 'suspended'
                                ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/10'
                                }`}>
                                <span className={`size-1.5 rounded-full ${
                                  (m.status === 'active' || m.is_active) ? 'bg-green-500' : m.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                                }`}></span>
                                {m.status === 'suspended' ? 'Suspenso' : (m.status === 'active' || m.is_active ? 'Ativo' : 'Inativo')}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {m.store_phone && (
                                  <button
                                    onClick={() => window.open(`https://wa.me/55${m.store_phone.replace(/\D/g, '')}`, '_blank')}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-100"
                                    title="Contato WhatsApp"
                                  >
                                    <span className="material-symbols-outlined text-lg">forum</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setEditingItem(m);
                                    setEditType('merchant');
                                  }}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-slate-900 transition-all shadow-sm"
                                  title="Editar Lojista"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateMerchantStatus(m.id, m.status === 'active' ? 'inactive' : 'active')}
                                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                                    m.status === 'active' ? 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'
                                  }`}
                                  title={m.status === 'active' ? 'Desativar Acesso' : 'Ativar Acesso'}
                                >
                                  <span className="material-symbols-outlined text-lg">{m.status === 'active' ? 'do_not_disturb_on' : 'check_circle'}</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateMerchantStatus(m.id, 'suspended')}
                                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                                    m.status === 'suspended' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-100'
                                  }`}
                                  title="Suspender Temporariamente"
                                >
                                  <span className="material-symbols-outlined text-lg">pause_circle</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteMerchant(m.id)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                  title="Excluir Lojista"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-8">
                {/* Support Header & Stats */}
                <div className="flex flex-wrap justify-between items-end gap-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Suporte Central</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Gerencie tickets e responda em tempo real para manter a alta satisfação.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                      <span className="material-symbols-outlined text-lg mr-2">download</span>
                      Exportar Relatório
                    </button>
                    <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-primary text-slate-900 hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-lg mr-2">add</span>
                      Abrir Novo Ticket
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Pendentes</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">24</p>
                    <div className="flex items-center text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">
                      <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                      12% aumento
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Média de Resposta</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">1h 45m</p>
                    <div className="flex items-center text-green-500 text-[10px] font-black uppercase tracking-widest mt-2">
                      <span className="material-symbols-outlined text-sm mr-1">timer</span>
                      8% melhoria
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">SLA Atendido</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tighter">94.2%</p>
                    <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mt-2">
                      <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                      Dentro da meta
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Tickets List Area */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-primary/10 overflow-hidden shadow-sm">
                      <div className="flex border-b border-primary/10 px-8 overflow-x-auto gap-8 bg-slate-50/50 dark:bg-slate-800/30">
                        {['Todos', 'Pagamentos', 'Entrega', 'Conta'].map((st, i) => (
                          <button key={st} className={`flex items-center justify-center border-b-2 h-16 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${i === 0 ? 'border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-400 hover:text-primary'}`}>
                            {st}
                          </button>
                        ))}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-primary/5">
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Prioridade</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary/5">
                            {[
                              { id: '#1024', name: 'João Silva', cat: 'Pagamento', prio: 'Alta', status: 'Pendente', time: '2h', color: 'bg-red-50 text-red-600' },
                              { id: '#1023', name: 'Maria Souza', cat: 'Entrega', prio: 'Média', status: 'Aberto', time: '4h', color: 'bg-amber-50 text-amber-600' },
                              { id: '#1021', name: 'Ana Oliveira', cat: 'Pagamento', prio: 'Crítica', status: 'Urgente', time: '6h', color: 'bg-red-500 text-white' },
                            ].map((tk, i) => (
                              <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                <td className="px-8 py-6">
                                  <span className="font-black text-sm dark:text-white">{tk.id}</span>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">há {tk.time}</p>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black uppercase">{tk.name.split(' ').map(n => n[0]).join('')}</div>
                                    <span className="text-sm font-bold dark:text-slate-200">{tk.name}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tk.color}`}>
                                    {tk.prio}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <span className="inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                    {tk.status}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <button className="text-primary hover:text-slate-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest underline transition-all">Visualizar</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-primary/5 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4 ativos de 128 totais</p>
                        <div className="flex gap-2">
                          <button className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                          </button>
                          <button className="size-8 rounded-lg bg-primary text-slate-900 text-xs font-black">1</button>
                          <button className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Support Tools */}
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-primary/10 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl"></div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">forum</span>
                        Resposta Rápida
                      </h3>
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ticket Destino</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 text-xs font-bold focus:ring-primary cursor-pointer">
                            <option>#1024 - João Silva (Pagamento)</option>
                            <option>#1023 - Maria Souza (Entrega)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mensagem</label>
                          <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-6 text-xs font-bold focus:ring-primary resize-none placeholder:text-slate-300" rows={4} placeholder="Escreva sua resposta..."></textarea>
                        </div>
                        <button className="w-full py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                          <span className="material-symbols-outlined text-lg">send</span>
                          Enviar Agora
                        </button>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] border border-primary/10 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Atividades
                      </h3>
                      <div className="space-y-6">
                        {[
                          { title: 'Ticket #1022 resolvido', user: 'Admin', time: '15m', icon: 'check_circle', color: 'bg-green-50 text-green-500' },
                          { title: 'Novo comentário #1024', user: 'João Silva', time: '42m', icon: 'comment', color: 'bg-blue-50 text-blue-500' },
                          { title: 'Criticidade elevada #1021', user: 'Sistema', time: '1h', icon: 'priority_high', color: 'bg-red-50 text-red-500' },
                        ].map((act, i) => (
                          <div key={i} className="flex gap-4 items-start group">
                            <div className={`size-8 rounded-xl ${act.color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                              <span className="material-symbols-outlined text-sm">{act.icon}</span>
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-slate-200 tracking-tight">{act.title}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Por: {act.user} • {act.time} atrás</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-8">
                {/* Finance Header & Filters */}
                <div className="flex flex-wrap justify-between items-end gap-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Relatórios de Faturamento</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base">Acompanhe a saúde financeira e o desempenho de vendas da plataforma.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                      <span className="material-symbols-outlined text-lg mr-2 text-slate-400">picture_as_pdf</span>
                      PDF
                    </button>
                    <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-primary text-slate-900 hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-lg mr-2">csv</span>
                      Exportar CSV
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Receita Total', val: `R$ ${(dashboardData.totalRevenue || 0).toFixed(2).replace('.', ',')}`, trend: '+12.5%', icon: 'payments', color: 'bg-primary/10 text-primary', trendCol: 'text-emerald-500' },
                    { label: 'Total de Pedidos', val: dashboardData.totalOrders || 0, trend: `+${(((dashboardData.completedOrdersCount || 0) / (dashboardData.totalOrders || 1)) * 100).toFixed(0)}%`, icon: 'shopping_cart', color: 'bg-blue-50 text-blue-500', trendCol: 'text-emerald-500' },
                    { label: 'Ticket Médio', val: `R$ ${(dashboardData.avgTicket || 0).toFixed(2).replace('.', ',')}`, trend: 'Estável', icon: 'confirmation_number', color: 'bg-purple-50 text-purple-500', trendCol: 'text-slate-500' },
                    { label: 'Lucro Líquido', val: `R$ ${(dashboardData.netProfit || 0).toFixed(2).replace('.', ',')}`, trend: `${appSettings.appCommission}%`, icon: 'account_balance', color: 'bg-emerald-50 text-emerald-500', trendCol: 'text-emerald-500' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${kpi.color}`}>
                          <span className="material-symbols-outlined">{kpi.icon}</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${kpi.trendCol} flex items-center gap-1`}>
                          <span className="material-symbols-outlined text-xs">{kpi.trend.startsWith('+') ? 'trending_up' : 'trending_down'}</span>
                          {kpi.trend}
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{kpi.val}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Trend Chart */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                      <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
                        Tendência de Receita
                      </h4>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-primary ring-4 ring-primary/10"></span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita</span>
                        </div>
                        <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-primary cursor-pointer">
                          <option>Últimos 30 Dias</option>
                          <option>Este Ano</option>
                        </select>
                      </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-1 px-4">
                      {(dashboardData.revenue30Days || []).map((val: number, i: number) => {
                        const maxVal = Math.max(...(dashboardData.revenue30Days || [1]), 1);
                        const h = (val / maxVal) * 100;
                        return (
                          <div key={i} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg relative group cursor-pointer">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              className={`absolute bottom-0 left-0 right-0 bg-primary/20 group-hover:bg-primary transition-all duration-300 rounded-t-lg`} 
                            ></motion.div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                              R$ {val.toFixed(0)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <span>Há 30 dias</span>
                      <span>15 dias</span>
                      <span>Hoje</span>
                    </div>
                  </div>

                  {/* Distribution Chart (Performance por Categoria) */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                         <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
                         Desempenho por Categoria
                       </h4>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Receita</span>
                    </div>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {dashboardData.categories?.map((svc: any, i: number) => (
                        <div key={i} className="group p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                               <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{svc.label}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{svc.val} pedidos realizados</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-emerald-500">R$ {svc.revenue.toFixed(2).replace('.', ',')}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{svc.percent.toFixed(1)}% do volume</p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${svc.percent}%` }}
                              className={`bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,217,0,0.3)]`}
                            ></motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">receipt_long</span>
                      Transações Recentes
                    </h4>
                    <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                      <input type="text" placeholder="Buscar por Order ID..." className="bg-transparent border-none text-[10px] font-bold px-4 py-2 w-48 focus:ring-0 placeholder:text-slate-300 dark:text-white" />
                      <button className="bg-primary text-slate-900 size-9 rounded-xl inline-flex items-center justify-center hover:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-xl">search</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {allOrders.slice(0, 10).map((tr) => (
                          <tr key={tr.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                              {new Date(tr.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                              #{tr.id.slice(0, 8)}
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {tr.service_type || 'Geral'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-700 dark:text-slate-300">{tr.user_name || 'Usuário'}</td>
                            <td className="px-8 py-6 text-sm font-black text-primary">R$ {tr.total_price?.toFixed(2).replace('.', ',')}</td>
                            <td className="px-8 py-6 text-right">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                tr.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                tr.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                <span className={`size-1.5 rounded-full ${tr.status === 'concluido' ? 'bg-emerald-500' : tr.status === 'cancelado' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                {tr.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando 1-4 de 2450 transações</p>
                    <div className="flex gap-2">
                      <button className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <button className="size-10 rounded-xl bg-primary text-slate-900 font-black text-xs">1</button>
                      <button className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'promotions' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

{/* â â Header â Â */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary">percent</span>
                      </div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Gestão de Promoções</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-1">Gerencie banners, cupons de desconto e campanhas ativas da plataforma.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setPromoFormType('banner'); setPromoForm({ title:'', description:'', image_url:'', coupon_code:'', discount_type:'percent', discount_value:10, min_order_value:0, max_usage:100, expires_at:'', is_active:true, is_vip:false }); setShowPromoForm(true); }}
                      className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                      Novo Banner
                    </button>
                    <button
                      onClick={() => { setPromoFormType('coupon'); setPromoForm({ title:'', description:'', image_url:'', coupon_code:'', discount_type:'percent', discount_value:10, min_order_value:0, max_usage:100, expires_at:'', is_active:true, is_vip:false }); setShowPromoForm(true); }}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">confirmation_number</span>
                      Criar Cupom
                    </button>
                  </div>
                </div>

{/* â â Stats â Â */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total de Promoções', val: promotionsList.length, icon: 'campaign', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
                    { label: 'Ativas', val: promotionsList.filter(p => p.is_active).length, icon: 'check_circle', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                    { label: 'Cupons', val: promotionsList.filter(p => p.coupon_code).length, icon: 'confirmation_number', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
                    { label: 'Banners', val: promotionsList.filter(p => p.image_url).length, icon: 'view_carousel', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
                      className={`bg-white dark:bg-slate-900 rounded-[28px] p-6 border ${s.bg} flex items-center gap-4`}>
                      <div className={`p-3 rounded-2xl ${s.bg.split(' ').slice(0,2).join(' ')}`}>
                        <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

{/* â â Filter Bar â Â */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                    {([
                      { id: 'all', label: 'Todos' },
                      { id: 'coupon', label: 'Cupons' },
                      { id: 'banner', label: 'Banners' },
                      { id: 'active', label: 'Ativos' },
                      { id: 'expired', label: 'Expirados' },
                    ] as { id: typeof promoFilter; label: string }[]).map(f => (
                      <button key={f.id} onClick={() => setPromoFilter(f.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${promoFilter === f.id ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                      type="text" value={promoSearch} onChange={e => setPromoSearch(e.target.value)}
                      placeholder="Buscar promoção ou cupom..."
                      className="pl-11 pr-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary dark:text-white w-72"
                    />
                  </div>
                </div>

{/* â â Inline Create Form â Â */}
                {showPromoForm && (
                  <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
                    className="bg-white dark:bg-slate-900 border border-primary/30 rounded-[40px] p-8 shadow-xl shadow-primary/5">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                          <span className="material-symbols-outlined text-primary">{promoFormType === 'coupon' ? 'confirmation_number' : 'add_photo_alternate'}</span>
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {promoFormType === 'coupon' ? 'Criar Cupom de Desconto' : 'Criar Banner Promocional'}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preencha os campos abaixo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {promoSaveStatus !== 'idle' && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                            promoSaveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600' :
                            promoSaveStatus === 'saving' ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'}`}>
                            <span className={`material-symbols-outlined text-xs ${promoSaveStatus === 'saving' ? 'animate-spin' : ''}`}>
                              {promoSaveStatus === 'saved' ? 'check_circle' : promoSaveStatus === 'saving' ? 'sync' : 'error'}
                            </span>
                            {promoSaveStatus === 'saved' ? 'Salvo' : promoSaveStatus === 'saving' ? 'Salvando...' : 'Erro'}
                          </span>
                        )}
                        <button
                          onClick={() => setShowPromoForm(false)}
                          className="size-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título *</label>
                        <input type="text" value={promoForm.title}
                          onChange={e => autoSavePromo({...promoForm, title: e.target.value})}
                          placeholder="Ex: Frete Grátis no Fim de Semana"
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                        <input type="text" value={promoForm.description}
                          onChange={e => autoSavePromo({...promoForm, description: e.target.value})}
                          placeholder="Válido apenas para primeiros pedidos"
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
                      </div>

                      {promoFormType === 'coupon' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código do Cupom *</label>
                            <input type="text" value={promoForm.coupon_code}
                              onChange={e => autoSavePromo({...promoForm, coupon_code: e.target.value.toUpperCase()})}
                              placeholder="EX: FRETE10"
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-black text-sm tracking-widest focus:ring-2 focus:ring-primary dark:text-white font-mono" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Desconto</label>
                            <div className="flex gap-2">
                              <button onClick={() => setPromoForm({...promoForm, discount_type: 'percent'})}
                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${promoForm.discount_type === 'percent' ? 'bg-primary text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                                % Percentual
                              </button>
                              <button onClick={() => setPromoForm({...promoForm, discount_type: 'fixed'})}
                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${promoForm.discount_type === 'fixed' ? 'bg-primary text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}`}>
                                R$ Fixo
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Valor do Desconto ({promoForm.discount_type === 'percent' ? '%' : 'R$'})
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                                {promoForm.discount_type === 'percent' ? '%' : 'R$'}
                              </span>
                              <input type="number" min="0" max={promoForm.discount_type === 'percent' ? 100 : 999}
                                value={promoForm.discount_value}
                                onChange={e => autoSavePromo({...promoForm, discount_value: parseFloat(e.target.value)||0})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-xl focus:ring-2 focus:ring-primary dark:text-white" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pedido Mínimo (R$)</label>
                            <input type="number" min="0" value={promoForm.min_order_value}
                              onChange={e => autoSavePromo({...promoForm, min_order_value: parseFloat(e.target.value)||0})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite de Usos</label>
                            <input type="number" min="1" value={promoForm.max_usage}
                              onChange={e => autoSavePromo({...promoForm, max_usage: parseInt(e.target.value)||1})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
                          </div>
                        </>
                      )}

                      {promoFormType === 'banner' && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Imagem do Banner *</label>
                          <input type="text" value={promoForm.image_url}
                            onChange={e => autoSavePromo({...promoForm, image_url: e.target.value})}
                            placeholder="https://exemplo.com/banner.jpg"
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
                          {promoForm.image_url && (
                            <div className="mt-3 rounded-2xl overflow-hidden aspect-video max-h-40 border border-slate-100 dark:border-slate-700">
                              <img src={promoForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Expiração</label>
                        <input type="date" value={promoForm.expires_at}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => autoSavePromo({...promoForm, expires_at: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <div className="flex items-center gap-3 h-[58px] bg-slate-50 dark:bg-slate-800 rounded-2xl px-5">
                          <button onClick={() => autoSavePromo({...promoForm, is_active: !promoForm.is_active})}
                            className={`w-12 h-7 rounded-full relative transition-all ${promoForm.is_active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`absolute top-1 size-5 bg-white rounded-full shadow-md transition-all ${promoForm.is_active ? 'right-1' : 'left-1'}`}></div>
                          </button>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{promoForm.is_active ? 'Ativo' : 'Inativo'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Oferta VIP</label>
                        <div className="flex items-center gap-3 h-[58px] bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 border-2 border-transparent hover:border-amber-500/20 transition-all">
                          <button onClick={() => autoSavePromo({...promoForm, is_vip: !promoForm.is_vip})}
                            className={`w-12 h-7 rounded-full relative transition-all ${promoForm.is_vip ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                            <div className={`absolute top-1 size-5 bg-white rounded-full shadow-md transition-all ${promoForm.is_vip ? 'right-1' : 'left-1'}`}></div>
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none">VIP Exclusive</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Destaque especial</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                      <button onClick={() => setShowPromoForm(false)}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                        Cancelar
                      </button>
                      <button
                        onClick={() => savePromotion(promoForm)}
                        disabled={promoSaving || !promoForm.title || (promoFormType === 'coupon' && !promoForm.coupon_code) || (promoFormType === 'banner' && !promoForm.image_url)}
                        className="px-8 py-3 bg-primary text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50">
                        <span className={`material-symbols-outlined text-base ${promoSaving ? 'animate-spin' : ''}`}>{promoSaving ? 'sync' : 'check_circle'}</span>
                        {promoSaving ? 'Publicando...' : promoFormType === 'coupon' ? 'Publicar Cupom' : 'Publicar Banner'}
                      </button>
                    </div>
                  </motion.div>
                )}

{/* â â Banners Grid â Â */}
                {(promoFilter === 'all' || promoFilter === 'banner' || promoFilter === 'active' || promoFilter === 'expired') && (() => {
                  const banners = promotionsList.filter(p => {
                    if (!p.image_url) return false;
                    if (promoFilter === 'active') return p.is_active;
                    if (promoFilter === 'expired') return p.expires_at && new Date(p.expires_at) < new Date();
                    if (promoSearch) return p.title?.toLowerCase().includes(promoSearch.toLowerCase());
                    return true;
                  });
                  if (!banners.length) return null;
                  return (
                    <div className="space-y-5">
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-500">view_carousel</span>
                        Banners Promocionais
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{banners.length}</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banners.map((bn ,i) => (
                          <motion.div key={bn.id || i} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.05 }}
                            className={`bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden group shadow-sm hover:shadow-lg transition-all ${!bn.is_active ? 'opacity-60' : ''}`}>
                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                              <img src={bn.image_url} alt={bn.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${bn.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}>
{bn.is_active ? ' â Ativo' : ' â â Inativo'}
                                </span>
                              </div>
                            </div>
                            <div className="p-5">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">{bn.title}</h3>
                              {bn.description && <p className="text-[11px] font-bold text-slate-400 mb-3">{bn.description}</p>}
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                <span className="material-symbols-outlined text-xs">calendar_month</span>
                                Expira: {bn.expires_at ? new Date(bn.expires_at).toLocaleDateString('pt-BR') : 'Sem data'}
                              </div>
                              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex gap-2">
                                  <button onClick={async () => { setPromoFormType('banner'); setPromoForm({...bn, expires_at: bn.expires_at?.slice(0,10)||''}); setShowPromoForm(true); }}
                                    className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">edit</span>
                                  </button>
                                  <button onClick={async () => { if(await showConfirm({ message: 'Excluir banner?' })) { await supabase.from('promotions_delivery').delete().eq('id', bn.id); fetchPromotions(); }}}
                                    className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </div>
                                <button onClick={async () => { await supabase.from('promotions_delivery').update({ is_active: !bn.is_active }).eq('id', bn.id); fetchPromotions(); }}
                                  className={`w-11 h-6 rounded-full relative transition-all ${bn.is_active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                  <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${bn.is_active ? 'right-1' : 'left-1'}`}></div>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

{/* â â Coupons Table â Â */}
                {(promoFilter === 'all' || promoFilter === 'coupon' || promoFilter === 'active' || promoFilter === 'expired') && (() => {
                  const coupons = promotionsList.filter(p => {
                    if (!p.coupon_code) return false;
                    if (promoFilter === 'active') return p.is_active;
                    if (promoFilter === 'expired') return p.expires_at && new Date(p.expires_at) < new Date();
                    if (promoSearch) return p.coupon_code?.toLowerCase().includes(promoSearch.toLowerCase()) || p.title?.toLowerCase().includes(promoSearch.toLowerCase());
                    return true;
                  });
                  if (!coupons.length) return null;
                  return (
                    <div className="space-y-5">
                      <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-500">confirmation_number</span>
                        Cupons de Desconto
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{coupons.length}</span>
                      </h2>
                      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Desconto</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido Mín.</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expira</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usos</th>
                                <th className="px-8 py-5"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {coupons.map((cp, i) => {
                                const usagePct = Math.min(100, Math.round(((cp.usage_count||0) / (cp.max_usage || 100)) * 100));
                                const isExpired = cp.expires_at && new Date(cp.expires_at) < new Date();
                                return (
                                  <tr key={cp.id || i} className="hover:bg-primary/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                      <button onClick={() => navigator.clipboard.writeText(cp.coupon_code)}
                                        className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-primary font-black text-xs tracking-widest border border-primary/10 shadow-sm hover:bg-primary hover:text-slate-900 transition-all group/code flex items-center gap-1"
                                        title="Clique para copiar">
                                        {cp.coupon_code}
                                        <span className="material-symbols-outlined text-[10px] opacity-0 group-hover/code:opacity-100 transition-opacity">content_copy</span>
                                      </button>
                                    </td>
                                    <td className="px-8 py-5">
                                      <p className="text-sm font-black text-slate-900 dark:text-white">{cp.title}</p>
                                      <p className="text-[10px] font-bold text-primary mt-0.5">
                                        {cp.discount_type === 'fixed' ? `R$ ${cp.discount_value?.toFixed(2)} de desconto` : `${cp.discount_value}% OFF`}
                                      </p>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                      {cp.min_order_value > 0 ? `R$ ${cp.min_order_value?.toFixed(2)}` : <span className="text-slate-300">Sem mínimo</span>}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        isExpired ? 'bg-red-50 text-red-500 border border-red-100' :
                                        cp.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                                        'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                        <span className="size-1.5 rounded-full bg-current"></span>
                                        {isExpired ? 'Expirado' : cp.is_active ? 'Ativo' : 'Inativo'}
                                      </span>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                      {cp.expires_at ? new Date(cp.expires_at).toLocaleDateString('pt-BR') : <span className="text-slate-300">Sem data</span>}
                                    </td>
                                    <td className="px-8 py-5">
                                      <div className="flex items-center gap-3 min-w-[100px]">
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-400' : usagePct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${usagePct}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{cp.usage_count||0}/{cp.max_usage||100}</span>
                                      </div>
                                    </td>
                                    <td className="px-8 py-5">
                                      <div className="flex items-center gap-2 justify-end">
                                        <button onClick={async () => { setPromoFormType('coupon'); setPromoForm({...cp, expires_at: cp.expires_at?.slice(0,10)||''}); setShowPromoForm(true); }}
                                          className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors flex items-center justify-center">
                                          <span className="material-symbols-outlined text-base">edit</span>
                                        </button>
                                        <button onClick={async () => { await supabase.from('promotions_delivery').update({ is_active: !cp.is_active }).eq('id', cp.id); fetchPromotions(); }}
                                          className={`w-11 h-6 rounded-full relative transition-all ${cp.is_active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                          <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${cp.is_active ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                        <button onClick={async () => { if(await showConfirm({ message: 'Excluir cupom?' })) { await supabase.from('promotions_delivery').delete().eq('id', cp.id); fetchPromotions(); }}}
                                          className="size-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                                          <span className="material-symbols-outlined text-base">delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Empty state */}
                {promotionsList.length === 0 && !showPromoForm && (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4 block">campaign</span>
                    <p className="text-lg font-black text-slate-400">Nenhuma promoção criada ainda</p>
                    <p className="text-sm font-bold text-slate-300 mt-1">Crie seu primeiro cupom ou banner acima</p>
                  </div>
                )}

                {/* IZI FLASH */}
                {(userRole === 'admin' || userRole === 'merchant') && (
                  <FlashOffersSection 
                    supabase={supabase} 
                    userRole={userRole} 
                    merchantId={userRole === 'merchant' ? merchantProfile?.merchant_id : undefined} 
                  />
                )}

              </div>
            )}

            {activeTab === 'izi_black' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
                      </div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Izi Black VIP</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-1">Gerencie benefícios, membros e configurações globais do programa VIP.</p>
                  </div>
                </div>

                {/* VIP Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Membros', val: usersList.filter(u => u.is_izi_black).length, icon: 'group', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
                    { label: 'Recompensas Ativas', val: promotionsList.filter(p => p.is_vip && p.is_active).length, icon: 'redeem', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                    { label: 'Receita Est. (Mensal)', val: `R$ ${(usersList.filter(u => u.is_izi_black).length * appSettings.iziBlackFee).toFixed(2).replace('.', ',')}`, icon: 'payments', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
                    { label: 'Cashback Distribuído', val: `R$ ${usersList.reduce((acc, u) => acc + (u.cashback_earned || 0), 0).toFixed(0)}`, icon: 'monetization_on', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
                  ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
                      className={`bg-white dark:bg-slate-900 rounded-[28px] p-6 border ${s.bg} flex items-center gap-4 shadow-sm`}>
                      <div className={`p-3 rounded-2xl ${s.bg.split(' ').slice(0,2).join(' ')}`}>
                        <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Global VIP Configuration */}
                  <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-500">settings</span>
                      Configuração do Programa
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço da Assinatura (Mês)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                          <input type="number" step="0.01" 
                            value={appSettings.iziBlackFee}
                            onChange={e => setAppSettings({ ...appSettings, iziBlackFee: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa de Cashback (%)</label>
                        <div className="relative">
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          <input type="number" 
                            value={appSettings.iziBlackCashback}
                            onChange={e => setAppSettings({ ...appSettings, iziBlackCashback: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min. Pedido Frete Grátis</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                          <input type="number" 
                            value={appSettings.iziBlackMinOrderFreeShipping}
                            onChange={e => setAppSettings({ ...appSettings, iziBlackMinOrderFreeShipping: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
                        </div>
                      </div>

                      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                         <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500/80 uppercase tracking-widest leading-relaxed">
                           As alterações entram em vigor imediatamente para todos os membros ativos.
                         </p>
                      </div>
                    </div>
                  </div>

                  {/* VIP Exclusive Rewards (Surprises) */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-500">card_giftcard</span>
                        Recompensas e Surpresas VIP
                      </h3>
                      <button 
                        onClick={() => { setPromoFormType('coupon'); setPromoForm({ title:'', description:'', image_url:'', coupon_code:'', discount_type:'percent', discount_value:10, min_order_value:0, max_usage:100, expires_at:'', is_active:true, is_vip:true }); setShowPromoForm(true); setActiveTab('promotions'); }}
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                        <span className="material-symbols-outlined text-lg">add</span>
                        Nova Recompensa
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                      {promotionsList.filter(p => p.is_vip).map((p, i) => (
                        <div key={p.id || i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-amber-500/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-2xl flex items-center justify-center ${p.image_url ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                              <span className="material-symbols-outlined text-xl">{p.image_url ? 'view_carousel' : 'confirmation_number'}</span>
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white">{p.title}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                  {p.coupon_code || 'Banner Exclusivo'}
                                </span>
                                <span className="size-1 rounded-full bg-slate-300"></span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${p.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {p.is_active ? 'Ativo' : 'Pausado'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setPromoFormType(p.coupon_code ? 'coupon' : 'banner'); setPromoForm(p); setShowPromoForm(true); setActiveTab('promotions'); }} className="size-9 rounded-xl bg-white dark:bg-slate-700 text-slate-400 hover:text-primary transition-colors flex items-center justify-center shadow-sm">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {promotionsList.filter(p => p.is_vip).length === 0 && (
                        <div className="text-center py-20 opacity-40">
                          <span className="material-symbols-outlined text-6xl mb-4 block text-slate-300">stars</span>
                          <p className="text-sm font-black uppercase tracking-widest">Nenhuma recompensa VIP configurada</p>
                          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Clique no botão acima para criar banners ou cupons exclusivos para membros.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gestão de Pedidos de Assinatura */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="material-symbols-outlined text-blue-500">history_edu</span>
                      Fila de Ativação (Pedidos de Assinatura)
                    </h3>
                    <button 
                      onClick={() => fetchSubscriptionOrders(1)}
                      className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">sync</span>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status Pgto</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {subscriptionOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50">
                               Nenhuma assinatura pendente no momento
                            </td>
                          </tr>
                        ) : (
                          subscriptionOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-8 py-6">
                                 <p className="font-black text-slate-900 dark:text-white text-sm">{o.user_name || 'Cliente'}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {o.id.slice(0,8).toUpperCase()}</p>
                              </td>
                              <td className="px-8 py-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  o.status === 'concluido' ? 'bg-green-100 text-green-600 border border-green-200' :
                                  'bg-amber-100 text-amber-600 border border-amber-200'
                                }`}>
                                  {o.status === 'concluido' ? 'Pago & Ativo' : 'Aguardando'}
                                </span>
                              </td>
                              <td className="px-8 py-6 font-black text-slate-900 dark:text-white">R$ {(o.total_price || 0).toFixed(2).replace('.', ',')}</td>
                              <td className="px-8 py-6 font-bold text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  {o.status !== 'concluido' && (
                                    <button 
                                      onClick={() => handleConfirmSubscriptionPayment(o)}
                                      className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                      Confirmar Pgto
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteOrder(o.id)}
                                    className="size-10 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-500/20"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação Assinaturas */}
                  {subscriptionOrdersTotalCount > ORDERS_PER_PAGE && (
                    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Página {subscriptionOrdersPage} de {Math.ceil(subscriptionOrdersTotalCount / ORDERS_PER_PAGE)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={subscriptionOrdersPage <= 1 || isLoadingList}
                          onClick={() => fetchSubscriptionOrders(subscriptionOrdersPage - 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                          disabled={subscriptionOrdersPage >= Math.ceil(subscriptionOrdersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                          onClick={() => fetchSubscriptionOrders(subscriptionOrdersPage + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Categories Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Ecosistema de Serviços</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie as modalidades de mobilidade e serviços de entrega.</p>
                  </div>
                  
                  {/* Segment Switcher */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-inner">
                    {[
                      { id: 'all', label: 'Todos', icon: 'grid_view' },
                      { id: 'mobility', label: 'Mobilidade', icon: 'directions_car' },
                      { id: 'service', label: 'Serviços', icon: 'shopping_bag' }
                    ].map((seg) => (
                      <button
                        key={seg.id}
                        onClick={() => setCategoryGroupFilter(seg.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                          categoryGroupFilter === seg.id 
                          ? 'bg-white dark:bg-slate-700 text-primary shadow-lg ring-1 ring-black/5' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{seg.icon}</span>
                        {seg.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    {categoriesState.length === 0 && (
                      <button
                        onClick={handleSeedCategories}
                        className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                        Configuração Inicial
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCategoryStudio({ 
                          id: `new-${Date.now()}`, 
                          name: '', 
                          description: '', 
                          icon: 'category', 
                          type: categoryGroupFilter === 'all' ? 'service' : categoryGroupFilter, 
                          is_active: true 
                        });
                        setActiveStudioTab('general');
                      }}
                      className="flex items-center gap-3 bg-primary text-slate-900 px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Nova Categoria
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Categorias', val: categoriesState.length.toString().padStart(2, '0'), icon: 'layers', color: 'bg-primary/10 text-primary', clickable: true },
                    { label: 'Ativas', val: categoriesState.filter(c => c.is_active).length.toString().padStart(2, '0'), icon: 'check_circle', color: 'bg-emerald-50 text-emerald-500' },
                    { label: 'Inativas', val: categoriesState.filter(c => !c.is_active).length.toString().padStart(2, '0'), icon: 'cancel', color: 'bg-slate-100 text-slate-400' },
                    { label: 'Novas (Mês)', val: '+1', icon: 'fiber_new', color: 'bg-blue-50 text-blue-500' },
                  ].map((stat, i) => (
                    <div 
                      key={i} 
                      onClick={() => stat.clickable && setShowCategoryListModal(true)}
                      className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group ${stat.clickable ? 'cursor-pointer hover:border-primary transition-all hover:shadow-lg' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${stat.color}`}>
                          <span className="material-symbols-outlined">{stat.icon}</span>
                        </div>
                        {stat.clickable && <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">open_in_new</span>}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{stat.val}</h3>
                    </div>
                  ))}
                </div>

                {/* Categories Grid (Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {categoriesState
                    .filter(c => !c.parent_id)
                    .filter(c => categoryGroupFilter === 'all' || (c.type || 'service') === categoryGroupFilter)
                    .map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-slate-900 rounded-[48px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden"
                    >
                      {/* Decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>

                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl overflow-hidden group-hover:scale-110 transition-transform">
                          {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/') || cat.icon.length > 50) ? (
                            <img src={cat.icon} className="size-full object-contain p-2" alt={cat.name} />
                          ) : (
                            <span className="material-symbols-outlined text-4xl font-bold">{cat.icon || 'category'}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedCategoryStudio(cat); setActiveStudioTab('general'); }}
                            className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (await showConfirm({ message: 'Excluir esta categoria e todas as suas subcategorias?' })) {
                                const { error } = await supabase.from('categories_delivery').delete().eq('id', cat.id);
                                if (!error) fetchCategories();
                              }
                            }}
                            className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="mb-8 relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{cat.name}</h3>
                          <div className={`size-2 rounded-full ${cat.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${
                            (cat.type || 'service') === 'mobility' 
                            ? 'bg-blue-50 text-blue-500 border-blue-100' 
                            : 'bg-amber-50 text-amber-500 border-amber-100'
                          }`}>
{(cat.type || 'service') === 'mobility' ? ' ƒ ÃÂÃÂ â Mobilidade' : ' Serviço'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          {cat.description || cat.desc || 'Nenhuma descrição informada para esta categoria principal.'}
                        </p>
                      </div>

                      {/* Subcategories Area */}
                      <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-[32px] p-6 mb-8 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subcategorias ({categoriesState.filter(s => s.parent_id === cat.id).length})</span>
                          <button 
                            onClick={() => {
                              setSelectedCategoryStudio(cat);
                              setActiveStudioTab('subcategories');
                            }}
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Adicionar
                          </button>
                        </div>
                        
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                          {categoriesState.filter(s => s.parent_id === cat.id).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group/sub">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sub.name}</span>
                              <div className="flex gap-2 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <button onClick={() => { setSelectedCategoryStudio(cat); setActiveStudioTab('subcategories'); }} className="text-slate-400 hover:text-primary transition-colors">
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button onClick={async () => { if(await showConfirm({ message: 'Excluir?' })) await supabase.from('categories_delivery').delete().eq('id', sub.id); fetchCategories(); }} className="text-slate-400 hover:text-red-500 transition-colors">
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            </div>
                          ))}
                          {categoriesState.filter(s => s.parent_id === cat.id).length === 0 && (
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-4 italic">Nenhuma subcategoria</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${cat.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {cat.is_active ? 'Habilitado' : 'Desabilitado'}
                          </span>
                        </div>
                        <button 
                          onClick={async () => {
                            await supabase.from('categories_delivery').update({ is_active: !cat.is_active }).eq('id', cat.id);
                            fetchCategories();
                          }}
                          className={`w-12 h-6 rounded-full relative transition-all ${cat.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-1 size-4 bg-white rounded-full shadow-sm transition-all ${cat.is_active ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'dynamic_rates' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                {/* Dynamic Rates Pro Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 -mr-32 -mt-32 rounded-full blur-3xl"></div>
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Motor de Preços v4.0</span>
                    </div>
<h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Gestão de Taxas Dinâmicas</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-2xl">Refine a economia do seu marketplace ajustando multiplicadores em tempo real para equilibrar oferta e demanda.</p>
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <button
                      onClick={() => fetchDynamicRates()}
                      className="group flex items-center justify-center gap-3 px-8 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                    >
                      <span className="material-symbols-outlined transition-transform group-hover:rotate-180">restart_alt</span>
                      Descartar
                    </button>
                    <button
                      onClick={saveDynamicRates}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-3 px-12 h-16 bg-primary text-slate-900 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">{isSaving ? 'sync' : 'verified'}</span>
                      {isSaving ? 'Salvando...' : 'Publicar Alterações'}
                    </button>
                  </div>
                </div>

                {/* Market Pulse & Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl">
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#ffd900,transparent_70%)]"></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-1">Pulso do Mercado</h3>
                        <p className="text-slate-400 text-sm font-bold">Equilíbrio da Operação em Tempo Real</p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 mt-12 relative z-10">
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ratio Atual (D/O)</p>
                         <h4 className="text-4xl font-black">{(stats.onlineDrivers / (allOrders.filter(o => o.status === 'pendente').length || 1)).toFixed(2)}</h4>
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Surge Sugerido</p>
                         <h4 className="text-4xl font-black text-primary">1.25x</h4>
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo de Espera Clientes</p>
                         <h4 className="text-4xl font-black">8.5 min</h4>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[48px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">rocket_launch</span>
                      Controle de Fluxo
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                         <div className="flex flex-col">
<span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Modo Dinâmico Automático</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{dynamicRatesState.flowControl.mode === 'auto' ? 'IA ativa monitorando oferta/demanda' : 'Modo manual habilitado'}</span>
                         </div>
                         <button 
                           onClick={() => {
                             const newFlow: { mode: 'auto' | 'manual', highDemandActive: boolean } = { ...dynamicRatesState.flowControl, mode: dynamicRatesState.flowControl.mode === 'auto' ? 'manual' : 'auto' };
                             setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                             saveSpecificRateMetadata('flow_control', newFlow);
                           }}
                           className={`w-12 h-7 rounded-full relative shadow-lg transition-all ${dynamicRatesState.flowControl.mode === 'auto' ? 'bg-primary shadow-primary/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                         >
                            <div className={`absolute top-1 size-5 bg-white rounded-full transition-all ${dynamicRatesState.flowControl.mode === 'auto' ? 'right-1' : 'left-1'}`}></div>
                         </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                         <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Modo de Alta Demanda</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Forçar surge em todo o mapa</span>
                         </div>
                         <button 
                           onClick={() => {
                             const newFlow = { ...dynamicRatesState.flowControl, highDemandActive: !dynamicRatesState.flowControl.highDemandActive };
                             setDynamicRatesState({ ...dynamicRatesState, flowControl: newFlow });
                             saveSpecificRateMetadata('flow_control', newFlow);
                           }}
                           className={`w-12 h-7 rounded-full relative transition-all ${dynamicRatesState.flowControl.highDemandActive ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-slate-200 dark:bg-slate-700'}`}
                         >
                            <div className={`absolute top-1 size-5 bg-white rounded-full transition-all ${dynamicRatesState.flowControl.highDemandActive ? 'right-1' : 'left-1'}`}></div>
                         </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Rules Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  
                  {/* Valores Base de Precificação */}
                  <section className="bg-white dark:bg-slate-900 px-6 py-10 sm:p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm col-span-1 xl:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                          <span className="material-symbols-outlined font-black text-2xl">universal_currency_alt</span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Preços Base p/ Categorias</h2>
<p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Taxas por distância e serviço</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 pr-4 rounded-[28px] border border-slate-100 dark:border-slate-700">
<span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Usar Preços Dinâmicos</span>
                         <button 
                           onClick={() => {
                             const newBase = { ...dynamicRatesState.baseValues, isDynamicActive: !dynamicRatesState.baseValues.isDynamicActive };
                             setDynamicRatesState(prev => ({ ...prev, baseValues: newBase }));
                             saveSpecificRateMetadata('base_values', {
                                mototaxi_min: parseFloat(newBase.mototaxi_min.replace(',', '.')),
                                mototaxi_km: parseFloat(newBase.mototaxi_km.replace(',', '.')),
                                carro_min: parseFloat(newBase.carro_min.replace(',', '.')),
                                carro_km: parseFloat(newBase.carro_km.replace(',', '.')),
                                van_min: parseFloat(newBase.van_min.replace(',', '.')),
                                van_km: parseFloat(newBase.van_km.replace(',', '.')),
                                utilitario_min: parseFloat(newBase.utilitario_min.replace(',', '.')),
                                utilitario_km: parseFloat(newBase.utilitario_km.replace(',', '.')),
                                isDynamicActive: newBase.isDynamicActive
                             });
                           }}
                           className={`w-14 h-8 rounded-full relative shadow-lg transition-all ${dynamicRatesState.baseValues.isDynamicActive ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                         >
                            <div className={`absolute top-1 size-6 bg-white rounded-full transition-all ${dynamicRatesState.baseValues.isDynamicActive ? 'right-1' : 'left-1'}`}></div>
                         </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { title: 'MotoTáxi', minKey: 'mototaxi_min', kmKey: 'mototaxi_km' },
                        { title: 'Carro Executivo', minKey: 'carro_min', kmKey: 'carro_km' },
                        { title: 'Entrega Express', minKey: 'utilitario_min', kmKey: 'utilitario_km' },
                        { title: 'Van de Transporte', minKey: 'van_min', kmKey: 'van_km' }
                      ].map((cat) => (
                        <div key={cat.title} className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-3">
                             <div className="size-10 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-sm text-primary">category</span></div>
                             <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{cat.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="space-y-1 relative group w-1/2 xl:w-28">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Taxa Mínima</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={(dynamicRatesState.baseValues as any)[cat.minKey]}
                                  onChange={(e) => {
                                      const newBase = { ...dynamicRatesState.baseValues };
                                      (newBase as any)[cat.minKey] = e.target.value;
                                      setDynamicRatesState(prev => ({ ...prev, baseValues: newBase }));
                                  }}
                                  className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-lg rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                              </div>
                            </div>
                            <div className="space-y-1 relative group w-1/2 xl:w-28">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Por KM</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={(dynamicRatesState.baseValues as any)[cat.kmKey]}
                                  onChange={(e) => {
                                      const newBase = { ...dynamicRatesState.baseValues };
                                      (newBase as any)[cat.kmKey] = e.target.value;
                                      setDynamicRatesState(prev => ({ ...prev, baseValues: newBase }));
                                  }}
                                  className="w-full text-right bg-white dark:bg-slate-900 border-none outline-none font-black text-primary text-lg rounded-2xl py-3 px-4 shadow-inner focus:ring-2 focus:ring-primary/20 transition-all pr-[35px]"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">R$</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Equilíbrio de Marketplace Section */}
                  <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 -mr-24 -mt-24 rounded-full blur-3xl"></div>
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 border border-blue-100">
                        <span className="material-symbols-outlined font-black text-2xl">balance</span>
                      </div>
                      <div>
                         <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Equilíbrio do Dynamic Logic</h2>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Sensibilidade do algoritmo</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-4">
                             <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Gatilho de Saturação (Threshold)</label>
                             <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full text-xs">{dynamicRatesState.equilibrium.threshold}x Ratio</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="3.0" step="0.1"
                            value={dynamicRatesState.equilibrium.threshold}
                            onChange={(e) => {
                              const newEqui = { ...dynamicRatesState.equilibrium, threshold: parseFloat(e.target.value) };
                              setDynamicRatesState(prev => ({ ...prev, equilibrium: newEqui }));
                              saveSpecificRateMetadata('equilibrium', newEqui);
                            }}
                            className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 font-bold px-4 leading-relaxed uppercase tracking-tighter">Define o ponto onde o preço começa a subir. Recomendado: 1.2x</p>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-4">
                             <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Sensibilidade (Aggressiveness)</label>
                             <span className="bg-amber-100 text-amber-700 font-black px-3 py-1 rounded-full text-xs">{dynamicRatesState.equilibrium.sensitivity}x</span>
                          </div>
                          <input 
                            type="range" min="1.0" max="5.0" step="0.5"
                            value={dynamicRatesState.equilibrium.sensitivity}
                            onChange={(e) => {
                              const newEqui = { ...dynamicRatesState.equilibrium, sensitivity: parseFloat(e.target.value) };
                              setDynamicRatesState(prev => ({ ...prev, equilibrium: newEqui }));
                              saveSpecificRateMetadata('equilibrium', newEqui);
                            }}
                            className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 font-bold px-4 leading-relaxed uppercase tracking-tighter">Aumentos mais rápidos conforme a demanda cresce linearmente.</p>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-4">
                             <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Teto Máximo (Hard Cap)</label>
                             <span className="bg-red-100 text-red-700 font-black px-3 py-1 rounded-full text-xs">{dynamicRatesState.equilibrium.maxSurge}x Valor</span>
                          </div>
                          <input 
                            type="range" min="2.0" max="10.0" step="1.0"
                            value={dynamicRatesState.equilibrium.maxSurge}
                            onChange={(e) => {
                              const newEqui = { ...dynamicRatesState.equilibrium, maxSurge: parseFloat(e.target.value) };
                              setDynamicRatesState(prev => ({ ...prev, equilibrium: newEqui }));
                              saveSpecificRateMetadata('equilibrium', newEqui);
                            }}
                            className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                          />
                       </div>
                    </div>
                  </section>

                  {/* Horários de Pico */}
                  <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-primary/10 text-primary border border-primary/20">
                          <span className="material-symbols-outlined font-black text-2xl">schedule</span>
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Horários de Pico</h2>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Multiplicadores automáticos</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsAddingPeakRule(true)}
                        className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                      >
                        <span className="material-symbols-outlined font-black">add</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {dynamicRatesState.peakHours.map((rule, idx) => (
                        <div key={rule.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-slate-900 dark:text-white">{rule.label}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Janela Diária Ativa</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="relative group">
                              <input
                                type="number" step="0.1"
                                value={rule.multiplier}
                                onChange={(e) => {
                                  const newPeak = [...dynamicRatesState.peakHours];
                                  newPeak[idx].multiplier = parseFloat(e.target.value);
                                  setDynamicRatesState({ ...dynamicRatesState, peakHours: newPeak });
                                }}
                                className="w-20 bg-white dark:bg-slate-900 border-none rounded-xl text-center font-black text-sm py-3 text-primary focus:ring-2 focus:ring-primary shadow-sm"
                              />
                               <span className="absolute -top-2 -right-2 size-5 bg-primary text-slate-900 rounded-full text-[8px] font-black flex items-center justify-center shadow-md">x</span>
                            </div>
                            <button
                              onClick={() => {
                                const newPeak = [...dynamicRatesState.peakHours];
                                newPeak[idx].active = !newPeak[idx].active;
                                setDynamicRatesState({ ...dynamicRatesState, peakHours: newPeak });
                              }}
                              className={`w-14 h-8 rounded-full relative transition-all ${rule.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                              <div className={`absolute top-1 size-6 bg-white rounded-full shadow-md transition-all ${rule.active ? 'right-1' : 'left-1'}`}></div>
                            </button>
                            <button 
                              onClick={() => handleRemovePeakRule(rule.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                               <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Zonas de Alta Demanda */}
                  <section className="bg-white dark:bg-slate-900 p-10 rounded-[56px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-indigo-50 text-indigo-500 border border-indigo-100">
                          <span className="material-symbols-outlined font-black text-2xl">near_me</span>
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Zonas de Alta Demanda</h2>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Geofencing & Taxas Fixas</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedZoneForMap('new')}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline flex items-center gap-1 group"
                      >
                         Adicionar Zona
                         <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">map</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {dynamicRatesState.zones.map((zone, idx) => (
                        <div key={zone.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/z hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="size-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1 shadow-sm group-hover/z:scale-110 transition-transform">
                              <img src={`https://picsum.photos/seed/map${zone.id}/200/200`} className="w-full h-full object-cover rounded-xl grayscale group-hover/z:grayscale-0 transition-all" alt="Zone" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{zone.label}</span>
                              <div className="flex items-center gap-2">
                                 <span className="size-1.5 rounded-full bg-indigo-500"></span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acréscimo fixo ativado</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0">
                            <div className="relative group">
                              <input
                                type="text"
                                value={zone.fee}
                                onChange={(e) => {
                                  const newZones = [...dynamicRatesState.zones];
                                  newZones[idx].fee = e.target.value;
                                  setDynamicRatesState({ ...dynamicRatesState, zones: newZones });
                                }}
                                className="w-24 bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 font-black text-primary text-sm shadow-sm focus:ring-2 focus:ring-primary/20 text-right pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">R$</span>
                            </div>
                            <button
                              onClick={() => {
                                const newZones = [...dynamicRatesState.zones];
                                newZones[idx].active = !newZones[idx].active;
                                setDynamicRatesState({ ...dynamicRatesState, zones: newZones });
                              }}
                              className={`w-14 h-8 rounded-full relative transition-all ${zone.active ? 'bg-indigo-500 shadow-lg shadow-indigo-200' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                              <div className={`absolute top-1 size-6 bg-white rounded-full shadow-md transition-all ${zone.active ? 'right-1' : 'left-1'}`}></div>
                            </button>
                            <button 
                              onClick={() => handleRemoveZone(zone.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                               <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {dynamicRatesState.zones.length === 0 && (
                         <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[32px] text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">Nenhuma zona de demanda configurada</div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Condições Climáticas (Wide) */}
                <section className="bg-white dark:bg-slate-900 p-10 rounded-[64px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-400 via-primary to-emerald-400"></div>
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-3xl bg-blue-50 text-blue-500 border border-blue-100">
                          <span className="material-symbols-outlined font-black text-2xl">cloudy_snowing</span>
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Condições Climáticas Atuantes</h2>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Ajuste de sensibilidade meteorológica</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                         <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizado via OpenWeather API</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {[
                       { key: 'rain', label: 'Chuva / Vento', icon: 'water_drop', color: 'text-blue-500', bg: 'bg-blue-50' },
                       { key: 'storm', label: 'Tempestade Severa', icon: 'thunderstorm', color: 'text-amber-500', bg: 'bg-amber-50' },
                       { key: 'snow', label: 'Neve / Gelo', icon: 'ac_unit', color: 'text-indigo-500', bg: 'bg-indigo-50' }
                     ].map((weather) => (
                       <div key={weather.key} className="group p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center gap-8 hover:bg-white dark:hover:bg-slate-900 hover:shadow-2xl transition-all relative overflow-hidden">
                          <div className={`p-6 rounded-[32px] ${weather.bg} ${weather.color} border border-current/10 shadow-lg group-hover:scale-110 transition-transform relative z-10`}>
                            <span className="material-symbols-outlined text-4xl">{weather.icon}</span>
                          </div>
                          
                          <div className="text-center relative z-10">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">{weather.label}</h3>
                            <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Multiplicador do Valor</p>
                          </div>

                          <div className="flex items-center gap-6 relative z-10 w-full justify-center">
                            <div className="relative">
                               <input
                                 type="number" step="0.1"
                                 value={(dynamicRatesState.weather as any)[weather.key].multiplier}
                                 onChange={(e) => {
                                   const newWeather = { ...dynamicRatesState.weather };
                                   (newWeather as any)[weather.key].multiplier = parseFloat(e.target.value);
                                   setDynamicRatesState({ ...dynamicRatesState, weather: newWeather });
                                 }}
                                 className="w-28 bg-white dark:bg-slate-950 border-none rounded-2xl py-5 text-center font-black text-2xl text-primary shadow-inner focus:ring-2 focus:ring-primary/20"
                               />
                               <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-primary text-slate-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Multi</span>
                            </div>
                            <button
                              onClick={() => {
                                const newWeather = { ...dynamicRatesState.weather };
                                (newWeather as any)[weather.key].active = !(newWeather as any)[weather.key].active;
                                setDynamicRatesState({ ...dynamicRatesState, weather: newWeather });
                              }}
                              className={`w-16 h-9 rounded-full relative transition-all ${(dynamicRatesState.weather as any)[weather.key].active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700 shadow-inner'}`}
                            >
                              <div className={`absolute top-1 size-7 bg-white rounded-full shadow-md transition-all ${(dynamicRatesState.weather as any)[weather.key].active ? 'right-1' : 'left-1'}`}></div>
                            </button>
                          </div>
                       </div>
                     ))}
                   </div>

                   <div className="mt-12 p-8 bg-primary/5 dark:bg-primary/10 rounded-[40px] border border-primary/10 flex items-center gap-6 group">
                      <div className="size-16 rounded-[24px] bg-primary flex items-center justify-center text-slate-900 shadow-xl shadow-primary/20 group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined text-3xl font-black">lightbulb</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Nota da Operação</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Os multiplicadores climáticos são aplicados sobre o valor final após o cálculo do surge de marketplace. Em situações de "Tempestade", a plataforma recomenda suspender pedidos de motoboys por segurança.</p>
                      </div>
                      <button className="px-8 py-4 bg-primary text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Doc. de Riscos</button>
                   </div>
                    </section>
                  </div>
                )}

            {activeTab === 'audit_logs' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Audit Logs Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Logs de Auditoria</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Rastreie todas as atividades e alterações realizadas no sistema em tempo real.</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                      Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-lg">csv</span>
                      Exportar CSV
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Buscar</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                        <input className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold placeholder:text-slate-300 dark:text-white" placeholder="Usuário ou palavra-chave..." type="text" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Módulo</label>
                      <select className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white cursor-pointer px-4">
                        <option>Todos os Módulos</option>
<option>Taxas Dinâmicas</option>
                        <option>Usuários</option>
                        <option>Promoções</option>
                        <option>Categorias</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Papel</label>
                      <select className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white cursor-pointer px-4">
                        <option>Todos os Papéis</option>
                        <option>Super Admin</option>
                        <option>Gerente Operacional</option>
                        <option>Suporte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Período</label>
                      <select className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white cursor-pointer px-4">
                        <option>Últimos 7 dias</option>
                        <option>Últimos 30 dias</option>
                        <option>Este mês</option>
                        <option>Personalizado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
                          <th className="px-8 py-6 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {auditLogsList.map((log) => (
                          <React.Fragment key={log.id}>
                            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="text-sm font-black text-slate-900 dark:text-white">{new Date(log.created_at).toLocaleDateString()}</div>
                                <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</div>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xs font-black border border-primary/20">
                                    {(log.user_id || 'AD').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">Sistema / Admin</div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Admin Mod</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${log.action.includes('Delete') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">{log.module}</span>
                              </td>
                              <td className="px-8 py-6 whitespace-nowrap">
                                <div className="text-[10px] font-mono font-bold text-slate-500 tracking-tight">{log.source_ip || 'Internal'}</div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button
                                  onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                  className={`size-10 flex items-center justify-center rounded-xl shadow-lg transition-all ${expandedLogId === log.id ? 'bg-primary text-slate-900 shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                                >
                                  <span className="material-symbols-outlined">{expandedLogId === log.id ? 'expand_less' : 'visibility'}</span>
                                </button>
                              </td>
                            </tr>
                            {expandedLogId === log.id && (
                              <tr className="bg-primary/[0.03] dark:bg-primary/[0.05]">
                                <td className="px-8 pb-10" colSpan={6}>
                                  <div className="animate-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-4">
                                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">database</span> Metadados da Ação
                                      </h4>
                                      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 font-mono text-[10px] overflow-x-auto shadow-inner text-slate-600 dark:text-slate-400">
                                        <code>{JSON.stringify(log.metadata, null, 2)}</code>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-8 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando 1 a 15 de 2,450 logs registrados</p>
                    <div className="flex gap-3">
                      <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button className="size-12 rounded-2xl bg-primary text-slate-900 font-black text-xs shadow-lg shadow-primary/25">1</button>
                      <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-black text-xs hover:border-primary transition-all">2</button>
                      <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-black text-xs hover:border-primary transition-all">3</button>
                      <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary">settings_applications</span>
                      </div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Configurações Globais</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-1">Controles operacionais, financeiros e de notificações da plataforma.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Auto-save status indicator */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      autoSaveStatus === 'saved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30' :
                      autoSaveStatus === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/30' :
                      autoSaveStatus === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/30' :
                      'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
                    }`}>
                      <span className={`material-symbols-outlined text-sm ${autoSaveStatus === 'pending' ? 'animate-spin' : ''}`}>
                        {autoSaveStatus === 'saved' ? 'check_circle' : autoSaveStatus === 'pending' ? 'sync' : autoSaveStatus === 'error' ? 'error' : 'cloud_done'}
                      </span>
                      {autoSaveStatus === 'saved' ? 'Salvo' : autoSaveStatus === 'pending' ? 'Salvando...' : autoSaveStatus === 'error' ? 'Erro ao salvar' : 'Auto-save ativo'}
                    </div>
                    <button
                      onClick={() => playIziSound('merchant')}
                      className="px-6 py-3 bg-primary/10 text-primary font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/20 transition-all border border-primary/20 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">volume_up</span>
                      Testar Som Izi
                    </button>
                    <button
                      onClick={() => fetchAppSettings()}
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                      Recarregar
                    </button>
                  </div>
                </div>

{/* â â Identidade da Plataforma â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <span className="material-symbols-outlined text-[120px]">store</span>
                  </div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                      <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Identidade da Plataforma</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações públicas do app</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Plataforma</label>
                      <input
                        className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white transition-all"
                        type="text"
                        value={appSettings.appName}
                        onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Suporte</label>
                      <input
                        className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white transition-all"
                        type="email"
                        value={appSettings.supportEmail}
                        onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

{/* â â Â Operacional: Plataforma Global â â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Horário Global da Plataforma</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controla quando o app inteiro aceita pedidos</p>
                    </div>
                  </div>

                  {/* Alert */}
                  <div className="mb-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
                    <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
                    <div>
                      <p className="text-xs font-black text-amber-700 dark:text-amber-400">Este é o teto global da plataforma</p>
                      <p className="text-[11px] font-bold text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                        Fora deste horário, <strong>nenhum cliente consegue fazer pedidos</strong>, independentemente do horário individual de cada estabelecimento. Cada lojista pode restringir ainda mais seu próprio horário nas configurações do seu perfil.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Janela de Atendimento da Plataforma</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-lg">wb_sunny</span>
                        <input
                          className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-300 text-sm font-bold dark:text-white"
                          type="time"
                          value={appSettings.openingTime}
                          onChange={(e) => setAppSettings({ ...appSettings, openingTime: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-black text-slate-300 uppercase">até</span>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                      </div>
                      <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg">bedtime</span>
                        <input
                          className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-300 text-sm font-bold dark:text-white"
                          type="time"
                          value={appSettings.closingTime}
                          onChange={(e) => setAppSettings({ ...appSettings, closingTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual timeline */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm text-slate-300">info</span>
                    O app estará <span className="text-emerald-500 mx-1">aberto</span> das <span className="text-blue-500 mx-1">{appSettings.openingTime}</span> até <span className="text-indigo-500 mx-1">{appSettings.closingTime}</span> todos os dias
                  </div>
                </section>

{/* â â Â Operacional: Raio e Defaults para Novos Lojistas â â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20">
                      <span className="material-symbols-outlined">delivery_dining</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Raio Global de Entrega</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite máximo para qualquer entrega na plataforma</p>
                    </div>
                  </div>

                  {/* Alert */}
                  <div className="mb-8 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl">
                    <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                    <div>
                      <p className="text-xs font-black text-blue-700 dark:text-blue-400">Raio máximo absoluto da plataforma</p>
                      <p className="text-[11px] font-bold text-blue-600/80 dark:text-blue-400/70 mt-0.5">
                        Nenhum entregador pode aceitar pedidos além deste limite, independentemente da configuração do lojista. Lojistas podem definir raios <strong>menores</strong> em seus perfis, mas nunca maiores que este valor.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-end gap-6">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Raio Máximo de Entrega</label>
                        <div className="relative">
                          <input
                            className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white pr-14"
                            type="number"
                            min="1"
                            max="100"
                            value={appSettings.radius}
                            onChange={(e) => setAppSettings({ ...appSettings, radius: parseInt(e.target.value) })}
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">km</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl px-8 py-4 min-w-[120px] text-center">
                        <span className="text-3xl font-black text-violet-500">{appSettings.radius}</span>
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">km máx.</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>1 km</span>
                        <span>50 km</span>
                        <span>100 km</span>
                      </div>
                      <input
                        type="range" min="1" max="100" value={appSettings.radius}
                        onChange={(e) => setAppSettings({ ...appSettings, radius: parseInt(e.target.value) })}
                        className="w-full accent-violet-500 h-2"
                      />
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[5, 15, 30].map(r => (
                          <button
                            key={r}
                            onClick={() => setAppSettings({ ...appSettings, radius: r })}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${appSettings.radius === r ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
                          >
                            {r} km
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

{/* â â Regras Financeiras â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Regras Financeiras Globais</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxas padrão aplicadas a todos os lojistas da plataforma</p>
                    </div>
                  </div>

                  {/* Info banner */}
                  <div className="mb-8 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl">
                    <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">info</span>
                    <div>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">Valores padrão da plataforma</p>
                      <p className="text-[11px] font-bold text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
                        Esses valores são aplicados a <strong>todos os lojistas por padrão</strong>. Lojistas com contratos especiais podem ter taxas negociadas individualmente no perfil de cada estabelecimento (seção Merchants).
                      </p>
                    </div>
                  </div>

                  {/* 3 financial rule cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    {/* Taxa Base */}
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[28px] p-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="material-symbols-outlined text-emerald-500">local_shipping</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-center">Cobrada do cliente</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Taxa Base de Entrega</label>
<p className="text-[10px] text-emerald-600/70 font-bold mb-3">Valor mínimo fixo por entrega, independente da distância</p>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-sm">R$</span>
                        <input
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-300 shadow-inner"
                          type="text"
                          value={appSettings.baseFee}
                          onChange={(e) => setAppSettings({ ...appSettings, baseFee: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Comissão App */}
                    <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="material-symbols-outlined text-primary">percent</span>
                        <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-full text-center">Retida da venda</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-primary/80 uppercase tracking-widest mb-1">Comissão da Plataforma</label>
                        <p className="text-[10px] text-primary/60 font-bold mb-3">Percentual do valor do pedido que fica com a plataforma</p>
                      </div>
                      <div className="relative">
                        <input
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-primary focus:ring-2 focus:ring-primary/30 shadow-inner"
                          type="number" min="0" max="50"
                          value={appSettings.appCommission}
                          onChange={(e) => setAppSettings({ ...appSettings, appCommission: parseInt(e.target.value) || 0 })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">%</span>
                      </div>
                    </div>

                    {/* Taxa de Serviço */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[28px] p-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="material-symbols-outlined text-blue-500">receipt_long</span>
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-100 dark:bg-blue-500/20 rounded-full text-center">Cobrada do cliente</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Taxa de Serviço</label>
                        <p className="text-[10px] text-blue-600/70 font-bold mb-3">Percentual adicional no total do pedido, visível ao cliente</p>
                      </div>
                      <div className="relative">
                        <input
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-blue-600 focus:ring-2 focus:ring-blue-300 shadow-inner"
                          type="number" min="0" max="20"
                          value={appSettings.serviceFee}
                          onChange={(e) => setAppSettings({ ...appSettings, serviceFee: parseInt(e.target.value) || 0 })}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Oferta Flash Global Section */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  {/* Background Glow Effect */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 -mr-32 -mt-32 rounded-full blur-[100px] group-hover:bg-rose-500/10 transition-colors duration-1000"></div>
                  
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-4 rounded-[22px] bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5">
                      <span className="material-symbols-outlined text-2xl">bolt</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Banner de Oferta Flash</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle o banner de destaque da home do app</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título do Banner</label>
                      <div className="relative group/input">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-rose-500 transition-colors text-lg">edit_note</span>
                        <input 
                          type="text"
                          value={appSettings.flashOfferTitle}
                          onChange={e => setAppSettings({...appSettings, flashOfferTitle: e.target.value})}
                          placeholder="Ex: Burgers Gourmet"
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Desconto (%)</label>
                      <div className="relative group/input">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-rose-500 transition-colors text-lg">percent</span>
                        <input 
                          type="number"
                          value={appSettings.flashOfferDiscount}
                          onChange={e => setAppSettings({...appSettings, flashOfferDiscount: parseInt(e.target.value) || 0})}
                          placeholder="50"
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expira em</label>
                      <div className="relative group/input">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-rose-500 transition-colors text-lg">calendar_today</span>
                        <input 
                          type="datetime-local"
                          value={appSettings.flashOfferExpiry}
                          onChange={e => setAppSettings({...appSettings, flashOfferExpiry: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </section>


{/* â â Notificações â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20">
                      <span className="material-symbols-outlined">notifications_active</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Notificações Inteligentes</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canais de comunicação ativos</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { key: 'smsNotifications', label: 'Alertas de Pedido (SMS)', desc: 'Confirmações e atualizações em tempo real para clientes via SMS', icon: 'sms', color: 'text-emerald-500' },
                      { key: 'emailNotifications', label: 'Faturas & Relatórios (E-mail)', desc: 'Disparo automático de comprovantes, notas e documentos fiscais', icon: 'email', color: 'text-blue-500' },
                    ].map(({ key, label, desc, icon }) => {
                      const isOn = (appSettings as any)[key];
                      return (
                        <div key={key} className={`flex items-center justify-between p-6 rounded-[28px] border transition-all ${isOn ? 'bg-primary/[0.03] border-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isOn ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              <span className={`material-symbols-outlined ${isOn ? 'text-primary' : 'text-slate-400'}`}>{icon}</span>
                            </div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block">{label}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{desc}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setAppSettings({ ...appSettings, [key]: !isOn })}
                            className={`w-14 h-8 rounded-full relative transition-all ${isOn ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                          >
                            <div className={`absolute top-1.5 size-5 bg-white rounded-full shadow-md transition-all ${isOn ? 'right-1.5' : 'left-1.5'}`}></div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

{/* â â Â Status Sistema (Manutenção) â â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
                      <span className="material-symbols-outlined">build</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Status da Plataforma</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles de manutenção e visibilidade</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'App ao Vivo', desc: 'Plataforma acessível aos usuários', icon: 'public', color: 'emerald', active: true },
                      { label: 'Modo Manutenção', desc: 'Suspender temporariamente o serviço', icon: 'construction', color: 'amber', active: false },
                      { label: 'Novos Cadastros', desc: 'Permitir registro de novos usuários', icon: 'person_add', color: 'blue', active: true },
                    ].map((item, i) => (
                      <div key={i} className={`p-6 rounded-[28px] border flex flex-col gap-4 ${item.active ? 'bg-' + item.color + '-50 dark:bg-' + item.color + '-500/10 border-' + item.color + '-100 dark:border-' + item.color + '-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`material-symbols-outlined text-${item.color}-500`}>{item.icon}</span>
                          <span className={`text-[9px] font-black px-2 py-1 rounded-full ${item.active ? 'bg-' + item.color + '-100 dark:bg-' + item.color + '-500/20 text-' + item.color + '-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                            {item.active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                        <button className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${item.active ? 'bg-' + item.color + '-500 text-white hover:bg-' + item.color + '-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}>
                          {item.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

{/* â â Segurança â Â */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
                      <span className="material-symbols-outlined">security</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Segurança & Acesso</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autenticação e proteção dos dados</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-[28px] p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400">lock</span>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">Alterar Senha Admin</p>
                          <p className="text-[10px] font-bold text-slate-400">Credenciais do painel administrativo</p>
                        </div>
                      </div>
                      <input type="password" placeholder="Nova senha (mín. 8 caracteres)" className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-5 py-3.5 font-bold text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white" />
                      <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 dark:hover:bg-slate-100 transition-all">
                        Atualizar Senha
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Autenticação em 2 Etapas (2FA)', active: true },
                        { label: 'Login por Biometria (App)', active: false },
                        { label: 'Alertas de Login Suspeito', active: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</p>
                          <div className={`w-11 h-6 rounded-full relative transition-all ${item.active ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`absolute top-1 size-4 bg-white rounded-full shadow-md transition-all ${item.active ? 'right-1' : 'left-1'}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ── Merchant: Meu Estabelecimento ── */}
            {activeTab === 'my_store' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Dashboard Header Integration */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-3xl text-emerald-500">dashboard</span>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Painel de Gestão</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie seu estabelecimento e acompanhe resultados em tempo real.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${merchantProfile?.is_open ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {merchantProfile?.is_open ? 'Loja Aberta' : 'Loja Fechada'}
                       </span>
                       <button
                         onClick={async () => {
                           const prevState = merchantProfile.is_open;
                           const newState = !prevState;
                           setMerchantProfile({ ...merchantProfile, is_open: newState });
                           try {
                             const { error } = await supabase
                               .from('admin_users')
                               .update({ is_open: newState })
                               .eq('id', merchantProfile.merchant_id);
                             if (error) throw error;
                           } catch (err: any) {
                             setMerchantProfile({ ...merchantProfile, is_open: prevState });
                             toastError('Erro ao alterar status: ' + err.message);
                           }
                         }}
                         className={`w-12 h-6 rounded-full relative p-1 transition-all ${merchantProfile?.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full transition-all ${merchantProfile?.is_open ? 'ml-auto' : 'ml-0'}`}></div>
                       </button>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${(merchantProfile as any)?.free_delivery ? 'text-emerald-500' : 'text-slate-400'}`}>
                         {(merchantProfile as any)?.free_delivery ? 'Frete Grátis ON' : 'Frete Grátis OFF'}
                       </span>
                       <button
                         onClick={async () => {
                           const prevState = (merchantProfile as any).free_delivery;
                           const newState = !prevState;
                           setMerchantProfile({ ...merchantProfile, free_delivery: newState } as any);
                           try {
                             const { error } = await supabase
                               .from('admin_users')
                               .update({ free_delivery: newState })
                               .eq('id', merchantProfile.merchant_id);
                             if (error) throw error;
                             toastSuccess(newState ? 'Frete grátis ativado! 🎉' : 'Frete grátis desativado.');
                           } catch (err: any) {
                             setMerchantProfile({ ...merchantProfile, free_delivery: prevState } as any);
                             toastError('Erro ao alterar frete: ' + err.message);
                           }
                         }}
                         className={`w-12 h-6 rounded-full relative p-1 transition-all ${(merchantProfile as any)?.free_delivery ? 'bg-emerald-500' : 'bg-slate-300'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full transition-all ${(merchantProfile as any)?.free_delivery ? 'ml-auto' : 'ml-0'}`}></div>
                       </button>
                    </div>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Conta Ativa
                    </span>
                  </div>
                </div>

                {/* Dash stats (copied from old dashboard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(() => {
                    const myId = merchantProfile?.merchant_id;
                    const myOrders = allOrders.filter((o: any) => o.merchant_id === myId);
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayOrders = myOrders.filter((o: any) => o.created_at?.startsWith(todayStr));
                    const completedOrders = myOrders.filter((o: any) => o.status === 'concluido');
                    const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
                    const pendingOrders = myOrders.filter((o: any) => o.status === 'pending' || o.status === 'aceito');
                    return [
                      { label: 'Pedidos Hoje', val: todayOrders.length.toString(), icon: 'shopping_bag', trend: `${todayOrders.filter((o: any) => o.status === 'concluido').length} concluídos`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                      { label: 'Faturamento Total', val: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: 'payments', trend: `${completedOrders.length} vendas`, color: 'text-primary', bg: 'bg-primary/10' },
                      { label: 'Pedidos Pendentes', val: pendingOrders.length.toString(), icon: 'pending_actions', trend: pendingOrders.length > 0 ? 'Ação necessária' : 'Nenhum', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                      { label: 'Total de Pedidos', val: myOrders.length.toString(), icon: 'receipt_long', trend: `${myOrders.filter((o: any) => o.status === 'cancelado').length} cancelados`, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    ];
                  })().map((s: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${s.bg}`}><span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span></div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full border border-current opacity-80 ${s.color}`}>{s.trend}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{s.val}</h3>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* intelligence card */}
                    {(() => {
                      const myId = merchantProfile?.merchant_id;
                      const myOrders = allOrders.filter((o) => o.merchant_id === myId);
                      const completed = myOrders.filter((o) => o.status === 'concluido');
                      const totalRevenue = completed.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
                      const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;
                      const hourCounts: Record<number, number> = {};
                      myOrders.forEach(o => { if (o.created_at) { const hour = new Date(o.created_at).getHours(); hourCounts[hour] = (hourCounts[hour] || 0) + 1; } });
                      let peakHour = 19; let maxCount = -1;
                      Object.entries(hourCounts).forEach(([h, count]) => { if (count > maxCount) { maxCount = count; peakHour = Number(h); } });
                      const peakTimeStr = `${peakHour}:00h - ${peakHour + 1}:00h`;
                      const activeVisitors = (myOrders.filter(o => o.status === 'pending').length * 3) + (new Date().getHours() > 18 ? 42 : 12) + (Math.floor(Math.random() * 5));
                      const conversionRate = myOrders.length > 0 ? Math.min(15, (completed.length / (myOrders.length * 6.4 + 5)) * 100).toFixed(1) : "0.0";
                      const tips: Record<string, string> = { 'restaurant': "Hambúrgueres com fritas têm 35% mais chance de venda em combos no sábado à noite.", 'market': "Produtos de higiene pessoal têm maior procura nas primeiras horas da manhã.", 'pharmacy': "Vitaminas e suplementos podem aumentar seu ticket médio em 15% se oferecidos no checkout.", 'beverages': "Combos de gelo e carvão aumentam a conversão em 40% durante o verão.", 'default': "Oferecer entrega grátis em pedidos acima de R$ 50 aumenta o volume de vendas em 22%." };
                      const aiTip = tips[merchantProfile?.store_type as string] || tips['default'];
                      return (
                        <section className="bg-slate-900 dark:bg-slate-950 rounded-[40px] p-8 border border-slate-800 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                          <div className="relative z-10 flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-lg font-black text-white flex items-center gap-3"><span className="material-symbols-outlined text-primary">insights</span>Inteligência Antigravity</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Pessoas na Loja agora</p>
                              <h4 className="text-3xl font-black text-white">{activeVisitors}</h4>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Conversão Menu</p>
                              <h4 className="text-3xl font-black text-white">{conversionRate}%</h4>
                            </div>
                          </div>
                          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-start gap-4 relative z-10">
                             <span className="material-symbols-outlined text-primary">psychology</span>
                             <p className="text-xs font-bold text-slate-300 leading-relaxed">"{aiTip}"</p>
                          </div>
                        </section>
                      );
                    })()}

                    {/* Last Orders table */}
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3"><span className="material-symbols-outlined text-primary">receipt_long</span>Últimos Pedidos</h3>
                        </div>
                        <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Todos →</button>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id).slice(0, 5).map((o: any) => (
                          <div key={o.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${o.status === 'concluido' ? 'bg-green-50 dark:bg-green-500/10' : o.status === 'cancelado' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-primary/10'}`}>
                                <span className={`material-symbols-outlined text-lg ${o.status === 'concluido' ? 'text-green-500' : o.status === 'cancelado' ? 'text-red-500' : 'text-primary'}`}>{o.status === 'concluido' ? 'check_circle' : o.status === 'cancelado' ? 'cancel' : 'pending'}</span>
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">{o.delivery_address}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    {/* Horários Section */}
                    <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <span className="material-symbols-outlined text-blue-500">schedule</span>
                          Horários
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
                          const dayConfig = merchantProfile?.opening_hours?.[day] || { active: true, open: '08:00', close: '22:00' };
                          return (
                            <div key={day} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center font-black text-[10px] uppercase text-slate-400 shadow-sm">
                                  {day}
                                </div>
                                <button
                                  onClick={() => {
                                    const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, active: !dayConfig.active } };
                                    setMerchantProfile({ ...merchantProfile, opening_hours: next });
                                  }}
                                  className={`w-10 h-6 rounded-full relative p-1 transition-all ${dayConfig.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${dayConfig.active ? 'ml-auto' : 'ml-0'}`}></div>
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="w-12 bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white p-0 text-center focus:ring-0"
                                  value={dayConfig.open}
                                  onChange={(e) => {
                                    const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, open: e.target.value } };
                                    setMerchantProfile({ ...merchantProfile, opening_hours: next });
                                  }}
                                />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">até</span>
                                <input
                                  type="text"
                                  className="w-12 bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white p-0 text-center focus:ring-0"
                                  value={dayConfig.close}
                                  onChange={(e) => {
                                    const next = { ...merchantProfile.opening_hours, [day]: { ...dayConfig, close: e.target.value } };
                                    setMerchantProfile({ ...merchantProfile, opening_hours: next });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            const { error } = await supabase
                              .from('admin_users')
                              .update({ opening_hours: merchantProfile.opening_hours })
                              .eq('id', merchantProfile.merchant_id);
                            if (error) throw error;
                            toastSuccess('Horários salvos com sucesso!');
                          } catch (err: any) {
                            toastError('Erro ao salvar horários: ' + err.message);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all mt-4 active:scale-95"
                      >
                        {isSaving ? 'Salvando...' : 'Salvar Horários'}
                      </button>
                    </section>
                </div>
              </div>
            </div>
          )}



            {/* ── Merchant: Motoboys Próprios ── */}
            {activeTab === 'my_drivers' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-3xl text-primary">delivery_dining</span>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Motoboys Próprios</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie sua frota exclusiva, acompanhe o status e configure regras de prioridade.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Priority & Rules */}
                  <div className="lg:col-span-1 space-y-6">
                    <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>
                      <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings_suggest</span>
                        Regras de Despacho
                      </h3>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridade de Pedidos</p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'exclusive', label: 'Meus Motoboys Primeiro', desc: 'O pedido toca primeiro para sua frota' },
{ id: 'global', label: 'Todos os Motoboys', desc: 'Toca simultâneo para todos (Padrão)' },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleUpdateDispatchSettings('dispatch_priority', opt.id)}
                                  className={`p-4 rounded-2xl border text-left transition-all ${(merchantProfile?.dispatch_priority || 'global') === opt.id
                                    ? 'bg-primary border-primary text-slate-900'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                  <p className="text-xs font-black uppercase tracking-tight">{opt.label}</p>
                                  <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agendamentos</p>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                { id: 'exclusive', label: 'Priorizar Minha Frota', desc: 'Reserva automática para seus motoboys' },
                                { id: 'global', label: 'Fluxo Convencional', desc: 'Disponível para qualquer entregador' },
                              ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => handleUpdateDispatchSettings('scheduling_priority', opt.id)}
                                className={`p-4 rounded-2xl border text-left transition-all ${(merchantProfile?.scheduling_priority || 'global') === opt.id
                                  ? 'bg-primary border-primary text-slate-900'
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                  }`}
                              >
                                <p className="text-xs font-black uppercase tracking-tight">{opt.label}</p>
                                <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Drivers List */}
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">groups</span>
                          Sua Equipe
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {myDriversList.length} motoboys</span>
                          <button 
                            onClick={() => setSelectedDriverStudio({ id: `new-${Date.now()}`, name: '', phone: '', vehicle_type: 'Moto', is_active: true, status: 'active', bank_info: { bank: '', agency: '', account: '', pix_key: '' } })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
                          >
                             <span className="material-symbols-outlined text-xs">add</span> Novo
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {myDriversList.length > 0 ? (
                          myDriversList.map((d, i) => (
                            <div key={i} className="flex items-center justify-between px-8 py-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                  <span className="material-symbols-outlined text-slate-400 text-2xl">person</span>
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{d.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{d.vehicle_type} • {d.license_plate}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`size-1.5 rounded-full ${d.is_online ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{d.is_online ? 'Online' : 'Offline'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    setEditingItem(d);
                                    setEditType('my_driver');
                                  }}
                                  className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteMyDriver(d.id)}
                                  className="size-10 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-300 hover:text-red-500 transition-all flex items-center justify-center border border-red-100 dark:border-red-900/20"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                              <span className="material-symbols-outlined text-4xl text-slate-300">smart_toy</span>
                            </div>
                            <p className="font-bold text-slate-400">Nenhum motoboy próprio cadastrado.</p>
                            <p className="text-xs text-slate-500 mt-2">Adicione entregadores exclusivos para sua loja.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Merchant/Admin: Estúdio do Lojista (Consolidado) ── */}
            {activeTab === 'my_studio' && (
              <div className="flex flex-col h-[calc(100vh-160px)] -m-8 relative overflow-hidden bg-white dark:bg-slate-900 shadow-2xl rounded-[40px] border border-slate-100 dark:border-slate-800">
                {((userRole === 'merchant' && merchantProfile) || (userRole === 'admin' && selectedMerchantPreview)) ? (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Digital Preview Column (Simulates App) */}
                    <div className="w-[480px] border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col items-center justify-center p-12 overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0"></div>
                      {renderDevicePreview(
                        userRole === 'merchant' ? merchantProfile : selectedMerchantPreview,
                        userRole === 'merchant' ? productsList : previewProducts,
                        userRole === 'merchant' ? menuCategoriesList : previewCategories
                      )}
                    </div>

                    {/* Creative Control Panel Column */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                       {renderStudioPanel(
                        userRole === 'merchant' ? merchantProfile : selectedMerchantPreview,
                        userRole === 'merchant' ? (updated: MerchantProfile) => setMerchantProfile(updated) : (updated: Merchant) => setSelectedMerchantPreview(updated)
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6 text-primary">
                      <span className="material-symbols-outlined text-5xl">storefront</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Selecione um Lojista</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium">Você precisa selecionar um lojista na aba "Lojistas" para visualizar e editar seu estúdio digital.</p>
                    <button 
                      onClick={() => setActiveTab('merchants')}
                      className="mt-8 px-8 py-4 bg-primary text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      Ir para Lojistas
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Merchant: Financeiro ── */}
            {
              activeTab === 'financial' && userRole === 'merchant' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-3xl text-emerald-500">account_balance_wallet</span>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Meu Financeiro</h1>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Controle seus ganhos, solicitações de saque e histórico de vendas.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                      <span className="material-symbols-outlined">payments</span>
                      Solicitar Saque
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-6">
                      <section className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 -mr-20 -mt-20 rounded-full blur-3xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Saldo Disponível</p>
                        <h2 className="text-5xl font-black tracking-tighter mb-8">R$ 1.254,80</h2>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 rounded-3xl bg-white/5 border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">A Receber (7 dias)</span>
                            <span className="font-black text-emerald-400">R$ 840,00</span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-3xl bg-white/5 border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Vendas (Mês)</span>
                            <span className="font-black">R$ 4.580,00</span>
                          </div>
                        </div>
                      </section>

                      <section className="bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">pie_chart</span>
                          Divisão de Taxas
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500">Sua Receita (88%)</span>
                            <span className="font-black text-slate-900 dark:text-white">R$ 4.030,40</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-emerald-500 w-[88%]"></div>
                            <div className="h-full bg-slate-300 dark:bg-slate-700 w-[12%]"></div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Comissão App (12%)</span>
                            <span>R$ 549,60</span>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="md:col-span-2">
                      <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-500">history</span>
                            Últimas Vendas
                          </h3>
                          <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Exportar CSV</button>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                          {allOrders.filter(o => o.status === 'concluido').slice(0, 8).map((o, i) => (
                            <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-slate-400">shopping_bag</span>
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Pedido #DT-{o.id.slice(0, 4).toUpperCase()}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString()} • {new Date(o.created_at).toLocaleTimeString().slice(0, 5)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-emerald-500">+ R$ {o.total_price.toFixed(2).replace('.', ',')}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Via {o.payment_method || 'Cartão'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )
            }

      {/* Edit Modals */}
      {
        editingItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-slate-900">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingItem(null)}></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`w-full ${editType === 'merchant' ? 'max-w-3xl' : 'max-w-lg'} bg-white dark:bg-slate-950 rounded-[48px] p-10 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh]`}
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Editor de Registro</p>
                  <h2 className="text-3xl font-black text-slate-900">
                    {editingItem.id ? 'Editar' : 'Novo'} {
                      editType === 'driver' ? 'Entregador' :
                        editType === 'my_driver' ? 'Motoboy Próprio' :
                          editType === 'user' ? 'Cliente' :
                            editType === 'category' ? 'Categoria' :
                              editType === 'merchant' ? 'Lojista' :
                            editType === 'my_product' ? 'Produto' : 'Promoção/Banner'
                    }
                  </h2>
                </div>
                <button onClick={() => { setEditingItem(null); setEditType(null); }} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>

              <form onSubmit={
                editType === 'driver' ? handleUpdateDriver :
                  editType === 'my_driver' ? handleUpdateMyDriver :
                    editType === 'user' ? handleUpdateUser :
                      editType === 'category' ? handleUpdateCategory :
                        editType === 'merchant' ? handleUpdateMerchant :
                          editType === 'my_product' ? handleUpdateMyProduct : handleUpdatePromotion
              } className="space-y-6">

                {/* Common fields for User, Driver, Category */}
                {editType === 'merchant' && (
                  <div className="space-y-8">
                    {/* Seção 1: Credenciais de Acesso */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-base">key</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Acesso ao Painel</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">E-mail de Login</label>
                          <input
                            type="email"
                            required
                            value={editingItem.email || ''}
                            onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                            placeholder="exemplo@lojista.com"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center ml-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Senha</label>
                            <button
                              type="button"
                              onClick={() => {
                                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
                                let pass = "";
                                for(let i=0; i<10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                                setEditingItem({...editingItem, password: pass});
                              }}
                              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                            >
                              Gerar Nova
                            </button>
                          </div>
                          <input
                            type="text"
                            value={editingItem.password || ''}
                            onChange={e => setEditingItem({ ...editingItem, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Perfil da Loja */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <span className="material-symbols-outlined text-base">storefront</span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Perfil do Estabelecimento</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 md:col-span-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nome Fantasia</label>
                          <input
                            type="text"
                            required
                            value={editingItem.store_name || ''}
                            onChange={e => setEditingItem({ ...editingItem, store_name: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Segmento</label>
                            <button 
                              type="button" 
                              onClick={handleAddSegment}
                              className="text-[10px] font-black text-primary hover:text-primary/70 uppercase tracking-widest flex items-center gap-1 px-3 py-1 group transition-colors"
                              title="Adicionar novo segmento ao sistema"
                            >
                              <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">add_circle</span>
                              Novo
                            </button>
                          </div>
                          <div className="relative">
                            <select
                              value={editingItem.store_type || 'restaurant'}
                              onChange={e => setEditingItem({ ...editingItem, store_type: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
                            >
                              {/* Fallback caso a lista esteja vazia */}
                              {categoriesState.filter(c => !c.parent_id && c.type === 'service').length === 0 && (
                                <>
                                  <option value="restaurant">Restaurante / Lanchonete</option>
                                  <option value="pharmacy">Farmácia</option>
                                  <option value="market">Mercado / Hortifruti</option>
                                  <option value="beverages">Bebidas</option>
                                  <option value="pet">Petshop</option>
                                </>
                              )}
                              
                              {/* Opções dinâmicas das categorias de serviço */}
                              {categoriesState
                                .filter(c => !c.parent_id && c.type === 'service')
                                .map(c => {
                                  const slug = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
                                  return (
                                    <option key={c.id} value={slug}>
                                      {c.name}
                                    </option>
                                  );
                                })}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <span className="material-symbols-outlined text-base">expand_more</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Documento (CPF/CNPJ)</label>
                          <input
                            type="text"
                            value={editingItem.document || ''}
                            onChange={e => setEditingItem({ ...editingItem, document: e.target.value })}
                            placeholder="00.000.000/0001-00"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Telefone Loja</label>
                          <input
                            type="text"
                            value={editingItem.store_phone || ''}
                            onChange={e => setEditingItem({ ...editingItem, store_phone: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Descrição curta</label>
                        <textarea
                          value={editingItem.store_description || ''}
                          onChange={e => setEditingItem({ ...editingItem, store_description: e.target.value })}
                          placeholder="Fale um pouco sobre o estabelecimento..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all min-h-[80px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">CEP</label>
                          <input
                            type="text"
                            value={editingItem.zip_code || ''}
                            onChange={e => {
                               const val = e.target.value;
                               setEditingItem({ ...editingItem, zip_code: val });
                               if (val.replace(/\D/g, '').length === 8) handleCepFetch(val);
                            }}
                            placeholder="00000-000"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Logradouro / Endereço</label>
                          <input
                            type="text"
                            value={editingItem.store_address || ''}
                            onChange={e => setEditingItem({ ...editingItem, store_address: e.target.value })}
                            placeholder="Ex: Av. Brasil"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Número</label>
                          <input
                            type="text"
                            value={editingItem.address_number || ''}
                            onChange={e => setEditingItem({ ...editingItem, address_number: e.target.value })}
                            placeholder="123"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Complemento</label>
                          <input
                            type="text"
                            value={editingItem.address_complement || ''}
                            onChange={e => setEditingItem({ ...editingItem, address_complement: e.target.value })}
                            placeholder="Apt 101, Fundos..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Bairro</label>
                          <input
                            type="text"
                            value={editingItem.neighborhood || ''}
                            onChange={e => setEditingItem({ ...editingItem, neighborhood: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Cidade</label>
                          <input
                            type="text"
                            value={editingItem.city || ''}
                            onChange={e => setEditingItem({ ...editingItem, city: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Estado</label>
                          <input
                            type="text"
                            value={editingItem.state || ''}
                            onChange={e => setEditingItem({ ...editingItem, state: e.target.value.toUpperCase() })}
                            maxLength={2}
                            placeholder="UF"
                            className="initial w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Identidade Visual (Logo)</label>
                        <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
                          <div className="size-20 rounded-[24px] bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                            {editingItem.store_logo ? (
                              <img src={editingItem.store_logo} className="size-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300 text-3xl">add_photo_alternate</span>
                            )}
                          </div>
                          <div className="flex-1">
                             <label className="cursor-pointer bg-white dark:bg-slate-800 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all inline-block border border-slate-100 dark:border-slate-700">
                               Trocar Logotipo
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*"
                                 onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setIsSaving(true);
                                    const url = await handleFileUpload(file, 'logos');
                                    if (url) setEditingItem({ ...editingItem, store_logo: url });
                                    setIsSaving(false);
                                  }
                                }} 
                               />
                             </label>
                             <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Recomendado: Quadrado (512x512)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {(editType === 'user' || editType === 'driver' || editType === 'my_driver' || editType === 'category' || editType === 'promotion' || editType === 'my_product') && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">
                        {editType === 'my_product' ? 'Nome do Produto' : 'Nome / Título'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.name || editingItem.title || ''}
                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value, title: e.target.value })}
                        placeholder={editType === 'my_product' ? 'Ex: Pizza Calabresa' : ''}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                {(editType === 'user' || editType === 'driver' || editType === 'my_driver') && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={editingItem.phone || ''}
                      onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
                {(editType === 'driver' || editType === 'my_driver') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Veículo</label>
                      <input
                        type="text"
                        required
                        value={editingItem.vehicle_type || ''}
                        onChange={e => setEditingItem({ ...editingItem, vehicle_type: e.target.value })}
                        placeholder="Ex: Honda CG 160"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Placa</label>
                      <input
                        type="text"
                        value={editingItem.license_plate || ''}
                        onChange={e => setEditingItem({ ...editingItem, license_plate: e.target.value.toUpperCase() })}
                        placeholder="ABC-1234"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}

                {editType === 'category' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Descrição curta</label>
                      <input
                        type="text"
                        required
                        value={editingItem.desc || ''}
                        onChange={e => setEditingItem({ ...editingItem, desc: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[28px] flex gap-2 mb-2">
                       <button
                         type="button"
                         onClick={() => setEditingItem({ ...editingItem, icon_mode: 'symbol' })}
                         className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${(!editingItem.icon_mode || editingItem.icon_mode === 'symbol') ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400'}`}
                       >
                         Material Icon
                       </button>
                       <button
                         type="button"
                         onClick={() => setEditingItem({ ...editingItem, icon_mode: 'image' })}
                         className={`flex-1 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${editingItem.icon_mode === 'image' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400'}`}
                       >
                         Custom Image
                       </button>
                    </div>

                    {(!editingItem.icon_mode || editingItem.icon_mode === 'symbol') ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Ícone (Material Symbol)</label>
                        <div className="flex gap-4">
                          <input
                            type="text"
                            required
                            value={editingItem.icon || ''}
                            onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
                            placeholder="Ex: motorcycle, layers"
                            className="flex-1 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <span className="material-symbols-outlined text-2xl">{editingItem.icon || 'category'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">URL da Imagem / SVG</label>
                          <input
                            type="text"
                            value={(editingItem.icon?.startsWith('http') || editingItem.icon?.startsWith('/') || editingItem.icon?.length > 50) ? editingItem.icon : ''}
                            onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
                            placeholder="https://exemplo.com/icone.png"
                            className="w-full bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-[35px] border border-dashed border-slate-200 dark:border-slate-700">
                          <div className="size-20 rounded-3xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                            {(editingItem.icon?.startsWith('http') || editingItem.icon?.startsWith('/') || editingItem.icon?.length > 50) ? (
                              <img src={editingItem.icon} className="size-full object-contain p-2" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-300 text-3xl">add_photo_alternate</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upload Direto</p>
                            <label className="cursor-pointer bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all inline-block border border-slate-100 dark:border-slate-600">
                              Importar Arquivo
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,.svg" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditingItem({ ...editingItem, icon: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                              />
                            </label>
                            <p className="text-[9px] font-bold text-slate-400 mt-2">Formatos: SVG, PNG, JPG, WEBP</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Categoria Pai (Opcional)</label>
                      <select
                        value={editingItem.parent_id || ''}
                        onChange={e => setEditingItem({ ...editingItem, parent_id: e.target.value || null })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Nenhuma (Categoria Principal)</option>
                        {categoriesState.filter(c => !c.parent_id && c.id !== editingItem.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Segmento (Tipo de Serviço)</label>
                      <select
                        value={editingItem.type || 'service'}
                        onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="service" title="🛒">Serviços / Delivery</option>
                        <option value="mobility" title="🚗">Mobilidade / Passageiros</option>
                      </select>
                    </div>
                  </>
                )}

                {editType === 'promotion' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Texto de Desconto (Opcional)</label>
                      <input
                        type="text"
                        value={editingItem.discount_text || ''}
                        onChange={e => setEditingItem({ ...editingItem, discount_text: e.target.value })}
                        placeholder="Ex: 20% OFF na primeira compra"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Valor (%)</label>
                        <input
                          type="number"
                          required
                          value={editingItem.discount_value || ''}
                          onChange={e => setEditingItem({ ...editingItem, discount_value: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Código (Opcional)</label>
                        <input
                          type="text"
                          value={editingItem.coupon_code || ''}
                          onChange={e => setEditingItem({ ...editingItem, coupon_code: e.target.value.toUpperCase() })}
                          placeholder="CUPOM20"
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Expira em</label>
                        <input
                          type="date"
                          value={editingItem.expires_at ? new Date(editingItem.expires_at).toISOString().split('T')[0] : ''}
                          onChange={e => setEditingItem({ ...editingItem, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Usos Máximos</label>
                        <input
                          type="number"
                          value={editingItem.max_usage || ''}
                          onChange={e => setEditingItem({ ...editingItem, max_usage: e.target.value })}
                          placeholder="0 para ilimitado"
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">URL da Imagem / Banner</label>
                      <input
                        type="text"
                        value={editingItem.banner_url || ''}
                        onChange={e => setEditingItem({ ...editingItem, banner_url: e.target.value })}
                        placeholder="https://exemplo.com/banner.jpg"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </>
                )}

                {editType === 'my_product' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Preço (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editingItem.price || ''}
                          onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                          placeholder="0,00"
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Categoria</label>
                        <select
                          required
                          value={editingItem.category || ''}
                          onChange={e => setEditingItem({ ...editingItem, category: e.target.value, subcategory: '' })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                           <option value="" disabled>Selecione</option>
                           {menuCategoriesList.filter(c => !c.parent_id).map(cat => (
                             <option key={cat.id} value={cat.name}>{cat.name}</option>
                           ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Subcategoria</label>
                      <select
                        value={editingItem.subcategory || ''}
                        onChange={e => setEditingItem({ ...editingItem, subcategory: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                         <option value="">Nenhuma</option>
                         {menuCategoriesList.filter(c => c.parent_id && c.parent_id === menuCategoriesList.find(parent => parent.name === editingItem.category)?.id).map(sub => (
                           <option key={sub.id} value={sub.name}>{sub.name}</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Descrição do Item</label>
                      <textarea
                        value={editingItem.description || ''}
                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                        placeholder="Ingredientes, tamanho, etc..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Imagem do Produto</label>
                      <div className="relative group/btn">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsSaving(true);
                              const url = await handleFileUpload(file, 'products');
                              if (url) setEditingItem({ ...editingItem, image_url: url });
                              setIsSaving(false);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-3xl px-6 py-4 font-bold text-sm flex items-center gap-3 group-hover/btn:border-primary transition-colors">
                          <span className="material-symbols-outlined text-primary">add_photo_alternate</span>
                          <span className="text-slate-400 truncate">
                            {editingItem.image_url ? 'Imagem Carregada ✓' : 'Clique para enviar imagem'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editType === 'driver' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Veículo</label>
                      <input
                        type="text"
                        value={editingItem.vehicle_type || ''}
                        onChange={e => setEditingItem({ ...editingItem, vehicle_type: e.target.value })}
                        placeholder="Ex: Moto, Carro"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Placa</label>
                      <input
                        type="text"
                        value={editingItem.license_plate || ''}
                        onChange={e => setEditingItem({ ...editingItem, license_plate: e.target.value })}
                        placeholder="ABC-1234"
                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                )}

                {editType !== 'merchant' && (
                <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">
                      {editType === 'my_product' ? 'Item Disponível' : 'Status da Conta'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {editType === 'my_product' ? 'Habilita ou desativa o item no cardápio' : 'Habilita ou desativa o acesso'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, is_active: !editingItem.is_active })}
                    className={`w-16 h-10 rounded-full relative transition-colors ${editingItem.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-md transition-all ${editingItem.is_active ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-8">
                  {editType === 'my_product' && editingItem && editingItem.id ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(editingItem.id, editingItem.name)}
                      className="w-full bg-red-100 text-red-600 rounded-3xl py-5 font-black uppercase tracking-widest hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span> Excluir
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setEditingItem(null); setEditType(null); }}
                      className="w-full bg-slate-100 text-slate-500 rounded-3xl py-5 font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary text-slate-900 rounded-3xl py-5 font-black uppercase tracking-widest hover:brightness-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Confirmar & Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )
      }

        {selectedDriverStudio && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedDriverStudio(null)}></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[64px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/10 dark:border-slate-800 h-[92vh]"
            >
              {/* Header */}
              <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-6">
                  <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <span className="material-symbols-outlined text-4xl font-black">sports_motorsports</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio do Entregador</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                      {(typeof selectedDriverStudio.id === 'string' && selectedDriverStudio.id.startsWith('new-')) ? 'Novo Cadastro Operacional' : `ID: ${selectedDriverStudio.id?.substring(0, 8)}...`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDriverStudio(null)}
                  className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Dashboard Navigation Tabs */}
            <div className="px-10 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex gap-8 overflow-x-auto no-scrollbar">
              {[
                { id: 'personal', label: 'Dados Pessoais', icon: 'person' },
                { id: 'vehicle', label: 'Veículo', icon: 'directions_bike' },
                { id: 'finance', label: 'Financeiro', icon: 'account_balance' },
                { id: 'documents', label: 'Documentação', icon: 'description' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveStudioTab(t.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-4 transition-all whitespace-nowrap ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <span className={`material-symbols-outlined text-xl ${activeStudioTab === t.id ? 'font-fill' : ''}`}>{t.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStudioTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-10"
                >
                  {activeStudioTab === 'personal' && (
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="flex flex-col items-center gap-4">
                          <div className="size-44 rounded-[48px] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden relative group">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${selectedDriverStudio.name || 'D'}&background=ffd900&color=000&size=256&bold=true`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <span className="material-symbols-outlined text-white text-4xl">add_a_photo</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedDriverStudio.is_active ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                              <span className={`size-2 rounded-full ${selectedDriverStudio.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {selectedDriverStudio.is_active ? 'Conta Ativa' : 'Conta Bloqueada'}
                            </span>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                               <input 
                                 type="text" 
                                 value={selectedDriverStudio.name || ''}
                                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, name: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                                 placeholder="Nome do motorista"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WhatsApp / Celular</label>
                               <input 
                                 type="text" 
                                 value={selectedDriverStudio.phone || ''}
                                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, phone: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                                 placeholder="(00) 00000-0000"
                               />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Acesso</label>
                               <input 
                                 type="email" 
                                 value={selectedDriverStudio.email || ''}
                                 onChange={e => setSelectedDriverStudio({...selectedDriverStudio, email: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-inner"
                                 placeholder="email@exemplo.com"
                               />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-inner">
                        <div className="flex items-center gap-3 mb-6">
                           <span className="material-symbols-outlined text-primary">location_on</span>
                           <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Localização Principal</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Endereço Completo</label>
                          <input 
                            type="text" 
                            value={selectedDriverStudio.address || ''}
                            onChange={e => setSelectedDriverStudio({...selectedDriverStudio, address: e.target.value})}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all shadow-sm"
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStudioTab === 'vehicle' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-inner space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl font-bold">directions_bike</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Ativos Transacionais</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações do Veículo de Trabalho</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Veículo</label>
                             <select 
                               value={selectedDriverStudio.vehicle_type || 'Moto'}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_type: e.target.value})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white appearance-none cursor-pointer"
                             >
                               <option>Moto</option>
                               <option>Bicicleta</option>
                               <option>Carro</option>
                               <option>Van / Caminhão</option>
                             </select>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Placa do Veículo</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.license_plate || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, license_plate: e.target.value})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                               placeholder="ABC-1234"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Modelo / Fabricante</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.vehicle_model || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_model: e.target.value})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                               placeholder="Ex: Honda CG 160"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cor Predominante</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.vehicle_color || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, vehicle_color: e.target.value})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                               placeholder="Ex: Vermelha"
                             />
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStudioTab === 'finance' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="p-10 rounded-[48px] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 shadow-inner space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <span className="material-symbols-outlined text-2xl font-bold">account_balance</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Dados para Repasse</h4>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest italic">Pagamentos & Conciliação</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Instituição Bancária</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.bank_info?.bank || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, bank: e.target.value }})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                               placeholder="Nome do Banco"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX (Principal)</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.bank_info?.pix_key || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, pix_key: e.target.value }})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                               placeholder="CPF, E-mail ou Telefone"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Número da Agência</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.bank_info?.agency || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, agency: e.target.value }})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                               placeholder="0001"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Conta & Dígito</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.bank_info?.account || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, bank_info: { ...selectedDriverStudio.bank_info, account: e.target.value }})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                               placeholder="00000000-0"
                             />
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStudioTab === 'documents' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="p-10 rounded-[48px] bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 shadow-inner space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="size-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-600">
                            <span className="material-symbols-outlined text-2xl font-bold">description</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Documentação & KYC</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verificação de Identidade e Segurança</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CPF / Documento</label>
                             <input 
                               type="text" 
                               value={selectedDriverStudio.document_number || ''}
                               onChange={e => setSelectedDriverStudio({...selectedDriverStudio, document_number: e.target.value})}
                               className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm"
                               placeholder="000.000.000-00"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status de Verificação</label>
                             <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl px-6 py-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <span className={`size-3 rounded-full ${selectedDriverStudio.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                  {selectedDriverStudio.status === 'active' ? 'Verificado' : 'Pendente / Em Análise'}
                                </span>
                             </div>
                           </div>
                        </div>

                        <div className="bg-indigo-500/5 rounded-3xl p-6 border border-indigo-500/10">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Arquivos Digitais</p>
                           <div className="flex flex-wrap gap-4">
                              <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                                <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span>
                                CNH_FRENTE.PDF
                              </button>
                              <button className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all">
                                <span className="material-symbols-outlined text-indigo-500">picture_as_pdf</span>
                                CNH_VERSO.PDF
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedDriverStudio({...selectedDriverStudio, is_active: !selectedDriverStudio.is_active})}
                  className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${selectedDriverStudio.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border border-green-100'}`}
                >
                  <span className="material-symbols-outlined text-lg">{selectedDriverStudio.is_active ? 'block' : 'check_circle'}</span>
                  {selectedDriverStudio.is_active ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                </button>
              </div>
              <div className="flex gap-6 items-center">
                <button 
                  onClick={() => setSelectedDriverStudio(null)}
                  className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-all font-sans"
                >
                  Cancelar
                </button>
                <button 
                   disabled={isSaving}
                   onClick={async () => {
                     setIsSaving(true);
                       try {
                         // Obter merchant_id se não estiver presente
                         let mId = selectedDriverStudio.merchant_id;
                         if (!mId && session?.user?.email) {
                           const { data: adminData } = await supabase
                             .from('admin_users')
                             .select('id')
                             .eq('email', session.user.email)
                             .single();
                           if (adminData) mId = adminData.id;
                         }

                         const driverData = {
                           name: selectedDriverStudio.name,
                           phone: selectedDriverStudio.phone,
                           vehicle_type: selectedDriverStudio.vehicle_type,
                           vehicle_model: selectedDriverStudio.vehicle_model,
                           vehicle_color: selectedDriverStudio.vehicle_color,
                           license_plate: selectedDriverStudio.license_plate,
                           document_number: selectedDriverStudio.document_number,
                           address: selectedDriverStudio.address,
                           bank_info: selectedDriverStudio.bank_info,
                           is_active: selectedDriverStudio.is_active,
                           status: selectedDriverStudio.status || 'active',
                           merchant_id: mId
                         };

                       const isNew = !selectedDriverStudio.id || (typeof selectedDriverStudio.id === 'string' && selectedDriverStudio.id.startsWith('new-'));
                       
                       let error;
                       if (isNew) {
                         const { error: err } = await supabase.from('drivers_delivery').insert([driverData]);
                         error = err;
                       } else {
                         const { error: err } = await supabase.from('drivers_delivery').update(driverData).eq('id', selectedDriverStudio.id);
                         error = err;
                       }
                       if (error) throw error;
                       toastSuccess('Dados do entregador salvos com sucesso!');
                       setSelectedDriverStudio(null);
                       fetchDrivers();
                       fetchMyDrivers();
                     } catch (err: any) {
                       toastError('Erro ao salvar entregador: ' + err.message);
                     } finally {
                       setIsSaving(false);
                     }
                   }}
                  className="px-12 py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-lg font-bold ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'done_all'}</span>
                  {isSaving ? 'Processando...' : 'Confirmar & Salvar'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ••••••• Client Detail Studio (Comprehensive Editing) ••••••• */}
      {selectedUserStudio && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedUserStudio(null)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[64px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/10 dark:border-slate-800 h-[92vh]"
          >
            {/* Header */}
            <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-6">
                <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <span className="material-symbols-outlined text-4xl font-black">person</span>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio do Cliente</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                    {(typeof selectedUserStudio.id === 'string' && selectedUserStudio.id.startsWith('new-')) ? 'Novo Cadastro Operacional' : `ID: ${selectedUserStudio.id?.substring(0, 8)}...`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUserStudio(null)}
                className="size-14 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-xl hover:rotate-90"
              >
                <span className="material-symbols-outlined text-2xl font-bold">close</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-12 py-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex gap-10 overflow-x-auto no-scrollbar">
              {[
                { id: 'personal', label: 'Cadastro Base', icon: 'account_circle' },
                { id: 'wallet', label: 'Carteira & Saldo', icon: 'wallet' },
                { id: 'security', label: 'Segurança & Status', icon: 'verified_user' },
                { id: 'iziblack', label: 'Izi Black VIP', icon: 'workspace_premium' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveStudioTab(t.id as any)}
                  className={`flex items-center gap-3 py-6 px-4 border-b-4 transition-all whitespace-nowrap group ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <span className={`material-symbols-outlined text-2xl ${activeStudioTab === t.id ? 'font-fill text-primary' : 'group-hover:scale-110 transition-transform'}`}>{t.icon}</span>
                  <span className="text-xs font-black uppercase tracking-[0.15em]">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Form Area */}
            <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStudioTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-4xl mx-auto w-full"
                >
                  {activeStudioTab === 'personal' && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center gap-6">
                          <div className="size-48 rounded-[56px] bg-slate-100 dark:bg-slate-800 border-8 border-white dark:border-slate-700 shadow-2xl overflow-hidden relative group cursor-pointer ring-4 ring-primary/5">
                            <img 
                              src={`https://ui-avatars.com/api/?name=${selectedUserStudio.name || 'C'}&background=ffd900&color=000&size=256&bold=true`} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-5xl drop-shadow-lg">photo_camera</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm ${selectedUserStudio.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              <span className={`size-2.5 rounded-full ${selectedUserStudio.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                              {selectedUserStudio.is_active ? 'Conta Verificada' : 'Conta Restrita'}
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Social / Razão</label>
                               <input 
                                 type="text" 
                                 value={selectedUserStudio.name || ''}
                                 onChange={e => setSelectedUserStudio({...selectedUserStudio, name: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                                 placeholder="Nome do cliente"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone de Contato</label>
                               <input 
                                 type="text" 
                                 value={selectedUserStudio.phone || ''}
                                 onChange={e => setSelectedUserStudio({...selectedUserStudio, phone: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                                 placeholder="(00) 00000-0000"
                               />
                            </div>
                            <div className="md:col-span-2 space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail Administrativo</label>
                               <input 
                                 type="email" 
                                 value={selectedUserStudio.email || ''}
                                 onChange={e => setSelectedUserStudio({...selectedUserStudio, email: e.target.value})}
                                 className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-5 font-bold text-base focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                                 placeholder="cliente@exemplo.com"
                               />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-2xl font-bold">history</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white">Resumo Cronológico</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Dados gerados pelo sistema</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente desde</span>
                             <span className="text-xl font-black text-slate-900 dark:text-white">
                                {selectedUserStudio.created_at ? new Date(selectedUserStudio.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Novo Registro'}
                             </span>
                          </div>
                          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">ID Global</span>
                             <span className="text-xs font-mono font-bold text-slate-500 truncate block">
                                {selectedUserStudio.id}
                             </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStudioTab === 'wallet' && (
                    <div className="space-y-10">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-12 rounded-[56px] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                           <span className="material-symbols-outlined text-[160px] font-black">account_balance_wallet</span>
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4">Saldo Disponível na Carteira</p>
                          <h3 className="text-6xl font-black tracking-tighter mb-4 flex items-baseline gap-2">
                            <span className="text-2xl font-bold opacity-60">R$</span>
                            {selectedUserStudio.wallet_balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                          </h3>
                          <div className="flex gap-4">
                             <button onClick={() => setShowAddCreditModal(true)} className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all border border-white/20">Adicionar Créditos</button>
                             <button onClick={() => setShowWalletStatementModal(true)} className="px-6 py-3 bg-black/10 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black/20 transition-all border border-white/5">Extrato Detalhado</button>
                          </div>
                        </div>
                      </div>

                      <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                         <h4 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 flex items-center gap-3">
                           <span className="size-2 rounded-full bg-emerald-500"></span>
                           Histórico Recente de Transações
                         </h4>
                         <div className="space-y-4">
                            {isWalletLoading ? (
                              <div className="flex items-center gap-3 h-20 px-6">
                                <span className="material-symbols-outlined animate-spin text-emerald-500">progress_activity</span>
                                <span className="text-xs font-bold text-slate-400">Carregando carteira...</span>
                              </div>
                            ) : walletTransactions.length === 0 ? (
                              <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">receipt_long</span>
                                <span className="text-xs font-bold text-slate-400">Nenhuma transação encontrada</span>
                              </div>
                            ) : (
                              walletTransactions.slice(0, 5).map(tx => {
                                const isPositive = tx.type === 'deposito' || tx.type === 'reembolso';
                                return (
                                <div key={tx.id} className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.01]">
                                   <div className="flex items-center gap-4">
                                      <div className={`size-10 rounded-xl flex items-center justify-center ${!isPositive ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                         <span className="material-symbols-outlined text-xl">{!isPositive ? 'shopping_bag' : 'add_circle'}</span>
                                      </div>
                                      <div>
                                         <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{tx.description || (!isPositive ? 'Uso de Saldo' : 'Aporte de Saldo')}</p>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                   </div>
                                   <span className={`text-sm font-black ${!isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
                                     {!isPositive ? '- ' : '+ '}R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                   </span>
                                </div>
                              )})
                            )}
                         </div>
                      </div>


                    </div>
                  )}

                  {activeStudioTab === 'iziblack' && (
                    <div className="space-y-12">
                      <div className="p-10 rounded-[48px] bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-white/10 transition-colors"></div>
                        <div className="flex items-center gap-6 mb-10 relative z-10">
                          <div className="size-16 rounded-3xl bg-gradient-to-br from-slate-700 to-black flex items-center justify-center text-white shadow-xl shadow-black/50 border border-white/10">
                            <span className="material-symbols-outlined text-3xl font-bold fill-1">workspace_premium</span>
                          </div>
                          <div>
                            <h4 className="text-xl font-black uppercase tracking-tight text-white">Programa Izi Black</h4>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Painel Administrativo VIP</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-4">Status da Assinatura</label>
                              <div className="relative">
                                <select 
                                  value={selectedUserStudio.is_izi_black ? 'active' : 'inactive'}
                                  onChange={e => setSelectedUserStudio({...selectedUserStudio, is_izi_black: e.target.value === 'active'})}
                                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 font-black text-sm focus:ring-4 focus:ring-white/10 text-white appearance-none cursor-pointer"
                                >
                                  <option value="active" className="text-black">🟢 Assinatura VIP Ativa</option>
                                  <option value="inactive" className="text-black">⚪ Sem Assinatura (Conta Comum)</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">expand_more</span>
                              </div>
                           </div>
                           <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Cashback Histórico Ganho</p>
                                <p className="text-3xl font-black text-white tabular-nums italic">R$ <span className="text-emerald-400">{(selectedUserStudio.cashback_earned || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStudioTab === 'security' && (
                    <div className="space-y-12">
                      <div className="p-10 rounded-[48px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                        <div className="flex items-center gap-4 mb-10">
                          <div className="size-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <span className="material-symbols-outlined text-2xl font-bold">lock</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white">Estado Crítico & Segurança</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controles de acesso do usuário</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status Transacional</label>
                              <div className="relative">
                                <select 
                                  value={selectedUserStudio.status || 'active'}
                                  onChange={e => setSelectedUserStudio({...selectedUserStudio, status: e.target.value, is_active: e.target.value === 'active'})}
                                  className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-4 focus:ring-primary/20 dark:text-white appearance-none cursor-pointer shadow-sm"
                                >
                                  <option value="active">🟢 Ativo (Acesso Total)</option>
                                  <option value="inactive">⚪ Inativo (Apenas Leitura)</option>
                                  <option value="suspended">🟡 Suspenso (Ação Requerida)</option>
                                  <option value="blocked">🔴 Bloqueado (Acesso Negado)</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Autenticação</label>
                              <button className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-lg">key</span>
                                Resetar Senha por E-mail
                              </button>
                           </div>
                        </div>
                      </div>

                      <div className="p-10 rounded-[56px] border-4 border-dashed border-red-100 dark:border-red-900/30 flex flex-col items-center text-center gap-6 py-16">
                         <div className="size-20 rounded-[32px] bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                           <span className="material-symbols-outlined text-4xl font-black">gpp_maybe</span>
                         </div>
                         <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Zona de Exclusão</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Estas ações são permanentes e afetarão todos os dados históricos deste cliente.</p>
                         </div>
                         <button className="px-10 py-5 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-red-500/30 hover:scale-105 transition-all">
                           Apagar Registro do Banco de Dados
                         </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-10 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedUserStudio({...selectedUserStudio, is_active: !selectedUserStudio.is_active, status: !selectedUserStudio.is_active ? 'active' : 'inactive'})}
                  className={`px-10 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border shadow-sm ${selectedUserStudio.is_active ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border-red-100' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white border-green-100'}`}
                >
                  <span className="material-symbols-outlined text-xl">{selectedUserStudio.is_active ? 'block' : 'check_circle'}</span>
                  {selectedUserStudio.is_active ? 'Bloquear Cliente' : 'Ativar Acesso'}
                </button>
              </div>
              <div className="flex gap-6 items-center">
                <button 
                  onClick={() => setSelectedUserStudio(null)}
                  className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all underline decoration-2 underline-offset-8 decoration-primary"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isSaving}
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const userData = {
                        name: selectedUserStudio.name,
                        phone: selectedUserStudio.phone,
                        is_active: selectedUserStudio.is_active,
                        status: selectedUserStudio.status || 'active',
                        is_izi_black: selectedUserStudio.is_izi_black || false
                      };

                      const isNew = !selectedUserStudio.id || (typeof selectedUserStudio.id === 'string' && selectedUserStudio.id.startsWith('new-'));
                      
                      let error;
                      if (isNew) {
                         const { error: err } = await supabase.from('users_delivery').insert([userData]);
                         error = err;
                      } else {
                         const { error: err } = await supabase.from('users_delivery').update(userData).eq('id', selectedUserStudio.id);
                         error = err;
                      }
                      if (error) throw error;
                      toastSuccess('Dados do cliente salvos com sucesso!');
                      if (selectedUser && selectedUser.id === selectedUserStudio.id) {
                        setSelectedUser({ ...selectedUser, ...selectedUserStudio });
                      }
                      setSelectedUserStudio(null);
                      fetchUsers();
                    } catch (err: any) {
                      toastError('Erro ao salvar cliente: ' + err.message);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="px-14 py-6 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-full shadow-[0_20px_40px_rgba(255,217,0,0.3)] hover:scale-[1.05] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-xl font-bold ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'done_all'}</span>
                  {isSaving ? 'Processando...' : 'Confirmar & Salvar Alterações'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ••••••• Active Orders Live Monitor ••••••• */}
      {showActiveOrdersModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 text-slate-900">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowActiveOrdersModal(false)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl bg-[#F8F9FA] dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.4)] relative z-10 flex flex-col border border-white/20 dark:border-slate-800 h-[80vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/10">
                  <span className="material-symbols-outlined text-3xl font-bold animate-pulse">shopping_cart</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Monitor de Pedidos Ativos</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{allOrders?.filter(o => !['concluido', 'cancelado'].includes(o.status)).length || 0} pedidos em andamento</p>
                </div>
              </div>
              <button 
                onClick={() => setShowActiveOrdersModal(false)}
                className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
              {allOrders?.filter(o => !['concluido', 'cancelado'].includes(o.status)).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 py-20">
                  <span className="material-symbols-outlined text-6xl">shopping_cart_off</span>
                  <p className="text-sm font-bold uppercase tracking-widest">Nenhum pedido ativo no momento</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allOrders?.filter(o => !['concluido', 'cancelado'].includes(o.status)).map((o, idx) => (
                    <motion.div 
                      key={o.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-bold border border-slate-100 dark:border-slate-800">
                            #{o.id.slice(0, 4).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{o.user_name || 'Cliente'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          <span className="truncate">{o.delivery_address || 'Endereço não informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          <span>{new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <button 
                        disabled={isCompletingOrder === o.id}
                        onClick={() => handleCompleteOrder(o.id)}
                        className="w-full py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-emerald-100 disabled:opacity-50"
                      >
                         {isCompletingOrder === o.id ? (
                           <span className="material-symbols-outlined animate-spin">sync</span>
                         ) : (
                           <span className="material-symbols-outlined text-base">task_alt</span>
                         )}
                         {isCompletingOrder === o.id ? 'Finalizando...' : 'Finalizar como Entregue'}
                      </button>
                    </motion.div>
                  ))}
                    </div>
                  )}
            </div>
          </motion.div>
        </div>
      )}
      {/* ••••••• Category Studio (Services & Infrastructure) ••••••• */}
      {selectedCategoryStudio && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setSelectedCategoryStudio(null)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[56px] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.6)] relative z-10 flex flex-col border border-white/20 dark:border-slate-800 h-[90vh]"
          >
            {/* Studio Header */}
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-6">
                <div className="size-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10 border border-primary/20">
                  <span className="material-symbols-outlined text-4xl font-black">{selectedCategoryStudio.icon || 'category'}</span>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Estúdio de Categoria</h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                      {selectedCategoryStudio.id?.startsWith('new-') ? 'Novo Recurso Estrutural' : `ID: ${selectedCategoryStudio.id}`}
                    </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCategoryStudio(null)}
                className="size-14 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 shadow-xl"
              >
                <span className="material-symbols-outlined text-2xl font-black">close</span>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-10 py-2 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex gap-8">
                 {[
                   { id: 'general', label: 'Dados Gerais', icon: 'settings' },
                   { id: 'subcategories', label: 'Subcategorias', icon: 'account_tree' },
                 ].map(t => (
                   <button
                     key={t.id}
                     onClick={() => setActiveStudioTab(t.id as any)}
                     className={`flex items-center gap-2 py-5 px-3 border-b-4 transition-all ${activeStudioTab === t.id ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                   >
                     <span className="material-symbols-outlined text-xl">{t.icon}</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-white dark:bg-slate-900">
               <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStudioTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      {activeStudioTab === 'general' && (
                         <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">Nome da Categoria</label>
                                   <input 
                                     type="text" 
                                     value={selectedCategoryStudio.name || ''} 
                                     onChange={e => setSelectedCategoryStudio({...selectedCategoryStudio, name: e.target.value})}
                                     className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                                     placeholder="Ex: Limpeza Residencial"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">Ícone (Symbol Name)</label>
                                   <div className="flex gap-4">
                                      <input 
                                        type="text" 
                                        value={selectedCategoryStudio.icon || ''} 
                                        onChange={e => setSelectedCategoryStudio({...selectedCategoryStudio, icon: e.target.value})}
                                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                                        placeholder="Ex: home_repair_service"
                                      />
                                      <div className="size-16 rounded-3xl bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                                         <span className="material-symbols-outlined text-2xl">{selectedCategoryStudio.icon || 'help'}</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">Descrição da Atividade</label>
                                   <textarea 
                                     value={selectedCategoryStudio.description || ''} 
                                     onChange={e => setSelectedCategoryStudio({...selectedCategoryStudio, description: e.target.value})}
                                     className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary shadow-inner h-32 resize-none dark:text-white"
                                     placeholder="Descreva brevemente o que esta categoria abrange..."
                                   />
                                </div>
                            </div>

                            <div className="p-8 rounded-[40px] bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={`size-12 rounded-2xl flex items-center justify-center ${selectedCategoryStudio.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                          <span className="material-symbols-outlined">{selectedCategoryStudio.is_active ? 'check_circle' : 'block'}</span>
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-slate-900 dark:text-white">Status de Disponibilidade</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{selectedCategoryStudio.is_active ? 'Visível para todos os usuários' : 'Oculto na interface do cliente'}</p>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => setSelectedCategoryStudio({...selectedCategoryStudio, is_active: !selectedCategoryStudio.is_active})}
                                      className={`w-16 h-10 rounded-full relative transition-all ${selectedCategoryStudio.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-400'}`}
                                    >
                                       <div className={`absolute top-1 size-8 bg-white rounded-full shadow-md transition-all ${selectedCategoryStudio.is_active ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                         </div>
                      )}

                      {activeStudioTab === 'subcategories' && (
                         <div className="space-y-8">
                            <div className="flex items-center justify-between">
                               <div>
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Sub-nódulos Operacionais</h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defina as especialidades desta categoria</p>
                               </div>
                               <button 
                                 onClick={async () => {
                                    if (String(selectedCategoryStudio.id).startsWith('new-')) {
                                       toastWarning('Salve a categoria principal antes de adicionar subcategorias.');
                                       return;
                                    }
                                    const { data, error } = await supabase.from('categories_delivery').insert([{
                                       name: 'Nova Subcategoria',
                                       parent_id: selectedCategoryStudio.id,
                                       type: 'service',
                                       is_active: true
                                    }]).select();
                                    if (error) toastError('Falha na infraestrutura: ' + error.message);
                                    else {
                                       toastSuccess('Sub-unidade adicionada com sucesso.');
                                       setCategoriesState(prev => [...prev, data[0]]);
                                    }
                                 }}
                                 className="px-6 py-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all"
                               >
                                  + Add Subcategoria
                               </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                               {categoriesState.filter(c => String(c.parent_id) === String(selectedCategoryStudio.id)).map(sub => (
                                  <div key={sub.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                                     <div className="flex items-center gap-6">
                                         <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-800">
                                            <span className="material-symbols-outlined text-xl">{sub.icon || 'subdirectory_arrow_right'}</span>
                                         </div>
                                         <input 
                                           type="text" 
                                           value={sub.name} 
                                           onBlur={async (e) => {
                                              const val = e.target.value;
                                              if (val.trim()) { await supabase.from('categories_delivery').update({ name: val }).eq('id', sub.id); }
                                           }}
                                           onChange={e => {
                                              const updated = categoriesState.map(c => c.id === sub.id ? { ...c, name: e.target.value } : c);
                                              setCategoriesState(updated);
                                           }}
                                           className="bg-transparent border-none font-bold text-sm focus:ring-0 p-0 dark:text-white w-64"
                                         />
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <button 
                                          onClick={async () => {
                                             const nextStatus = !sub.is_active;
                                             const { error } = await supabase.from('categories_delivery').update({ is_active: nextStatus }).eq('id', sub.id);
                                             if (!error) {
                                               setCategoriesState(prev => prev.map(c => c.id === sub.id ? { ...c, is_active: nextStatus } : c));
                                             }
                                          }}
                                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sub.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-500'}`}
                                        >
                                           {sub.is_active ? 'Ativa' : 'Inativa'}
                                        </button>
                                        <button 
                                           onClick={async () => {
                                             if(await showConfirm({ message: 'Excluir subcategoria?' })) {
                                                fetchCategories();
                                             }
                                           }}
                                           className="size-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                        >
                                           <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                     </div>
                                  </div>
                               ))}
                               {categoriesState.filter(c => c.parent_id === selectedCategoryStudio.id).length === 0 && (
                                  <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[48px]">
                                      <div className="size-20 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                                          <span className="material-symbols-outlined text-4xl">account_tree</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-400">Nenhuma subcategoria vinculada.</p>
                                  </div>
                               )}
                            </div>
                         </div>
                      )}
                    </motion.div>
               </AnimatePresence>
            </div>

            {/* Studio Footer */}
            <div className="p-10 border-t border-slate-100 dark:border-slate-800 flex justify-between bg-white dark:bg-slate-950 rounded-b-[56px]">
               <button 
                 onClick={() => setSelectedCategoryStudio(null)}
                 className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all font-sans"
               >
                 Descartar Alterações
               </button>
               <button 
                 disabled={isSaving}
                 onClick={async () => {
                    setIsSaving(true);
                    try {
                      const categoryData = {
                        name: selectedCategoryStudio.name,
                        description: selectedCategoryStudio.description,
                        icon: selectedCategoryStudio.icon,
                        type: selectedCategoryStudio.type || 'service',
                        is_active: selectedCategoryStudio.is_active,
                        parent_id: selectedCategoryStudio.parent_id
                      };

                      const isNew = selectedCategoryStudio.id?.startsWith('new-');
                      
                      if (isNew) {
                         const { data, error } = await supabase.from('categories_delivery').insert([categoryData]).select();
                         if (error) throw error;
                         if (data && data[0]) {
                            // Categoria criada, podemos agora permitir subcategorias
                            toastSuccess('Categoria implementada com sucesso!');
                            setSelectedCategoryStudio(data[0]);
                            setActiveStudioTab('subcategories');
                         }
                      } else {
                        const { error } = await supabase.from('categories_delivery').update(categoryData).eq('id', selectedCategoryStudio.id);
                        if (error) throw error;
                        toastSuccess('Dados atualizados no ecossistema.');
                        setSelectedCategoryStudio(null);
                      }
                      fetchCategories();
                    } catch (err: any) {
                      toastError('Erro na infraestrutura: ' + err.message);
                    } finally {
                      setIsSaving(false);
                    }
                 }}
                 className="px-12 py-5 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
               >
                  {isSaving ? (
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  )}
                  {isSaving ? 'Sincronizando...' : 'Implementar Mudanças'}
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ••••••• Category Directory Modal ••••••• */}
      {showCategoryListModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setShowCategoryListModal(false)}></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[56px] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10 flex flex-col border border-white/20 dark:border-slate-800 h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-6">
                <div className="size-16 rounded-[24px] bg-primary/20 flex items-center justify-center text-primary border border-primary/10 shadow-lg shadow-primary/10">
                  <span className="material-symbols-outlined text-4xl font-black">category</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Diretório de Categorias</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Ecosystem Infrastructure • {categoriesState.length} itens cadastrados</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                  <span className="material-symbols-outlined text-slate-300 ml-2">search</span>
                  <input type="text" placeholder="Filtrar categorias..." className="bg-transparent border-none text-[11px] font-bold px-4 py-2 w-48 focus:ring-0 placeholder:text-slate-300 dark:text-white" />
                </div>
                <button 
                  onClick={() => setShowCategoryListModal(false)}
                  className="size-14 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all border border-slate-200 dark:border-slate-700 hover:rotate-90"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoriesState.sort((a, _b) => (a.parent_id ? 1 : -1)).map((cat) => (
                  <div key={cat.id} className="group p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-xl hover:border-primary/20">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined text-2xl">{cat.icon || 'category'}</span>
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{cat.name}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cat.parent_id ? 'Subcategoria' : 'Categoria Principal'}</p>
                         </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => {
                             setSelectedCategoryStudio(cat);
                             setActiveStudioTab('general');
                             setShowCategoryListModal(false);
                           }}
                           className="size-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-slate-900 transition-all flex items-center justify-center"
                         >
                            <span className="material-symbols-outlined text-base">edit</span>
                         </button>
                         <button 
                           onClick={async () => {
                             if(await showConfirm({ message: 'Tem certeza?' })) {
                               await supabase.from('categories_delivery').delete().eq('id', cat.id);
                               fetchCategories();
                             }
                           }}
                           className="size-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                         >
                            <span className="material-symbols-outlined text-base">delete</span>
                         </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                       <span className={cat.is_active ? 'text-emerald-500' : 'text-slate-300'}>{cat.is_active ? '● Ativo' : '○ Inativo'}</span>
                       <span>Criado em {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Painel de Controle de Infraestrutura</p>
               <button 
                 onClick={() => {
                    setSelectedCategoryStudio({ 
                      id: `new-${Date.now()}`, 
                      name: '', 
                      description: '', 
                      icon: 'category', 
                      type: 'service', 
                      is_active: true 
                    });
                    setActiveStudioTab('general');
                    setShowCategoryListModal(false);
                 }}
                 className="px-8 py-4 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
               >
                 Criar Nova Categoria
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ••••••• Peak Hour Rule Modal ••••••• */}
      {isAddingPeakRule && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 text-slate-900">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setIsAddingPeakRule(false)}></div>
           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] p-10 relative z-10 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                 <span className="material-symbols-outlined text-primary">schedule</span>
                 Novo Horário de Pico
              </h2>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição / Nome</label>
                    <input 
                      type="text" value={newPeakRule.label} placeholder="Ex: Sexta Noite 18h-22h"
                      onChange={e => setNewPeakRule({...newPeakRule, label: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-5 font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Multiplicador Sugerido</label>
                    <div className="flex items-center gap-4">
                       <input 
                        type="range" min="1.0" max="4.0" step="0.1" value={newPeakRule.multiplier}
                        onChange={e => setNewPeakRule({...newPeakRule, multiplier: parseFloat(e.target.value)})}
                        className="flex-1 accent-primary"
                       />
                       <span className="text-xl font-black text-primary w-16 text-center">{newPeakRule.multiplier}x</span>
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsAddingPeakRule(false)} className="flex-1 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 font-black text-xs uppercase tracking-widest text-slate-400">Cancelar</button>
                    <button onClick={handleAddPeakRule} className="flex-1 h-16 rounded-3xl bg-primary font-black text-xs uppercase tracking-widest text-slate-900 shadow-xl shadow-primary/20">Criar Regra</button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* ••••••• Zone Map Selection Modal ••••••• */}
      {selectedZoneForMap && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-10 text-slate-900 overflow-hidden">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" onClick={() => setSelectedZoneForMap(null)}></div>
           <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[56px] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[95vh] border border-white/20">
              {/* Map Side */}
              <div className="flex-1 relative bg-[#f0ebe3]">
                 <div className="absolute top-6 left-6 right-6 z-20 flex gap-3">
                    <div className="flex-1 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl border border-[#f8c967]/50 shadow-xl flex items-center gap-2">
                       <span className="material-symbols-outlined text-[#e98d58] text-lg">search</span>
                       {isLoaded && (
                         <Autocomplete
                           onLoad={auto => setMapSearch(auto)}
                           onPlaceChanged={() => {
                             if (mapSearch) {
                               const place = mapSearch.getPlace();
                               if (place.geometry?.location) {
                                 const lat = place.geometry.location.lat();
                                 const lng = place.geometry.location.lng();
                                 setNewZoneData(prev => ({...prev, lat, lng}));
                                 setMapCenterView({ lat, lng }); setFixedGridCenter({ lat, lng }); setSelectedHexagons([]);
                               }
                             }
                           }}
                         >
                           <input type="text" placeholder="Pesquisar endereço..." className="bg-transparent border-none text-sm font-bold w-full focus:ring-0 placeholder:text-slate-400 text-slate-700" />
                         </Autocomplete>
                       )}
                    </div>
                    {/* My Location Button */}
                    <button
                      onClick={() => {
                        if (!navigator.geolocation) return;
                        setIsGeolocating(true);
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            setNewZoneData(prev => ({...prev, lat, lng}));
                            setMapCenterView({ lat, lng }); setFixedGridCenter({ lat, lng }); setSelectedHexagons([]);
                            setIsGeolocating(false);
                          },
                          () => setIsGeolocating(false),
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      }}
                      className="w-14 h-[46px] rounded-2xl bg-white/95 border border-[#f8c967]/50 shadow-xl flex items-center justify-center hover:bg-[#f8c967]/20 transition-all group"
                      title="Usar minha localização atual"
                    >
                      {isGeolocating
                        ? <span className="material-symbols-outlined text-[#e98d58] animate-spin text-xl">progress_activity</span>
                        : <span className="material-symbols-outlined text-[#e98d58] group-hover:scale-110 transition-transform text-xl">my_location</span>
                      }
                    </button>
                 </div>
                 {mapsLoadError ? (
                   <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-6 p-12 text-center">
                      <span className="material-symbols-outlined text-6xl text-red-400">map_off</span>
                      <div>
                        <p className="text-base font-black text-white uppercase tracking-widest mb-2">API Google Maps com Erro</p>
                        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{mapsLoadError}</p>
                      </div>
                      <div className="bg-slate-800 rounded-2xl p-5 text-left space-y-2 w-full max-w-sm">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Como corrigir:</p>
                        <p className="text-[11px] text-slate-300">1. Acesse console.cloud.google.com</p>
                        <p className="text-[11px] text-slate-300">2. Ative: Maps JavaScript API + Places API</p>
                        <p className="text-[11px] text-slate-300">3. Permita localhost nas restrições da chave</p>
                      </div>
                   </div>
                  ) : isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={mapCenterView}
                      zoom={14}
                      onLoad={map => { zoneMapRef.current = map; }}
                      onDragEnd={() => {
                        if (zoneMapRef.current) {
                          const center = zoneMapRef.current.getCenter();
                          if (center) setMapCenterView({ lat: center.lat(), lng: center.lng() });
                        }
                      }}
                      options={{ 
                         styles: wazeMapStyle, 
                         disableDefaultUI: true, 
                         zoomControl: true,
                         mapTypeControl: false,
                         streetViewControl: false,
                         fullscreenControl: false
                      }}
                      onClick={() => {}}
                    >
                       {hexGrid.map(hex => (
                         <Polygon
                           key={hex.id}
                           paths={getHexPath(hex.center, HEX_SIZE)}
                           onClick={() => {
                             setSelectedHexagons(prev => 
                               prev.includes(hex.id) ? prev.filter(h => h !== hex.id) : [...prev, hex.id]
                             );
                           }}
                           options={{
                             fillColor: selectedHexagons.includes(hex.id) ? "#6366f1" : "transparent",
                             fillOpacity: 0.4,
                             strokeColor: "#6366f1",
                             strokeOpacity: 0.2,
                             strokeWeight: 1,
                           }}
                         />
                       ))}
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4">
                       <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Iniciando Google Maps...</p>
                    </div>
                  )}
               </div>
               {/* Config Side */}
               <div className="w-full md:w-[400px] p-10 flex flex-col justify-between bg-white dark:bg-slate-950 overflow-y-auto scrollbar-hide">
                  <div className="space-y-8">
                     <div>
<h2 className="text-2xl font-black dark:text-white leading-tight">Nova Zona Dinâmica</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuração de Perímetro</p>
                     </div>
                      <div className="space-y-6">
                         <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                               <span className="material-symbols-outlined text-sm">gesture</span>
                               <span className="text-[10px] font-black uppercase tracking-widest">Modo Colmeia Ativo</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                               Clique nos hexágonos no mapa para "pintar" a área de cobertura. A taxa será aplicada a todos os hexágonos selecionados.
                            </p>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Zona</label>
                            <input type="text" value={newZoneData.label} placeholder="Ex: Centro Expandido" onChange={e => setNewZoneData({...newZoneData, label: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-5 font-bold text-slate-900 dark:text-white" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Acréscimo Fixo (R$)</label>
                            <input type="text" value={newZoneData.fee} onChange={e => setNewZoneData({...newZoneData, fee: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-5 font-black text-primary text-xl" />
                         </div>
                      </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setSelectedZoneForMap(null)} className="flex-1 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 font-black text-[10px] uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-slate-800">Cancelar</button>
                     <button onClick={handleAddZone} className="flex-1 h-16 rounded-3xl bg-indigo-500 font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-indigo-200">Salvar Zona</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}

          {/* Modal Adicionar Créditos */}
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
                      onClick={handleAddCredit}
                      disabled={isAddingCredit}
                      className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isAddingCredit ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">done_all</span>}
                      {isAddingCredit ? 'Processando...' : 'Confirmar Pagamento'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Modal Extrato Detalhado */}
          <AnimatePresence>
            {showWalletStatementModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowWalletStatementModal(false)}></div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]"
                >
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">receipt_long</span>
                        Extrato Detalhado
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Todas as movimentações da carteira</p>
                    </div>
                    <button onClick={() => setShowWalletStatementModal(false)} className="size-12 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-colors shadow-sm">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900 space-y-4 custom-scrollbar">
                    {walletTransactions.length === 0 ? (
                      <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-4 block">receipt_long</span>
                        <p className="text-slate-400 font-bold">Nenhuma movimentação registrada.</p>
                      </div>
                    ) : (
                      walletTransactions.map(tx => {
                        const isPositive = tx.type === 'deposito' || tx.type === 'reembolso';
                        return (
                        <div key={tx.id} className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-4">
                              <div className={`size-12 rounded-2xl flex items-center justify-center ${!isPositive ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                <span className="material-symbols-outlined text-2xl">{!isPositive ? 'shopping_bag' : 'add_circle'}</span>
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{tx.description || (!isPositive ? 'Uso de Saldo' : 'Aporte de Saldo')}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[9px] font-mono font-bold text-slate-300 dark:text-slate-600 mt-1">ID: {tx.id}</p>
                              </div>
                          </div>
                          <span className={`text-lg font-black ${!isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
                            {!isPositive ? '- ' : '+ '}R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )})
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* New Order Toast Notification */}
          <AnimatePresence>
            {newOrderNotification.show && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 16, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl p-4 pr-6 flex items-center gap-4 border-2 border-primary/50 cursor-pointer hover:scale-105 transition-all"
                onClick={() => {
                   setNewOrderNotification({show: false});
                   setActiveTab('orders');
                }}
              >
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-900 animate-pulse">
                  <span className="material-symbols-outlined text-2xl font-black">notifications_active</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Pedido Recebido!</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Toque para abrir a tela de pedidos</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Novo Segmento (Stealth Luxury All Black Yellow) */}
          <AnimatePresence>
            {showSegmentModal && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSegmentModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-slate-950 border border-yellow-500/10 rounded-[32px] overflow-hidden shadow-[0_32px_120px_-20px_rgba(234,179,8,0.1)] p-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <span className="material-symbols-outlined text-xl">category</span>
                      </div>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider">Novo Segmento</h2>
                    </div>
                    <button 
                      onClick={() => setShowSegmentModal(false)}
                      className="size-10 flex items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveNewSegment} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">Nome do Segmento</label>
                      <input
                        type="text"
                        autoFocus
                        value={newSegmentName}
                        onChange={e => setNewSegmentName(e.target.value)}
                        placeholder="Ex: Sushibar, Barbearia..."
                        className="w-full bg-black border border-slate-800 rounded-2xl px-6 py-4 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-yellow-500/50 transition-all"
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium px-4 leading-relaxed uppercase tracking-widest text-center">
                      O novo segmento será adicionado à base global e poderá ser selecionado em todos os novos cadastros.
                    </p>

                    <button
                      type="submit"
                      disabled={isSavingSegment || !newSegmentName.trim()}
                      className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-slate-500 text-black rounded-2xl font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 group"
                    >
                      {isSavingSegment ? (
                        <div className="size-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          Salvar Segmento
                          <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Modal Novo/Editar Produto (Allblack Design) */}
          <AnimatePresence>
            {showProductModal && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowProductModal(false)}
                  className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  className="relative w-full max-w-2xl bg-[#000000] border border-yellow-500/10 rounded-[48px] overflow-hidden shadow-[0_32px_120px_-20px_rgba(234,179,8,0.15)] flex flex-col max-h-[90vh]"
                >
                  {/* Header */}
                  <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-[22px] bg-yellow-400 flex items-center justify-center text-black">
                        <span className="material-symbols-outlined text-2xl font-black">inventory_2</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{productForm.id && !productForm.id.startsWith('new-') ? 'Editar Produto' : 'Novo Produto'}</h2>
                        <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-[0.2em] mt-0.5">Gestão de Inventário Premium</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowProductModal(false)}
                      className="size-12 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all hover:rotate-90"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  {/* Scrollable Form */}
                  <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
                    <form id="productForm" onSubmit={handleSaveProduct} className="space-y-8 mt-4">
                      
                      {/* Upload Section */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Visual do Produto</p>
                        <div className="relative group/upload h-48 rounded-[38px] bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:border-yellow-400/40 transition-all overflow-hidden">
                          {productForm.image_url ? (
                            <>
                              <img src={productForm.image_url} className="absolute inset-0 size-full object-cover opacity-40 group-hover/upload:opacity-60 transition-opacity" />
                              <div className="relative z-10 size-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-xl group-hover/upload:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                              </div>
                              <p className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">Alterar Imagem</p>
                            </>
                          ) : (
                            <>
                              <div className="size-16 rounded-[24px] bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20 group-hover/upload:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-loose">Solte a imagem aqui ou <span className="text-yellow-400 underline underline-offset-4">escolha o arquivo</span></p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sugerido: 800x800px (Máx 5MB)</p>
                              </div>
                            </>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsSavingProduct(true);
                                const url = await handleFileUpload(file, 'products');
                                if (url) setProductForm({ ...productForm, image_url: url });
                                setIsSavingProduct(false);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">Nome do Produto</label>
                          <input
                            type="text"
                            required
                            value={productForm.name}
                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                            placeholder="Ex: Coca-Cola 350ml, X-Burguer Duplo..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">Preço (R$)</label>
                          <input
                            type="text"
                            required
                            value={productForm.price}
                            onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="0,00"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4 flex justify-between items-center pr-2">
                            <span>Categoria</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setCategoryPromptType('category');
                                setCategoryPromptName('');
                                setShowCategoryPromptModal(true);
                              }}
                              className="text-yellow-400 hover:text-white flex items-center gap-1 transition-colors normal-case tracking-normal"
                            >
                              <span className="material-symbols-outlined text-[12px]">add</span> Adicionar categoria
                            </button>
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={productForm.category}
                              onChange={e => setProductForm({ ...productForm, category: e.target.value, sub_category: '' })}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all appearance-none cursor-pointer"
                            >
                               <option value="" disabled>Selecione</option>
                               {(userRole === 'admin' && selectedMerchantPreview ? previewCategories : menuCategoriesList).filter(c => !c.parent_id).map(cat => (
                                 <option key={cat.id} value={cat.name}>{cat.name}</option>
                               ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">expand_more</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4 flex justify-between items-center pr-2">
                            <span>Subcategoria</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const activeCategories = userRole === 'admin' && selectedMerchantPreview ? previewCategories : menuCategoriesList;
                                const parent = activeCategories.find(c => c.name === productForm.category && !c.parent_id);
                                if (!parent) return toastError('Selecione uma categoria pai primeiro.');
                                
                                setCategoryPromptType('subcategory');
                                setCategoryPromptName('');
                                setShowCategoryPromptModal(true);
                              }}
                              className="text-yellow-400 hover:text-white flex items-center gap-1 transition-colors normal-case tracking-normal"
                            >
                              <span className="material-symbols-outlined text-[12px]">add</span> Adicionar subcategoria
                            </button>
                          </label>
                          <div className="relative">
                            <select
                              value={productForm.sub_category}
                              onChange={e => setProductForm({ ...productForm, sub_category: e.target.value })}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all appearance-none cursor-pointer"
                            >
                               <option value="">Nenhuma</option>
                               {(userRole === 'admin' && selectedMerchantPreview ? previewCategories : menuCategoriesList).filter(c => c.parent_id && c.parent_id === (userRole === 'admin' && selectedMerchantPreview ? previewCategories : menuCategoriesList).find(parent => parent.name === productForm.category)?.id).map(sub => (
                                 <option key={sub.id} value={sub.name}>{sub.name}</option>
                               ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">Disponibilidade</label>
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, is_available: !productForm.is_available })}
                            className={`w-full h-[58px] rounded-2xl border transition-all flex items-center px-6 gap-3 ${productForm.is_available ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}
                          >
                             <span className="material-symbols-outlined">{productForm.is_available ? 'check_circle' : 'cancel'}</span>
                             <span className="text-[10px] font-black uppercase tracking-widest">{productForm.is_available ? 'Item Disponível' : 'Item Indisponível'}</span>
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">Promoções e Destaques</label>
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, featured: !productForm.featured })}
                            className={`w-full h-[58px] rounded-2xl border transition-all flex items-center px-6 gap-3 ${productForm.featured ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-[#0a0a0a] border-white/10 text-slate-600'}`}
                          >
                             <span className="material-symbols-outlined">{productForm.featured ? 'star' : 'star_border'}</span>
                             <span className="text-[10px] font-black uppercase tracking-widest">{productForm.featured ? 'Produto em Destaque/Oferta' : 'Produto Normal'}</span>
                          </button>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">Descrição</label>
                          <textarea
                            value={productForm.description}
                            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                            placeholder="Ingredientes, peso, tamanho..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-3xl px-6 py-4 font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all min-h-[120px] resize-none"
                          />
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="p-8 bg-black/50 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Padrão de Qualidade • Izi Delivery Systems</p>
                    </div>
                    <div className="flex-1 sm:flex-initial flex items-center gap-3">
                       <button
                         type="button"
                         onClick={() => setShowProductModal(false)}
                         className="flex-1 sm:flex-initial px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         Cancelar
                       </button>
                       <button
                         form="productForm"
                         type="submit"
                         disabled={isSavingProduct}
                         className="flex-1 sm:flex-initial px-10 py-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-slate-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 active:scale-95 flex items-center justify-center gap-2"
                       >
                         {isSavingProduct ? (
                           <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                         ) : (
                           <>
                             {productForm.id && !productForm.id.startsWith('new-') ? 'Salvar Alterações' : 'Criar Produto'}
                             <span className="material-symbols-outlined text-lg">check_circle</span>
                           </>
                         )}
                       </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Modal Nova Categoria/Subcategoria (Allblack Design) */}
          <AnimatePresence>
            {showCategoryPromptModal && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => !isSavingCategoryPrompt && setShowCategoryPromptModal(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-[#000000] border border-yellow-500/10 rounded-[32px] overflow-hidden shadow-[0_32px_120px_-20px_rgba(234,179,8,0.15)]"
                >
                  <div className="p-8 pb-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 mb-1">
                        Izi Delivery Forms
                      </p>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                        {categoryPromptType === 'subcategory' ? 'Nova Subcategoria' : 'Nova Categoria'}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isSavingCategoryPrompt && setShowCategoryPromptModal(false)}
                      className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveCategoryPrompt} className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/60 ml-4">
                        Nome da {categoryPromptType === 'subcategory' ? 'Subcategoria' : 'Categoria'}
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={categoryPromptName}
                        onChange={e => setCategoryPromptName(e.target.value)}
                        placeholder={categoryPromptType === 'subcategory' ? "Ex: Refrigerantes, Tradicionais..." : "Ex: Bebidas, Hambúrgueres..."}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCategoryPromptModal(false)}
                        className="flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCategoryPrompt}
                        className="flex-1 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-slate-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isSavingCategoryPrompt ? (
                          <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>
                            Salvar
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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
  );
}

export default App;



