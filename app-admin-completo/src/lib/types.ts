// Tipos centralizados do projeto izidelivery
// Substitui os principais usos de `any` no App.tsx

export interface Order {
  id: string;
  user_id: string;
  merchant_id?: string;
  merchant_name?: string;
  driver_id?: string;
  status: 'pending' | 'aceito' | 'preparando' | 'pendente' | 'picked_up' | 'em_rota' | 'a_caminho' | 'concluido' | 'cancelado' | 'novo' | 'pendente_pagamento' | 'waiting_merchant' | 'waiting_driver' | 'pronto' | 'no_local';
  service_type?: string;
  total_price: number;
  delivery_address: string;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
  user_name?: string;
  scheduled_at?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicle_type?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  license_plate?: string;
  is_active: boolean;
  password?: string;
  is_online?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  rating?: number;
  merchant_id?: string;
  lat?: number;
  lng?: number;
  bank_info?: {
    bank?: string;
    agency?: string;
    account?: string;
    pix_key?: string;
  };
  document_number?: string;
  address?: string;
  created_at: string;
}

export interface User {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  is_active: boolean;
  status?: 'active' | 'inactive' | 'suspended' | 'blocked';
  wallet_balance?: number;
  cashback_earned?: number;
  is_izi_black?: boolean;
  created_at: string;
}

export interface Merchant {
  id: string;
  email: string;
  role: 'admin' | 'merchant';
  password?: string;
  store_name?: string;
  store_logo?: string;
  store_banner?: string;
  store_description?: string;
  store_phone?: string;
  store_address?: string;
  store_type?: 'restaurant' | 'pharmacy' | 'market' | 'beverages' | string;
  document?: string;
  is_active: boolean;
  is_open?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  delivery_radius?: number;
  commission_percent?: number;
  service_fee?: number;
  dispatch_priority?: 'exclusive' | 'global';
  scheduling_priority?: 'exclusive' | 'global';
  opening_hours?: Record<string, { active: boolean; open: string; close: string }>;
  free_delivery?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MerchantProfile {
  merchant_id?: string;
  store_name?: string;
  store_logo?: string;
  store_description?: string;
  store_banner?: string;
  store_phone?: string;
  delivery_radius?: number;
  opening_hours?: Record<string, { active: boolean; open: string; close: string }>;
  store_address?: string;
  dispatch_priority?: 'exclusive' | 'global';
  scheduling_priority?: 'exclusive' | 'global';
  is_open?: boolean;
  store_type?: string;
  free_delivery?: boolean;
  password?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  subcategory?: string;
  image_url?: string;
  merchant_id: string;
  is_available: boolean;
  featured?: boolean;
  created_at?: string;
  option_groups?: ProductOptionGroup[];
}

export interface ProductOptionGroup {
  id: string;
  product_id: string;
  name: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
  sort_order: number;
  options?: ProductOptionItem[];
}

export interface ProductOptionItem {
  id: string;
  group_id: string;
  name: string;
  price: number;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type?: 'service' | 'mobility';
  parent_id?: string | null;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface Promotion {
  id?: string;
  title: string;
  description?: string;
  image_url?: string;
  coupon_code?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_usage: number;
  usage_count?: number;
  expires_at?: string;
  is_active: boolean;
  is_vip?: boolean;
  merchant_id?: string;
  created_at?: string;
}

export interface DedicatedSlot {
  id: string;
  merchant_id: string;
  title: string;
  description?: string;
  fee_per_day: number;
  working_hours?: string;
  is_active: boolean;
  created_at?: string;
  _isNew?: boolean;
  _tempTitle?: string;
  _tempDesc?: string;
  _tempFee?: number;
  _tempHours?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  module: string;
  metadata?: Record<string, unknown>;
  source_ip?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposito' | 'reembolso' | 'pagamento' | 'saque';
  amount: number;
  description?: string;
  created_at: string;
}

export interface DynamicRate {
  id: string;
  type: 'peak_hour' | 'zone' | 'equilibrium' | 'base_values' | 'weather_rules' | 'flow_control';
  label?: string;
  multiplier?: number;
  fee?: number;
  is_active?: boolean;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MenuCategory {
  id: string;
  name: string;
  merchant_id: string;
  sort_order: number;
  is_active: boolean;
  parent_id?: string | null;
}

export interface DynamicRatesState {
  peakHours: any[];
  zones: any[];
  weather: {
    rain: { multiplier: number; active: boolean };
    storm: { multiplier: number; active: boolean };
    snow: { multiplier: number; active: boolean };
  };
  equilibrium: {
    threshold: number;
    sensitivity: number;
    maxSurge: number;
  };
  baseValues: {
    mototaxi_min: string;
    mototaxi_km: string;
    carro_min: string;
    carro_km: string;
    van_min: string;
    van_km: string;
    utilitario_min: string;
    utilitario_km: string;
    isDynamicActive: boolean;
  };
  flowControl: {
    mode: 'auto' | 'manual';
    highDemandActive: boolean;
  };
}

export interface PartnerStore {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  category?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export type Tab = 'dashboard' | 'tracking' | 'orders' | 'drivers' | 'users' | 'financial' |
  'settings' | 'support' | 'promotions' | 'categories' | 'dynamic_rates' |
  'audit_logs' | 'my_store' | 'my_drivers' | 'my_studio' | 'merchants' | 'izi_black' | 'partners';

export type UserRole = 'admin' | 'merchant';

export interface AppSettings {
  appName: string;
  supportEmail: string;
  openingTime: string;
  closingTime: string;
  radius: number;
  baseFee: number;
  appCommission: number;
  serviceFee: number;
  smsNotifications: boolean;
  emailNotifications: boolean;
  iziBlackFee: number;
  iziBlackCashback: number;
  iziBlackMinOrderFreeShipping: number;
  flashOfferTitle: string;
  flashOfferDiscount: number;
  flashOfferExpiry: string;
  iziCoinRate: number;
}

export interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  completedOrdersCount: number;
  avgTicket: number;
  netProfit: number;
  totalCommission: number;
  deliverySuccessRate: number;
  dailyRevenue: number[];
  revenuePath: string;
  dayLabels: string[];
  totalOrdersToday: number;
  categories: any[];
  topMerchants: any[];
}
