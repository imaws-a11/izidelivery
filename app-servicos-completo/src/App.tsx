import { useState, useMemo, useEffect, useRef, useCallback, Fragment } from "react";
import { BespokeIcons } from "./lib/BespokeIcons";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import iziCoinImg from "./assets/images/izi-coin-premium.png";
import { supabase } from "./lib/supabase";
import { toast, toastSuccess, toastError, toastWarning, showConfirm } from "./lib/useToast";
import { useGoogleMapsLoader } from "./hooks/useGoogleMapsLoader";
import { GMAPS_KEY } from "./config";
// Mercado Pago
import { MercadoPagoCardForm } from "./components/MercadoPagoCardForm";
import { calculateFreightPrice, calculateVanPrice } from "./lib/pricing_engine";

// Novos Componentes Modulares
import { Icon } from "./components/common/Icon";
import { DigitalTimer } from "./components/common/DigitalTimer";
import { AddressSearchInput } from "./components/features/Address/AddressSearchInput";
import { AIConciergePanel } from "./components/features/AI/AIConciergePanel";
import { IziTrackingMap } from "./components/features/Map/IziTrackingMap";
import { LoginView } from "./components/features/Auth/LoginView";
import { HomeView } from "./components/features/Home/HomeView";
import { OrderListView } from "./components/features/Order/OrderListView";
import { ProfileView } from "./components/features/Profile/ProfileView";
import { WalletView } from "./components/features/Wallet/WalletView";
import { IziPayView } from "./components/features/Wallet/IziPayView";
import { CartView } from "./components/features/Cart/CartView";
import { CheckoutView } from "./components/features/Checkout/CheckoutView";
import { ActiveOrderView } from "./components/features/Order/ActiveOrderView";
import { OrderDetailView } from "./components/features/Order/OrderDetailView";
import { IziCoinTrackingView } from "./components/features/Order/IziCoinTrackingView";
import { EstablishmentListView } from "./components/features/Establishment/EstablishmentListView";
import { ExploreRestaurantsView } from "./components/features/Home/ExploreRestaurantsView";
import { ExploreBarsView } from "./components/features/Tourism/ExploreBarsView";
import { HotelReservationDetailsView } from "./components/features/Tourism/HotelReservationDetailsView";
import { ExploreHotelsView } from "./components/features/Tourism/ExploreHotelsView";
import { BeverageOffersView } from "./components/features/Home/BeverageOffersView";
import { RestaurantMenuView } from "./components/features/Home/RestaurantMenuView";
import { MarketExploreView } from "./components/features/Home/MarketExploreView";
import { PaymentMethodsView } from "./components/features/Payment/PaymentMethodsView";
import { FlashOffersListView } from "./components/features/FlashOffersListView";
import { AddressListView } from "./components/features/Address/AddressListView";
import { NotificationsCenterView } from "./components/features/Notifications/NotificationsCenterView";
import { QuestCenterView } from "./components/features/Gamification/QuestCenterView";
import { IziBlackView } from "./components/features/Membership/IziBlackView";
import { ExploreEnviosView } from "./components/features/Shipping/ExploreEnviosView";
import { ExploreEnviosUberView } from "./components/features/Shipping/ExploreEnviosUberView";
import { ExploreTurboFlashView } from "./components/features/Shipping/Explores/ExploreTurboFlashView";
import { ExploreLightFlashView } from "./components/features/Shipping/Explores/ExploreLightFlashView";
import { ExploreExpressView } from "./components/features/Shipping/Explores/ExploreExpressView";
import { ExploreScheduledView } from "./components/features/Shipping/Explores/ExploreScheduledView";
import { ScheduledCheckoutView } from "./components/features/Shipping/ScheduledCheckoutView";
import { ExploreIziEnviosView } from "./components/features/Shipping/Explores/ExploreIziEnviosView";
import { ExploreClickCollectView } from "./components/features/Shipping/Explores/ExploreClickCollectView";
import { ProductDetailView } from "./components/features/Product/ProductDetailView";
import { CategoryListView } from "./components/features/Explore/CategoryListView";
import { FoodCategoryExplorer } from "./components/features/Explore/FoodCategoryExplorer";
import { PharmacyExploreView } from "./components/features/Explore/PharmacyExploreView";
import { BeverageExploreView } from "./components/features/Explore/BeverageExploreView";
import { MarketExploreView as NewMarketExploreView } from "./components/features/Explore/MarketExploreView";
import { PetshopExploreView } from "./components/features/Explore/PetshopExploreView";
import { GasWaterExploreView } from "./components/features/Explore/GasWaterExploreView";
import { ExperienceExploreView } from './components/features/ExperienceExploreView';
import { ExperienceDetailView } from './components/features/ExperienceDetailView';
import { ExperienceCheckoutView } from './components/features/ExperienceCheckoutView';
import { experiencesMockData } from './data/experiencesMock';
import { BakeryExploreView } from "./components/features/Explore/BakeryExploreView";
import { FruitExploreView } from "./components/features/Explore/FruitExploreView";
import { EnviosExploreView } from "./components/features/Home/EnviosExploreView";
import { SearchView } from "./components/features/Explore/SearchView";
import { AIConciergeView } from "./components/features/AI/AIConciergeView";
import { PaymentFlowView } from "./components/features/Checkout/PaymentFlowView";
import { OrderStatusView } from "./components/features/Order/OrderStatusView";
import { OrderSupportView } from "./components/features/Order/OrderSupportView";
import { OrderFeedbackView } from "./components/features/Order/OrderFeedbackView";
import { FloatingHeader } from "./components/common/FloatingHeader";
import { AddressDrawer } from "./components/features/Address/AddressDrawer";
import { OrderWaitingView } from "./components/features/Order/OrderWaitingView";

// Mobilidade e Envios
import { MobilityWizardView } from "./components/features/Mobility/MobilityWizardView";
import { LogisticsTrackingView } from "./components/features/Mobility/LogisticsTrackingView";
import SplashScreenComponent from "./components/common/SplashScreen";
import { SplashScreen as CapacitorSplash } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from '@capacitor/push-notifications';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import { useApp } from "./hooks/useApp";
import { useNotification } from "./contexts/NotificationContext";
import type { SavedAddress, Order, Quest } from "./types";

// Componentes agora em arquivos separados

function App() {
  useGoogleMapsLoader();

  const {
    // Auth
    user, userId, userName, setUserName, phone, setPhone,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword,
    authMode, setAuthMode, isLoading, setIsLoading, loginError, setLoginError,
    authInitLoading, setAuthInitLoading, handleLogin, handleSignUp, logout, isAdmin,
    rememberMe, setRememberMe,

    // Global / Config
    isInitializing, initError, globalSettings, appSettings, 
    activeBroadcast, closeBroadcast,
    pixCpf, setPixCpf, pixConfirmed, setPixConfirmed, lightningData, setLightningData,

    // Orquestração de View
    view, setView, tab, setTab, subView, setSubView, navigateSubView: _ignoredNavigate,
    selectedItem, setSelectedItem, selectedShop, setSelectedShop, activeService, setActiveService, paymentsOrigin, setPaymentsOrigin,
    userLocation: _ignoredLocation, updateLocation: _ignoredUpdate, // Ignorados pois o App.tsx ainda usa versões locais legadas

    // Outros Contextos
    walletBalance, iziCoins, setIziCoins, userXP, setUserXP, iziCashbackEarned, isIziBlackMembership, walletTransactions, fetchWalletData,
    orders, activeOrder, fetchOrders, setActiveOrder,
    savedAddresses, saveAddress, deleteAddress, setActiveAddress,

    // Checkout & Cart
    cart, setCart, appliedCoupon, setAppliedCoupon, useCoins, setUseCoins, getCartSubtotal, clearCart: _ignoredClearCart,

    // Libs
    toastSuccess, toastError, showConfirm
  } = useApp();

  const { unreadCount } = useNotification();

  const [cartAnimations, setCartAnimations] = useState<{id: string, x: number, y: number, img: string}[]>([]);
  const userLevel = useMemo(() => Math.floor((userXP || 0) / 100) + 1, [userXP]);
  const activeOrdersCount = useMemo(() => 
    orders.filter(o => o.status && !["concluido", "cancelado"].includes(o.status)).length, 
  [orders]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showMasterPerks, setShowMasterPerks] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("OlÃ¡! Como posso ajudar vocÃª hoje?");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPaymentMethod, setDepositPaymentMethod] = useState("pix");
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  const sendInternalNotification = async (title: string, body: string, data: any = {}) => {
    if (!userId) return;
    try {
      await supabase.from('notifications_delivery').insert({
        user_id: userId,
        title,
        body,
        data,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("[NOTIFY] Erro ao criar notificação interna:", e);
    }
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const triggerCartAnimation = (e: React.MouseEvent, img: string) => {
    const id = Date.now().toString() + Math.random();
    setCartAnimations(prev => [...prev, { id, x: e.clientX, y: e.clientY, img }]);
    setTimeout(() => {
      setCartAnimations(prev => prev.filter(a => a.id !== id));
    }, 800);
  };

  const [showSplash, setShowSplash] = useState(true);
  const [flashOffers, setFlashOffers] = useState<any[]>([]);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isInitializing) {
      const timer = setTimeout(() => setShowSplash(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitializing]);


  // Reset scroll on subView change
  useEffect(() => {
    if (subView !== "none") {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [subView]);

  // Sincroniza o endereço padrão (ativo) do usuário com o userLocation global
  useEffect(() => {
    if (userId && savedAddresses.length > 0) {
      const activeAddr = savedAddresses.find(a => a.active);
      if (activeAddr) {
        console.log("[LOCATION] Sincronizando endereço ativo do usuário:", activeAddr.street);
        setUserLocation({
          address: activeAddr.street,
          lat: activeAddr.lat,
          lng: activeAddr.lng,
          isManual: true, // Bloqueia sobrescrita pelo GPS
          loading: false
        });
      }
    }
  }, [userId, savedAddresses]);

  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);



// Fetch payment methods when entering payments screen





  // As funÃ§Ãµes de endereÃ§o e cartÃµes foram migradas para AddressContext e WalletContext

  useEffect(() => {
    fetchMarketData();
    fetchFlashOffers();
    fetchBeveragePromo();
    fetchExploreBanners();
    const interval = setInterval(fetchMarketData, 20000);
    const flashChannel = supabase.channel('flash_offers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_offers' }, fetchFlashOffers)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(flashChannel);
    };
  }, [userId]);

  // SincronizaÃ§Ã£o em Tempo Real de Pedidos (Webhooks/Status)
  useEffect(() => {
    if (!userId) return;

    const ordersChannel = supabase.channel('orders_realtime_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders_delivery',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log("[REALTIME] AtualizaÃ§Ã£o de Pedido:", payload);
        fetchOrders(); // Atualiza lista global
        
        const newOrder = payload.new as any;
        const oldOrder = payload.old as any;

        if (selectedItem && newOrder && newOrder.id === selectedItem.id) {
          setSelectedItem(newOrder);
          
          // Transições Automáticas de Tela baseadas no Status
          if (newOrder.status !== oldOrder?.status) {
             const statusMap: any = {
               "confirmado": { title: "Pedido Confirmado", body: `A loja ${newOrder.merchant_name} aceitou seu pedido!` },
               "preparando": { title: "Em Preparo", body: "Seu pedido já está sendo preparado." },
               "em_rota": { title: "Saiu para Entrega", body: "O entregador já está a caminho do seu endereço!" },
               "coletado": { title: "Pedido Coletado", body: "O entregador acabou de retirar seu pedido." },
               "picked_up": { title: "Pedido Coletado", body: "O entregador acabou de retirar seu pedido." },
               "no_local": { title: "Entregador no Local", body: "O entregador chegou! Prepare-se para receber." },
               "concluido": { title: "Pedido Entregue", body: "Obrigado por pedir com o Izi! Aproveite seu pedido." },
               "cancelado": { title: "Pedido Cancelado", body: "Infelizmente seu pedido foi cancelado." }
             };

             if (statusMap[newOrder.status]) {
                sendInternalNotification(statusMap[newOrder.status].title, statusMap[newOrder.status].body, { orderId: newOrder.id });
             }

             if (newOrder.status === "confirmado") {
                toastSuccess("Pedido aceito! A loja já está preparando.");
                setSubView("active_order");
             } else if (newOrder.status === "em_rota") {
                toastSuccess("Pedido em rota! Prepare-se para receber.");
                setSubView("active_order");
             } else if (newOrder.status === "cancelado") {
                toastError("O pedido foi cancelado pela loja.");
                setSubView("none");
             }
          }

          // ConfirmaÃ§Ã£o de Pagamento Digital (Webhooks do MP/BTCPay)
          if (newOrder.payment_status === "paid" && oldOrder?.payment_status !== "paid") {
             toastSuccess("Pagamento confirmado com sucesso!");
             // Se estava na tela de aguardando pagamento, move para aguardando lojista
             if (navigationSubViewRef.current === "waiting_payment" || navigationSubViewRef.current === "pix_payment" || navigationSubViewRef.current === "lightning_payment") {
                setSubView("waiting_merchant");
             }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [userId, selectedItem]);

  // Registro de Notificacoes Push Nativas (Capacitor)
  useEffect(() => {
    if (!userId || !user) return;

    const setupPush = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('[PUSH] Pulando: Ambiente Web.');
        return;
      }

      try {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[PUSH] Permissao negada pelo usuario.');
          return;
        }

        // Cria canal dedicado no Android 8+ para garantir som e vibraÃ§Ã£o
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'order_updates',
            name: 'AtualizaÃ§Ãµes de Pedidos',
            description: 'NotificaÃ§Ãµes sobre status de pedidos e entregas',
            sound: 'notification',
            importance: 5,
            visibility: 1,
            vibration: true
          });
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('[PUSH] Token registrado:', token.value);
          await supabase
            .from('users_delivery')
            .update({ push_token: token.value })
            .eq('id', userId);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[PUSH] Erro no registro:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PUSH] Recebida:', notification);
          showToast(`${notification.title}: ${notification.body}`, 'info');
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[PUSH] AÃ§Ã£o do usuÃ¡rio:', notification);
        });

      } catch (err) {
        console.error('[PUSH] Falha na configuracao:', err);
      }
    };

    setupPush();

    // Listener para o botÃ£o de voltar do Android (Capacitor)
    const backButtonHandler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      console.log("[BACK] BotÃ£o fÃ­sico detectado. canGoBack:", canGoBack);
      
      // Se houver uma subview aberta, voltamos para 'none'
      if (navigationSubViewRef.current !== "none") {
        console.log("[BACK] Fechando subView:", navigationSubViewRef.current);
        window.history.back();
        return;
      }
      
      // Se estivermos em uma aba diferente de 'home', voltamos para 'home'
      if (tabRef.current !== "home") {
        console.log("[BACK] Voltando para aba Home");
        window.history.back();
        return;
      }

      // Se nÃ£o houver histÃ³rico para voltar no navegador, podemos deixar o Capacitor fechar o app
      // ou apenas registrar. Se canGoBack for false, o app geralmente fecha.
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    // Listener para mudanÃ§as no histÃ³rico (popstate) do navegador
    const handlePopState = (event: PopStateEvent) => {
      console.log("[POPSTATE] MudanÃ§a detetada:", event.state);
      if (event.state) {
        if (event.state.subView) setSubView(event.state.subView);
        if (event.state.tab) setTab(event.state.tab);
      } else {
        // Se voltarmos ao estado inicial (sem state)
        setSubView("none");
        setTab("home");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
        backButtonHandler.then(h => h.remove());
      }
      window.removeEventListener("popstate", handlePopState);
    };
  }, [userId, user]);

  const handleStartNativeTransferScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      showToast("Use o leitor na aba Carteira para web.", "info");
      return;
    }

    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera !== 'granted') {
        const { camera: newStatus } = await BarcodeScanner.requestPermissions();
        if (newStatus !== 'granted') return;
      }

      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        const text = barcodes[0].displayValue;
        const cleanId = text.replace("izipay:", "").replace("user:", "").replace("merchant:", "").trim();
        
        // Simula busca
        const { data: userData } = await supabase.from("users_delivery").select("id, name, email").eq("id", cleanId).single();
        if (userData) {
          setTransferTarget(userData);
        } else {
          showToast("Usuário não encontrado.", "error");
        }
      }
    } catch (err) {
      console.error("Native Scan Error:", err);
    }
  };

  const handleConfirmSavedCardShortcut = async (orderId: string, amount: number, origin: string) => {
    if (!selectedCard) {
      setSubView("card_payment");
      return;
    }
    
    setIsLoading(true);
    try {
      const cleanEmail = (user?.email || loginEmail || "cliente@izidelivery.com").trim().toLowerCase();
      const brand = (selectedCard.brand || "Visa").toLowerCase();
      const token = selectedCard.mp_token || selectedCard.token;

      // Mapeamento correto para IDs do Mercado Pago
      let mpMethodId = "master";
      if (brand.includes("visa")) mpMethodId = "visa";
      else if (brand.includes("master")) mpMethodId = "master";
      else if (brand.includes("amex")) mpMethodId = "amex";
      else if (brand.includes("elo")) mpMethodId = "elo";
      else if (brand.includes("hiper")) mpMethodId = "hipercard";

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
        body: {
          amount: Number(amount.toFixed(2)),
          orderId: orderId,
          payment_method_id: mpMethodId,
          token: token,
          email: cleanEmail,
          installments: 1
        },
      });

      if (fnErr || (fnData && (fnData.status !== 'approved' && fnData.status !== 'in_process'))) {
         const mpMsg = fnData?.details || fnData?.error || fnErr?.message || "O cartão foi recusado pela operadora.";
         console.error("[PAYMENT ERROR]", { fnErr, fnData });
         toastError(`Pagamento não aprovado: ${mpMsg}`);
         if (origin === "izi_black") setSubView("izi_black_purchase");
         else if (origin === "profile") {
           setShowDepositModal(true);
           setSubView("none");
         }
         else setSubView("checkout");
         return;
      }

      // Sucesso
      if (origin === "izi_black") {
         await supabase.from('users_delivery').update({ is_izi_black: true }).eq('id', userId);
         setIsIziBlackMembership(true);
         setIziBlackStep('success');
         setSubView("izi_black_purchase");
      } else if (origin === "profile") {
         setSubView("izi_coin_tracking");
      } else {
         const { data: updatedOrder } = await supabase.from("orders_delivery").select().eq("id", orderId).single();
         setSelectedItem(updatedOrder || { id: orderId });
         if (cart.length > 0) await clearCart(orderId);
         setTab("orders");
         setSubView("none");
      }
      toastSuccess("Pagamento aprovado!");

    } catch (err: any) {
      console.error("Card processing shortcut error:", err);
      toastError("Instabilidade na rede. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // fetchWalletBalance migrada para WalletContext

  const fetchCartData = async (uid: string) => {
    if (!uid) return;
    try {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("cart_data")
        .eq("id", uid)
        .maybeSingle();
      
      if (!error && data && Array.isArray(data.cart_data)) {
        // [Comentario Limpo pelo Sistema]
        setCart(data.cart_data);
        isFirstEmptySync.current = false;
      }
    } catch (e) {
      console.error("Erro ao buscar sacola sincronizada:", e);
    }
  };

  const isLoaded = true; // Loaded via index.html

  const updateLocation = (force = false, onSuccess?: (address: string, lat: number, lng: number) => void) => {
    // Se o endereÃ§o foi definido manualmente e nÃ£o for um "force", ignoramos a atualizaÃ§Ã£o automÃ¡tica
    // Isso evita que o GPS do dispositivo sobrescreva um endereÃ§o salvo ou selecionado.
    const processCoords = async (latitude: number, longitude: number, accuracy?: number) => {
      // Se for forÃ§ado ou estivermos em tela de mobilidade, removemos o bloqueio manual
      const mobilityViews = ["taxi_wizard", "freight_wizard", "logistics_tracking", "excursion_wizard", "van_wizard"];
      const isMobility = mobilityViews.includes(subView);
      
      if (force || isMobility) {
        setUserLocation(prev => ({ ...prev, isManual: false }));
      } else if (userLocation.isManual && !force) {
        console.log("[GPS] Ignorando atualizaÃ§Ã£o automÃ¡tica pois o endereÃ§o Ã© manual.");
        return;
      }

      try {
        // PROTEÃ‡ÃƒO: Nunca sobrescrever coordenadas boas com piores
        // Se jÃ¡ temos coords com boa precisÃ£o, rejeita atualizaÃ§Ãµes com precisÃ£o muito pior
        setUserLocation(prev => {
          const prevAccuracy = prev.accuracy as number | undefined;
          if (prevAccuracy && accuracy && prevAccuracy < 200 && accuracy > prevAccuracy * 3) {
            console.log(`[GPS] Ignorando coords ruins (${accuracy.toFixed(0)}m) â€” jÃ¡ temos ${prevAccuracy.toFixed(0)}m`);
            return prev; // MantÃ©m as coords atuais, melhores
          }
          return { ...prev, lat: latitude, lng: longitude, accuracy, loading: false };
        });
        
        setTransitData(prev => {
          // Se for mobilidade e ainda nÃ£o tiver origem, ou se for forÃ§ado, atualiza a origem
          const shouldUpdateOrigin = isMobility || force || !prev.origin?.lat;
          if (!shouldUpdateOrigin) return prev;
          
          const currentOrigin = prev.origin;
          const isObj = currentOrigin && typeof currentOrigin === 'object';
          
          return {
            ...prev,
            origin: isObj 
              ? { ...currentOrigin, lat: latitude, lng: longitude }
              : { address: currentOrigin || "Minha localizaÃ§Ã£o", lat: latitude, lng: longitude }
          };
        });

        let address = "";
        let snappedLat = latitude;
        let snappedLng = longitude;

        // 2. BUSCA ENDEREÃ‡O EM SEGUNDO PLANO
        // Tenta reverse geocode via Google Maps Geocoder (browser)
        if ((window as any).google?.maps) {
          try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
              location: { lat: latitude, lng: longitude },
            });
            if (response.results[0]) {
              address = response.results[0].formatted_address;
              if (response.results[0].geometry?.location) {
                snappedLat = response.results[0].geometry.location.lat();
                snappedLng = response.results[0].geometry.location.lng();
              }
            }
          } catch { /* silent */ }
        }

        // Fallback: Places API via fetch
        if (!address) {
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GMAPS_KEY}&language=pt-BR&result_type=street_address|route`
            );
            const data = await res.json();
            if (data.results?.[0]) {
              address = data.results[0].formatted_address;
              if (data.results[0].geometry?.location) {
                snappedLat = data.results[0].geometry.location.lat;
                snappedLng = data.results[0].geometry.location.lng;
              }
            }
          } catch { /* silent */ }
        }

        // Fallback: Nominatim (OpenStreetMap)
        if (!address) {
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const nomData = await nomRes.json();
            address = nomData.display_name?.split(",").slice(0, 3).join(",").trim() || "LocalizaÃ§Ã£o atual";
            if (nomData.lat && nomData.lon) {
              snappedLat = parseFloat(nomData.lat);
              snappedLng = parseFloat(nomData.lon);
            }
          } catch { /* silent */ }
        }

        if (!address) address = "LocalizaÃ§Ã£o atual";

        // 3. ATUALIZA APENAS O ENDEREÃ‡O QUANDO CHEGAR
        // VerificaÃ§Ã£o dupla: se no meio do caminho o endereÃ§o virou manual (ex: carregou endereÃ§o salvo), abortamos.
        setUserLocation(prev => {
          if (prev.isManual && !force) return prev;
          return { ...prev, address, loading: false };
        });

        localStorage.setItem("lastKnownLocation", JSON.stringify({ address, loading: false, lat: snappedLat, lng: snappedLng, accuracy }));
        setTransitData((prev) => ({ 
          ...prev, 
          origin: { 
            address: address, 
            lat: snappedLat, 
            lng: snappedLng 
          } 
        }));
        if (onSuccess) onSuccess(address, snappedLat, snappedLng);
      } catch (error) {
        console.error("[GPS] Erro ao processar coordenadas:", error);
        setUserLocation((prev) => ({ ...prev, loading: false }));
      }
    };

    // --- Caminho Nativo (Android / iOS via Capacitor) ---
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          const perm = await Geolocation.requestPermissions();
          if (perm.location === "granted") {
            const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            });
            await processCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          } else {
            setUserLocation({ address: "PermissÃ£o de localizaÃ§Ã£o negada", loading: false });
          }
        } catch {
          setUserLocation({ address: "Erro ao obter localizaÃ§Ã£o", loading: false });
        }
      })();
      return;
    }

    // --- Caminho Web (Browser via navigator.geolocation) ---
    if (!("geolocation" in navigator)) {
      setUserLocation({ address: "GeolocalizaÃ§Ã£o nÃ£o disponÃ­vel", loading: false });
      return;
    }

    const tryGoogleGeolocationAPI = async () => {
      // Google Geolocation API - muito mais precisa que navigator.geolocation em desktops
      try {
        const res = await fetch(
          `https://www.googleapis.com/geolocation/v1/geolocate?key=${GMAPS_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ considerIp: true }) }
        );
        const data = await res.json();
        if (data.location) {
          console.log(`[GPS] Google Geolocation API: ${data.location.lat}, ${data.location.lng} (precisÃ£o: ${data.accuracy}m)`);
          await processCoords(data.location.lat, data.location.lng, data.accuracy);
          return true;
        }
      } catch (e) {
        console.warn("[GPS] Google Geolocation API falhou:", e);
      }
      return false;
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`[GPS] Browser geolocation: ${latitude}, ${longitude} (precisÃ£o: ${accuracy?.toFixed(0)}m)`);
        await processCoords(latitude, longitude, accuracy);
      },
      async (error) => {
        console.warn("[GPS] Browser geolocation falhou:", error.message);
        // SÃ³ usa Google Geolocation API se NÃƒO temos coordenadas prÃ©vias
        const hasExistingCoords = userLocation.lat && userLocation.lng;
        if (!hasExistingCoords) {
          console.log("[GPS] Sem coords prÃ©vias. Tentando Google Geolocation API...");
          const ok = await tryGoogleGeolocationAPI();
          if (!ok) {
            setUserLocation(prev => ({ ...prev, address: "NÃ£o foi possÃ­vel obter localizaÃ§Ã£o", loading: false }));
          }
        } else {
          console.log("[GPS] Mantendo coords existentes (browser timeout mas jÃ¡ temos GPS).");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    const mobilityViews = ["taxi_wizard", "freight_wizard", "logistics_tracking", "excursion_wizard", "van_wizard"];
    let watchId: any = null;

    if (mobilityViews.includes(subView)) {
      console.log("[GEO] Ativando monitoramento contÃ­nuo para subView:", subView);
      if (Capacitor.isNativePlatform()) {
        Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }, (pos) => {
          if (pos?.coords) {
            setUserLocation(prev => { 
              if (!prev.isManual) {
                setTransitData(tPrev => ({ ...tPrev, origin: { ...tPrev.origin, lat: pos.coords.latitude, lng: pos.coords.longitude } }));
              }
              return { 
                ...prev, 
                lat: pos.coords.latitude, 
                lng: pos.coords.longitude, 
                loading: false,
                accuracy: pos.coords.accuracy 
              };
            });
          }
        }).then(id => { watchId = id; });
      } else {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setUserLocation(prev => { 
              if (!prev.isManual) {
                setTransitData(tPrev => ({ ...tPrev, origin: { ...tPrev.origin, lat: pos.coords.latitude, lng: pos.coords.longitude } }));
              }
              return { 
                ...prev, 
                lat: pos.coords.latitude, 
                lng: pos.coords.longitude, 
                loading: false,
                accuracy: pos.coords.accuracy 
              };
            });
          },
          (err) => {
            // watchPosition pode dar timeout em desktop - nÃ£o faz nada, mantÃ©m coords existentes
            console.log("[GEO] Watch timeout/erro (normal em desktop):", err?.message);
          },
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
        );
      }
    }

    return () => {
      if (watchId !== null) {
        if (Capacitor.isNativePlatform()) Geolocation.clearWatch({ id: watchId });
        else navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [subView]);

  useEffect(() => {
    if (user) {
      setView("app");
      window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
      
      fetchOrders();
      fetchWalletData();
      fetchSavedCards(userId!);
      fetchCoupons();
      fetchBeveragePromo();
      fetchFlashOffers();
    } else if (!authInitLoading) {
      setView("login");
    }
  }, [user, authInitLoading, userId]);
  useEffect(() => {
    if (!userId) return;
    const sub = supabase
      .channel("orders_tracking")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders_delivery" },
        (payload) => {
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          if (!newOrder || newOrder.user_id !== userIdRef.current) return;

          // Sempre atualizar a lista local para refletir no F5 ou navegaÃ§Ãµes
          if (userIdRef.current) fetchOrders();

          // Verificar transiÃ§Ãµes de status para Toasts
          const statusChanged = oldOrder && oldOrder.status && newOrder.status !== oldOrder.status;
          
          if (statusChanged || !oldOrder) {
            const statusMessages: Record<string, string> = {
              'novo': 'Pagamento aprovado! O lojista jÃ¡ recebeu seu pedido. âš¡',
              'pendente_pagamento': 'Aguardando confirmaÃ§Ã£o do pagamento... ðŸ’³',
              'pendente': 'O lojista recebeu seu pedido! ðŸ¥³',
              'aceito': 'O estabelecimento aceitou seu pedido! ðŸ¥³',
              'confirmado': 'Pedido confirmado! O preparo comeÃ§ou. âœ…',
              'preparando': 'Seu pedido estÃ¡ sendo preparado com carinho! ðŸ¥—',
              'no_preparo': 'Seu pedido jÃ¡ estÃ¡ no preparo! ðŸ¥—',
              'waiting_driver': 'Pedido aceito! Buscando o melhor entregador para vocÃª. ðŸ›µ',
              'pronto': 'Pedido pronto! Aguardando o motoboy para coleta. ðŸ“¦',
              'saiu_para_coleta': 'O motoboy aceitou e estÃ¡ indo retirar seu pedido! ðŸ›µ',
              'chegou_coleta': 'O motoboy chegou ao estabelecimento para retirar seu pedido! ðŸ›µ',
              'picked_up': 'Pedido coletado! O motoboy iniciou a entrega para vocÃª. ðŸš€',
              'a_caminho': 'Motoboy a caminho! Sua entrega estÃ¡ em rota. ðŸ›µ',
              'saiu_para_entrega': 'Fique atento! Seu pedido saiu para entrega! ðŸ›µ',
              'em_rota': 'Motoboy a caminho! Prepare-se para receber seu Izi. ðŸ›µ',
              'no_local': 'O motoboy chegou ao seu endereÃ§o! ðŸ””',
              'concluido': 'Pedido entregue com sucesso! Bom apetite. âœ¨',
              'cancelado': 'Ah não! Seu pedido foi cancelado. ⚠️',
              'recusado': 'Desculpe, o estabelecimento não pôde aceitar o pedido agora. ⚠️'
            };

            const msg = statusMessages[newOrder.status] || `Status do pedido atualizado: ${newOrder.status}`;
            showToast(msg, newOrder.status === 'cancelado' ? 'warning' : 'success');
          }

          // Monitoramento de Sucesso de Pagamento (Bitcoin / Pix / Geral)
          // NOTA: !oldOrder foi removido â€” sem ele, pedidos de dinheiro/maquininha (que sÃ£o INSERTs novos)
          // nÃ£o disparam incorretamente o fluxo de confirmaÃ§Ã£o digital.
          const isPaid = newOrder.payment_status === 'paid' || (newOrder.status === 'novo' && oldOrder?.status === 'pendente_pagamento');
          
          if (isPaid) {
            const isPaymentSubView = ["lightning_payment", "pix_payment", "payment_processing", "card_payment"].includes(navigationSubViewRef.current);
            if (isPaymentSubView) {
              console.log("[REALTIME] Sucesso detectado para pedido:", newOrder.id);
              if (newOrder.service_type === 'coin_purchase') {
                setSelectedItem(newOrder);
                setSubView("izi_coin_tracking");
              } else {
                clearCart(newOrder.id);
                setSubView("payment_success");
              }
            }
          }

          // Feedback de conclusÃ£o
          if (newOrder.status === 'concluido' && (oldOrder?.status !== 'concluido' || !oldOrder)) {
            setSelectedItem(newOrder);
            setTimeout(() => {
              if (newOrder.service_type === 'subscription') {
                setShowIziBlackWelcome(true);
                setSubView("none");
              } else if (newOrder.service_type === 'coin_purchase') {
                showToast("IZI COINS adicionados com sucesso!", "success");
                setShowDepositModal(false);
                setSubView("izi_coin_tracking");
                if (userIdRef.current) fetchWalletData();
              } else {
                setSubView("order_feedback");
              }
            }, 2000);
          }

          // TransiÃ§Ãµes de estados de espera
          if ((navigationSubViewRef.current === "waiting_merchant" || navigationSubViewRef.current === "lightning_payment" || navigationSubViewRef.current === "pix_payment") && 
              ["novo", "paid", "pago", "aceito", "confirmado", "preparando", "pendente", "no_preparo", "pronto", "waiting_driver"].includes(newOrder.status)) {
            showToast("Pagamento confirmado! ✅", "success");
            setSelectedItem(newOrder); 
            setTimeout(() => setSubView("active_order"), 1000);
          }

          if (navigationSubViewRef.current === "waiting_merchant" && newOrder.status === "cancelado") {
            showToast("Seu pedido foi recusado.", "warning");
            setSubView("none");
          }

          if (navigationSubViewRef.current === "waiting_driver" && ["a_caminho", "em_rota", "no_local", "picked_up", "saiu_para_entrega"].includes(newOrder.status)) {
            setSelectedItem(newOrder);
            setTimeout(() => setSubView("active_order"), 1500);
          }

          if (navigationSubViewRef.current === "waiting_driver" && newOrder.status === "cancelado") {
            setSubView("none");
          }

          // Atualizar item selecionado se for o pedido atual sendo visualizado
          if (selectedItemRef.current?.id === newOrder.id) {
            setSelectedItem(newOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [userId, subView]);

  useEffect(() => {
    if (!userId) return;

    // SincronizaÃ§Ã£o em tempo real de Perfil (Saldo, XP, Coins, Izi Black, Carrinho)
    const userSub = supabase
      .channel(`user_sync_${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users_delivery", filter: `id=eq.${userId}` },
        (payload: any) => {
          console.log("[SYNC] Perfil do usuÃ¡rio atualizado remotamente.");
          fetchWalletData();
          
          // Sincronizar carrinho se a mudanÃ§a veio de outro dispositivo
          const remoteCart = payload.new?.cart_data;
          if (Array.isArray(remoteCart)) {
            // Verificar se o carrinho local Ã© diferente para evitar loops infinitos ou 'ressurreiÃ§Ã£o' indesejada
            const localCartStr = JSON.stringify(cartRef.current);
            const remoteCartStr = JSON.stringify(remoteCart);
            
            if (localCartStr !== remoteCartStr) {
               console.log("[SYNC] Sincronizando sacola entre dispositivos...");
               setCart(remoteCart);
            }
          }
        }
      )
      .subscribe();

    // SincronizaÃ§Ã£o de EndereÃ§os Salvos em tempo real
    const addrSub = supabase
      .channel(`addr_sync_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_addresses", filter: `user_id=eq.${userId}` },
        () => {
          console.log("[SYNC] EndereÃ§os salvos atualizados, sincronizando...");
          fetchSavedAddresses(userId);
        }
      )
      .subscribe();

    // SincronizaÃ§Ã£o de Pedidos em tempo real para o cliente
    const orderSub = supabase
      .channel(`order_sync_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders_delivery", filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("[SYNC] Pedido atualizado, atualizando lista e visualizaÃ§Ã£o...");
          fetchOrders();
          // Se o pedido atual for o que estamos vendo, atualiza o item selecionado
          if (selectedItemRef.current && (payload.new as any).id === selectedItemRef.current.id) {
             setSelectedItem(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userSub);
      supabase.removeChannel(addrSub);
      supabase.removeChannel(orderSub);
    };
  }, [userId]);

  const fetchSavedCards = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedCards(data || []);
    } catch (err) {
      console.error("Erro ao buscar cartÃµes:", err);
    }
  };
  

  const handleCancelOrder = async (orderId: string) => {
    console.log("[DEBUG] Iniciando cancelamento do pedido:", orderId);
    if (!orderId) {
      toastError("ID do pedido nÃ£o encontrado.");
      return;
    }

    try {
      const { data: orderData } = await supabase.from("orders_delivery").select("status").eq("id", orderId).single();
      
      let error = null;
      if (orderData && ["novo", "pendente", "pendente_pagamento", "waiting_driver", "searching_driver", "waiting_merchant"].includes(orderData.status)) {
         const { error: delError } = await supabase.from("orders_delivery").delete().eq("id", orderId);
         error = delError;
      } else {
         const { error: updError } = await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", orderId);
         error = updError;
      }

      if (error) {
        console.error("[DEBUG] Erro Supabase no cancelamento:", error);
        throw error;
      }

      console.log("[DEBUG] Pedido cancelado/excluÃ­do no banco com sucesso.");
      toastSuccess("Pedido cancelado com sucesso!");
      
      if (userId) fetchOrders();
      setSelectedItem(null);
      setTab("orders");
      setSubView("none");
    } catch (err: any) {
      console.error("Erro ao cancelar pedido:", err);
      toastError(`NÃ£o foi possÃ­vel cancelar: ${err.message || 'Erro de rede'}`);
    }
  };

  const handleCancelCoinOrder = async (orderId: string) => {
    if (!orderId) {
      toastError("ID da recarga nÃ£o encontrado.");
      return;
    }

    const confirm = window.confirm("Deseja realmente cancelar esta recarga?");
    if (!confirm) return;

    try {
      const { data: orderData } = await supabase.from("orders_delivery").select("status").eq("id", orderId).single();
      
      let error = null;
      if (orderData && orderData.status === "pendente_pagamento") {
         const { error: delError } = await supabase.from("orders_delivery").delete().eq("id", orderId);
         error = delError;
      } else {
         const { error: updError } = await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", orderId);
         error = updError;
      }

      if (error) throw error;

      toastSuccess("Recarga cancelada com sucesso!");
      
      if (userId) fetchOrders();
      setSelectedItem(null);
      setSubView("none");
      setTab("home");
    } catch (err: any) {
      console.error("Erro ao cancelar recarga:", err);
      toastError("Erro ao cancelar recarga. Tente novamente.");
    }
  };

  const handleGlobalRefresh = async () => {
    try {
      await Promise.all([
        fetchOrders(),
        fetchWalletData(),
        fetchFlashOffers(),
        fetchCoupons(),
        fetchBeveragePromo(),
        fetchMarketData()
      ]);
      console.log("✅ [REFRESH] App data updated successfully.");
    } catch (error) {
      console.error("🚨 [REFRESH] Failed to update app data:", error);
    }
  };

  const fetchCoupons = async () => {
    console.log("[DEBUG] Fetching coupons/banners...");
    const { data } = await supabase
      .from('promotions_delivery')
      .select('*')
      .eq('is_active', true)
      .neq('type', 'explore')
      .order('created_at', { ascending: false });
    
    if (data) {
      console.log("[DEBUG] Available promotions found:", data.length, data);
      setAvailableCoupons(data);
    }
  };

  const fetchExploreBanners = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('promotions_delivery')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'explore')
        .order('created_at', { ascending: false });
      
      if (data) setExploreBanners(data);
    } catch (e) {
      console.error("Error fetching explore banners:", e);
    }
  }, []);

  const fetchBeveragePromo = useCallback(async () => {
    try {
      // [Comentario Limpo pelo Sistema]
      const { data: banners } = await supabase
        .from('promotions_delivery')
        .select('*')
        .eq('is_active', true)
        .is('coupon_code', null)
        .neq('type', 'explore')
        .order('created_at', { ascending: false });
      
      if (banners) {
      // [Comentario Limpo pelo Sistema]
        const bevBanners = banners.filter(b => 
          (b.title?.toLowerCase().includes('bebida') || b.description?.toLowerCase().includes('bebida') ||
           b.title?.toLowerCase().includes('gelada') || b.description?.toLowerCase().includes('gelada'))
        );
        setBeverageBanners(bevBanners.length > 0 ? bevBanners : banners.slice(0, 1));
      }

      // 2. Buscar Produtos da categoria Bebidas para a tela de ofertas
      const { data: pDeals } = await supabase
        .from('products_delivery')
        .select('*, product_options_groups_delivery(id)')
        .eq('is_available', true)
        .eq('category', 'Bebidas')
        .limit(8);
      
      if (pDeals) {
        const discountPct = globalSettings?.flash_offer_discount || 25;
        const discountMult = 1 / (1 - (discountPct / 100)); // Calculate back to original price
        
        const formatted = pDeals.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          oldPrice: p.price * (discountMult || 1.25),
          off: `${discountPct}%`,
          img: p.image_url || "",
          cat: p.category || "Bebidas",
          merchant_id: p.merchant_id,
          has_options: p.product_options_groups_delivery && p.product_options_groups_delivery.length > 0
        }));
        setBeverageOffers(formatted);
      }
    } catch (err) {
    }
  }, [globalSettings]);

  const normalizeCpf = (value?: string | null) => `${value || ""}`.replace(/\D/g, "");
  const getBenefitTrackingCpf = () => normalizeCpf(profileCpf || pixCpf || cpf);
  const getFlashOfferSourceId = (item: any) => item?.flash_offer_id || item?.offer_id || item?.id || null;
  const normalizeFlashOfferProductKey = (value?: string | null) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const getBenefitUsageCount = async (sourceType: "coupon" | "flash_offer", sourceId: string) => {
    const filters: string[] = [];
    if (userId) filters.push(`user_id.eq.${userId}`);

    const trackedCpf = getBenefitTrackingCpf();
    if (trackedCpf) filters.push(`cpf.eq.${trackedCpf}`);
    if (filters.length === 0) return 0;

    const { count, error } = await supabase
      .from("benefit_redemptions_delivery")
      .select("id", { count: "exact", head: true })
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .or(filters.join(","));

    if (error) {
      console.error(`Erro ao verificar uso de ${sourceType}:`, error);
      return 0;
    }

    return count || 0;
  };

  const isUserFirstOrder = async () => {
    const filters: string[] = [];
    if (userId) filters.push(`user_id.eq.${userId}`);
    const trackedCpf = getBenefitTrackingCpf();
    if (trackedCpf) filters.push(`items->>0:cpf.eq.${trackedCpf}`); // Simple check if CPF is in items metadata or check a specific table

    // Let's use orders_delivery count
    const { count, error } = await supabase
      .from("orders_delivery")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("status", "eq", "cancelado");

    if (error) return false;
    return (count || 0) === 0;
  };

  const validateCouponRules = async (coupon: any, subtotal: number) => {
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return "Este cupom jÃ¡ expirou.";
    }

    if (subtotal < (coupon.min_order_value || 0)) {
      return `O valor mÃ­nimo para este cupom Ã© R$ ${coupon.min_order_value.toFixed(2)}.`;
    }

    if (coupon.usage_count >= coupon.max_usage) {
      return "Este cupom jÃ¡ atingiu o limite de usos.";
    }

    if (coupon.is_vip && !isIziBlackMembership) {
      return "Este cupom Ã© exclusivo para membros IZI Black.";
    }

    if (coupon.first_order_only && !(await isUserFirstOrder())) {
      return "Este cupom Ã© vÃ¡lido apenas para sua primeira compra.";
    }

    if (coupon.id) {
      const usageCount = await getBenefitUsageCount("coupon", coupon.id);
      const limitPerUser = coupon.max_usage_per_user || 1; // Default to 1 if not specified but rule exists?
      // Wait, if max_usage_per_user is null/0, it's unlimited.
      if (coupon.max_usage_per_user && usageCount >= coupon.max_usage_per_user) {
        return `VocÃª jÃ¡ atingiu o limite de ${coupon.max_usage_per_user} uso(s) deste cupom por CPF.`;
      }
      
      // Keep legacy check for coupons that don't have max_usage_per_user set but were intended for single use
      if (!coupon.max_usage_per_user && usageCount > 0) {
        return "Este cupom jÃ¡ foi utilizado por este CPF/usuÃ¡rio.";
      }
    }

    return null;
  };

  const validateFlashOfferRules = async (item: any) => {
    const sourceId = getFlashOfferSourceId(item);
    if (!item?.is_flash_offer || !sourceId) return null;

    if (item.first_order_only && !(await isUserFirstOrder())) {
      return "Esta oferta Ã© vÃ¡lida apenas para sua primeira compra.";
    }

    const usageCount = await getBenefitUsageCount("flash_offer", sourceId);
    if (item.max_usage_per_user && usageCount >= item.max_usage_per_user) {
      return `VocÃª jÃ¡ atingiu o limite de ${item.max_usage_per_user} uso(s) desta oferta por CPF.`;
    }

    if (!item.max_usage_per_user && usageCount > 0) {
      return "Esta oferta jÃ¡ foi utilizada por este CPF/usuÃ¡rio.";
    }

    return null;
  };

  const registerBenefitUsage = async (sourceType: "coupon" | "flash_offer", sourceId: string, orderId?: string) => {
    try {
      const trackedCpf = getBenefitTrackingCpf();
      const { error } = await supabase
        .from("benefit_redemptions_delivery")
        .insert({
          source_type: sourceType,
          source_id: sourceId,
          user_id: userId || null,
          cpf: trackedCpf || null,
          order_id: orderId || null,
        });

      if (error) {
        console.warn("[BENEFIT] Erro ao registrar uso:", error.message);
      }
    } catch (e) {
      console.warn("[BENEFIT] Falha crÃ­tica ao registrar uso:", e);
    }
  };

  const ensureCartBenefitsAreAvailable = async () => {
    const subtotal = cart.reduce((sum, item) => {
      const basePrice = Number(item.price) || 0;
      const addonsPrice = Array.isArray(item.addonDetails) 
        ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
        : 0;
      return sum + (basePrice + addonsPrice) * (item.quantity || 1);
    }, 0);

    if (appliedCoupon) {
      const couponError = await validateCouponRules(appliedCoupon, subtotal);
      if (couponError) return couponError;
    }

    // ValidaÃ§Ã£o de Ofertas Flash com dados completos
    const flashOfferItems = cart.filter((item: any) => item.is_flash_offer);
    for (const item of flashOfferItems) {
      const sourceId = getFlashOfferSourceId(item);
      if (!sourceId) continue;

      // Buscamos os dados atuais da oferta para garantir que as regras (1Âª compra, limite CPF) sejam validadas
      const { data: fullOffer } = await supabase
        .from('flash_offers')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fullOffer) {
        const flashOfferError = await validateFlashOfferRules(fullOffer);
        if (flashOfferError) return `${item.name}: ${flashOfferError}`;
      }
    }

    return null;
  };

  const registerPendingBenefitUsages = async (orderId?: string) => {
    if (appliedCoupon?.id) {
      await registerBenefitUsage("coupon", appliedCoupon.id, orderId);
      await supabase
        .from("promotions_delivery")
        .update({ usage_count: (appliedCoupon.usage_count || 0) + 1 })
        .eq("id", appliedCoupon.id);
    }

    const flashOfferIds = [...new Set(
      cart
        .filter((item: any) => item.is_flash_offer)
        .map((item: any) => getFlashOfferSourceId(item))
        .filter(Boolean)
    )];
    for (const offerId of flashOfferIds) {
      await registerBenefitUsage("flash_offer", offerId, orderId);
    }
  };

  const validateCoupon = async (code: string) => {
    if (!code.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const { data, error } = await supabase
        .from('promotions_delivery')
        .select('*')
        .eq('coupon_code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponError("Cupom invÃ¡lido ou expirado.");
        setAppliedCoupon(null);
        return;
      }

      const subtotal = cart.reduce((sum, item) => {
        const basePrice = Number(item.price) || 0;
        const addonsPrice = Array.isArray(item.addonDetails) 
          ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
          : 0;
        return sum + basePrice + addonsPrice;
      }, 0);
      const couponError = await validateCouponRules(data, subtotal);
      if (couponError) {
        setCouponError(couponError);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data);
      setCouponInput("");
      setCouponError("");
    } catch (err) {
      setCouponError("Erro ao validar cupom.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };



  const getItemCount = (id: number) =>
    cart.filter((item) => item.id === id).length;

  const processingItemsRef = useRef<Set<string>>(new Set());

  const handleAddToCart = async (item: any, e?: React.MouseEvent) => {
    if (processingItemsRef.current.has(item.id)) return;

    // 1. Feedback Visual Imediato (AnimaÃ§Ã£o)
    if (e && triggerCartAnimation) {
      triggerCartAnimation(e, item.img || "");
    }

    processingItemsRef.current.add(item.id);

    try {
      // 2. ValidaÃ§Ãµes bÃ¡sicas rÃ¡pidas
      const flashOfferError = await validateFlashOfferRules(item);
      if (flashOfferError) {
        showToast(flashOfferError, "error" as any);
        processingItemsRef.current.delete(item.id);
        return;
      }

      // VerificaÃ§Ã£o de Estabelecimento Aberto
      const merchantId = item.merchant_id;
      let shop = selectedShop?.id === merchantId ? selectedShop : ESTABLISHMENTS.find(s => s.id === merchantId);
      
      if (!shop && merchantId) {
        // Tentar buscar rÃ¡pido no banco se nÃ£o estiver no cache (ex: busca global ou deep link)
        const { data: m } = await supabase.from('admin_users').select('opening_hours, is_open, opening_mode, store_name').eq('id', merchantId).maybeSingle();
        if (m) {
          const isOpen = isStoreOpen(m.opening_hours, m.is_open, m.opening_mode);
          if (!isOpen) {
            showToast(`Desculpe! ${m.store_name || "A loja"} estÃ¡ fechada no momento e nÃ£o pode receber novos pedidos. ðŸ•’`, "error");
            processingItemsRef.current.delete(item.id);
            return;
          }
        }
      } else if (shop && !shop.isOpen) {
        showToast(`Desculpe! ${shop.name || "A loja"} estÃ¡ fechada no momento e nÃ£o pode receber novos pedidos. ðŸ•’`, "error");
        processingItemsRef.current.delete(item.id);
        return;
      }

      // 3. VerificaÃ§Ã£o de Opcionais
      const { data: groups } = await supabase
        .from('product_options_groups_delivery')
        .select('id')
        .eq('product_id', item.id)
        .limit(1);

      if (groups && groups.length > 0) {
        setSelectedItem(item);
        setSubView("product_detail");
        processingItemsRef.current.delete(item.id);
        return;
      }
    } catch (err) {
      console.error("Erro no fluxo do carrinho:", err);
    }

    // 4. AdiÃ§Ã£o Real ao Carrinho
    setCart((prev: any[]) => [...prev, { ...item, timestamp: Date.now() }]);
    setUserXP((prev: number) => prev + 10);
    processingItemsRef.current.delete(item.id);
  };

  const handleRemoveOneFromCart = (productId: string) => {
    setCart((prev: any[]) => {
      const idx = [...prev].reverse().findIndex(item => item.id === productId);
      if (idx === -1) return prev;
      const actualIdx = prev.length - 1 - idx;
      const newCart = [...prev];
      newCart.splice(actualIdx, 1);
      return newCart;
    });
  };

  const handleShopClick = async (shop: any) => {
    if (!shop.isOpen) {
      toastError(`Desculpe! ${shop.name} estÃ¡ fechado no momento. ðŸ•’`);
      return;
    }
    
    setSelectedShop(shop);
    setActiveCategory("Destaques");
    const isRestaurant = shop.type === "restaurant";
    const targetView = "restaurant_menu";

    try {
      // 1. Buscar produtos do estabelecimento
      const { data: products } = await supabase
        .from("products_delivery")
        .select("*, product_options_groups_delivery(id)")
        .eq("merchant_id", shop.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false });


      // 2. Buscar redenÃ§Ãµes do usuÃ¡rio para desativar ofertas jÃ¡ utilizadas
      let usedSourceIds = new Set<string>();
      if (userId) {
        const trackedCpf = getBenefitTrackingCpf();
        const filters: string[] = [`user_id.eq.${userId}`];
        if (trackedCpf) filters.push(`cpf.eq.${trackedCpf}`);
        
        const { data: redemptions } = await supabase
          .from("benefit_redemptions_delivery")
          .select("source_id")
          .or(filters.join(","));
          
        if (redemptions) {
          usedSourceIds = new Set(redemptions.map(r => r.source_id));
        }
      }

      console.log("Produtos recebidos:", products?.length, products?.[0]);
      if (products && products.length > 0) {
        // 3. Filtrar ofertas ativas que o usuÃ¡rio ainda NÃƒO utilizou
        const activeProductOffers = (flashOffers || []).filter((offer: any) =>
          offer?.merchant_id === shop.id &&
          offer?.is_active &&
          (!offer?.expires_at || new Date(offer.expires_at).getTime() > Date.now()) &&
          !usedSourceIds.has(offer.id)
        );

        const offersByProductId = new Map<string, any>();
        const offersByProductName = new Map<string, any>();
        activeProductOffers.forEach((offer: any) => {
          if (offer?.product_id) {
            const productId = String(offer.product_id);
            if (!offersByProductId.has(productId)) {
              offersByProductId.set(productId, offer);
            }
          }

          const productNameKey = normalizeFlashOfferProductKey(offer?.product_name);
          if (productNameKey && !offersByProductName.has(productNameKey)) {
            offersByProductName.set(productNameKey, offer);
          }
        });

        const grouped: Record<string, any[]> = {};
        products.forEach((p: any) => {
          const cat = p.category || p.subcategory || (isRestaurant ? "CardÃ¡pio" : "Produtos");
          if (!grouped[cat]) grouped[cat] = [];
          
          const linkedOffer =
            offersByProductId.get(String(p.id)) ||
            offersByProductName.get(normalizeFlashOfferProductKey(p.name));
          
          const discountedPrice = linkedOffer ? Number(linkedOffer.discounted_price) : Number(p.price);
          const hasLinkedOffer = Boolean(
            linkedOffer &&
            Number.isFinite(discountedPrice) &&
            discountedPrice >= 0 &&
            discountedPrice < Number(p.price)
          );

          grouped[cat].push({
            id: p.id,
            name: p.name,
            desc: p.description || "",
            price: hasLinkedOffer ? discountedPrice : p.price,
            oldPrice: hasLinkedOffer ? Number(p.price) : undefined,
            img: p.image_url || "",
            merchant_id: shop.id,
            merchant_name: shop.name,
            store: shop.name,
            is_flash_offer: hasLinkedOffer,
            flash_offer_id: hasLinkedOffer ? linkedOffer.id : undefined,
            has_options: p.product_options_groups_delivery && p.product_options_groups_delivery.length > 0
          });
        });
        const categories = Object.entries(grouped).map(([name, items]) => ({ name, items }));
        setSelectedShop({ ...shop, categories });
      }
    } catch (e) {
      console.error("Erro ao carregar menu:", e);
    }

    navigateSubView(targetView);
  };


  const handleApplyCoupon = async (code: string) => {
    if (!code) return;
    const { data, error } = await supabase
      .from("promotions_delivery")
      .select("*")
      .eq("coupon_code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toastError("Cupom invÃ¡lido ou expirado.");
      return;
    }

    const subtotal = getCartSubtotal();
    const couponErr = await validateCouponRules(data, subtotal);
    if (couponErr) {
      toastError(couponErr);
      return;
    }

    setAppliedCoupon(data);
    setCouponInput(data.coupon_code);
    toastSuccess("Cupom aplicado!");
  };

  const clearCart = async (orderId?: string) => {
    const subtotal = getCartSubtotal();
    const couponDiscount = appliedCoupon
      ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100)
      : 0;
    
    const total = Math.max(0, subtotal - couponDiscount);
    
    // BENEFÃCIO IZI BLACK: Multiplicadores DinÃ¢micos
    const baseRate = Number(globalSettings?.izi_coin_rate || 1);
    const blackRate = Number(globalSettings?.izi_black_cashback || 5);
    const coinRate = isIziBlackMembership ? blackRate : baseRate;
    
    // O cashback Ã© em porcentagem (ex: 1 = 1%, 5 = 5%)
    const earnedCoins = Number((total * (coinRate / 100)).toFixed(8));
    const finalCoins = useCoins ? earnedCoins : (Number(iziCoins) + earnedCoins);
    
    // BENEFÃCIO IZI BLACK: XP DinÃ¢mico
    const baseXP = 50;
    const xpMult = Number(globalSettings?.izi_black_xp_multiplier || 2);
    const earnedXP = isIziBlackMembership ? (baseXP * xpMult) : baseXP;
    
    await registerPendingBenefitUsages(orderId);

    setCart([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setUserXP((prev: number) => prev + earnedXP);
    setIziCoins(finalCoins);
    
    if (userId) {
      await supabase.from("users_delivery").update({ 
        izi_coins: finalCoins,
        user_xp: (userXP + earnedXP),
        cart_data: []
      }).eq("id", userId);
      
      fetchCartData(userId); // Refetch to sync state
      fetchOrders();
    }
  };

  useEffect(() => {
    if (subView === "payments" && userId) {
      fetchSavedCards(userId);
    }
  }, [subView, userId]);

// Simular movimento do entregador
  useEffect(() => {
    if (subView === "active_order") {
      const interval = setInterval(() => {
        setDriverPos(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [subView]);



  useEffect(() => {
    if (!globalSettings?.flash_offer_expiry) return;
    const target = new Date(globalSettings.flash_offer_expiry).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({h: '00', m: '00', s: '00'});
        clearInterval(timer);
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setTimeLeft({h, m, s});
    }, 1000);
    return () => clearInterval(timer);
  }, [globalSettings]);

  const fetchFlashOffers = async () => {
    try {
      // 1. Busca todas as ofertas relâmpago marcadas como ativas
      const { data, error: offersError } = await supabase
        .from('flash_offers')
        .select('*, admin_users(store_name, store_logo)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      
      // 2. Filtra por expiração no JS para evitar problemas de timezone/drift
      const now = new Date();
      const activeOffers = (data || []).filter(o => new Date(o.expires_at) > now);

      if (activeOffers.length === 0) {
        setFlashOffers([]);
        return;
      }

      // 3. Busca resgates do usuário para marcar como 'Resgatado' em vez de ocultar
      let redeemedIds = new Set<string>();
      
      const userId = user?.id || localStorage.getItem('user_id');
      const userCpf = user?.cpf || localStorage.getItem('user_cpf');

      if (userId || userCpf) {
        const filters = [];
        if (userId) filters.push(`user_id.eq.${userId}`);
        if (userCpf) filters.push(`cpf.eq.${userCpf}`);

        const { data: redemptions } = await supabase
          .from("benefit_redemptions_delivery")
          .select("source_id")
          .eq("source_type", "flash_offer")
          .or(filters.join(","));

        if (redemptions) {
          redeemedIds = new Set(redemptions.map(r => r.source_id));
        }
      }

      // 3. Marca cada oferta como resgatada ou não
      const offersWithStatus = activeOffers.map((offer: any) => ({
        ...offer,
        is_redeemed: redeemedIds.has(offer.id)
      }));

      setFlashOffers(offersWithStatus);
    } catch (error) {
      console.error("Erro ao buscar ofertas relÃ¢mpago:", error);
    }
  };

  const [couponInput, setCouponInput] = useState("");
  const [, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);


  // Persistir carrinho no localStorage e Supabase sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem("izi_cart", JSON.stringify(cart));
      
      // Sincronizar com o banco se estiver logado
      if (userId) {
        if (isFirstEmptySync.current && cart.length === 0) {
            return;
        }
        
        isFirstEmptySync.current = false;

        supabase.from("users_delivery")
          .update({ cart_data: cart })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.error("Erro ao sincronizar sacola na nuvem:", error);
          });
      }
    } catch {}
  }, [cart, userId]);

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [chatMessages, setChatMessages] = useState<{id: string, sender: string, text: string, time: string}[]>([]);
  const [chatInput, setChatInput] = useState("");

  const [exploreCategoryState, setExploreCategoryState] = useState<{
    id: 'flowers' | 'sweets' | 'pets' | 'gas' | 'butcher';
    title: string;
    tagline: string;
    primaryColor: string;
    icon: string;
    banner: string;
  } | null>(null);

  const [selectedExperience, setSelectedExperience] = useState<any>(null);
  const [pendingReservation, setPendingReservation] = useState<any>(null);

  const [quests] = useState([
    { id: 1, title: 'Explorador Urbano', desc: 'PeÃ§a em 3 categorias diferentes hoje', xp: 500, progress: 1, total: 3, icon: 'explore', color: '#fbbf24' },
    { id: 2, title: 'Amigo do Peito', desc: 'Indique um amigo para a Izi', xp: 1000, progress: 0, total: 1, icon: 'group_add', color: '#10b981' },
    { id: 3, title: 'Madrugador Izi', desc: 'PeÃ§a cafÃ© da manhÃ£ antes das 9h', xp: 300, progress: 0, total: 1, icon: 'wb_sunny', color: '#f59e0b' },
  ]);

      // [Comentario Limpo pelo Sistema]
  const viewRef = useRef(view);
  const tabRef = useRef(tab);
  const navigationSubViewRef = useRef(subView);
  const userIdRef = useRef(userId);

  const selectedItemRef = useRef(selectedItem);
  const previousSubViewRef = useRef(subView);
  const cartRef = useRef(cart);

  useEffect(() => { navigationSubViewRef.current = subView; }, [subView]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { selectedItemRef.current = selectedItem; }, [selectedItem]);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const orderStatusLabels: Record<string, string> = {
    pending: "Aguardando",
    pendente: "Aguardando",
    pendente_pagamento: "Aguardando Pagamento",
    novo: "Processando",
    waiting_merchant: "Aguardando Loja",
    waiting_driver: "Buscando Entregador",
    aceito: "Confirmado",
    confirmado: "Confirmado",
    preparando: "Em PreparaÃ§Ã£o",
    no_preparo: "Em PreparaÃ§Ã£o",
    pronto: "Pronto para Retirada",
    a_caminho_coleta: "Entregador Vindo Coletar",
    chegou_coleta: "Entregador no Local de Retirada",
    no_local_coleta: "Entregador no Local de Retirada",
    a_caminho: "A Caminho da Entrega",
    picked_up: "Pedido Coletado",
    em_rota: "A Caminho da Entrega",
    saiu_para_entrega: "Pedido Saiu para Entrega",
    no_local: "Entregador no seu Local!",
    concluido: "ConcluÃ­do",
    cancelado: "Cancelado",
  };


  const getOrderStatusLabel = (status?: string) =>
    orderStatusLabels[status || ""] || (status ? status.replace(/_/g, " ") : "Em processamento");

  const getOrderStatusTone = (status?: string) => {
    if (status === "concluido") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "cancelado") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (["waiting_driver", "a_caminho_coleta", "chegou_coleta", "a_caminho", "em_rota", "saiu_para_entrega", "no_local"].includes(status || "")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    return "bg-yellow-400/10 text-yellow-400 border-yellow-400/20";
  };

  const isOrderTrackable = (status?: string) =>
    [
      "novo",
      "waiting_merchant",
      "waiting_driver",
      "aceito",
      "confirmado",
      "preparando",
      "no_preparo",
      "pronto",
      "a_caminho_coleta",
      "chegou_coleta",
      "a_caminho",
      "at_pickup",
      "picked_up",
      "em_rota",
      "saiu_para_entrega",
      "no_local",
    ].includes(status || "");

  const getOrderAddress = (raw: any) => {
    if (!raw) return "EndereÃ§o nÃ£o informado";
    if (typeof raw !== "string") return raw.formatted_address || raw.address || "EndereÃ§o";
    
    let clean = raw.split("| ITENS:")[0].split("| OBS:")[0].trim();
    try {
      const p = JSON.parse(clean);
      return p.formatted_address || p.address || clean;
    } catch {
      return clean;
    }
  };

  const getOrderItems = (order: any) => {
    if (Array.isArray(order?.items) && order.items.length > 0) return order.items;

    const match = String(order?.delivery_address || "").match(/\|\s*ITENS:\s*(.+)$/i);
    if (!match?.[1]) return [];

    return match[1]
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name, index) => ({
        id: `${order?.id || "order"}-${index}`,
        name,
        quantity: 1,
        price: null,
      }));
  };

  const buildOrderChatWelcome = () => {
    const contactName =
      selectedItem?.driver_name ||
      selectedItem?.merchant_name ||
      "time Izi";

    return `OlÃ¡! Aqui Ã© ${contactName}. Como posso ajudar com seu pedido?`;
  };

  const openOrderChat = (topic?: string) => {
    const welcomeMessage = {
      id: `chat-welcome-${Date.now()}`,
      sender: "driver",
      text: buildOrderChatWelcome(),
      time: "agora",
    };

    setChatMessages((prev) => {
      const base = prev.length > 0 ? prev : [welcomeMessage];
      if (!topic) return base;

      return [
        ...base,
        {
          id: `chat-topic-${Date.now()}`,
          sender: "driver",
          text: `Perfeito. Vou te ajudar com: ${topic}. Me conte mais detalhes para eu agilizar o atendimento.`,
          time: "agora",
        },
      ];
    });
    setSubView("order_chat");
  };

  const handleShareAction = async (title: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${title}\n${text}`);
        showToast("InformaÃ§Ãµes copiadas para compartilhar.", "success");
        return;
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        showToast("NÃ£o foi possÃ­vel compartilhar agora.", "warning");
      }
      return;
    }

    showToast("Compartilhamento nÃ£o disponÃ­vel neste dispositivo.", "warning");
  };

  const handleFavoriteAction = (label: string) => {
    showToast(`${label} salvo nos favoritos.`, "success");
  };

  const handleCallOrderContact = () => {
    const rawPhone = selectedItem?.driver_phone || selectedItem?.merchant_phone || selectedItem?.phone;
    if (!rawPhone) {
      openOrderChat("Preciso falar com alguÃ©m sobre este pedido");
      return;
    }

    const phone = String(rawPhone).replace(/[^\d+]/g, "");
    window.location.href = `tel:${phone}`;
  };

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { navigationSubViewRef.current = subView; }, [subView]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { selectedItemRef.current = selectedItem; }, [selectedItem]);
  useEffect(() => {
    if (subView !== "order_chat" || chatMessages.length > 0) return;
    setChatMessages([
      {
        id: "chat-initial",
        sender: "driver",
        text: buildOrderChatWelcome(),
        time: "agora",
      },
    ]);
  }, [subView, chatMessages.length, selectedItem?.driver_name, selectedItem?.merchant_name]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLojistasModal, setShowLojistasModal] = useState(false);
  const [partnerStores, setPartnerStores] = useState<any[]>([]);
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await supabase.from('partner_stores_delivery').select('*').eq('is_active', true);
        if (data) setPartnerStores(data);
      } catch (err) { console.error('Error fetching partners:', err); }
    };
    fetchPartners();
  }, []);
  useEffect(() => { navigationSubViewRef.current = subView; }, [subView]);

      // [Comentario Limpo pelo Sistema]
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { view: v, tab: t, subView: sv } = event.state;
      // [Comentario Limpo pelo Sistema]
        if (userIdRef.current && v === "login") {
          window.history.pushState(
            { view: "app", tab: t || tabRef.current, subView: "none" },
            "",
          );
          setSubView("none"); setShopRating(0); setDriverRating(0); setFbComment("");
          return;
        }
        if (v) setView(v);
        if (t) setTab(t);
        setSubView(sv || "none");
      } else {
      // [Comentario Limpo pelo Sistema]
        if (userIdRef.current) {
          window.history.pushState(
            { view: "app", tab: tabRef.current, subView: "none" },
            "",
          );
          setSubView("none");
        } else {
          setSubView("none");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.history.replaceState({ view, tab, subView }, "");

    // [NOVO] Handler para o botÃ£o voltar fÃ­sico do dispositivo (Android)
    const backHandler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      console.log("[BACK] BotÃ£o voltar fÃ­sico pressionado. subView atual:", navigationSubViewRef.current);
      
      if (navigationSubViewRef.current !== 'none') {
        // Se houver uma subView (modal/overlay) aberta, volta no histÃ³rico do navegador
        window.history.back();
      } else if (tabRef.current !== 'home' && viewRef.current === 'app') {
        // Se estiver em outra aba, volta para a home
        setTab('home');
        window.history.replaceState({ view: viewRef.current, tab: 'home', subView: 'none' }, "");
      } else {
        // Caso contrÃ¡rio, sai do app
        CapacitorApp.exitApp();
      }
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // @ts-ignore - backHandler is a Promise
      backHandler.then(h => h.remove());
    };
  }, []);

  const appTabs = ["home", "orders", "wallet", "profile"] as const;
  type AppTab = (typeof appTabs)[number];

  const isAppTab = (value: string): value is AppTab =>
    (appTabs as readonly string[]).includes(value);

  const normalizeSubViewTarget = (target: string) => {
    if (target === "product") return "product_detail";
    return target;
  };

  const calculateDeliveryFee = () => {
    // 1. Identificar o Lojista Atual
    const activeShop = selectedShop || (cart.length > 0 ? ESTABLISHMENTS.find(e => e.id === cart[0].merchant_id || e.id === cart[0].store_id) : null);
    if (!activeShop) return 0;

    // 2. Frete GrÃ¡tis do Lojista (toggle explÃ­cito no painel)
    const isExplicitlyFree = activeShop.free_delivery === true || activeShop.freeDelivery === true;
    if (isExplicitlyFree) {
      console.log(`[DELIVERY] Frete GrÃ¡tis aplicado pela loja: ${activeShop.name}`);
      return 0;
    }

    // 3. IZI Black (BenefÃ­cio do UsuÃ¡rio)
    if (isIziBlackMembership) {
       const minOrderIziBlack = Number(appSettings?.iziBlackMinOrderFreeShipping || 0);
       const subtotal = cart.reduce((sum, item: any) => {
         const itemTotal = (Number(item.price) || 0) * (item.quantity || 1);
         const addonsTotal = (item.addonDetails || []).reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0) * (item.quantity || 1);
         return sum + itemTotal + addonsTotal;
       }, 0);
       
       if (minOrderIziBlack === 0 || subtotal >= minOrderIziBlack) {
         console.log(`[DELIVERY] Frete GrÃ¡tis via Izi Black (Subtotal: R$${subtotal.toFixed(2)} >= MÃ­n: R$${minOrderIziBlack})`);
         return 0;
       }
    }

    // 4. Fallback legado: Frete grÃ¡tis no item do carrinho
    if (cart.length > 0) {
       const first = cart[0];
       if (first.merchant_free_delivery === true || first.free_delivery === true) {
           return 0;
       }
    }

    // 5. PADRÃƒO: Modo Bairros
    if (activeShop.coverageMode === 'neighborhoods' && activeShop.zones) {
       const userAddrLower = (userLocation.address || "").toLowerCase();
       const matchedZone = Object.entries(activeShop.zones as Record<string, {active: boolean, price: number}>)
           .find(([zName, cfg]) => cfg.active && userAddrLower.includes(zName.toLowerCase()));
           
       if (matchedZone) {
          console.log(`[DELIVERY] Zona de bairro encontrada: ${matchedZone[0]} -> R$ ${matchedZone[1].price}`);
          return matchedZone[1].price;
       }
    }

    // 6. MODO RAIO â€” CÃ¡lculo proporcional por KM + metros
    const bv = marketConditions.settings.baseValues;
    const surge = bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0;
    
    const typeMapping: Record<string, {min: string, km: string}> = {
      "restaurant": { min: 'food_min', km: 'food_km' },
      "market":     { min: 'market_min', km: 'market_km' },
      "pharmacy":   { min: 'pharmacy_min', km: 'pharmacy_km' },
      "beverages":  { min: 'beverages_min', km: 'beverages_km' },
    };
    
    const metric = typeMapping[activeShop.type] || typeMapping["restaurant"];
    const fallbackBase = globalSettings?.base_fee ?? appSettings?.baseFee ?? 5.90;
    
    const baseFare  = parseFloat(String(bv[metric.min] ?? fallbackBase));
    const distRate  = parseFloat(String(bv[metric.km] ?? 1.0));

    // --- CÃ¡lculo de DistÃ¢ncia Real em Tempo Real ---
    // Usa lat/lng ATUAL do usuÃ¡rio (pode ter mudado depois do primeiro fetch dos lojistas)
    let distKm: number;
    const userLat = userLocation.lat;
    const userLng = userLocation.lng;
    const shopLat = activeShop.latitude;
    const shopLng = activeShop.longitude;

    if (userLat && userLng && shopLat && shopLng) {
      // FÃ³rmula de Haversine (resultado em km)
      const R = 6371;
      const dLat = (shopLat - userLat) * (Math.PI / 180);
      const dLon = (shopLng - userLng) * (Math.PI / 180);
      const a = Math.sin(dLat/2)**2 + Math.cos(userLat * Math.PI/180) * Math.cos(shopLat * Math.PI/180) * Math.sin(dLon/2)**2;
      const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      // Multiplicador de rota real vs linha reta (~30% a mais)
      distKm = straightLine * 1.3;
      // console.log(`[DELIVERY] DistÃ¢ncia calculada em tempo real: ${distKm.toFixed(3)} km (linha reta: ${straightLine.toFixed(3)} km)`);
    } else {
      // Fallback: distÃ¢ncia prÃ©-computada no carregamento dos lojistas ou padrÃ£o
      distKm = activeShop.distKm || 1.5;
      // console.warn(`[DELIVERY] GPS do usuÃ¡rio nÃ£o disponÃ­vel. Usando distÃ¢ncia estimada de ${distKm.toFixed(1)} km`);
    }

    // CÃ¡lculo PROPORCIONAL (sem arredondamento por km)
    // Ex: 1.3 km â†’ baseFare + 1.3 * distRate (nÃ£o cobra 2 km inteiros)
    const dynamicCalculated = parseFloat((baseFare + (distRate * distKm * surge)).toFixed(2));

    // Se o lojista tem taxa fixa configurada e NÃƒO estÃ¡ em modo raio, usa a taxa fixa
    const fixedShopFee = activeShop.service_fee !== undefined && activeShop.service_fee !== null && Number(activeShop.service_fee) > 0
      ? Number(activeShop.service_fee)
      : null;
    
    const finalFee = activeShop.coverageMode === 'radius'
      ? dynamicCalculated
      : (fixedShopFee !== null ? fixedShopFee : dynamicCalculated);

    // console.log(`[DELIVERY] Taxa final (Modo: ${activeShop.coverageMode}, Dist: ${distKm.toFixed(3)} km): R$ ${finalFee}`);
    return finalFee;
  };


  const handlePlaceOrder = async (useCoins = false) => {

    if (!paymentMethod) { alert("Selecione uma forma de pagamento."); return; }
    if (!userId) { alert("FaÃ§a login para continuar."); return; }
    if (cart.length === 0) { alert("Seu carrinho estÃ¡ vazio."); return; }

    // VerificaÃ§Ã£o de Estabelecimento Aberto antes de prosseguir
    const currentShopId = selectedShop?.id || cart[0]?.merchant_id || cart.find(i => i.merchant_id)?.merchant_id || null;
    const shopName = selectedShop?.name || cart[0]?.merchant_name || cart[0]?.store || "Estabelecimento";
    const activeShop = ESTABLISHMENTS.find(e => e.id === currentShopId) || selectedShop;

    if (activeShop && !activeShop.isOpen) {
      toastError(`Desculpe! ${shopName} estÃ¡ fechado no momento e nÃ£o pode receber este pedido. ðŸ•’`);
      return;
    }
    
    setUseCoins(useCoins);

    const subtotal = cart.reduce((sum, item) => {
      const basePrice = Number(item.price) || 0;
      const addonsPrice = Array.isArray(item.addonDetails) 
        ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
        : 0;
      return sum + (basePrice + addonsPrice) * (item.quantity || 1);
    }, 0);
    const couponDiscount = appliedCoupon
      ? appliedCoupon.discount_type === "fixed"
        ? appliedCoupon.discount_value
        : (subtotal * appliedCoupon.discount_value) / 100
      : 0;
    
    const coinValue = globalSettings?.izi_coin_value || 1.0;
    const coinDiscount = useCoins ? (iziCoins || 0) * coinValue : 0;
    const deliveryFee = currentDeliveryFee;
    const serviceFeePercent = globalSettings?.service_fee_percent || 0;
    const rawServiceFee = (subtotal * serviceFeePercent) / 100;
    const serviceFeeAmount = isIziBlackMembership ? 0 : rawServiceFee;
    const totalRaw = subtotal + deliveryFee + serviceFeeAmount - couponDiscount - coinDiscount;
    const total = Math.max(0, Number(totalRaw.toFixed(2)));

    const orderDistance = activeShop?.distKm || 0;

    const orderBase = {
      user_id: userId,
      merchant_id: currentShopId,
      merchant_name: shopName,
      user_name: userName,
      status: "novo",
      total_price: Number(total.toFixed(2)),
      delivery_fee: deliveryFee,
      service_fee: Number(serviceFeeAmount.toFixed(2)),
      items: cart,
      pickup_address: activeShop?.store_address || activeShop?.address || shopName,
      delivery_address: `${userLocation?.address || "Endereço não informado"}`,
      delivery_lat: userLocation?.lat,
      delivery_lng: userLocation?.lng,
      payment_method: paymentMethod,
      service_type: activeShop?.type || "restaurant",
      notes: (paymentMethod === "dinheiro" && changeFor) ? `TROCO PARA: R$ ${changeFor}` : "",
      route_distance_km: Number(orderDistance.toFixed(2))
    };

    console.log("[DIAG] handlePlaceOrder acionado:", { paymentMethod, total, currentShopId });

    if (total < 0) {
       toastError("O valor total do pedido nÃ£o pode ser negativo.");
       setIsLoading(false);
       return;
    }

    // 1. VerificaÃ§Ã£o Centralizada de Regras de BenefÃ­cios (Cupons e Izi Flash)
    const benefitError = await ensureCartBenefitsAreAvailable();
    if (benefitError) {
      toastError(benefitError);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      if (paymentMethod === "pix") {
        setPixConfirmed(false);
        setPixCpf("");
        setSelectedItem({ id: "temp", ...orderBase });
        navigateSubView("pix_payment");
        return;
      }

      if (paymentMethod === "bitcoin_lightning") {
        try {
          // Explicitly omit status from orderBase to ensure override works correctly
          const { status: _, ...restOfOrderBase } = orderBase;
          const { data: order, error: insertError } = await supabase.from("orders_delivery").insert({ ...restOfOrderBase, status: "pendente_pagamento", payment_status: "pending" }).select().single();
          if (insertError) throw insertError;

          // DeduÃ§Ã£o de Izi Coins se houver desconto aplicado
          if (useCoins && iziCoins > 0) {
            const coinValue = globalSettings?.izi_coin_value || 1.0;
            const discountApplied = (iziCoins * coinValue);
            const subtotalForCoins = subtotal + deliveryFee + serviceFeeAmount - couponDiscount;
            const coinsUsedAsDiscountValue = Math.min(discountApplied, subtotalForCoins);
            const coinsToDeduct = coinsUsedAsDiscountValue / coinValue;
            const newIziCoins = Number((iziCoins - coinsToDeduct).toFixed(8));
            
            await supabase.from("users_delivery").update({ izi_coins: newIziCoins }).eq("id", userId);
            setIziCoins(newIziCoins);
          }

          console.log("Invocando create-lightning-invoice com total:", total, "orderId:", order.id);
          const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
            body: { amount: total, orderId: order.id, customerName: userName, memo: `IziDelivery #${order.id.slice(0,8).toUpperCase()}` }
          });

          if (lnErr || !lnData?.payment_request) {
            console.error("LN Error Details:", lnErr, lnData);
            throw new Error(lnData?.error || "NÃ£o foi possÃ­vel gerar a fatura Bitcoin.");
          }

          setSelectedItem({ ...order, total_price: total, lightningInvoice: lnData.payment_request, satoshis: lnData.satoshis, btc_price_brl: lnData.btc_price_brl });
          
          // Persistir os dados da fatura no banco de dados para evitar perda em refresh
          await supabase.from("orders_delivery").update({ 
            lightning_invoice: lnData.payment_request,
            satoshis: lnData.satoshis,
            btc_price_brl: lnData.btc_price_brl
          }).eq("id", order.id);

          // O cart NÃƒO deve ser limpo aqui. SÃ³ apÃ³s o pagamento ser confirmado via Realtime/Webhook
          navigateSubView("lightning_payment");
          return;
        } catch (e: any) {
          console.error("LN Error:", e);
          alert(`Erro ao iniciar pagamento Bitcoin: ${e.message || "Tente outro mÃ©todo."}`);
          return;
        }
      }

      if (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega") {
        if (!currentShopId) { 
          console.error("[CRITICAL] Checkout abortado: merchant_id nÃ£o encontrado no carrinho nem na loja.", { cart });
          toastError("Houve um erro tÃ©cnico: Loja nÃ£o identificada. Por favor, tente adicionar os itens novamente.");
          setIsLoading(false);
          return; 
        }
        
        const payload = { ...orderBase, status: "waiting_merchant", payment_status: "pending" };
        
        try {
          const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(payload).select().single();
          
          if (insertError || !order) {
            console.error("Insert Error:", insertError);
            toastError("Erro ao criar pedido. Tente novamente.");
            setIsLoading(false);
            return;
          }

          // Notificar Lojista via Push
          supabase.functions.invoke('send-push-notification', {
            body: {
              merchant_id: currentShopId,
              title: '🔔 Novo Pedido IZI!',
              body: `Você recebeu um novo pedido de ${userName || 'um cliente'}. Abra o painel para aceitar!`,
              data: { orderId: order.id, type: 'new_order' }
            }
          }).catch(err => console.error('Erro ao notificar lojista (offline):', err));

          // DeduÃ§Ã£o de Izi Coins se houver desconto aplicado
          if (useCoins && iziCoins > 0) {
            const coinValue = globalSettings?.izi_coin_value || 1.0;
            const discountApplied = (iziCoins * coinValue);
            const subtotalForCoins = subtotal + deliveryFee + serviceFeeAmount - couponDiscount;
            const coinsUsedAsDiscountValue = Math.min(discountApplied, subtotalForCoins);
            const coinsToDeduct = coinsUsedAsDiscountValue / coinValue;
            const newIziCoins = Number((iziCoins - coinsToDeduct).toFixed(8));
            
            await supabase.from("users_delivery").update({ izi_coins: newIziCoins }).eq("id", userId);
            setIziCoins(newIziCoins);
          }

          setSelectedItem(order);
          
          // Limpeza do carrinho em bloco try/catch isolado para nÃ£o afetar a criaÃ§Ã£o com sucesso
          try {
            if (cart.length > 0) await clearCart(order.id);
          } catch (clearErr) {
            console.warn("Aviso: Carrinho nÃ£o foi limpo, mas pedido foi criado:", clearErr);
          }

          setIsLoading(false);
          sendInternalNotification("Pedido Realizado!", `Seu pedido na loja ${shopName} foi enviado com sucesso.`, { orderId: order.id });
          navigateSubView("waiting_merchant");
          return;

          navigateSubView("waiting_merchant");
        } catch (dbErr) {
          console.error("DB Error:", dbErr);
          toastError("Erro de conexÃ£o. Verifique sua rede.");
          setIsLoading(false);
        }
        return;
      }

      if (paymentMethod === "saldo") {
        const coinValue = globalSettings?.izi_coin_value || 1.0;
        const totalBrlAvailable = walletBalance + (iziCoins * coinValue);

        if (totalBrlAvailable < total) {
          toastError("Saldo insuficiente na carteira IZI Pay.");
          setIsLoading(false);
          return;
        }

        // 1. Calcular Novos Saldos PRIMEIRO
        let remainingToPay = total;
        let tempNewIziCoins = iziCoins;
        let tempNewWalletBalance = walletBalance;

        if (useCoins && iziCoins > 0) {
           const discountApplied = (iziCoins * coinValue);
           const subtotalForCoins = subtotal + deliveryFee + serviceFeeAmount - couponDiscount;
           const coinsUsedAsDiscountValue = Math.min(discountApplied, subtotalForCoins);
           const coinsToDeduct = coinsUsedAsDiscountValue / coinValue;
           tempNewIziCoins -= coinsToDeduct;
        }

        if (remainingToPay > 0) {
           const coinsAvailableValue = tempNewIziCoins * coinValue;
           if (coinsAvailableValue >= remainingToPay) {
              tempNewIziCoins -= (remainingToPay / coinValue);
              remainingToPay = 0;
           } else {
              remainingToPay -= coinsAvailableValue;
              tempNewIziCoins = 0;
           }
           if (remainingToPay > 0) {
              tempNewWalletBalance -= remainingToPay;
              remainingToPay = 0;
           }
        }

        // 2. Debitar no Banco de Dados PRIMEIRO (Garantia de CobranÃ§a)
        const { error: updateErr } = await supabase.from("users_delivery").update({ 
          wallet_balance: Number(tempNewWalletBalance.toFixed(2)),
          izi_coins: Number(tempNewIziCoins.toFixed(8))
        }).eq("id", userId);

        if (updateErr) {
          console.error("Erro crÃ­tico ao debitar saldo:", updateErr);
          throw new Error("NÃ£o foi possÃ­vel processar o dÃ©bito na sua carteira. Tente novamente.");
        }

        // 3. Criar o pedido com status pago
        const { data: order, error: orderErr } = await supabase
          .from("orders_delivery")
          .insert({ ...orderBase, status: "waiting_merchant", payment_status: "paid" })
          .select()
          .single();

        if (orderErr || !order) {
           // ESTORNO SE FALHAR A CRIAÃ‡ÃƒO DO PEDIDO
           await supabase.from("users_delivery").update({ 
             wallet_balance: walletBalance,
             izi_coins: iziCoins
           }).eq("id", userId);
           throw orderErr || new Error("Erro ao criar pedido. Seu saldo foi estornado.");
        }

        // Notificar Lojista via Push
        supabase.functions.invoke('send-push-notification', {
          body: {
            merchant_id: currentShopId,
            title: '🔔 Novo Pedido IZI!',
            body: `Você recebeu um novo pedido de ${userName || 'um cliente'}. Abra o painel para aceitar!`,
            data: { orderId: order.id, type: 'new_order' }
          }
        }).catch(err => console.error('Erro ao notificar lojista (saldo):', err));

        // 4. Registrar no histÃ³rico e atualizar estado local
        await supabase.from("wallet_transactions_delivery").insert({
          user_id: userId,
          type: "pagamento",
          amount: total,
          description: `Pedido #${order.id.slice(0, 6).toUpperCase()} em ${shopName}`,
          balance_after: tempNewWalletBalance,
        });

        setWalletBalance(tempNewWalletBalance);
        setIziCoins(tempNewIziCoins);
        setSelectedItem(order);
        if (cart.length > 0) await clearCart(order.id);
        navigateSubView("waiting_merchant");
        return;
      }

      if (paymentMethod === "cartao") {
        if (selectedCard) {
           const orderPayload = { ...orderBase, status: "pendente_pagamento" };
           const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(orderPayload).select().single();
           if (insertError || !order) {
              toastError("Erro ao criar pedido. Tente novamente.");
              return;
           }

           // DeduÃ§Ã£o de Izi Coins se houver desconto aplicado
           if (useCoins && iziCoins > 0) {
             const coinValue = globalSettings?.izi_coin_value || 1.0;
             const discountApplied = (iziCoins * coinValue);
             const subtotalForCoins = subtotal + deliveryFee + serviceFeeAmount - couponDiscount;
             const coinsUsedAsDiscountValue = Math.min(discountApplied, subtotalForCoins);
             const coinsToDeduct = coinsUsedAsDiscountValue / coinValue;
             const newIziCoins = Number((iziCoins - coinsToDeduct).toFixed(8));
             
             await supabase.from("users_delivery").update({ izi_coins: newIziCoins }).eq("id", userId);
             setIziCoins(newIziCoins);
           }

           handleConfirmSavedCardShortcut(order.id, total, "checkout");
           return;
        }
        setSubView("card_payment");
        return;
      }

    } catch (e) {
      console.error(e);
      navigateSubView("payment_error");
    } finally {
      setIsLoading(false);
    }
  };

const navigateSubView = (target: string) => {
    const normalizedTarget = normalizeSubViewTarget(target);

    if (isAppTab(normalizedTarget)) {
      setTab(normalizedTarget);
      setSubView("none");
      window.history.pushState(
        { view: viewRef.current, tab: normalizedTarget, subView: "none" },
        "",
      );
      return;
    }

    const nextSubView = normalizedTarget as typeof subView;
    setSubView(nextSubView);
    window.history.pushState(
      { view: viewRef.current, tab: tabRef.current, subView: nextSubView },
      "",
    );
  };
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Destaques");
  const [restaurantInitialCategory, setRestaurantInitialCategory] = useState("Todos");
  const [activeMenuCategory, setActiveMenuCategory] = useState("Destaques");
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);

  // Sistema de rastreamento do motoboy em tempo real para o cliente
  useEffect(() => {
    if (!selectedItem?.driver_id) {
      setDriverLocation(null);
      return;
    }

    const fetchDriverInitialLoc = async () => {
      if (!selectedItem?.driver_id) return;
    const { data } = await supabase.from('drivers_delivery').select('lat, lng').eq('id', selectedItem.driver_id).maybeSingle();
      if (data?.lat) setDriverLocation({ lat: data.lat, lng: data.lng });
    };
    fetchDriverInitialLoc();

    const channel = supabase.channel(`driver_loc_${selectedItem.driver_id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'drivers_delivery',
        filter: `id=eq.${selectedItem.driver_id}` 
      }, (payload) => {
        const newLoc = payload.new as any;
        if (newLoc.lat) setDriverLocation({ lat: newLoc.lat, lng: newLoc.lng });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedItem?.driver_id]);
  
  // SincronizaÃ§Ã£o em tempo real do status do pedido para o cliente
  useEffect(() => {
    if (!selectedItem?.id) return;

    const channel = supabase.channel(`order_status_${selectedItem.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders_delivery',
        filter: `id=eq.${selectedItem.id}` 
      }, async (payload) => {
        console.log("[REALTIME] Status do pedido atualizado:", payload.new.status);
        
        if (payload.new.driver_id) {
           const { data: driverInfo } = await supabase
             .from("drivers_delivery")
             .select("name, license_plate, avatar_url, phone, rating")
             .eq("id", payload.new.driver_id)
             .single();
             
           if (driverInfo) {
             const updatedItem = {
               ...payload.new,
               driver_name: driverInfo.name,
               driver_vehicle_plate: driverInfo.license_plate,
               driver_avatar: driverInfo.avatar_url,
               driver_phone: driverInfo.phone,
               driver_rating: driverInfo.rating
             };
             setSelectedItem(updatedItem);
           } else {
             setSelectedItem(payload.new);
           }
        } else {
           setSelectedItem(payload.new);
        }

        // Atualizar lista de pedidos tambÃ©m se o usuÃ¡rio estiver logado
        if (userId) fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedItem?.id, userId]);



  const [filterTab, setFilterTab] = useState<"ativos" | "historico">("ativos");
  const [transitData, setTransitData] = useState({
    origin: { address: "", lat: null as number | null, lng: null as number | null } as any,
    destination: { address: "", lat: null as number | null, lng: null as number | null } as any,
    stops: [] as any[],
    type: "mototaxi" as "mototaxi" | "carro" | "van" | "utilitario" | "frete",
    estPrice: 0,
    scheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    receiverName: "",
    receiverPhone: "",
    packageDesc: "",
    weightClass: "Pequeno (atÃ© 5kg)",
    // Novos campos para Frete e Van
    vehicleCategory: "Fiorino",
    helpers: 0,
    accessibility: { stairsAtOrigin: false, stairsAtDestination: false, serviceElevator: false },
    cargoPhotos: [] as string[],
    passengers: 1,
    tripType: "only_one_way" as "only_one_way" | "round_trip" | "hourly",
    luggage: "none" as "none" | "medium" | "large",
    purpose: "",
    priority: "normal" as "turbo" | "light" | "normal" | "scheduled",
    operationType: "enviar" as "enviar" | "retirar",
    subService: "express" as "express" | "coleta",
    pickupCode: "",
    invoiceNumber: "",
    pickupSector: "",
    excursionData: {
      passengers: 10,
      tripType: 'ida_e_volta',
      departureDate: '',
      returnDate: '',
      notes: ''
    }
  });
  const [distancePrices, setDistancePrices] = useState<Record<string, number>>({});
  const [distanceValueKm, setDistanceValueKm] = useState(0);
  const [routePolyline, setRoutePolyline] = useState<string>("");
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [nearbyDriversCount, setNearbyDriversCount] = useState(0);
  const [mobilityStep, setMobilityStep] = useState(1);

      // [Comentario Limpo pelo Sistema]
  useEffect(() => {
    if (selectedItem?.route_polyline) {
      setRoutePolyline(selectedItem.route_polyline);
    } else if (selectedItem?.polyline) {
      setRoutePolyline(selectedItem.polyline);
    }
  }, [selectedItem]);

  const [transitHistory, setTransitHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("transitHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);


  const { 
    ESTABLISHMENTS, 
    setESTABLISHMENTS, 
    establishmentTypes,
    setEstablishmentTypes 
  } = useApp();

  const isStoreOpen = useCallback((openingHours: any, manualOpen: any, mode: string = 'auto') => {
    // 1. Garantir que manualOpen seja tratado corretamente (default true se null)
    const isManualOpen = manualOpen !== false;

    // 2. Prioridade MÃ¡xima: BotÃ£o de Override Manual (is_open)
    // Se o lojista DESLIGOU a loja manualmente, ela fica FECHADA independente do modo.
    if (isManualOpen === false) return false;

    // 3. Se o modo for 'manual' e o botÃ£o estiver ligado (true), a loja estÃ¡ ABERTA.
    if (mode === 'manual') return isManualOpen === true;

    // 4. Modo AutomÃ¡tico: Segue o horÃ¡rio programado
    // Se nÃ£o houver horÃ¡rios configurados, assume que estÃ¡ aberta se isManualOpen for true.
    if (!openingHours || Object.keys(openingHours).length === 0) return isManualOpen;

    const now = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const today = days[now.getDay()];
    const config = openingHours[today];

    if (!config || !config.active) return false;

    try {
      // Formato esperado: "HH:MM"
      if (!config.open || !config.close) return isManualOpen;
      const [openH, openM] = config.open.split(':').map(Number);
      const [closeH, closeM] = config.close.split(':').map(Number);
      
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      const nowInMinutes = nowH * 60 + nowM;
      const openInMinutes = openH * 60 + openM;
      let closeInMinutes = closeH * 60 + closeM;

      // Suporte para HorÃ¡rio que vira a noite (Ex: 18:00 atÃ© 02:00)
      if (closeInMinutes < openInMinutes) {
        return nowInMinutes >= openInMinutes || nowInMinutes <= closeInMinutes;
      }

      // Caso especial: 24h (00:00 Ã s 00:00 ou 00:00 Ã s 23:59)
      if (openInMinutes === closeInMinutes && openInMinutes === 0) return true;

      return nowInMinutes >= openInMinutes && nowInMinutes <= closeInMinutes;
    } catch (e) {
      return true;
    }
  }, []);

  const fetchRealEstablishments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('role', 'merchant')
        .eq('is_active', true);
        
      if (error) throw error;
      
      const { data: zonesData } = await supabase.from('merchant_delivery_zones').select('*');
      const zonesByMerchant: Record<string, Record<string, {active: boolean, price: number}>> = {};
      if (zonesData) {
        zonesData.forEach(z => {
           if (!zonesByMerchant[z.merchant_id]) zonesByMerchant[z.merchant_id] = {};
           zonesByMerchant[z.merchant_id][z.neighborhood] = {
             active: z.is_active,
             price: z.price
           };
        });
      }

      const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*(Math.PI/180))*Math.cos(lat2*(Math.PI/180))*Math.sin(dLon/2)*Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      };

      // Blindagem: Busca de itens em promoÃ§Ã£o via Fetch Direto
      const getPromoItems = async () => {
        try {
          const sUrl = import.meta.env.VITE_SUPABASE_URL;
          const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const res = await fetch(`${sUrl}/rest/v1/products_delivery?select=merchant_id,name,price&is_available=eq.true`, {
            headers: { 'apikey': sKey, 'Authorization': `Bearer ${sKey}` }
          });
          if (res.ok) return await res.json();
        } catch (e) { console.error("[PROMO] Erro na blindagem de promoÃ§Ãµes:", e); }
        return [];
      };

      const promoItems = await getPromoItems();


      const promoMerchantIds = new Set(
        promoItems
          ?.filter(p => (p.name || "").toLowerCase().includes("oferta especial") || (p.description || "").toLowerCase().includes("promoÃ§Ã£o"))
          .map(p => p.merchant_id) || []
      );
      
        const realEstabs = data?.map(m => {
          const isOpen = isStoreOpen(m.opening_hours, m.is_open, m.opening_mode);
          const hasPromotions = promoMerchantIds.has(m.id);
          
          let distKm = 1.5; // fallback
          if (userLocation.lat && userLocation.lng && m.latitude && m.longitude) {
            distKm = getDistanceKm(userLocation.lat, userLocation.lng, m.latitude, m.longitude);
            // Multiplique por 1.3 por causa de conversÃ£o (distÃ¢ncia de ruas vs linha reta)
            distKm = distKm * 1.3;
          }
          
          // Mapeamento de tipos do banco para os filtros do App baseados na nova taxonomia
          const rawType = (m.store_type || "restaurant").toLowerCase().trim();
          
          return {
            id: m.id,
            name: m.store_name || "Loja Parceira",
            description: m.store_description || "",
            type: rawType,
            foodCategory: Array.isArray(m.food_category) ? m.food_category : [m.food_category || "all"],
            tag: isOpen ? "Aberto Agora" : "Fechado",
            statusTag: isOpen ? "Aberto" : "Fechado",
            isOpen,
            mode: m.opening_mode || 'auto',
            opening_hours: m.opening_hours,
            rating: "4.9",
            dist: `${distKm.toFixed(1)} km`,
            distKm: distKm,
            time: m.estimated_time || "30-45 min",
            img: m.store_logo || "",
            banner: m.store_banner || "",
            freeDelivery: !!m.free_delivery,
            free_delivery: !!m.free_delivery,
            service_fee: m.free_delivery ? 0 : (m.service_fee !== undefined && m.service_fee !== null ? Number(m.service_fee) : null),
            fee: m.free_delivery ? "GrÃ¡tis" : `R$ ${Number(m.service_fee ?? globalSettings?.base_fee ?? appSettings?.baseFee ?? 5.90).toFixed(2).replace('.', ',')}`,
            latitude: m.latitude,
            longitude: m.longitude,
            coverageMode: m.delivery_coverage_mode || 'radius',
            zones: zonesByMerchant[m.id] || {},
            store_address: m.store_address || '',
            hasPromotions
          };
        }) || [];

        // Ordenar: Abertos primeiro
        const sortedEstabs = [...realEstabs].sort((a, b) => (a.isOpen === b.isOpen ? 0 : a.isOpen ? -1 : 1));
        
        setESTABLISHMENTS(sortedEstabs);
    } catch (err) {
    }
  }, [isStoreOpen, globalSettings, appSettings]);

  useEffect(() => {
    fetchRealEstablishments();

    // AI Dynamic Suggestions Cycle
    const aiTips = [
      "Percebi que vocÃª gosta de culinÃ¡ria japonesa. Que tal conferir as ofertas do Sushi Zen?",
      "Hoje Ã© sexta! Temos cupons especiais de 20% em bebidas para membros Izi Black. ÃƒÃ†â€™Ã‚Â°ÃƒÃ¢â‚¬Â¦Ã‚Â¸ÃƒÃ¢â‚¬Å¡Ã‚ ÃƒÃ¢â‚¬Å¡Ã‚Â»",
      "Baseado no seu histÃ³rico, vocÃª costuma pedir em mercados ÃƒÃ†â€™ s 19h. Deseja agendar suas compras?",
      "O trÃƒÃ‚Â¢nsito estÃ¡ pesado hoje. Sugiro usar o MototÃ¡xi para chegar mais rÃ¡pido ao seu destino.",
      "VocÃª estÃ¡ a apenas 250 XP de subir para o nÃ­vel 13! Que tal um pedido extra hoje?"
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % aiTips.length;
      setAiMessage(aiTips[index]);
    }, 15000);

      // [Comentario Limpo pelo Sistema]
    const channel = supabase
      .channel('admin_users_status_sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_users'
        },
        (payload: any) => {
          const updated = payload.new;
          setESTABLISHMENTS(prev => {
              const idx = prev.findIndex(e => e.id === updated.id);
              if (idx === -1) return prev;
              
              const newArr = [...prev];
              const isOpen = isStoreOpen(updated.opening_hours, updated.is_open, updated.opening_mode);
              
              console.log(`[REALTIME] Status de ${updated.store_name} atualizado:`, { isOpen, manual: updated.is_open });

              newArr[idx] = {
                ...newArr[idx],
                isOpen,
                tag: isOpen ? "Aberto Agora" : "Fechado",
                statusTag: isOpen ? "Aberto" : "Fechado",
                mode: updated.opening_mode,
                opening_hours: updated.opening_hours,
                is_open: updated.is_open,
                free_delivery: updated.free_delivery,
                freeDelivery: updated.free_delivery,
                service_fee: updated.service_fee
              };
              
              // Re-ordenar para manter abertos no topo
              return newArr.sort((a, b) => (a.isOpen === b.isOpen ? 0 : a.isOpen ? -1 : 1));
            });
          }
        )
        .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchRealEstablishments, isStoreOpen]);

  // Sincronizar selectedShop com ESTABLISHMENTS para feedback instantÃ¢neo no Menu
  useEffect(() => {
    if (selectedShop && subView === "restaurant_menu") {
      const updated = ESTABLISHMENTS.find(e => e.id === selectedShop.id);
      if (updated && (updated.isOpen !== selectedShop.isOpen || updated.mode !== selectedShop.mode)) {
        setSelectedShop(updated);
      }
    }
  }, [ESTABLISHMENTS, selectedShop, subView]);

  useEffect(() => {
    if (!userId) return;
    
      // [Comentario Limpo pelo Sistema]
    const ordersChannel = supabase
      .channel('my_orders_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders_delivery',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [userId]);
  


  // Sincroniza o selectedItem com as atualizaÃ§Ãµes em tempo real
  useEffect(() => {
    if (selectedItem?.id) {
      const updated = orders.find(o => o.id === selectedItem.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedItem)) {
        setSelectedItem(updated);
      }
    }
  }, [orders]);

  // Atualiza automaticamente as telas PIX/Lightning se o pagamento for confirmado em tempo real
  // Usa selectedItem.id (nÃ£o o objeto inteiro) como dependÃªncia para evitar loops de re-render
  useEffect(() => {
    if ((subView !== "pix_payment" && subView !== "lightning_payment")) return;
    if (!selectedItem?.id || selectedItem.id === "temp") return;

    const liveOrder = orders.find((o: any) => o.id === selectedItem.id);
    if (!liveOrder || !liveOrder.status) return;

    // PRIORIDADE 1: Pagamento confirmado (paid ou novo)
    const isPaid = liveOrder.payment_status === "paid" || liveOrder.status === "novo";
    if (isPaid) {
      console.log("[SYNC] Pagamento aprovado detectado, finalizando fluxo...");
      if (cart.length > 0) clearCart(liveOrder.id);
      setSelectedItem(liveOrder);
      if (liveOrder.service_type === "coin_purchase") {
        setSubView("izi_coin_tracking");
      } else {
        setSubView("none");
        setTab("orders");
      }
      toastSuccess("Pagamento Confirmado! ðŸŽ‰");
      return; // Sair imediatamente para nÃ£o processar o bloco abaixo
    }

    // PRIORIDADE 2: Pedido cancelado/recusado enquanto aguardando pagamento
    if (liveOrder.status === "cancelado" || liveOrder.status === "recusado") {
      toastError("Pagamento recusado ou pedido cancelado.");
      setSubView("payment_error");
    }
  }, [orders, subView, selectedItem?.id]); // selectedItem.id previne loop

  // Sincroniza logistics_tracking em tempo real
  useEffect(() => {
    if (subView !== "logistics_tracking") return;
    if (!selectedItem?.id) return;

    const liveOrder = orders.find((o: any) => o.id === selectedItem.id);
    if (!liveOrder || !liveOrder.status) return;

    // Atualiza dados do motorista/status em tempo real sem loop
    const hasChanged = 
      liveOrder.status !== selectedItem.status ||
      liveOrder.driver_id !== selectedItem.driver_id ||
      liveOrder.driver_name !== selectedItem.driver_name;
    
    if (hasChanged) {
      console.log("[LOGISTICS SYNC] Status atualizado:", liveOrder.status);
      setSelectedItem((prev: any) => ({ ...prev, ...liveOrder }));
    }

    // Se pedido concluÃ­do, atualiza UI
    if (liveOrder.status === "concluido") {
      toastSuccess("Entrega concluÃ­da com sucesso! ðŸŽ‰");
    }

    // Se cancelado
    if (liveOrder.status === "cancelado" || liveOrder.status === "recusado") {
      toastError("ServiÃ§o cancelado.");
    }
  }, [orders, subView, selectedItem?.id, selectedItem?.status, selectedItem?.driver_id]);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);


  const handleClearCart = async () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponInput("");
    
    if (userId) {
      try {
        await supabase.from("users_delivery")
          .update({ cart_data: [] })
          .eq("id", userId);
        console.log("[CART] Sacola esvaziada na nuvem");
      } catch (e) {
        console.error("[CART] Erro ao esvaziar sacola na nuvem:", e);
      }
    }
    localStorage.setItem("izi_cart", JSON.stringify([]));
  };
  const [userLocation, setUserLocation] = useState<{
    address: string;
    loading: boolean;
    lat?: number | null;
    lng?: number | null;
    isManual?: boolean;
  }>(() => {
    return {
      address: "Buscando satÃ©lite...",
      loading: true,
      lat: null,
      lng: null
    };
  });

  // Taxa de entrega REATIVA â€” recalcula quando GPS, carrinho, lojista ou membership mudam.

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro" | "cartao_entrega" | "saldo" | "bitcoin_lightning" | "google_pay">(() => (localStorage.getItem("preferredPaymentMethod") as any) || "cartao");
  const [changeFor, setChangeFor] = useState("");
  useEffect(() => {
    localStorage.setItem("preferredPaymentMethod", paymentMethod);
  }, [paymentMethod]);
  const [deliveryType] = useState<"delivery" | "pickup">("delivery");

  const [cpf, setCpf] = useState<string>("");
  const [profileCpf, setProfileCpf] = useState<string>("");
  const [orderNotes] = useState<string>("");
  const [showPixPayment, setShowPixPayment] = useState(false);

  const [driverPos, setDriverPos] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [adIndex, setAdIndex] = useState(0);
  const [beverageBanners, setBeverageBanners] = useState<any[]>([]);
  const [exploreBanners, setExploreBanners] = useState<any[]>([]);
  const [bevBannerIndex, setBevBannerIndex] = useState(0);
  useEffect(() => {
    if (beverageBanners.length > 1) {
      const interval = setInterval(() => {
        setBevBannerIndex(prev => (prev + 1) % beverageBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [beverageBanners.length]);
  const [beverageOffers, setBeverageOffers] = useState<any[]>([]);

      // [Comentario Limpo pelo Sistema]
  const [marketConditions, setMarketConditions] = useState({
    demand: 1.0,
    traffic: "Normal",
    weather: "Ensolarado",
    surgeMultiplier: 1.0,
    settings: {
      equilibrium: { threshold: 1.2, sensitivity: 2.0, maxSurge: 4.0 },
      weather: {
        rain: { multiplier: 1.3, active: true },
        storm: { multiplier: 1.8, active: true },
        snow: { multiplier: 2.5, active: false }
      },
      shippingPriorities: {
        normal: { multiplier: 1.0, min_fee: 8 },
        light: { multiplier: 1.2, min_fee: 12 },
        turbo: { multiplier: 1.5, min_fee: 15 },
        scheduled: { multiplier: 1.0, min_fee: 12 }
      },
      baseValues: {
        mototaxi_min: 6.0, mototaxi_km: 2.5,
        carro_min: 14.0, carro_km: 4.5,
        van_min: 35.0, van_km: 8.0,
        utilitario_min: 10.0, utilitario_km: 3.0,
        logistica_min: 45.0, logistica_km: 8.0,
        logistica_stairs: 30.0, logistica_helper: 35.0,
        isDynamicActive: true
      }
    }
  });

  // Taxa de entrega REATIVA â€” recalcula quando GPS, carrinho, lojista, membership ou surge mudam.
  const currentDeliveryFee = useMemo(
    () => calculateDeliveryFee(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userLocation.lat, userLocation.lng, cart, selectedShop, isIziBlackMembership, ESTABLISHMENTS, marketConditions]
  );



  useEffect(() => {
    const fetchEstablishmentTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('establishment_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (!error && data) {
          setEstablishmentTypes(data);
        }
      } catch (err) {
        console.error("Erro ao buscar tipos de estabelecimento:", err);
      }
    };
    fetchEstablishmentTypes();
  }, []);

  const dynamicFoodCategories = useMemo(() => {
    // Categorias Master que compÃµem o ecossistema de "Food"
    const foodMasterValues = ['restaurant', 'candy', 'comida'];
    const foodMasterParents = establishmentTypes.filter(t => foodMasterValues.includes(t.value) && !t.parent_id);
    const foodMasterIds = foodMasterParents.map(p => p.id);
    
    // Pegamos as especialidades de todos esses pais
    const specialties = establishmentTypes.filter(t => t.parent_id && foodMasterIds.includes(t.parent_id));

    const base = [
      { id: "all",        name: "Todos",         icon: "restaurant",    action: () => { setRestaurantInitialCategory("Todos"); navigateSubView("explore_restaurants"); } },
      { id: "promocoes",  name: "PromoÃ§Ãµes",     icon: "percent",       action: () => { setRestaurantInitialCategory("PromoÃ§Ãµes"); navigateSubView("explore_restaurants"); } },
    ];

    const dynamic = specialties.map(s => ({
      id: s.value,
      name: s.name,
      icon: s.icon || "restaurant",
      action: () => { setRestaurantInitialCategory(s.value); navigateSubView("explore_restaurants"); }
    }));

    // Fallback se nÃ£o houver dinÃ¢micas ainda
    if (dynamic.length === 0) {
      return [
        ...base,
        { id: "burguer",    name: "Burguer",       icon: "lunch_dining",  action: () => { setRestaurantInitialCategory("burguer"); navigateSubView("explore_restaurants"); } },
        { id: "pizza",      name: "Pizza",         icon: "local_pizza",   action: () => { setRestaurantInitialCategory("pizza"); navigateSubView("explore_restaurants"); } },
        { id: "doces",      name: "Doces e Bolos", icon: "cake",          action: () => { setRestaurantInitialCategory("doces"); navigateSubView("explore_restaurants"); } },
        { id: "japones",    name: "JaponÃªs",       icon: "set_meal",      action: () => { setRestaurantInitialCategory("japones"); navigateSubView("explore_restaurants"); } },
      ];
    }

    return [...base, ...dynamic, { id: "daily", name: "Do Dia", icon: "today", action: () => navigateSubView("daily_menus") }];
  }, [establishmentTypes]);

  const lunchCategories = [
    { id: "all",     name: "Todos",           icon: "restaurant" },
    { id: "promo",   name: "PromoÃ§Ã£o do Dia", icon: "percent" },
    { id: "monte",   name: "Monte o seu",     icon: "flatware" },
    { id: "pratos",  name: "Pratos feitos",   icon: "rice_bowl" },
    { id: "marmita", name: "Marmitas",        icon: "lunch_dining" },
  ];

  const fetchMarketData = async () => {
    try {
      // [Comentario Limpo pelo Sistema]
      const { data: ratesData } = await supabase
        .from('dynamic_rates_delivery')
        .select('*');
      
      const config = {
        equilibrium: ratesData?.find(r => r.type === 'equilibrium')?.metadata || marketConditions.settings.equilibrium,
        weather: ratesData?.find(r => r.type === 'weather_rules')?.metadata || marketConditions.settings.weather,
        baseValues: ratesData?.find(r => r.type === 'base_values')?.metadata || marketConditions.settings.baseValues,
        flowControl: ratesData?.find(r => r.type === 'flow_control')?.metadata || marketConditions.settings.flowControl,
        shippingPriorities: ratesData?.find(r => r.type === 'shipping_priorities')?.metadata || marketConditions.settings.shippingPriorities,
        peakHours: (ratesData?.find(r => r.type === 'peak_hour')?.metadata as any)?.rules || []
      };

      // 2. Contagem de Motoristas On-line (Oferta Real)
      const { count: onlineDrivers } = await supabase
        .from('drivers_delivery')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      // 3. Viagens/Pedidos Abertos (Demanda Real)
      const { count: pendingOrders } = await supabase
        .from('orders_delivery')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const weathers = ["Ensolarado", "Nublado", "Chuva Leve", "Tempestade"];
      const now = new Date();
      const hour = now.getHours();
      
      // SincronizaÃ§Ã£o Real: O clima Ã© definido pelo Admin. Se nenhum estiver ativo, usa lÃ³gica temporal.
      let currentWeather = (hour > 18 || hour < 6) ? "Nublado" : "Ensolarado";
      if (config.weather?.storm?.active) currentWeather = "Tempestade";
      else if (config.weather?.rain?.active) currentWeather = "Chuva Leve";
      else if (config.weather?.snow?.active) currentWeather = "Nublado"; // Neve mapeado para nublado visualmente aqui

      const drivers = onlineDrivers || 1; 
      const orders = pendingOrders || 0;
      const ratio = orders / drivers;

      // --- LOGICA DE SURGE (%) ---
      let surge = 1.0;

      // 1. Modo Inteligente (Algoritmo de EquilÃ­brio)
      const { threshold, sensitivity, maxSurge } = config.equilibrium;
      if (config.flowControl?.mode === 'auto') {
        if (ratio > threshold) {
          surge = 1.0 + (ratio - threshold) * sensitivity;
        }
      }

      // 2. Regras de Clima
      if (currentWeather === "Tempestade" && config.weather?.storm?.active) surge += (config.weather.storm.multiplier - 1);
      if (currentWeather === "Chuva Leve" && config.weather?.rain?.active) surge += (config.weather.rain.multiplier - 1);
      
      // 3. Regras de HorÃ¡rio de Pico (Peak Hours do Admin)
      config.peakHours.forEach((rule: any) => {
        if (rule.active) {
            // No momento usamos apenas multiplicador global se houver, mas podemos expandir para labels
            // Ex: "AcrÃ©scimo Noturno"
            surge += (rule.multiplier - 1);
        }
      });

      // 4. Overrides do Admin (Surge CrÃ­tico)
      if (config.flowControl?.highDemandActive) {
        surge = Math.max(surge, 1.5); // ForÃ§a pelo menos 1.5x
      }

      const finalSurge = Math.max(1.0, Math.min(maxSurge || 4.0, surge));

      setMarketConditions({
        demand: parseFloat(ratio.toFixed(2)),
        traffic: ratio > 1.5 ? "Congestionado" : (ratio > 1 ? "Moderado" : "Normal"),
        weather: currentWeather,
        surgeMultiplier: parseFloat(finalSurge.toFixed(2)),
        settings: config as any
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 20000); // Sincroniza a cada 20s
    return () => clearInterval(interval);
  }, []);

  const calculateDynamicPrice = (basePrice: number) => {
    return marketConditions.settings.baseValues.isDynamicActive 
      ? basePrice * marketConditions.surgeMultiplier 
      : basePrice;
  };

      // [Comentario Limpo pelo Sistema]
  const calculateDistancePrices = (origin: any, destination: any) => {
    const extractStr = (val: any) => {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) return val.address || val.formatted_address || val.display_name || "";
      return "";
    };

    const originStr = extractStr(origin);
    const destStr = extractStr(destination);

    if (!originStr || !destStr || !window.google?.maps) return;
    setIsCalculatingPrice(true);
    setDistancePrices({});

    try {
      const callRoutesAPI = async () => {
        try {
          const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GMAPS_KEY,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs'
            },
            body: JSON.stringify({
              origin: { address: originStr },
              destination: { address: destStr },
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE',
              computeAlternativeRoutes: false,
              languageCode: 'pt-BR',
              units: 'METRIC'
            })
          });

          const data = await res.json();
          if (!res.ok) {
            console.error("Routes API Error Payload:", { origin, destination });
            console.error("Routes API Error Response:", data);
            setIsCalculatingPrice(false);
            return;
          }

          setIsCalculatingPrice(false);

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distKm = (route.distanceMeters || 0) / 1000;
            
            // Converter duraÃ§Ã£o (string "123s") para minutos
            const durationSeconds = route.duration ? parseInt(route.duration.replace('s', '')) : 0;
            const durationMin = Math.ceil(durationSeconds / 60);
            
            const distText = distKm.toFixed(1).replace('.', ',') + " km";
            const durationText = durationMin + " min";
            
            setRouteDistance(`${distText} â€¢ ${durationText}`);
            setDistanceValueKm(distKm);

            // Decodificar Polyline para exibir no mapa
            if (route.polyline?.encodedPolyline && window.google?.maps?.geometry?.encoding) {
              const path = window.google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
              const points = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
              setRoutePolyline(points as any);
            }

            // Continuar com o cÃ¡lculo de preÃ§os (que usa distKm e marketConditions jÃ¡ no escopo pai)
            processPrices(distKm);
          }
        } catch (err) {
          console.error("Routes API Error:", err);
          setIsCalculatingPrice(false);
        }
      };

      const processPrices = (distKm: number) => {
        const bv = marketConditions.settings.baseValues;
        const surge = (bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0) || 1.0;
        
        const mototaxi_min   = parseFloat(String(bv.mototaxi_min))   || 6.0;
        const mototaxi_km    = parseFloat(String(bv.mototaxi_km))    || 2.5;
        const mototaxi_int   = Math.max(0.1, parseFloat(String(bv.mototaxi_km_interval)) || 1.0);
        
        const carro_min      = parseFloat(String(bv.carro_min))      || 14.0;
        const carro_km       = parseFloat(String(bv.carro_km))       || 4.5;
        const carro_int      = Math.max(0.1, parseFloat(String(bv.carro_km_interval)) || 1.0);
        
        const van_min        = parseFloat(String(bv.van_min))        || 35.0;
        const van_km         = parseFloat(String(bv.van_km))         || 8.0;
        const van_int        = Math.max(0.1, parseFloat(String(bv.van_km_interval)) || 1.0);
            
        // PreÃ§os base para UtilitÃ¡rio (Izi Envios) vindos da seÃ§Ã£o Shipping Priorities
        const priorities = marketConditions.settings?.shippingPriorities || {};
        const scheduledCfg = priorities.scheduled || { min_fee: 15, km_fee: 1 };
        const normalCfg    = priorities.normal    || { min_fee: 10, km_fee: 1 };
        
        const utilitario_min = parseFloat(String(scheduledCfg.min_fee)) || 15.0;
        const utilitario_km  = parseFloat(String((scheduledCfg as any).km_fee))  || 1.0;
        const utilitario_int = 1.0;
            
        const logistica_min  = parseFloat(String(bv.logistica_min))  || 45.0;
            const logistica_km   = parseFloat(String(bv.logistica_km))   || 8.0;
            const logistica_int  = Math.max(0.1, parseFloat(String(bv.logistica_km_interval)) || 1.0);

            // LogÃ­stica Customizada por VeÃ­culo (ResiliÃªncia de chaves snake_case e camelCase)
            const getVal = (k1: string, k2: string, fallback: number) => {
              const v = bv[k1] || bv[k2];
              return v ? parseFloat(String(v)) : fallback;
            };

            const fiorino_min = getVal('fiorino_min', 'fiorinoMin', logistica_min);
            const fiorino_km  = getVal('fiorino_km',  'fiorinoKm',  logistica_km);
            const bau_p_min   = getVal('bau_p_min',   'bauPMin',    logistica_min);
            const bau_p_km    = getVal('bau_p_km',    'bauPKm',     logistica_km);
            const bau_m_min   = getVal('bau_m_min',   'bauMMin',    logistica_min);
            const bau_m_km    = getVal('bau_m_km',    'bauMKm',     logistica_km);
            const bau_g_min   = getVal('bau_g_min',   'bauGMin',    logistica_min);
            const bau_g_km    = getVal('bau_g_km',    'bauGKm',     logistica_km);
            const aberto_min  = getVal('aberto_min',  'abertoMin',  logistica_min);
            const aberto_km   = getVal('aberto_km',   'abertoKm',   logistica_km);

            const newPrices = {
              mototaxi:   parseFloat(((mototaxi_min   + (mototaxi_km   * (distKm / mototaxi_int)))   * surge).toFixed(2)),
              carro:      parseFloat(((carro_min      + (carro_km      * (distKm / carro_int)))      * surge).toFixed(2)),
              van:        parseFloat(((van_min        + (van_km        * (distKm / van_int)))        * surge).toFixed(2)),
              utilitario: parseFloat(((utilitario_min + (utilitario_km * distKm)) * surge).toFixed(2)),
              logistica:  parseFloat(((logistica_min  + (logistica_km  * (distKm / logistica_int)))  * surge).toFixed(2)),
              // PreÃ§os especÃ­ficos de logÃ­stica - Agora puramente Lineares (KM * DistÃ¢ncia)
              fiorino:    parseFloat(((fiorino_min + (fiorino_km * distKm)) * surge).toFixed(2)),
              bau_p:      parseFloat(((bau_p_min   + (bau_p_km   * distKm)) * surge).toFixed(2)),
              bau_m:      parseFloat(((bau_m_min   + (bau_m_km   * distKm)) * surge).toFixed(2)),
              bau_g:      parseFloat(((bau_g_min   + (bau_g_km   * distKm)) * surge).toFixed(2)),
              aberto:     parseFloat(((aberto_min  + (aberto_km  * distKm)) * surge).toFixed(2)),
              van_carga:  parseFloat(((van_min     + (van_km     * distKm)) * surge).toFixed(2)),
            };
            setDistancePrices(newPrices);
            setTransitData(prev => {
              // 1. Wizard de LogÃ­stica/Frete
              if ((prev.type === 'logistica' || prev.type === 'frete') && prev.vehicleCategory) {
                return prev;
              }
              
              // 2. Regra Izi Envios (Prioridades)
              if (prev.type === 'utilitario') {
                 const pKey = prev.priority || 'normal';
                 const config = priorities[pKey as keyof typeof priorities];
                 if (config) {
                    const price = (Number(config.min_fee) + (Number((config as any).km_fee) * distKm)) * (Number(config.multiplier) || 1);
                    return { ...prev, estPrice: parseFloat(price.toFixed(2)) };
                 }
              }

              // 3. Demais Categorias
              const finalBasePrice = newPrices[prev.type as keyof typeof newPrices] || newPrices.mototaxi;
              return { ...prev, estPrice: finalBasePrice };
            });

            supabase
              .from('drivers_delivery')
              .select('id, name, vehicle_type, rating')
              .eq('is_online', true)
              .limit(5)
              .then(({ data }) => {
                if (data) {
                  setNearbyDrivers(data);
                  setNearbyDriversCount(data.length);
                }
              });
            }; // Fim do processPrices

            // Chamar a nova API de Rotas (v2)
            callRoutesAPI();
        } catch (err) {
            console.error("Error calculating routes:", err);
            setIsCalculatingPrice(false);
        }
    };


  const handleRequestTransit = () => {
    if (!transitData.origin) {
      toastError("Selecione um ponto de coleta/parceiro");
      return;
    }
    if (!transitData.destination) {
      toastError("Defina o endereÃ§o de entrega");
      return;
    }
    if (!transitData.receiverName) {
      toastError("Informe o nome do destinatÃ¡rio");
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
  };

  const handleConfirmMobility = async (paymentMethod: string) => {
    if (!userId) {
      toastWarning("FaÃ§a login para continuar");
      setView("login");
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
    
      // [Comentario Limpo pelo Sistema]
    let finalPrice = 0;
    const surgeMultiplier = bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0;

    if (transitData.type === 'logistica' || transitData.type === 'frete') {
       if (Number(transitData.estPrice) > 0) {
         finalPrice = Number(transitData.estPrice);
       } else {
          const vehicleConfigs: Record<string, { min: string, km: string, int: string }> = {
            "Fiorino": { min: 'fiorino_min', km: 'fiorino_km', int: 'fiorino_km_interval' },
            "Van Carga": { min: 'van_min', km: 'van_km', int: 'van_km_interval' },
            "Caminhonete": { min: 'caminhonete_min', km: 'caminhonete_km', int: 'caminhonete_km_interval' },
            "CaminhÃ£o BaÃº Pequeno": { min: 'bau_p_min', km: 'bau_p_km', int: 'bau_p_km_interval' },
            "CaminhÃ£o BaÃº MÃ©dio": { min: 'bau_m_min', km: 'bau_m_km', int: 'bau_m_km_interval' },
            "CaminhÃ£o BaÃº Grande": { min: 'bau_g_min', km: 'bau_g_km', int: 'bau_g_km_interval' },
            "CaminhÃ£o Aberto": { min: 'aberto_min', km: 'aberto_km', int: 'aberto_km_interval' }
          };

          const configKeys = vehicleConfigs[transitData.vehicleCategory];
          let baseFare = parseFloat(String(bv.logistica_min || 45));
          let distanceRate = parseFloat(String(bv.logistica_km || 4.5));
          let logistica_int = Math.max(0.1, parseFloat(String(bv.logistica_km_interval)) || 1.0);

          if (configKeys && bv[configKeys.min] && parseFloat(String(bv[configKeys.min])) > 0) {
              baseFare = parseFloat(String(bv[configKeys.min]));
              distanceRate = parseFloat(String(bv[configKeys.km]));
              logistica_int = Math.max(0.1, parseFloat(String(bv[configKeys.int])) || 1.0);
          } else {
              const vehicleMultipliers: Record<string, number> = {
                "Fiorino": 1.0,
                "Van Carga": 1.0,
                "Caminhonete": 1.25,
                "CaminhÃ£o BaÃº Pequeno": 1.6,
                "CaminhÃ£o BaÃº MÃ©dio": 2.2,
                "CaminhÃ£o BaÃº Grande": 3.5,
                "CaminhÃ£o Aberto": 1.9,
              };
              const multiplier = vehicleMultipliers[transitData.vehicleCategory] || 1.0;
              baseFare *= multiplier;
              distanceRate *= multiplier;
          }

          finalPrice = calculateFreightPrice({
              baseFare: baseFare * surgeMultiplier,
              distanceInKm: Math.ceil((distanceValueKm || 1) / logistica_int),
              distanceRate: distanceRate * surgeMultiplier,
              helperCount: (transitData.freightData?.helpers || 0),
              helperRate: parseFloat(String(bv.logistica_helper || 35)),
              hasStairs: transitData.freightData?.hasStairs,
              stairsFee: parseFloat(String(bv.logistica_stairs || 30))
          }).totalPrice;
       }
    } else if (transitData.type === 'van') {
       const van_int = Math.max(0.1, parseFloat(String(bv.van_km_interval)) || 1.0);
       finalPrice = calculateVanPrice({
          baseFare: parseFloat(String(bv.van_min || 35)),
          distanceInKm: Math.ceil((distanceValueKm || 1) / van_int),
          distanceRate: parseFloat(String(bv.van_km || 8)) * surgeMultiplier,
          stopCount: transitData.stops?.length || 0,
          stopRate: 15, // Mover para settings se necessÃ¡rio
          isDaily: transitData.tripType === 'hourly',
          hours: 4,
          hourlyRate: 45
       }).totalPrice;
    } else {
      // Para outros tipos (mototaxi, carro, utilitario), usamos o preÃ§o jÃ¡ calculado no preview
      // que agora tambÃ©m Ã© aditivo por padrÃ£o.
      const rawP = distancePrices[transitData.type];
      finalPrice = isNaN(rawP) || !rawP ? (basePrices[transitData.type] || 6.90) : rawP;
    }
    
    // Inserindo lÃ³gica de prioridade de envio (Turbo, Light, etc)
    const priorityId = transitData.priority;
    const priorityConfig = marketConditions.settings?.shippingPriorities?.[priorityId as keyof typeof marketConditions.settings.shippingPriorities];
    
    if (priorityConfig && priorityConfig.active) {
      if ((priorityConfig as any).km_fee > 0) {
        // CÃ¡lculo independente por prioridade (Base + KM * DistÃ¢ncia)
        finalPrice = (priorityConfig.min_fee || 0) + ((priorityConfig as any).km_fee * distanceValueKm);
      } else {
        // CÃ¡lculo baseado em multiplicador (Legado)
        finalPrice *= (priorityConfig.multiplier || 1.0);
        if (finalPrice < (priorityConfig.min_fee || 0)) {
          finalPrice = priorityConfig.min_fee;
        }
      }
    }

      // [Comentario Limpo pelo Sistema]
    const serviceFeePercent = globalSettings?.service_fee_percent || 0;
    const rawServiceFee = (finalPrice * serviceFeePercent) / 100;
    const serviceFeeAmount = isIziBlackMembership ? 0 : rawServiceFee;
    finalPrice += serviceFeeAmount;

    setIsLoading(true);


    try {
      // 1. Criar o pedido (inicialmente pendente se for cartao, ou pago se for saldo/dinheiro)
      const initialPaymentStatus = (paymentMethod === 'dinheiro' || paymentMethod === 'pix' || paymentMethod === 'bitcoin_lightning') ? 'pending' : 'paid';
      const initialOrderStatus = (paymentMethod === 'cartao') ? 'pendente_pagamento' : 'waiting_driver';

      const orderBase: any = {
        user_id: userId,
        merchant_id: null,
        status: initialOrderStatus,
        total_price: finalPrice,
        service_type: transitData.type,
        pickup_address: typeof transitData.origin === 'object' ? (transitData.origin.address || transitData.origin.formatted_address) : transitData.origin,
        delivery_address: `${typeof transitData.destination === 'object' ? (transitData.destination.formatted_address || transitData.destination.address || JSON.stringify(transitData.destination)) : transitData.destination} | OBS: ${
          transitData.type === 'van'
            ? `EXCURSÃƒO: ${transitData.excursionData.passengers} passageiros. Tipo: ${transitData.excursionData.tripType === 'ida_e_volta' ? 'Ida e Volta' : 'Somente Ida'}. Partida: ${transitData.excursionData.departureDate}. ${transitData.excursionData.notes || ''}`
            : (transitData.type === 'logistica' || transitData.type === 'frete')
              ? `FRETE: ${transitData.vehicleCategory}. ${transitData.helpers || 0} ajudantes. ${
                  (transitData.accessibility?.stairsAtOrigin || transitData.accessibility?.stairsAtDestination) ? 'NecessÃ¡rio subir ESCADAS.' : 'Sem escadas.'
                }`
              : isShipping
                ? `ENVIO: ${transitData.packageDesc || 'Objeto'} (${transitData.weightClass}). Recebedor: ${transitData.receiverName} (${transitData.receiverPhone})`
                : `VIAGEM: Transporte de passageiro (${transitData.type === 'mototaxi' ? 'MotoTÃ¡xi' : 'Particular'})`
        }`,
        payment_method: paymentMethod,
        payment_status: initialPaymentStatus,
        scheduled_at: (transitData.scheduled || transitData.type === 'van') ? (transitData.type === 'van' ? transitData.excursionData.departureDate : `${transitData.scheduledDate}T${transitData.scheduledTime}:00`) : null,
        route_polyline: routePolyline
      };

      // LÃ³gica de DÃ©bito de Saldo (OcorrerÃ¡ ANTES da criaÃ§Ã£o do pedido para garantir atomicidade)
      let finalNewIziCoins = iziCoins;
      let finalNewWalletBalance = walletBalance;

      if (paymentMethod === "saldo") {
        const coinValue = globalSettings?.izi_coin_value || 1.0;
        const totalBrlAvailable = walletBalance + (iziCoins * coinValue);
        
        if (totalBrlAvailable < finalPrice) {
          toastError("Saldo insuficiente na carteira IZI Pay.");
          setIsLoading(false);
          return;
        }

        let remainingToPay = finalPrice;
        let tempNewIziCoins = iziCoins;
        let tempNewWalletBalance = walletBalance;

        const coinsAvailableValue = tempNewIziCoins * coinValue;
        if (coinsAvailableValue >= remainingToPay) {
          tempNewIziCoins -= (remainingToPay / coinValue);
          remainingToPay = 0;
        } else {
          remainingToPay -= coinsAvailableValue;
          tempNewIziCoins = 0;
        }

        if (remainingToPay > 0) {
          tempNewWalletBalance -= remainingToPay;
          remainingToPay = 0;
        }

        // Executar o dÃ©bito no banco ANTES de criar o pedido
        const { error: updateErr } = await supabase.from("users_delivery").update({ 
          wallet_balance: Number(tempNewWalletBalance.toFixed(2)),
          izi_coins: Number(tempNewIziCoins.toFixed(8))
        }).eq("id", userId);

        if (updateErr) {
          console.error("Erro crÃ­tico ao debitar saldo:", updateErr);
          throw new Error("NÃ£o foi possÃ­vel processar o dÃ©bito na sua carteira. Tente novamente.");
        }

        finalNewIziCoins = tempNewIziCoins;
        finalNewWalletBalance = tempNewWalletBalance;
      }

      // 1. Criar o pedido
      const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(orderBase).select().single();
      
      if (insertError || !order) {
        // SE FALHOU AO CRIAR O PEDIDO, PRECISAMOS ESTORNAR O SALDO SE FOI DEBITADO!
        if (paymentMethod === "saldo") {
           await supabase.from("users_delivery").update({ 
             wallet_balance: walletBalance,
             izi_coins: iziCoins
           }).eq("id", userId);
        }
        throw insertError || new Error("Falha ao criar registro do pedido");
      }

      // 2. LÃ³gica de PÃ³s-DÃ©bito (Registrar transaÃ§Ã£o e atualizar estado local)
      if (paymentMethod === "saldo") {
        setWalletBalance(finalNewWalletBalance);
        setIziCoins(finalNewIziCoins);

        await supabase.from("wallet_transactions_delivery").insert({
          user_id: userId,
          type: "pagamento",
          amount: finalPrice,
          description: `ServiÃ§o #${order.id.slice(0, 6).toUpperCase()}: ${transitData.type}`,
          balance_after: finalNewWalletBalance
        });
      }


      if (transitData.type === 'van') {
        await supabase.from("excursions_delivery").insert({
          order_id: order.id, trip_type: transitData.excursionData.tripType,
          passengers: transitData.excursionData.passengers, departure_date: transitData.excursionData.departureDate,
          return_date: transitData.excursionData.tripType === 'ida_e_volta' ? transitData.excursionData.returnDate : null,
          additional_notes: transitData.excursionData.notes
        });
      }

      if (paymentMethod === 'pix') {
         setPixConfirmed(false); setPixCpf("");
         setSelectedItem({ ...order, total_price: finalPrice });
         setSubView('pix_payment');
         setIsLoading(false);
         return;
      } else if (paymentMethod === 'bitcoin_lightning') {
          try {
            const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
              body: { amount: finalPrice, orderId: order.id, memo: `Viagem Izi #${order.id}` },
            });
            if (!lnErr && lnData?.payment_request) {
               const lData = { 
                 payment_request: lnData.payment_request, 
                 satoshis: lnData.satoshis,
                 btc_price_brl: lnData.btc_price_brl 
               };
               setLightningData(lData);
               setSelectedItem({ 
                 ...order, 
                 lightningInvoice: lData.payment_request, 
                 satoshis: lData.satoshis, 
                 btc_price_brl: lData.btc_price_brl,
                 total_price: finalPrice 
               });
               setSubView("lightning_payment");
               setIsLoading(false);
               return;
            }
          } catch(e) { console.error("LN Error:", e); }
      } else if (paymentMethod === 'cartao') {
          if (selectedCard) {
            handleConfirmSavedCardShortcut(order.id, finalPrice, "mobility");
            return;
          }
          setSelectedItem(order);
          setSubView("card_payment");
          setIsLoading(false);
          return;
      }


      const newHistory = [transitData.destination, ...transitHistory.filter(h => h !== transitData.destination)].slice(0, 10);
      setTransitHistory(newHistory);
      localStorage.setItem("transitHistory", JSON.stringify(newHistory));
      setSelectedItem(order);
      
      if (paymentMethod !== 'pix' && paymentMethod !== 'bitcoin_lightning') {
        const isLogisticsService = ['frete', 'logistica', 'van'].includes(transitData.type);
        if (transitData.scheduled) {
          toastSuccess("Agendamento confirmado com sucesso!");
          setSubView("mobility_payment_success");
        } else {
          setSubView("mobility_payment_success");
        }
      }
    } catch (err: any) {
      console.error("Erro no fluxo de mobilidade:", err);
      toastError("NÃ£o foi possÃ­vel criar seu pedido: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-rotate ad banner
  useEffect(() => {
    const adTimer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(adTimer);
  }, []);

      // [Comentario Limpo pelo Sistema]
  useEffect(() => {
    const includedViews = ["taxi_wizard", "transit_selection", "freight_wizard", "excursion_wizard", "shipping_details"];
    if (includedViews.includes(subView) && transitData.origin && transitData.destination) {
      setIsCalculatingPrice(true);
      setDistancePrices({});
      const timer = setTimeout(() => {
        const extractAddr = (val: any) => {
          if (typeof val === 'string') return val;
          if (typeof val === 'object' && val !== null) {
            return val.address || val.formatted_address || val.display_name;
          }
          return null;
        };
        
        const ori = extractAddr(transitData.origin);
        const dest = extractAddr(transitData.destination);
        
        if (ori && dest) {
          calculateDistancePrices(ori, dest);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [transitData.origin, transitData.destination, subView, marketConditions]);

  // Autopreencher origem se estiver vazia ao entrar no wizard
  useEffect(() => {
    const wizards = ["taxi_wizard", "freight_wizard", "van_wizard", "excursion_wizard", "transit_selection"];
    if (wizards.includes(subView) && userLocation.address && !transitData.origin) {
      setTransitData(prev => ({ ...prev, origin: userLocation.address }));
    }
  }, [subView, userLocation.address]);

  // Capturar localizaÃ§Ã£o atual obrigatoriamente ao entrar em fluxos de mobilidade/logÃ­stica
  useEffect(() => {
    const mobilityWizardViews = ["taxi_wizard", "freight_wizard", "van_wizard", "excursion_wizard", "transit_selection"];
    if (mobilityWizardViews.includes(subView)) {
      updateLocation(); // Garante atualizaÃ§Ã£o real e recente
    }
  }, [subView]);

  // Definir tipo de serviÃ§o correto ao entrar no FreightWizard
  useEffect(() => {
    if (subView === "freight_wizard") {
      setTransitData(prev => ({ ...prev, type: "frete" }));
      setMobilityStep(1);
    }
  }, [subView]);

  useEffect(() => {
    const previousSubView = previousSubViewRef.current;
    const mobilityWizardViews = ["taxi_wizard", "freight_wizard", "excursion_wizard"];
    const isEnteringDifferentWizard =
      mobilityWizardViews.includes(subView) &&
      previousSubView !== subView &&
      previousSubView !== "mobility_payment";

    if (isEnteringDifferentWizard) {
      setMobilityStep(1);
    }

    previousSubViewRef.current = subView;
  }, [subView]);

    
  // Scanner logic moved to modular components






  const renderExploreCategory = () => {
    if (!exploreCategoryState) return null;

    const accentColor = exploreCategoryState.primaryColor;

    return (
      <EstablishmentListView
        title={exploreCategoryState.title}
        subtitle={exploreCategoryState.tagline}
        icon={exploreCategoryState.icon}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSubView={setSubView}
        establishments={ESTABLISHMENTS}
        filterFn={(estab: any) => {
          const catId = (exploreCategoryState.id || "").toLowerCase();
          const type = (estab.type || "").toLowerCase();
          const foodCats = Array.isArray(estab.foodCategory) 
            ? estab.foodCategory.map((c: any) => (c || "").toLowerCase())
            : [(estab.foodCategory || "").toLowerCase()];
            
          return type === catId || 
                 foodCats.includes(catId) || 
                 foodCats.some((c: string) => c.includes(catId)) ||
                 (estab.description || "").toLowerCase().includes(catId);
        }}
        onShopClick={(shop) => handleShopClick({ ...shop, type: exploreCategoryState.id })}
        cartLength={cart.length}
        navigateSubView={navigateSubView}
        backView="none"
      />
    );
  };

  const renderExploreRestaurants = () => {
    const isLunchMode = restaurantInitialCategory === "AlmoÃ§o";
    
    return (
      <ExploreRestaurantsView 
        setSubView={setSubView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cart={cart}
        navigateSubView={navigateSubView}
        foodCategories={isLunchMode ? lunchCategories : dynamicFoodCategories}
        availableCoupons={availableCoupons}
        establishments={ESTABLISHMENTS}
        onShopClick={handleShopClick}
        copiedCoupon={copiedCoupon}
        setCopiedCoupon={setCopiedCoupon}
        initialCategory={restaurantInitialCategory}
        isIziBlackMembership={isIziBlackMembership}
      />
    );
  };

  const renderDailyMenus = () => {
    const specials: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-black text-white text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto pb-10">
        <header className="sticky top-0 z-50 bg-black/80  backdrop-blur-3xl border-b border-slate-200/50 border-zinc-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('explore_restaurants')} className="size-12 rounded-[22px] bg-white bg-zinc-900 shadow-2xl border border-zinc-800 border-zinc-800 flex items-center justify-center active:scale-90 transition-all group">
                <Icon name="arrow_back" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-white">CardÃ¡pios do Dia</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">SugestÃµes Especiais</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-10 pt-8">
           <div className="bg-pink-500/5 p-8 rounded-[45px] border border-pink-500/10 mb-2">
             <h2 className="text-lg font-black text-pink-600  mb-2 leading-none uppercase tracking-tighter">Ofertas de Hoje</h2>
             <p className="text-xs font-medium text-zinc-500">Seus pratos favoritos com preÃ§os exclusivos para hoje.</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
                {specials.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={p.id || i}
                  onClick={() => { handleAddToCart(p); }}
                  className="bg-zinc-900 rounded-2xl p-3 shadow-lg border border-zinc-800 active:scale-95 transition-all overflow-hidden relative group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-square rounded-xl overflow-hidden shrink-0 shadow-md">
                       <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-2 left-2 bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-md">HOJE</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                       <p className="text-[7px] font-black uppercase tracking-widest text-pink-500 mb-0.5">{p.store}</p>
                       <h3 className="text-[11px] font-black text-white leading-tight mb-1 truncate group-hover:text-pink-500 transition-colors uppercase">{p.name}</h3>
                       <p className="text-[9px] text-zinc-500 font-medium line-clamp-1 leading-tight mb-3">{p.desc}</p>
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-black text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                           className="size-8 rounded-lg bg-pink-500 text-white flex items-center justify-center transition-all shadow-md active:scale-90"
                         >
                           <span className="material-symbols-outlined text-base">add</span>
                         </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
             ))}
           </div>
        </main>
      </div>
    );
  };

  const renderExclusiveOffer = () => {
    let displayDeals: any[] = [];
    if (selectedItem) {
      displayDeals = [selectedItem];
    } else {
      displayDeals = flashOffers.length > 0 ? flashOffers.map(f => ({
        id: f.product_id || f.id,
        name: f.product_name,
        store: f.admin_users?.store_name || 'Loja Parceira',
        img: f.product_image || '',
        oldPrice: Number(f.original_price),
        price: Number(f.discounted_price),
        merchant_id: f.merchant_id,
        merchant_name: f.admin_users?.store_name || 'Loja Parceira',
        is_flash_offer: true,
        flash_offer_id: f.id,
        expires_at: f.expires_at,
        off: f.original_price && f.discounted_price 
          ? `- R$ ${(Number(f.original_price) - Number(f.discounted_price)).toFixed(2).replace('.', ',')} OFF` 
          : `- R$ ${(Number(f.original_price) * (Number(f.discount_percent) / 100)).toFixed(2).replace('.', ',')} OFF`,
        desc: (f.description || 'Oferta imperdível por tempo limitado!') + `\n\n📌 Vendido por: ${f.admin_users?.store_name || 'Loja Parceira'}`
      })) : [];
    }

    return (
      <div className="absolute inset-0 z-[100] bg-white text-zinc-900 flex flex-col hide-scrollbar overflow-y-auto pb-10">
        {/* HEADER TRANSPARENTE SEM FUNDO */}
        <header className="absolute top-0 left-0 right-0 z-[130] p-6 flex items-center gap-6 pointer-events-none">
           <button 
            onClick={() => {
              setSubView("none" as any);
              setSelectedItem(null);
            }} 
            className="size-12 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center text-black active:scale-90 transition-all pointer-events-auto"
          >
            <Icon name="arrow_back_ios_new" className="text-xl" />
          </button>
        </header>

        <main className="flex-1 space-y-10 pb-20">
          {/* HERO INFO */}
          <section className="pt-24 px-8 flex flex-col items-center text-center">
             <span className="text-yellow-600 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Oferta Izi Flash</span>
             <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-8">Exclusiva</h1>

             {/* Timer Clean */}
             {displayDeals.length > 0 && displayDeals[0].expires_at && (
               <div className="bg-zinc-50 border border-zinc-100 p-8 rounded-[40px] shadow-sm mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">A oferta termina em:</p>
                  <DigitalTimer targetDate={displayDeals[0].expires_at} size="lg" variant="light" />
               </div>
             )}
          </section>

          {/* DEAL CARDS */}
          <div className="px-6 flex flex-col items-center gap-12">
            {displayDeals.map((deal, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={deal.id || i}
                className="w-full max-w-[380px] bg-white rounded-[56px] overflow-hidden border border-zinc-100 shadow-2xl shadow-zinc-200 flex flex-col items-center group active:scale-[0.98] transition-all"
              >
                <div className="w-full h-96 relative">
                  <img src={deal.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-6 left-6 bg-yellow-400 px-6 py-2 rounded-2xl shadow-xl shadow-yellow-400/20">
                    <span className="text-[10px] text-black font-black uppercase tracking-widest">{deal.off}</span>
                  </div>
                </div>
                
                <div className="p-10 flex flex-col items-center text-center -mt-20 relative z-10 w-full bg-white rounded-t-[48px]">
                  <h3 className="text-3xl font-black text-zinc-900 tracking-tighter leading-tight mb-2">{deal.name}</h3>
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] mb-6">{deal.store}</p>
                  <p className="text-xs text-zinc-400 font-bold mb-10 max-w-[280px] leading-relaxed uppercase tracking-wider">{deal.desc}</p>
                  
                  <div className="w-full flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-zinc-200 line-through tracking-widest mb-1">R$ {(deal.oldPrice || 0).toFixed(2).replace('.', ',')}</span>
                      <div className="flex items-center gap-2">
                         <span className="text-yellow-500 text-lg font-black tracking-tighter">R$</span>
                         <span className="text-5xl font-black text-zinc-900 tracking-tighter">{(deal.price || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAddToCart(deal)}
                      className="w-full h-20 bg-black text-yellow-400 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                    >
                      Adicionar ao Carrinho
                      <span className="material-symbols-rounded text-2xl">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    );
  };




  const renderHealthPlantao = () => renderAllPharmacies();

  const renderGenericList = () => {
    const shop = activeService || { label: "Loja", type: "generic" };
    const title = shop.label || "Explorar";

    const categoryIcons: Record<string, string> = {
      "Petshop": "pets", "Flores": "local_florist", "Doces & Bolos": "cake",
      "FarmÃ¡cia": "local_pharmacy", "Mercado": "local_mall",
      "GÃ¡s & Ãƒ gua": "propane_tank", "AÃ§ougue": "kebab_dining", "Padaria": "bakery_dining", "Izi Envios": "package_2"
    };
    const icon = categoryIcons[title] || "storefront";

    return (
      <EstablishmentListView
        title={title}
        subtitle="DisponÃ­vel agora"
        icon={icon}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSubView={setSubView}
        establishments={ESTABLISHMENTS}
        filterFn={(estab: any) => {
          const sType = (estab.type || "").toLowerCase();
          const sTag = (estab.tag || "").toLowerCase();
          const activeType = (activeService?.type || "").toLowerCase();
          const activeLabel = (activeService?.label || "").toLowerCase();
          
          return sType === activeType || 
                 sType === activeLabel || 
                 sTag.includes(activeType) || 
                 sTag.includes(activeLabel);
        }}
        onShopClick={(shop) => handleShopClick({ ...shop, type: "generic" })}
        cartLength={cart.length}
        navigateSubView={navigateSubView}
        backView="none"
      />
    );
  };



  const renderMarketList = () => (
    <MarketExploreView 
      setSubView={setSubView}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      cart={cart}
      navigateSubView={navigateSubView}
      establishments={ESTABLISHMENTS}
      onShopClick={handleShopClick}
      availableCoupons={availableCoupons}
    />
  );

  const renderPharmacyList = () => (
    <EstablishmentListView
      title="FarmÃ¡cias"
      subtitle="SaÃºde e bem-estar"
      icon="local_pharmacy"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      setSubView={setSubView}
      establishments={ESTABLISHMENTS}
      filterFn={(shop: any) => shop.type === 'pharmacy' || shop.type === 'farmacia' || shop.type === 'saude'}
      onShopClick={(shop) => handleShopClick({ ...shop, type: "generic" })}
      cartLength={cart.length}
      navigateSubView={navigateSubView}
      backView="none"
    />
  );

  const renderAllPharmacies = () => (
    <EstablishmentListView
      title="Todas as FarmÃ¡cias"
      subtitle="Unidades PrÃ³ximas"
      icon="local_pharmacy"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      setSubView={setSubView}
      establishments={ESTABLISHMENTS}
      filterFn={(shop: any) => shop.type === 'pharmacy' || shop.type === 'farmacia' || shop.type === 'saude'}
      onShopClick={(shop) => handleShopClick({ ...shop, type: "generic" })}
      cartLength={cart.length}
      navigateSubView={navigateSubView}
      backView="pharmacy_list"
    />
  );

  const renderBeveragesList = () => (
    <EstablishmentListView
      title="Bebidas"
      subtitle="Distribuidoras e adegas"
      icon="local_bar"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      setSubView={setSubView}
      establishments={ESTABLISHMENTS}
      filterFn={(shop: any) => shop.type === "beverages" || shop.type === "bebidas"}
      onShopClick={(shop) => handleShopClick({ ...shop, type: "generic" })}
      cartLength={cart.length}
      navigateSubView={navigateSubView}
      backView="none"
    />
  );

  const renderBeverageOffers = () => {
    const deals = beverageOffers;
    return (
      <div className="bg-black text-zinc-100 absolute inset-0 z-50 bg-zinc-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-10">
        <header className="sticky top-0 z-[60] bg-zinc-950/80 backdrop-blur-2xl border-b border-white/10 p-6 flex items-center gap-6">
           <button 
            onClick={() => setSubView("beverages_list")}
            className="size-12 rounded-2xl bg-zinc-900/5 flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Ofertas Geladas</h1>
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.2em]">SeleÃ§Ã£o Premium de Ofertas</p>
          </div>
          <button onClick={() => navigateSubView("cart")} className="relative size-12 rounded-2xl bg-zinc-900/5 border border-white/10 flex items-center justify-center group active:scale-95 transition-all">
            <Icon name="shopping_bag" />
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-yellow-400 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-slate-950 shadow-xl">{cart.length}</span>}
          </button>
        </header>

        <main className="p-6 space-y-8">
            <div className="relative h-64 rounded-[50px] overflow-hidden group border border-white/10 bg-zinc-900 shadow-2xl">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={bevBannerIndex}
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -50 }}
                   transition={{ duration: 0.5 }}
                   className="absolute inset-0"
                 >
                   <img 
                     src={beverageBanners.length > 0 ? beverageBanners[bevBannerIndex].image_url : ""} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center px-10">
                      <div className="flex items-center gap-2 mb-4">
                         <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Aproveite</span>
                         <span className="bg-yellow-400 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Limitado</span>
                      </div>
                      <h2 className="text-4xl font-black tracking-tighter leading-tight max-w-[250px] text-yellow-400">
                         {beverageBanners.length > 0 ? beverageBanners[bevBannerIndex].title : "Oferta Izi"}
                      </h2>
                      <p className="text-[11px] font-bold text-white/60 mt-4 uppercase tracking-[0.2em]">
                         {beverageBanners.length > 0 ? beverageBanners[bevBannerIndex].description : "Confira nossas ofertas selecionadas"}
                      </p>
                   </div>
                 </motion.div>
               </AnimatePresence>
               
               {beverageBanners.length > 1 && (
                 <div className="absolute bottom-6 right-10 flex gap-1.5 z-20">
                   {beverageBanners.map((_: any, i: number) => (
                     <button 
                       key={i}
                       onClick={(e) => { e.stopPropagation(); setBevBannerIndex(i); }}
                       className={`h-1.5 rounded-full transition-all duration-500 ${i === bevBannerIndex ? 'w-8 bg-yellow-400' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                     />
                   ))}
                 </div>
              )}
            </div>

           <div className="grid grid-cols-1 gap-6 pt-4">
              {deals.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id || `deal-${i}`}
                  className="bg-zinc-900/40 border border-white/5 rounded-[45px] p-5 flex items-center gap-6 group hover:bg-zinc-900/60 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-2xl relative z-10 border border-white/5">
                     <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                     <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-md">-{item.off}</div>
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                     <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1.5">{item.cat}</p>
                     <h3 className="text-lg font-black tracking-tight mb-4 leading-tight truncate text-white">{item.name}</h3>
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-xl font-black text-yellow-400 leading-none mb-1">R$ {item.price.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="size-10 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-all">
                           <Icon name="add" />
                        </div>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </main>
      </div>
    );
  };

  const renderFlashOffersList = () => {
    // Re-computar activeStories similar ao HomeView para consistÃªncia
    const activeStorieslist = (flashOffers || [])
      .map((offer: any) => {
      const expiresAt = new Date(offer.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const timeLeft = diffHrs > 0 ? `${diffHrs}h` : diffMins > 0 ? `${diffMins}min` : "Expira logo";
      
      let finalPrice = Number(offer.discounted_price);
      if (!finalPrice && offer.original_price && offer.discount_percent) {
          finalPrice = Number(offer.original_price) * (1 - (Number(offer.discount_percent) / 100));
      }
      
      const originalPrice = Number(offer.original_price);
      const merchantData = offer.admin_users || {};

      return {
        id: offer.id,
        merchant: merchantData.store_name || offer.merchant_name || "Izi Partner",
        name: offer.product_name || offer.title || "Oferta Relâmpago",
        finalPrice: finalPrice ? finalPrice.toFixed(2).replace('.', ',') : "Preço sob consulta",
        originalPrice: originalPrice ? originalPrice.toFixed(2).replace('.', ',') : "",
        timeLeft,
        img: offer.product_image || merchantData.store_logo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop",
        isMaster: !!offer.is_vip,
        isOpen: ESTABLISHMENTS.find(e => e.id === offer.merchant_id)?.isOpen ?? true,
        isRedeemed: !!offer.is_redeemed,
        offer,
      };
    });

    return (
      <FlashOffersListView 
        activeStories={activeStorieslist}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        setSelectedItem={setSelectedItem}
        userLevel={userLevel || 0}
        showToast={showToast}
        setShowMasterPerks={setShowMasterPerks}
      />
    );
  };


  const renderRestaurantMenu = () => {
    return (
      <RestaurantMenuView 
        selectedShop={selectedShop}
        setSubView={setSubView}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        handleAddToCart={handleAddToCart}
        handleRemoveOneFromCart={handleRemoveOneFromCart}
        navigateSubView={navigateSubView}
        cart={cart}
        iziCoinRate={Number(globalSettings?.izi_coin_rate || 1.0)}
        iziBlackRate={Number(globalSettings?.izi_black_cashback || 5.0)}
        isIziBlack={isIziBlackMembership}
      />
    );
  };

  const renderLightningPayment = () => {
    const invoice = selectedItem?.lightningInvoice || selectedItem?.lightning_invoice || lightningData?.payment_request || "";
    
    // NormalizaÃ§Ã£o agressiva de cotaÃ§Ã£o
    const btcPrice = Number(
      selectedItem?.btcPrice || 
      selectedItem?.btc_price_brl || 
      lightningData?.btcPrice || 
      lightningData?.btc_price_brl || 
      appSettings?.lastBtcPrice || 
      500000
    );

    return (
      <div className="flex flex-col h-full bg-zinc-950">
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="bg-zinc-900/50 rounded-3xl p-8 border border-white/5 text-center">
             <p className="text-zinc-400 text-sm">
               Pagamento via Lightning: {invoice.slice(0, 32)}...
             </p>
          </div>
        </main>
      </div>
    );
  };

  const renderExperienceExplore = () => {
    let category = '';
    let title = '';
    
    if (subView === 'explore_excursions') { category = 'excursions'; title = 'Excursões'; }
    else if (subView === 'explore_daytrips') { category = 'daytrips'; title = 'Bate e Volta'; }
    else if (subView === 'explore_hotels') { category = 'hotels'; title = 'Hospedagens'; }
    else if (subView === 'explore_nightlife') { category = 'nightlife'; title = 'Noite (Bar)'; }
    else if (subView === 'explore_agenda') { category = 'agenda'; title = 'Agenda Cultural'; }
    else if (subView === 'explore_tours') { category = 'tours'; title = 'Passeios'; }

    if (!category) return null;

    return (
      <ExperienceExploreView
        title={title}
        category={category}
        items={experiencesMockData[category] || []}
        onClose={() => setSubView('none')}
        onSelectItem={(item) => {
           setSelectedExperience(item);
           setSubView('experience_detail');
        }}
      />
    );
  };

  const getServicePresentation = (o: any) => {
    if (!o) return { label: 'Serviço', icon: 'shopping_bag', color: 'text-yellow-400', glow: 'rgba(250,205,5,0.5)', name: 'Pedido', bg: 'bg-yellow-400/10' };
    const type = o.service_type;
    if (['mototaxi', 'carro', 'van'].includes(type)) {
      return { 
        label: type === 'mototaxi' ? 'Mobilidade (Moto)' : 'Mobilidade (Carro)',
        icon: type === 'mototaxi' ? 'two_wheeler' : 'directions_car',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        glow: 'rgba(59,130,246,0.5)',
        name: o.merchant_name || (type === 'mototaxi' ? 'Izi Moto' : 'Izi Car')
      };
    }
    if (type === 'utilitario' || type === 'package' || type === 'frete' || type === 'logistica') {
      return { 
        label: 'Izi Envios',
        icon: 'local_shipping',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        glow: 'rgba(168,85,247,0.5)',
        name: o.merchant_name || 'Entrega de Objeto'
      };
    }
    return { 
      label: 'AlimentaÃ§Ã£o',
      icon: 'restaurant',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      glow: 'rgba(250,205,5,0.5)',
      name: o.merchant_name || 'Pedido'
    };
  };



  const renderPaymentProcessing = () => (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
      <div className="size-20 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-6" />
      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Processando Pagamento</h2>
      <p className="text-zinc-400 mt-2 font-medium">Aguarde um instante, estamos confirmando tudo... âš¡</p>
    </div>
  );





  const handlePurchaseCoins = async (amount: number, method: string, existingOrderId?: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      let orderData: any;

      if (existingOrderId) {
        // Atualizar o mÃ©todo de pagamento de um pedido existente
        const { data: updated, error: updateError } = await supabase
          .from("orders_delivery")
          .update({
            payment_method: method === "lightning" ? "bitcoin_lightning" : method === "pix" ? "pix" : "cartao",
            status: "pendente_pagamento" // Garante que volta para pendente se estava em outro estado
          })
          .eq("id", existingOrderId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        orderData = updated;
      } else {
        // Criar um novo pedido
        const { data: inserted, error: insertError } = await supabase
          .from("orders_delivery")
          .insert({
            user_id: userId,
            status: "pendente_pagamento",
            total_price: amount,
            pickup_address: `Compra de ${amount} IZI COINS`,
            delivery_address: "Recarga de Carteira",
            service_type: "coin_purchase",
            payment_method: method === "lightning" ? "bitcoin_lightning" : method === "pix" ? "pix" : "cartao",
            delivery_fee: 0
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        orderData = inserted;
      }

      setShowDepositModal(false);

      if (method === "cartao") {
        setSelectedItem(orderData);
        setPaymentsOrigin("profile");
        if (selectedCard) {
          handleConfirmSavedCardShortcut(orderData.id, amount, "profile");
          return;
        }
        setSubView("card_payment");
      } else if (method === "lightning") {
        setSubView("payment_processing");
        const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
          body: { amount, orderId: orderData.id, memo: `IZI Coin Deposit - R$ ${amount}` },
        });
        if (lnErr) throw lnErr;
        setSelectedItem({ 
          ...orderData, 
          lightningInvoice: lnData.payment_request, 
          satoshis: lnData.satoshis, 
          btc_price_brl: lnData.btc_price_brl 
        });
        setSubView("lightning_payment");
      } else if (method === "pix") {
        setSelectedItem(orderData);
        setSubView("pix_payment");
      }
    } catch (e: any) {
      toastError("Erro ao processar recarga: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBroadcastPopup = () => (
    <AnimatePresence>
      {activeBroadcast && (
        <motion.div 
          key="broadcast-popup"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            className="w-full max-w-sm bg-[#111] border-2 border-white/5 rounded-[50px] shadow-[30px_30px_60px_rgba(0,0,0,0.6),inset_8px_8px_16px_rgba(255,255,255,0.02)] overflow-hidden flex flex-col relative"
          >
            {/* Header / Imagem */}
            {activeBroadcast.image_url ? (
              <div className="relative w-full h-56">
                <img src={activeBroadcast.image_url} alt="Promo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
              </div>
            ) : (
               <div className="pt-12 pb-4 flex items-center justify-center">
                  <div className="size-20 rounded-[30px] bg-yellow-400 text-black flex items-center justify-center shadow-xl">
                     <span className="material-symbols-outlined text-4xl font-black">campaign</span>
                  </div>
               </div>
            )}

            <div className="px-10 pb-12 pt-6 text-center space-y-6">
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{activeBroadcast.title}</h3>
                 <p className="text-[12px] text-zinc-400 leading-relaxed font-medium">{activeBroadcast.message}</p>
               </div>

               <motion.button 
                 whileTap={{ scale: 0.95 }}
                 onClick={closeBroadcast}
                 className="w-full bg-yellow-400 text-black font-black py-5 rounded-[22px] shadow-xl shadow-yellow-400/10 uppercase tracking-widest text-[10px]"
               >
                 Aproveitar
               </motion.button>
            </div>

            <button 
              onClick={closeBroadcast}
              className="absolute top-6 right-6 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 active:scale-90 transition-all font-black"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderDepositModal = () => {
    const coinRate = appSettings?.iziCoinRate || 1.0;
    const coinsToReceive = (Number(depositAmount) || 0) / coinRate;
    const integerPart = Math.floor(coinsToReceive);
    const fractionalPart = (coinsToReceive - integerPart).toFixed(8).substring(2);
    const isFinishingPayment = selectedItem?.service_type === 'coin_purchase' && selectedItem?.status === 'pendente_pagamento' && showDepositModal;
    
    // Se estiver finalizando, fixa o valor do deposito
    useEffect(() => {
      if (isFinishingPayment && selectedItem) {
        setDepositAmount(selectedItem.total_price.toString());
        setDepositPaymentMethod(selectedItem.payment_method === "bitcoin_lightning" ? "lightning" : selectedItem.payment_method);
      }
    }, [isFinishingPayment, selectedItem?.id]);

    return (
      <AnimatePresence>
        {showDepositModal && (
          <motion.div 
            key="deposit-modal-bg"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <motion.div 
              key="deposit-modal-content"
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className="w-full max-w-lg bg-black border-2 border-white/10 rounded-[40px] shadow-2xl relative max-h-[95vh] flex flex-col overflow-hidden"
            >
              {/* Glow Accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none" />
              
              <header className="shrink-0 px-8 pt-10 pb-6 flex items-center justify-between relative z-50">
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                    {isFinishingPayment ? "Pagar Pedido" : "Izi Store"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="size-1.5 rounded-full bg-yellow-400" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                      {isFinishingPayment ? "Escolha como pagar" : "Recarga InstantÃ¢nea"}
                    </p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowDepositModal(false);
                    if (isFinishingPayment) setSelectedItem(null);
                  }}
                  className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined font-black text-xl">close</span>
                </motion.button>
              </header>

              <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-10 space-y-10 relative z-10">
                {/* Visualizador de Saldo Final */}
                <section className="relative py-12 rounded-[32px] bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center overflow-hidden">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-4">ConversÃ£o Prevista</p>
                      <div className="flex items-baseline justify-center">
                         <span className="text-7xl font-black text-white tracking-tighter tabular-nums">
                           {integerPart.toLocaleString('pt-BR')}
                         </span>
                         <span className="text-2xl font-black text-yellow-400 tracking-tighter ml-1 tabular-nums">
                           ,{fractionalPart.substring(0, 2)}
                         </span>
                         <div className="size-12 ml-4">
                            <img src={iziCoinImg} alt="" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]" />
                         </div>
                      </div>
                   <div className="mt-8 px-6 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                      <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">1 IZI = R$ {coinRate.toFixed(2).replace(".", ",")}</p>
                   </div>
                </section>

                {/* SeleÃ§Ã£o de Valores */}
                {!isFinishingPayment && (
                  <section className="space-y-6">
                    <div className="flex justify-between items-end px-2">
                      <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Escolha o valor</label>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total a Pagar</p>
                         <p className="text-2xl font-black text-yellow-400 tracking-tighter">R$ {Number(depositAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* Predefined Chips */}
                    <div className="grid grid-cols-3 gap-3">
                      {[5, 10, 25, 50, 100, 200].map((val) => (
                        <button
                          key={val}
                          onClick={() => setDepositAmount(val.toString())}
                          className={`h-16 rounded-2xl border-2 font-black text-lg transition-all flex items-center justify-center
                            ${Number(depositAmount) === val 
                              ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/10' 
                              : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20 hover:text-white'}`}
                        >
                          <span className="text-xs mr-1 opacity-60">R$</span>{val}
                        </button>
                      ))}
                    </div>

                    {/* Manual Input */}
                    <div className="relative mt-8">
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-2 pl-8 focus-within:border-yellow-400/50 transition-all">
                         <span className="text-white/20 font-black text-xl">R$</span>
                         <input 
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Outro valor..."
                          className="flex-1 bg-transparent border-none text-2xl font-black text-white outline-none py-6 tabular-nums placeholder:text-white/10"
                        />
                        <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                          <span className="material-symbols-outlined text-white/40 text-2xl font-black">edit</span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {isFinishingPayment && (
                  <div className="py-6 flex flex-col items-center text-center">
                     <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Valor do Pedido</p>
                     <p className="text-4xl font-black text-yellow-400 tracking-tighter">R$ {Number(depositAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}

                {/* MÃ©todos de Pagamento */}
                <section className="space-y-4">
                   <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] px-2">Meio de Pagamento</h3>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'cartao', icon: 'credit_card', label: 'CartÃ£o' },
                        { id: 'pix', icon: 'pix', label: 'Pix' },
                        { id: 'lightning', icon: 'bolt', label: 'Lightning' }
                      ].map((method) => (
                       <button
                         key={method.id}
                         onClick={() => setDepositPaymentMethod(method.id)}
                         className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 active:scale-95
                           ${depositPaymentMethod === method.id 
                             ? "bg-yellow-400 border-yellow-400 text-black shadow-lg" 
                             : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                           }`}
                       >
                         <span className="material-symbols-outlined text-2xl font-black">{method.icon}</span>
                         <span className="text-[9px] font-black uppercase tracking-widest leading-none">{method.label}</span>
                       </button>
                     ))}
                   </div>
                </section>
              </div>

              <footer className="shrink-0 p-8 pt-4 bg-black border-t border-white/10 relative z-20">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!depositAmount || Number(depositAmount) <= 0 || isLoading}
                  onClick={() => handlePurchaseCoins(Number(depositAmount), depositPaymentMethod, isFinishingPayment ? selectedItem?.id : undefined)}
                  className="w-full bg-yellow-400 text-black font-black h-20 rounded-[28px] shadow-xl flex justify-center items-center gap-4 group relative overflow-hidden"
                >
                  {isLoading ? (
                    <div className="size-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="uppercase tracking-[0.4em] text-xs font-black">Confirmar DepÃ³sito</span>
                      <span className="material-symbols-outlined text-2xl font-black group-hover:translate-x-1 transition-transform">rocket_launch</span>
                    </>
                  )}
                </motion.button>
                <div className="flex items-center justify-center gap-3 mt-10 opacity-30">
                   <div className="h-px w-8 bg-zinc-800" />
                   <span className="text-[10px] font-black text-zinc-600 tracking-[0.8em] uppercase">Powered by Izi Pay</span>
                   <div className="h-px w-8 bg-zinc-800" />
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };





  
  const renderDatePicker = () => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      days.push(d);
    }

    return (
      <motion.div key="date-picker-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end justify-center p-4">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-[500px] bg-zinc-900 rounded-[40px] border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white">Escolha a Data</h3>
            <button onClick={() => setShowDatePicker(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto no-scrollbar p-2">
            {days.map((date, i) => {
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = transitData.scheduledDate === dateStr;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setTransitData({ ...transitData, scheduledDate: dateStr });
                    setShowDatePicker(false);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    isSelected ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-zinc-800 border-white/5 text-zinc-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase opacity-60 mb-1">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                  <span className="text-lg font-black">{date.getDate()}</span>
                  <span className="text-[10px] font-black uppercase opacity-60">{date.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderTimePicker = () => {
    const times = [];
    for (let h = 8; h <= 20; h++) {
      times.push(`${h.toString().padStart(2, '0')}:00`);
      times.push(`${h.toString().padStart(2, '0')}:30`);
    }

    return (
      <motion.div key="time-picker-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end justify-center p-4">
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-[500px] bg-zinc-900 rounded-[40px] border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white">Escolha o HorÃ¡rio</h3>
            <button onClick={() => setShowTimePicker(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto no-scrollbar p-2">
            {times.map((time, i) => {
              const isSelected = transitData.scheduledTime === time;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setTransitData({ ...transitData, scheduledTime: time });
                    setShowTimePicker(false);
                  }}
                  className={`py-4 rounded-2xl border font-black transition-all ${
                    isSelected ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-zinc-800 border-white/5 text-zinc-400'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    );
  };



  const BottomNav = () => {
    const navItems = [
      { id: "home", icon: "home", label: "InÃ­cio" },
      { id: "busca", icon: "search", label: "Busca" },
      { id: "wallet", icon: "payments", label: "Izi Pay" },
      { id: "orders", icon: "receipt_long", label: "Pedidos" },
      { id: "profile", icon: "person", label: "Perfil" },
    ];

    return (
      <nav
        className="fixed bottom-0 left-0 z-[1000] flex w-full items-center justify-around bg-white/90 px-2 pt-3 backdrop-blur-xl border-t border-zinc-100"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
          height: "auto",
        }}
      >
        {navItems.map((item, i) => {
          const isActive = (tab === item.id && subView === 'none');

          return (
            <button
              key={item.id || `nav-${i}`}
              onClick={() => {
                setTab(item.id as any);
                setSubView("none");
                window.history.replaceState(
                  { view: "app", tab: item.id, subView: "none" },
                  "",
                );
              }}
              className="relative flex flex-col items-center justify-center flex-1 transition-all active:scale-90 py-1"
            >
              <div className="relative flex flex-col items-center">
                <span
                  className={`material-symbols-rounded text-[26px] transition-all duration-300 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>

                {/* Feedback Visual de Pedidos Ativos */}
                {item.id === 'orders' && activeOrdersCount > 0 && (
                  <div className="absolute -top-1 -right-1 size-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-white leading-none">{activeOrdersCount}</span>
                  </div>
                )}
                
                <span
                  className={`mt-1 text-[10px] font-bold transition-all duration-300 ${
                    isActive ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 size-1 bg-yellow-400 rounded-full"
                  />
                )}
              </div>
            </button>
          );
        })}
      </nav>
    );
  };

  const isMobilityActive = ["taxi_wizard", "freight_wizard", "van_wizard", "logistics_tracking", "active_order"].includes(subView);
  
  const mobilityProps = {
    transitData,
    setTransitData,
    mobilityStep,
    setMobilityStep,
    routePolyline,
    routeDistance,
    driverLocation,
    distancePrices,
    distanceValueKm,
    marketConditions,
    isCalculatingPrice,
    calculateVanPrice,
    handleConfirmMobility,
    calculateDynamicPrice,
    updateLocation,
    userLocation
  };

  return (
    <>
      <div className={`${isMobilityActive ? "h-screen overflow-hidden" : "min-h-screen"} bg-black selection:bg-yellow-400/30`}>
        <AnimatePresence mode="wait">
          {view === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
              <div className="relative">
                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity }} className="size-24 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-yellow-400 tracking-tighter">IZI</span>
                </div>
              </div>
              <p className="mt-8 text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Carregando ExperiÃªncia</p>
            </motion.div>
          )}

          {view === "login" && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <LoginView loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} authMode={authMode} setAuthMode={setAuthMode} handleLogin={handleLogin} handleSignUp={handleSignUp} isLoading={isLoading} loginError={loginError} setLoginError={setLoginError} phone={phone} setPhone={setPhone} userName={userName} setUserName={setUserName} rememberMe={rememberMe} setRememberMe={setRememberMe} />
            </motion.div>
          )}

          {view === "app" && (
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen relative overflow-hidden bg-black">
              
              {/* Barra Superior Flutuante Minimalista */}
              <AnimatePresence>
                {subView === "none" && (
                  <FloatingHeader 
                    userAddress={userLocation?.address || ""}
                    cartLength={cart.length}
                    onAddressClick={() => setSubView("addresses")}
                    onCartClick={() => setSubView("cart")}
                    onNotificationsClick={() => setSubView("notifications_center")}
                    hasUnreadNotifications={unreadCount > 0}
                  />
                )}
              </AnimatePresence>

              <AddressDrawer 
                isOpen={isAddressDrawerOpen} 
                onClose={() => setIsAddressDrawerOpen(false)} 
              />

              <AnimatePresence mode="wait">
                {tab === "home" && (
                  <motion.div key="home-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <HomeView 
                      userLevel={userLevel} 
                      userId={userId} 
                      userLocation={userLocation} 
                      isIziBlackMembership={isIziBlackMembership}
                      cart={cart} 
                      myOrders={orders} 
                      navigateSubView={navigateSubView} 
                      setSubView={setSubView} 
                      subView={subView} 
                      searchQuery={searchQuery} 
                      setSearchQuery={setSearchQuery} 
                      setSelectedItem={setSelectedItem} 
                      onOpenDepositModal={() => setShowDepositModal(true)}
                      onReturnToPayment={(order) => {
                        setSelectedItem(order);
                        setShowDepositModal(true);
                      }}
                      onOpenCoinTracking={(order) => {
                        setSelectedItem(order);
                        setSubView("izi_coin_tracking");
                      }}
                      availableCoupons={availableCoupons.filter((c: any) => c.coupon_code)} 
                      banners={availableCoupons.filter((c: any) => !c.coupon_code)} 
                      copiedCoupon={copiedCoupon} 
                      setCopiedCoupon={setCopiedCoupon} 
                      showToast={showToast} 
                      setShowMasterPerks={setShowMasterPerks} 
                      ESTABLISHMENTS={ESTABLISHMENTS} 
                      handleShopClick={handleShopClick} 
                      flashOffers={flashOffers} 
                      setActiveService={setActiveService} 
                      onRefresh={handleGlobalRefresh}
                      transitData={transitData} 
                      setTransitData={setTransitData} 
                      setExploreCategoryState={setExploreCategoryState} 
                      setRestaurantInitialCategory={setRestaurantInitialCategory} 
                      setTab={setTab} 
                      establishmentTypes={establishmentTypes}
                      appSettings={appSettings}
                    />
                  </motion.div>
                )}
                {tab === "orders" && (
                  <motion.div key="orders-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                      <OrderListView 
                        myOrders={orders} 
                        userId={userId} 
                        setSubView={setSubView} 
                        setSelectedItem={setSelectedItem} 
                        navigateSubView={navigateSubView} 
                        fetchMyOrders={fetchOrders} 
                        tab={tab} 
                        onOpenCoinTracking={(order) => {
                          setSelectedItem(order);
                          setSubView("izi_coin_tracking");
                        }}
                      />
                  </motion.div>
                )}
                {tab === "wallet" && (
                  <motion.div key="wallet-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                     <IziPayView 
                       walletTransactions={walletTransactions} 
                       iziCoins={iziCoins}
                       userName={userName}
                       userId={userId}
                       walletBalance={walletBalance || 0}
                       onBack={() => setTab("home")}
                     />
                  </motion.div>
                )}
                {tab === "profile" && (
                  <motion.div key="profile-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                     <ProfileView userId={userId} userName={userName} userLevel={userLevel} userXP={userXP} setSubView={setSubView} logout={logout} setTab={setTab} isIziBlackMembership={isIziBlackMembership} />
                  </motion.div>
                )}
                {tab === "busca" && (
                  <motion.div key="busca-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                     <SearchView onCategoryClick={(cat) => navigateSubView(cat + "_list")} onSearch={(q) => setSearchQuery(q)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {subView === "cart" && (
                  <motion.div key="cartv" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    <CartView 
                      cart={cart} 
                      setCart={setCart}
                      handleClearCart={handleClearCart}
                      setSubView={(v: any) => setSubView(v)} 
                      navigateSubView={navigateSubView}
                      merchantProducts={selectedShop?.products || []}
                      merchantName={selectedShop?.name || ""}
                      handleAddToCart={handleAddToCart}
                      isIziBlack={isIziBlackMembership} 
                      deliveryFee={currentDeliveryFee} 
                      iziBlackRate={appSettings?.izi_black_cashback || 5}
                      iziCoinRate={isIziBlackMembership ? (globalSettings?.izi_coin_rate || 1) : 0}                    />
                  </motion.div>
                )}
                {subView === "checkout" && (
                  <motion.div key="check" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[130]">
                    <CheckoutView 
                      cart={cart} 
                      appliedCoupon={appliedCoupon} 
                      walletTransactions={walletTransactions} 
                      savedCards={savedCards} 
                      userId={userId} 
                      userLocation={userLocation} 
                      paymentMethod={paymentMethod} 
                      setPaymentMethod={(m: any) => setPaymentMethod(m)} 
                      iziCoinRate={isIziBlackMembership ? (globalSettings?.izi_coin_rate || 1.0) : 0}
                      changeFor={changeFor} 
                      setChangeFor={setChangeFor} 
                      selectedCard={selectedCard} 
                      setSelectedCard={setSelectedCard} 
                      couponInput={couponInput} 
                      setCouponInput={setCouponInput} 
                      handleApplyCoupon={handleApplyCoupon} 
                      setAppliedCoupon={setAppliedCoupon} 
                      handlePlaceOrder={handlePlaceOrder} 
                      setPaymentsOrigin={setPaymentsOrigin} 
                      setSubView={(v: any) => setSubView(v)} 
                      iziCoins={iziCoins} 
                      iziCoinValue={globalSettings?.izi_coin_value || globalSettings?.iziCoinRate || 1.0} 
                      deliveryFee={currentDeliveryFee} 
                      isIziBlack={isIziBlackMembership}
                      walletBalance={walletBalance}
                      isShopOpen={selectedShop ? isStoreOpen(selectedShop.opening_hours, selectedShop.is_open, selectedShop.opening_mode) : true}
                      shopName={selectedShop?.name || "Izi Delivery"}
                    />
                  </motion.div>
                )}

                {/* Views de Lista e Categorias */}
                {["daily_menus", "generic_list"].includes(subView) && (
                  <motion.div key="category-list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    <CategoryListView onShopClick={handleShopClick} />
                  </motion.div>
                )}

                {["explore_excursions", "explore_daytrips", "explore_hotels", "explore_nightlife", "explore_agenda", "explore_tours"].includes(subView) && (
                  <motion.div key="exp-explore" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    {renderExperienceExplore()}
                  </motion.div>
                )}

                {subView === "explore_bars" && (
                  <motion.div key="explore-bars" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <ExploreBarsView onBack={() => setSubView("none")} onBarClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {subView === "explore_restaurants" && (
                  <motion.div key="explore-restaurants" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <ExploreRestaurantsView 
                      setSubView={setSubView}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      cart={cart}
                      navigateSubView={navigateSubView}
                      foodCategories={establishmentTypes.filter(t => t.is_food)}
                      availableCoupons={availableCoupons}
                      establishments={ESTABLISHMENTS}
                      onShopClick={handleShopClick}
                      copiedCoupon={copiedCoupon}
                      setCopiedCoupon={setCopiedCoupon}
                      initialCategory={restaurantInitialCategory}
                      isIziBlackMembership={isIziBlackMembership}
                      flashOffers={flashOffers}
                    />
                  </motion.div>
                )}

                {(subView === "explore_pharmacy" || subView === "pharmacy_list") && (
                  <motion.div key="explore-pharmacy" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <PharmacyExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {(subView === "explore_beverages" || subView === "beverages_list") && (
                  <motion.div key="explore-beverages" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <BeverageExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {(subView === "explore_market" || subView === "market_list") && (
                  <motion.div key="explore-market" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <NewMarketExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {(subView === "explore_petshop" || subView === "pets_list") && (
                  <motion.div key="explore-petshop" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <PetshopExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {subView === "explore_gas" && (
                  <motion.div key="explore-gas" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <GasWaterExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {subView === "explore_bakery" && (
                  <motion.div key="explore-bakery" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <BakeryExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {subView === "explore_fruit" && (
                  <motion.div key="explore-fruit" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                    <FruitExploreView onBack={() => setSubView("none")} onShopClick={handleShopClick} exploreBanners={exploreBanners} />
                  </motion.div>
                )}

                {subView === "explore_category" && (
                  <motion.div key="explore-cat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    {renderExploreCategory()}
                  </motion.div>
                )}

                {subView === "restaurant_menu" && (
                  <motion.div key="rest-menu" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[150]">
                    {renderRestaurantMenu()}
                  </motion.div>
                )}

                {subView === "flash_offers" && (
                  <motion.div key="flash_list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[150]">
                    {renderFlashOffersList()}
                  </motion.div>
                )}

                {subView === "exclusive_offer" && (
                  <motion.div key="exclusive_v" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="absolute inset-0 z-[160]">
                    {renderExclusiveOffer()}
                  </motion.div>
                )}

                {subView === "explore_envios" && (
                  <motion.div key="exp_envios" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    <ExploreEnviosUberView />
                  </motion.div>
                )}

                {subView === "explore_izi_envios" && (
                  <motion.div key="exp_izi_envios" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    <ExploreIziEnviosView 
                      onBack={() => setSubView("none" as any)} 
                      navigateSubView={navigateSubView} 
                      setTransitData={setTransitData} 
                    />
                  </motion.div>
                )}

                {subView === "explore_turbo_flash" && (
                  <motion.div key="exp_turbo" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                    <ExploreTurboFlashView transitData={transitData} setTransitData={setTransitData} onBack={() => setSubView("explore_envios")} />
                  </motion.div>
                )}

                {subView === "explore_light_flash" && (
                  <motion.div key="exp_light" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                    <ExploreLightFlashView transitData={transitData} setTransitData={setTransitData} onBack={() => setSubView("explore_envios")} />
                  </motion.div>
                )}

                {subView === "explore_express" && (
                  <motion.div key="exp_express" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                    <ExploreExpressView transitData={transitData} setTransitData={setTransitData} onBack={() => setSubView("explore_envios")} />
                  </motion.div>
                )}

                {subView === "explore_scheduled" && (
                  <motion.div key="exp_sched" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                    <ExploreScheduledView transitData={transitData} setTransitData={setTransitData} onBack={() => setSubView("explore_envios")} />
                  </motion.div>
                )}

                {subView === "scheduled_checkout" && (
                  <motion.div key="scheduled_checkout" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.45 }} className="absolute inset-0 z-[170]">
                    <ScheduledCheckoutView
                      transitData={transitData}
                      setTransitData={setTransitData}
                      userId={userId}
                      showToast={showToast}
                      onBack={() => setSubView("explore_izi_envios")}
                    />
                  </motion.div>
                )}

                {subView === "explore_click_collect" && (
                  <motion.div key="exp_click" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                    <ExploreClickCollectView transitData={transitData} setTransitData={setTransitData} onBack={() => setSubView("explore_envios")} />
                  </motion.div>
                )}

                {(subView === "product" || subView === "product_detail") && (
                  <motion.div key="product_detail" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[130]">
                    <ProductDetailView />
                  </motion.div>
                )}

                {subView === "experience_detail" && selectedExperience && (
                  <motion.div key="exp_detail" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[170]">
                    <ExperienceDetailView 
                      item={selectedExperience} 
                      onBack={() => setSubView('explore_' + selectedExperience.category as any)} 
                      onConfirmReservation={(res) => {
                        setPendingReservation(res);
                        setSubView('experience_checkout');
                      }}
                    />
                  </motion.div>
                )}

                {subView === "experience_checkout" && pendingReservation && (
                  <motion.div key="exp_checkout" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[180]">
                    <ExperienceCheckoutView 
                      reservation={pendingReservation}
                      walletBalance={iziCoins}
                      onBack={() => setSubView('experience_detail')}
                      onPay={(method) => {
                        showToast(`Reserva confirmada via ${method}!`, "success");
                        setSubView('none');
                        // Aqui entraria a lógica real de processamento e desconto de saldo
                      }}
                    />
                  </motion.div>
                )}

                {subView === "order_detail" && (
                  <motion.div key="odetail" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                     <OrderDetailView order={selectedItem} onBack={() => setSubView("none")} onSupport={() => setSubView("order_support")} />
                  </motion.div>
                )}

                {subView === "izi_coin_tracking" && (
                  <motion.div key="izicointrack" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                     <IziCoinTrackingView 
                        order={selectedItem} 
                        onClose={() => setSubView("none")} 
                        onGoToWallet={() => { setSubView("none"); setTab("wallet"); }} 
                        onCancel={handleCancelCoinOrder} 
                        onSupport={() => setSubView("order_support")} 
                      />
                  </motion.div>
                )}

                {subView === "addresses" && (
                  <motion.div key="addres" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                    <AddressListView />
                  </motion.div>
                )}

                {subView === "payments" && (
                  <motion.div key="payments" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                    <PaymentMethodsView />
                  </motion.div>
                )}

                {subView === "wallet_internal" && (
                  <motion.div key="wallet" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                    <WalletView />
                  </motion.div>
                )}

                {subView === "quest_center" && (
                  <motion.div key="quests" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[190]">
                    <QuestCenterView />
                  </motion.div>
                )}

                {subView === "notifications_center" && (
                  <motion.div key="notifcenter" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    <NotificationsCenterView onBack={() => setSubView("none")} />
                  </motion.div>
                )}

                {["izi_black_card", "izi_black_purchase"].includes(subView) && (
                  <motion.div key="iziblackv" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="absolute inset-0 z-[180]">
                    <IziBlackView />
                  </motion.div>
                )}

                {isAIOpen && (
                  <motion.div key="ai-concierge" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="fixed inset-0 z-[160]">
                    <AIConciergeView />
                  </motion.div>
                )}

                {/* Mobilidade */}
                {["taxi_wizard", "freight_wizard", "van_wizard", "mobility_payment", "excursion_wizard", "excursion_detail"].includes(subView) && (
                  <motion.div key="mobility-wizard" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[115]">
                    <MobilityWizardView {...mobilityProps} />
                  </motion.div>
                )}
                {subView === "logistics_tracking" && (
                  <motion.div key="ltrack" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[160]">
                    <LogisticsTrackingView 
                       order={selectedItem}
                       userLocation={userLocation as any}
                       driverLocation={driverLocation}
                       onBack={() => window.history.back()}
                       onUpdateLocation={updateLocation}
                    />
                  </motion.div>
                )}
                {subView === "active_order" && (
                  <motion.div key="aorder" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[100]">
                    <ActiveOrderView selectedItem={selectedItem} driverLocation={driverLocation} userLocation={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} routePolyline={routePolyline || selectedItem?.route_polyline} onMyLocationClick={updateLocation} setSubView={setSubView} onCancelOrder={handleCancelOrder} />
                  </motion.div>
                )}

                {/* Status de Pagamento e Pedido */}
                {/* Fluxo de Pagamento e Checkout */}
                {["payment_processing", "payment_error", "payment_success", "mobility_payment_success", "pix_payment", "lightning_payment", "card_payment"].includes(subView) && (
                  <motion.div key="payment-flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                    <PaymentFlowView />
                  </motion.div>
                )}

                {subView === "waiting_payment" && (
                  <motion.div key="wait_pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200]">
                    <OrderWaitingView type="payment" />
                  </motion.div>
                )}

                {subView === "waiting_merchant" && (
                  <motion.div key="wait_merch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200]">
                    <OrderWaitingView type="merchant" />
                  </motion.div>
                )}

                {/* Status de Pedido e Loja */}
                {["waiting_merchant", "waiting_driver", "scheduled_order"].includes(subView) && (
                  <motion.div key="order-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                    <OrderStatusView />
                  </motion.div>
                )}

                {/* Suporte, Chat e Feedback */}
                {subView === "order_support" && (
                  <motion.div key="osupport" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                    <OrderSupportView />
                  </motion.div>
                )}
                {subView === "order_chat" && (
                  <motion.div key="ochat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                    <OrderSupportView />
                  </motion.div>
                )}
                {subView === "order_feedback" && (
                  <motion.div key="ofeedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[160]">
                    <OrderFeedbackView />
                  </motion.div>
                )}


              </AnimatePresence>

              {subView === "none" && <BottomNav />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Animations */}
        <AnimatePresence>
          {cartAnimations.map((anim, i) => (
            <motion.img
              key={anim.id || `anim-${i}`}
              src={anim.img || ""}
              initial={{ x: anim.x - 30, y: anim.y - 30, scale: 0.8, opacity: 1 }}
              animate={{ 
                x: window.innerWidth / 2 - 30,
                y: window.innerHeight - 80,
                scale: 0.1,
                opacity: 0,
                rotate: 360
              }}
              transition={{
                duration: 0.8,
                ease: [0.175, 0.885, 0.32, 1.275]
              }}
              className="fixed z-[9999] size-16 object-cover rounded-full shadow-2xl border-2 border-primary pointer-events-none"
            />
          ))}
        </AnimatePresence>

        {renderBroadcastPopup()}

        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast-notification"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-[400px]"
            >
              <div className={`px-6 py-4 rounded-[25px] border backdrop-blur-xl flex items-center gap-4 shadow-2xl ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-900/90 border-white/10'}`}>
                <div className={`size-10 rounded-xl flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'}`}>
                  <span className="material-symbols-outlined text-xl">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showDatePicker && renderDatePicker()}
          {showTimePicker && renderTimePicker()}
        </AnimatePresence>

        <AnimatePresence>
          {showSplash && (
            <SplashScreenComponent key="splash-screen" finishLoading={() => setShowSplash(false)} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;







