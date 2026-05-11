import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateFreightPrice, calculateVanPrice } from "../lib/pricing_engine";
import { useAuth } from '../hooks/useAuth';
import { toastSuccess, toastError, toastWarning } from "../lib/useToast";

interface AppContextData {
  // Configurações
  globalSettings: any;
  appSettings: any;
  isInitializing: boolean;
  initError: string | null;
  activeBroadcast: any | null;
  user: any | null;
  userId: string | null;
  userName: string;
  closeBroadcast: () => void;
  refreshSettings: () => Promise<void>;

  // Orquestração de View
  view: "login" | "app" | "loading";
  setView: (view: "login" | "app" | "loading") => void;
  tab: "home" | "orders" | "wallet" | "profile" | "busca";
  setTab: (tab: "home" | "orders" | "wallet" | "profile" | "busca") => void;
  subView: string;
  setSubView: (subView: string) => void;
  navigateSubView: (view: string) => void;
  
  // Seleção e Estado Global de UI
  selectedItem: any | null;
  setSelectedItem: (item: any | null) => void;
  selectedShop: any | null;
  setSelectedShop: (shop: any | null) => void;
  activeService: any | null;
  setActiveService: (service: any | null) => void;
  
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  paymentsOrigin: "checkout" | "profile" | "izi_black";
  setPaymentsOrigin: (origin: "checkout" | "profile" | "izi_black") => void;
  
  // Estados de Pagamento e Membership
  pixCpf: string;
  setPixCpf: (cpf: string) => void;
  pixConfirmed: boolean;
  setPixConfirmed: (confirmed: boolean) => void;
  isIziBlackMembership: boolean;
  setIsIziBlackMembership: (isBlack: boolean) => void;
  lightningData: any;
  setLightningData: (data: any) => void;
  
  // Localização
  userLocation: { lat: number | null; lng: number | null; loading: boolean; error: string | null; address?: string };
  updateLocation: (highAccuracy?: boolean) => Promise<{ lat: number; lng: number; address: string } | null>;
  setUserLocation: (loc: any) => void;

  // Carrinho e Checkout
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  appliedCoupon: any | null;
  setAppliedCoupon: (coupon: any | null) => void;
  useCoins: boolean;
  setUseCoins: (use: boolean) => void;
  getCartSubtotal: () => number;
  clearCart: () => void;

  // Estabelecimentos (Migrado do App.tsx)
  ESTABLISHMENTS: any[];
  setESTABLISHMENTS: React.Dispatch<React.SetStateAction<any[]>>;
  handleShopClick: (shop: any) => Promise<void>;
  establishmentTypes: any[];
  setEstablishmentTypes: (types: any[]) => void;
  handleResumePayment: (order: any) => void;

  // Trânsito e Envios
  transitData: any;
  setTransitData: React.Dispatch<React.SetStateAction<any>>;
  isCalculatingPrice: boolean;
  setIsCalculatingPrice: React.Dispatch<React.SetStateAction<boolean>>;
  routeDistance: string;
  setRouteDistance: React.Dispatch<React.SetStateAction<string>>;
  distancePrices: any;
  setDistancePrices: React.Dispatch<React.SetStateAction<any>>;
  calculateDistancePrices: (origin: any, destination: any) => void;
  handleRequestTransit: () => void;
  showDatePicker: boolean;
  setShowDatePicker: React.Dispatch<React.SetStateAction<boolean>>;
  showTimePicker: boolean;
  setShowTimePicker: React.Dispatch<React.SetStateAction<boolean>>;
  showLojistasModal: boolean;
  setShowLojistasModal: React.Dispatch<React.SetStateAction<boolean>>;
  marketConditions: any;
  fetchMarketData: () => Promise<void>;
  routePolyline: any[];
  setRoutePolyline: React.Dispatch<React.SetStateAction<any[]>>;
  distanceValueKm: number;
  setDistanceValueKm: React.Dispatch<React.SetStateAction<number>>;
  nearbyDrivers: any[];
  setNearbyDrivers: React.Dispatch<React.SetStateAction<any[]>>;
  nearbyDriversCount: number;
  setNearbyDriversCount: React.Dispatch<React.SetStateAction<number>>;
  handleConfirmMobility: (paymentMethod: string) => Promise<void>;
  calculateVanPrice: typeof calculateVanPrice;
  calculateFreightPrice: typeof calculateFreightPrice;
  calculateDynamicPrice: (basePrice: number) => number;
  selectedCard: any;
  setSelectedCard: (card: any) => void;
  walletBalance: number;
  setWalletBalance: (balance: number) => void;
  iziCoins: number;
  setIziCoins: (coins: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  triggerCartAnimation: (e: any, img: string) => void;
  // Mobilidade e Etapas
  mobilityStep: number;
  setMobilityStep: (step: number) => void;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authInitLoading, user, userId, userName } = useAuth();
  
  // Estados de Configuração
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);

  // Estados de Pagamento e Saldo
  const [walletBalance, setWalletBalance] = useState(0);
  const [iziCoins, setIziCoins] = useState(0);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(() => (typeof window !== "undefined" ? localStorage.getItem("preferredPaymentMethod") || "cartao" : "cartao"));

  // Salvar método preferido quando mudar (Sincronizado via CartSync)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredPaymentMethod", paymentMethod);
    }
  }, [paymentMethod]);

  // Estados de Orquestração (Movidos do App.tsx)

  const [view, setView] = useState<"login" | "app" | "loading">("loading");
  const [tab, setTab] = useState<"home" | "orders" | "wallet" | "profile" | "busca">("home");
  const [subView, setSubView] = useState<string>("none");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [activeService, setActiveService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentsOrigin, setPaymentsOrigin] = useState<"checkout" | "profile" | "izi_black">("checkout");

  // Estados de Pagamento e Membership
  const [pixCpf, setPixCpf] = useState("");
  const [pixConfirmed, setPixConfirmed] = useState(false);
  const [isIziBlackMembership, setIsIziBlackMembership] = useState(false);
  const [lightningData, setLightningData] = useState<any>(null);
  const [cartAnimations, setCartAnimations] = useState<any[]>([]);

  const triggerCartAnimation = (e: any, img: string) => {
    if (!e) return;
    const id = Date.now().toString() + Math.random();
    setCartAnimations(prev => [...prev, { id, x: e.clientX, y: e.clientY, img }]);
    setTimeout(() => {
      setCartAnimations(prev => prev.filter(a => a.id !== id));
    }, 800);
  };

  // Localização
  const [userLocation, setUserLocation] = useState<any>({ lat: null, lng: null, loading: false, error: null, address: "" });

  // Carrinho e Checkout
  const [cart, setCart] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [useCoins, setUseCoins] = useState(false);

  // Estabelecimentos (Migrado do App.tsx)
  const [ESTABLISHMENTS, setESTABLISHMENTS] = useState<any[]>([]);
  const [establishmentTypes, setEstablishmentTypes] = useState<any[]>([]);

  // Trânsito e Envios (Migrado do App.tsx)
  const [transitData, setTransitData] = useState<any>({
    type: "mototaxi",
    subService: "express",
    priority: "normal",
    operationType: "enviar",
    origin: "",
    destination: "",
    weightClass: "Pequeno (até 5kg)",
    packageDesc: "",
    receiverName: "",
    receiverPhone: "",
    scheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    estPrice: 0,
    stops: []
  });
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [routeDistance, setRouteDistance] = useState("");
  const [distancePrices, setDistancePrices] = useState<any>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLojistasModal, setShowLojistasModal] = useState(false);
  const [distanceValueKm, setDistanceValueKm] = useState(0);
  const [routePolyline, setRoutePolyline] = useState<any[]>([]);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [nearbyDriversCount, setNearbyDriversCount] = useState(0);
  const [mobilityStep, setMobilityStep] = useState(1);

  const [marketConditions, setMarketConditions] = useState({
    demand: 1.0,
    traffic: "Normal",
    surgeMultiplier: 1.0,
    settings: {
      baseValues: {
        isDynamicActive: false,
        mototaxi_min: 6,
        carro_min: 14,
        van_min: 35,
        utilitario_min: 10,
        mototaxi_km: 1.2,
        carro_km: 2.5,
        van_km: 8.0,
        utilitario_km: 2.0
      },
      shippingPriorities: {}
    }
  });

  const calculateDynamicPrice = (basePrice: number) => {
    return marketConditions.settings.baseValues.isDynamicActive 
      ? basePrice * marketConditions.surgeMultiplier 
      : basePrice;
  };

  const closeBroadcast = () => {
    if (activeBroadcast?.id) {
      localStorage.setItem('last_izi_broadcast_user', activeBroadcast.id);
    }
    setActiveBroadcast(null);
  };


  const refreshSettings = async () => {
    try {
      const { data: gData } = await supabase.from('admin_settings_delivery').select('*').eq('key', 'global').maybeSingle();
      if (gData?.value) setGlobalSettings(gData.value);
      const { data: aData } = await supabase.from('app_settings_delivery').select('*').maybeSingle();
      if (aData) setAppSettings(aData);
    } catch (e) { console.error("Error refreshing settings:", e); }
  };

  const updateLocation = async (highAccuracy = true): Promise<{ lat: number; lng: number; address: string } | null> => {
    console.log("[GPS] Iniciando busca de localização...");
    setUserLocation(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      const msg = "Geolocalização não suportada";
      setUserLocation(prev => ({ ...prev, loading: false, error: msg }));
      toastError(msg);
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0 // Força o GPS a buscar uma posição nova, não do cache
    };

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.warn("[GPS] Timeout de 12s atingido");
        setUserLocation(prev => ({ ...prev, loading: false, error: "Tempo limite excedido" }));
        toastWarning("O GPS demorou a responder. Tente novamente em um local aberto.");
        resolve(null);
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timer);
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          console.log(`[GPS] Coordenadas obtidas: ${lat}, ${lng} (Precisão: ${accuracy}m)`);
          
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ 
              location: { lat, lng },
              region: 'BR',
              language: 'pt-BR'
            }, (results, status) => {
              let address = "";
              
              if (status === "OK" && results && results[0]) {
                // Filtra para remover códigos postais ou partes genéricas se desejar, 
                // mas formatted_address costuma ser o melhor
                address = results[0].formatted_address;
                console.log("[GPS] Endereço geocodificado:", address);
              } else {
                address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                console.warn("[GPS] Geocoder falhou ou não retornou resultados precisos");
              }
              
              const newData = { lat, lng, address, loading: false, error: null };
              setUserLocation(newData);
              resolve(newData);
            });
          } else {
            const newData = { lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, loading: false, error: null };
            setUserLocation(newData);
            resolve(newData);
          }
        },
        (err) => {
          clearTimeout(timer);
          let errorMsg = "Falha ao obter GPS";
          if (err.code === 1) errorMsg = "Permissão de localização negada";
          else if (err.code === 2) errorMsg = "Posição indisponível";
          
          console.error("[GPS] Erro:", err);
          setUserLocation(prev => ({ ...prev, loading: false, error: errorMsg }));
          toastError(errorMsg);
          resolve(null);
        },
        options
      );
    });
  };

  const getCartSubtotal = () => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const clearCart = () => { setCart([]); setAppliedCoupon(null); setUseCoins(false); };

  const APP_TABS = ["home", "orders", "wallet", "profile", "busca"] as const;
  const navigateSubView = (target: string) => {
    if ((APP_TABS as readonly string[]).includes(target)) {
      setTab(target as typeof tab);
      setSubView("none");
      window.history.pushState(
        { view: "app", tab: target, subView: "none" },
        "",
      );
    } else {
      setSubView(target);
      window.history.pushState(
        { view: "app", tab, subView: target },
        "",
      );
    }
  };

  const handleShopClick = async (shop: any) => {
    setSelectedShop(shop);
    setSubView("shop_detail");
  };

  const fetchMarketData = async () => {
    try {
      // Busca base_values e shipping_priorities da tabela correta
      const { data: rows } = await supabase
        .from('dynamic_rates_delivery')
        .select('type, multiplier, metadata, is_active');

      if (rows && rows.length > 0) {
        const baseValuesRow = rows.find((r: any) => r.type === 'base_values');
        const prioritiesRow = rows.find((r: any) => r.type === 'shipping_priorities');

        // Calcular multiplicador composto de todas as regras ativas
        const activeMultipliers = rows
          .filter((r: any) => r.is_active && r.type !== 'base_values' && r.type !== 'shipping_priorities')
          .reduce((acc: number, r: any) => acc * (Number(r.multiplier) || 1.0), 1.0);

        setMarketConditions(prev => ({
          ...prev,
          surgeMultiplier: activeMultipliers,
          settings: {
            ...prev.settings,
            baseValues: baseValuesRow?.metadata || prev.settings.baseValues,
            shippingPriorities: prioritiesRow?.metadata || {}
          }
        }));
      }
    } catch (e) { console.error("Error fetching market data:", e); }
  };


  const calculateDistancePrices = async (origin: string, destination: string) => {
    setIsCalculatingPrice(true);
    try {
      if (!window.google || !window.google.maps) {
        throw new Error("Google Maps não carregado");
      }

      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await new Promise<window.google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        }, (res, status) => {
          if (status === "OK" && res) resolve(res);
          else reject(new Error(`Falha ao calcular rota: ${status}`));
        });
      });

      const route = result.routes[0];
      const leg = route.legs[0];
      const distKm = (leg.distance?.value || 0) / 1000;
      const durationMin = Math.ceil((leg.duration?.value || 0) / 60);
      
      setRouteDistance(`${distKm.toFixed(1).replace('.', ',')} km • ${durationMin} min`);
      setDistanceValueKm(distKm);
      setRoutePolyline(route.overview_path);

      const bv = marketConditions.settings.baseValues;
      const newPrices = {
        mototaxi: Math.max(bv.mototaxi_min, distKm * bv.mototaxi_km) * marketConditions.surgeMultiplier,
        carro: Math.max(bv.carro_min, distKm * bv.carro_km) * marketConditions.surgeMultiplier,
        van: Math.max(bv.van_min, distKm * bv.van_km) * marketConditions.surgeMultiplier,
        utilitario: Math.max(bv.utilitario_min, distKm * bv.utilitario_km) * marketConditions.surgeMultiplier
      };

      setDistancePrices(newPrices);
      setTransitData((prev: any) => ({ 
        ...prev, 
        estPrice: newPrices[prev.type as keyof typeof newPrices] || newPrices.utilitario 
      }));
    } catch (err) {
      console.error("Erro ao calcular rota:", err);
      toastError("Não foi possível calcular a rota. Verifique os endereços.");
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const handleRequestTransit = useCallback(() => {
    if (!transitData.origin) {
      toastError("Selecione um ponto de coleta/parceiro");
      return;
    }
    if (!transitData.destination) {
      toastError("Defina o endereço de entrega");
      return;
    }
    if (!transitData.receiverName) {
      toastError("Informe o nome do destinatário");
      return;
    }
    if (!transitData.receiverPhone) {
      toastError("Informe o telefone de contato");
      return;
    }
    if (transitData.scheduled && (!transitData.scheduledDate || !transitData.scheduledTime)) {
      toastError("Selecione data e hora para o agendamento");
      return;
    }
    
    setSubView("mobility_payment");
  }, [transitData, setSubView]);

  const handleConfirmMobility = async (paymentMethod: string) => {
    if (globalSettings?.maintenance_mode) {
      toastError("Plataforma em manutenção. Tente novamente mais tarde.");
      return;
    }

    if (!userId) {
      toastWarning("Faça login para continuar");
      return;
    }

    const isShipping = ['utilitario', 'van', 'frete', 'logistica'].includes(transitData.type);
    const bv = marketConditions.settings.baseValues;
    const basePrices: Record<string, number> = { 
      mototaxi: bv.mototaxi_min || 6, 
      carro: bv.carro_min || 14, 
      van: bv.van_min || 35, 
      utilitario: bv.utilitario_min || 10 
    };
    
    let finalPrice = 0;
    const surgeMultiplier = bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0;

    if (transitData.type === 'logistica' || transitData.type === 'frete') {
       if (Number(transitData.estPrice) > 0) {
         finalPrice = Number(transitData.estPrice);
       } else {
          finalPrice = calculateFreightPrice({
              baseFare: 45 * surgeMultiplier,
              distanceInKm: distanceValueKm,
              distanceRate: 4.5 * surgeMultiplier,
              helperCount: (transitData.freightData?.helpers || 0),
              helperRate: 35,
              hasStairs: false,
              stairsFee: 30
          }).totalPrice;
       }
    } else if (transitData.type === 'van') {
       finalPrice = calculateVanPrice({
          baseFare: 35,
          distanceInKm: distanceValueKm,
          distanceRate: 8 * surgeMultiplier,
          stopCount: transitData.stops?.length || 0,
          stopRate: 15,
          isDaily: false,
          hours: 4,
          hourlyRate: 45
       }).totalPrice;
    } else {
      const rawP = distancePrices[transitData.type];
      finalPrice = isNaN(rawP) || !rawP ? (basePrices[transitData.type] || 6.90) : rawP;
    }
    
    const priorityId = transitData.priority;
    const priorityConfig = marketConditions.settings?.shippingPriorities?.[priorityId as keyof typeof marketConditions.settings.shippingPriorities];
    
    if (priorityConfig && priorityConfig.active) {
      if ((priorityConfig as any).km_fee > 0) {
        finalPrice = (priorityConfig.min_fee || 0) + ((priorityConfig as any).km_fee * distanceValueKm);
      } else {
        finalPrice *= (priorityConfig.multiplier || 1.0);
        if (finalPrice < (priorityConfig.min_fee || 0)) {
          finalPrice = priorityConfig.min_fee;
        }
      }
    }

    const serviceFeePercent = globalSettings?.service_fee_percent || 0;
    const rawServiceFee = (finalPrice * serviceFeePercent) / 100;
    const serviceFeeAmount = isIziBlackMembership ? 0 : rawServiceFee;
    finalPrice += serviceFeeAmount;

    setIsLoading(true);

    try {
      const initialPaymentStatus = (paymentMethod === 'dinheiro' || paymentMethod === 'pix' || paymentMethod === 'bitcoin_lightning') ? 'pending' : 'paid';
      const initialOrderStatus = (paymentMethod === 'cartao') ? 'pendente_pagamento' : 'waiting_driver';

      const orderBase: any = {
        user_id: userId,
        status: initialOrderStatus,
        total_price: finalPrice,
        service_type: transitData.type,
        pickup_address: typeof transitData.origin === 'object' ? (transitData.origin.address || transitData.origin.formatted_address) : transitData.origin,
        delivery_address: `${typeof transitData.destination === 'object' ? (transitData.destination.formatted_address || transitData.destination.address) : transitData.destination}`,
        payment_method: paymentMethod,
        payment_status: initialPaymentStatus,
        scheduled_at: (transitData.scheduled) ? `${transitData.scheduledDate}T${transitData.scheduledTime}:00` : null,
        route_polyline: routePolyline
      };

      if (paymentMethod === "saldo") {
        const coinValue = globalSettings?.izi_coin_value || 1.0;
        const totalBrlAvailable = walletBalance + (iziCoins * coinValue);
        
        if (totalBrlAvailable < finalPrice) {
          toastError("Saldo insuficiente");
          setIsLoading(false);
          return;
        }

        let remainingToPay = finalPrice;
        let tempNewIziCoins = iziCoins;
        let tempNewWalletBalance = walletBalance;

        if ((tempNewIziCoins * coinValue) >= remainingToPay) {
          tempNewIziCoins -= (remainingToPay / coinValue);
          remainingToPay = 0;
        } else {
          remainingToPay -= (tempNewIziCoins * coinValue);
          tempNewIziCoins = 0;
        }

        if (remainingToPay > 0) {
          tempNewWalletBalance -= remainingToPay;
        }

        await supabase.from("users_delivery").update({ 
          wallet_balance: Number(tempNewWalletBalance.toFixed(2)),
          izi_coins: Number(tempNewIziCoins.toFixed(8))
        }).eq("id", userId);

        setWalletBalance(tempNewWalletBalance);
        setIziCoins(tempNewIziCoins);
      }

      const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(orderBase).select().single();
      
      if (insertError || !order) throw insertError || new Error("Falha ao criar pedido");

      setSelectedItem(order);
      
      if (paymentMethod === 'pix') {
         setSubView('pix_payment');
      } else if (paymentMethod === 'bitcoin_lightning') {
         setSubView("lightning_payment");
      } else if (paymentMethod === 'cartao') {
         setSubView("card_payment");
      } else {
         setSubView("mobility_payment_success");
      }
    } catch (err: any) {
      console.error("Erro no fluxo de mobilidade:", err);
      toastError("Erro ao criar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronização do Carrinho
  useEffect(() => {
    if (!userId) {
      setCart([]);
      return;
    }

    const syncCart = async () => {
      try {
        const { data, error } = await supabase
          .from('cart_sync_delivery')
          .select('items')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.items) {
          const { 
            cart: savedCart, 
            appliedCoupon: savedCoupon, 
            useCoins: savedUseCoins,
            paymentMethod: savedMethod
          } = data.items;
          
          if (savedCart) setCart(savedCart);
          if (savedCoupon) setAppliedCoupon(savedCoupon);
          if (savedUseCoins !== undefined) setUseCoins(savedUseCoins);
          if (savedMethod) setPaymentMethod(savedMethod);
        }
        setIsInitialLoad(false);
      } catch (e) {
        console.error("Erro ao sincronizar carrinho:", e);
        setIsInitialLoad(false);
      }
    };

    syncCart();

    const cartSub = supabase
      .channel(`cart_sync_${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cart_sync_delivery',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newItems = (payload.new as any)?.items;
        if (newItems) {
           // Só atualiza se for diferente do atual para evitar loops
           setCart(prev => {
             const prevStr = JSON.stringify(prev);
             const nextStr = JSON.stringify(newItems);
             return prevStr === nextStr ? prev : newItems;
           });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(cartSub);
    };
  }, [userId]);

  // Salvar alterações do carrinho no DB
  useEffect(() => {
    if (!userId || isInitialLoad) return;

    const saveCart = async () => {
      try {
        await supabase
          .from('cart_sync_delivery')
          .upsert({ 
            user_id: userId, 
            items: { 
              cart, 
              appliedCoupon, 
              useCoins,
              paymentMethod
            }, 
            updated_at: new Date().toISOString() 
          });
      } catch (e) {
        console.error("Erro ao salvar carrinho:", e);
      }
    };

    const timer = setTimeout(saveCart, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [cart, userId, isInitialLoad]);

  const handleResumePayment = (order: any) => {
    if (!order) return;
    setSelectedItem(order);
    const method = (order.payment_method || '').toLowerCase();
    
    if (method.includes('pix')) {
      navigateSubView('pix_payment');
    } else if (method.includes('lightning') || method.includes('bitcoin')) {
      navigateSubView('lightning_payment');
    } else if (method.includes('cartao') || method.includes('card') || method.includes('stripe') || method.includes('credit')) {
      navigateSubView('payments');
    } else {
      navigateSubView('payments'); // Fallback para tela de seleção
    }
  };

  // Sincronização de Saldo e Moedas
  useEffect(() => {
    if (!userId) {
      setWalletBalance(0);
      setIziCoins(0);
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users_delivery')
          .select('wallet_balance, izi_coins, is_izi_black')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setWalletBalance(data.wallet_balance || 0);
          setIziCoins(data.izi_coins || 0);
          setIsIziBlackMembership(!!data.is_izi_black);
        }
      } catch (e) {
        console.error("Erro ao carregar dados financeiros:", e);
      }
    };

    fetchUserData();

    const userSub = supabase
      .channel(`user_balance_${userId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users_delivery',
        filter: `id=eq.${userId}`
      }, (payload) => {
        const { wallet_balance, izi_coins, is_izi_black } = payload.new as any;
        if (wallet_balance !== undefined) setWalletBalance(wallet_balance);
        if (izi_coins !== undefined) setIziCoins(izi_coins);
        if (is_izi_black !== undefined) setIsIziBlackMembership(!!is_izi_black);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userSub);
    };
  }, [userId]);

  // Orquestrador de Inicialização
  useEffect(() => {
    const initializeApp = async () => {
      await refreshSettings();
      await fetchMarketData();
      setIsInitializing(false);
    };
    initializeApp();
    
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Escuta de Transmissões Administrativas (Popups)
  useEffect(() => {
    if (!userId) {
      setActiveBroadcast(null);
      return;
    }

    const initBroadcasts = async () => {
      const { data } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .eq('status', 'sent')
        .in('type', ['popup', 'both'])
        .in('target_type', ['all', 'users'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data[0]) {
        const lastSeen = localStorage.getItem('last_izi_broadcast_user');
        if (lastSeen !== data[0].id) {
          setActiveBroadcast(data[0]);
        }
      }
    };

    initBroadcasts();

    const broadcastSub = supabase
      .channel(`broadcast-notifs-user-${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'broadcast_notifications' 
      }, (payload) => {
        const notif = payload.new as any;
        if ((notif.type === 'popup' || notif.type === 'both') && 
            (notif.target_type === 'all' || notif.target_type === 'users')) {
          setActiveBroadcast(notif);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastSub);
    };
  }, [userId]);

  return (
    <AppContext.Provider value={{
      globalSettings, appSettings, isInitializing, initError, activeBroadcast, closeBroadcast, refreshSettings,
      user, userId, userName,
      view, setView, tab, setTab, subView, setSubView, navigateSubView,
      selectedItem, setSelectedItem, selectedShop, setSelectedShop, activeService, setActiveService,
      isLoading, setIsLoading, paymentsOrigin, setPaymentsOrigin,
      pixCpf, setPixCpf, pixConfirmed, setPixConfirmed, isIziBlackMembership, setIsIziBlackMembership, lightningData, setLightningData,
      userLocation, updateLocation, setUserLocation,
      cart, setCart, appliedCoupon, setAppliedCoupon, useCoins, setUseCoins, getCartSubtotal, clearCart,
      ESTABLISHMENTS, setESTABLISHMENTS, handleShopClick, establishmentTypes, setEstablishmentTypes,
      transitData, setTransitData, isCalculatingPrice, setIsCalculatingPrice, routeDistance, setRouteDistance,
      distancePrices, setDistancePrices, calculateDistancePrices, handleRequestTransit,
      showDatePicker, setShowDatePicker, showTimePicker, setShowTimePicker, showLojistasModal, setShowLojistasModal,
      marketConditions, fetchMarketData, routePolyline, setRoutePolyline, distanceValueKm, setDistanceValueKm,
      nearbyDrivers, setNearbyDrivers, nearbyDriversCount, setNearbyDriversCount,
      handleConfirmMobility,
      selectedCard, setSelectedCard, walletBalance, setWalletBalance, iziCoins, setIziCoins,
      paymentMethod, setPaymentMethod, triggerCartAnimation, cartAnimations,
      mobilityStep, setMobilityStep, handleResumePayment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
