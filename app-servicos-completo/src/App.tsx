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
import { AddressSearchInput } from "./components/features/Address/AddressSearchInput";
import { AIConciergePanel } from "./components/features/AI/AIConciergePanel";
import { IziTrackingMap } from "./components/features/Map/IziTrackingMap";
import { LoginView } from "./components/features/Auth/LoginView";
import { HomeView } from "./components/features/Home/HomeView";
import { OrderListView } from "./components/features/Order/OrderListView";
import { ProfileView } from "./components/features/Profile/ProfileView";
import { WalletView } from "./components/features/Wallet/WalletView";
import { CartView } from "./components/features/Cart/CartView";
import { CheckoutView } from "./components/features/Checkout/CheckoutView";
import { ActiveOrderView } from "./components/features/Order/ActiveOrderView";
import { IziCoinTrackingView } from "./components/features/Order/IziCoinTrackingView";
import { EstablishmentListView } from "./components/features/Establishment/EstablishmentListView";
import { ExploreRestaurantsView } from "./components/features/Home/ExploreRestaurantsView";
import { BeverageOffersView } from "./components/features/Home/BeverageOffersView";
import { RestaurantMenuView } from "./components/features/Home/RestaurantMenuView";
import { MarketExploreView } from "./components/features/Home/MarketExploreView";
import { PaymentMethodsView } from "./components/features/Profile/PaymentMethodsView";
import { FlashOffersListView } from "./components/features/FlashOffersListView";

// Mobilidade e Envios
import { TaxiWizard } from "./components/features/Mobility/TaxiWizard";
import { VanWizard } from "./components/features/Mobility/VanWizard";
import { ExcursionWizard } from "./components/features/Excursions/ExcursionWizard";
import { LogisticsTrackingView } from "./components/features/Mobility/LogisticsTrackingView";
import { FreightWizard } from "./components/features/Mobility/FreightWizard";
import { MobilityPaymentView } from "./components/features/Mobility/MobilityPaymentView";
import SplashScreenComponent from "./components/common/SplashScreen";
import { SplashScreen as CapacitorSplash } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from '@capacitor/push-notifications';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import { useAuth } from "./hooks/useAuth";
import type { SavedAddress, Order, Quest } from "./types";

// Componentes agora em arquivos separados

function App() {
  const [view, setView] = useState<"login" | "app" | "loading">("loading");
  const [tab, setTab] = useState<"home" | "orders" | "wallet" | "profile">(
    "home",
  );

      // [Comentario Limpo pelo Sistema]
  useGoogleMapsLoader();
  
  const {
    user,
    userId,
    userName,
    setUserName,
    phone,
    setPhone,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    authMode,
    setAuthMode,
    isLoading,
    loginError,
    setLoginError,
    authInitLoading,
    setAuthInitLoading,
    handleLogin,
    handleSignUp,
    setIsLoading,
    logout,
    isAdmin
  } = useAuth();

  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [shopRating, setShopRating] = useState<number>(0);
  const [driverRating, setDriverRating] = useState<number>(0);
  const [fbComment, setFbComment] = useState<string>("");
  const [fbIsSubmitting, setFbIsSubmitting] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPixCode, setDepositPixCode] = useState("");
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<"cartao" | "lightning" | "pix">("cartao");
  const [cartAnimations, setCartAnimations] = useState<{id: string, x: number, y: number, img: string}[]>([]);

  const triggerCartAnimation = (e: React.MouseEvent, img: string) => {
    const id = Date.now().toString() + Math.random();
    setCartAnimations(prev => [...prev, { id, x: e.clientX, y: e.clientY, img }]);
    setTimeout(() => {
      setCartAnimations(prev => prev.filter(a => a.id !== id));
    }, 800);
  };

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Timer de segurança redundante no App.tsx
    const safetyTimer = setTimeout(() => {
      setShowSplash(false);
      if (Capacitor.isNativePlatform()) {
        CapacitorSplash.hide();
      }
    }, 5000);
    return () => clearTimeout(safetyTimer);
  }, []);

  const [subView, setSubView] = useState<
    | "none"
    | "explore_restaurants"
    | "market_list"
    | "pharmacy_list"
    | "restaurant_menu"
    | "product_detail"
    | "checkout"
    | "active_order"
    | "addresses"
    | "payments"
    | "transit_selection"
    | "taxi_wizard"
    | "excursion_wizard"
    | "freight_wizard"
    | "generic_list"
    | "wallet"
    | "payment_processing"
    | "payment_error"
    | "payment_success"
    | "cart"
    | "store_catalog"
    | "all_pharmacies"
    | "health_plantao"
    | "daily_menus"
    | "exclusive_offer"
    | "shipping_details"
    | "beverages_list"
    | "beverage_offers"
    | "explore_category"
    | "explore_envios"
    | "pix_payment"
    | "order_chat"
    | "quest_center"
    | "notifications_center"
    | "order_support"
    | "order_feedback"
    | "mobility_payment"
    | "waiting_merchant"
    | "waiting_driver"
    | "scheduled_order"
    | "lightning_payment"
    | "shipping_priority"
    | "izi_black_purchase"
    | "card_payment"
    | "izi_coin_tracking"
    | "flash_offers_list"
  >("none");

  // Reset scroll on subView change
  useEffect(() => {
    if (subView !== "none") {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }
  }, [subView]);

  const previousSubViewRef = useRef<string>("none");
  const [iziBlackOrigin, setIziBlackOrigin] = useState<"home" | "checkout">("home");
  const [iziBlackStep, setIziBlackStep] = useState<"info" | "payment" | "pix_qr" | "success">("info");
  const [iziBlackPixCode, setIziBlackPixCode] = useState("");
  const [isUsingCoins, setIsUsingCoins] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);
  const [email, setEmail] = useState("");


  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string; expirationDate: string } | null>(null);
  const [lightningData, setLightningData] = useState<{ payment_request: string; satoshis: number; btc_price_brl: number } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };
  const toastError = (message: string) => showToast(message, 'error');

  // --- Izi Elite Client Features ---
  const [userXP, setUserXP] = useState(0);
  const [iziCoins, setIziCoins] = useState(0);
  const [userLevel] = useState(12);
  const [nextLevelXP] = useState(2500);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [schedObsState, setSchedObsState] = useState('');
  const [schedChatInputState, setSchedChatInputState] = useState('');
  const [schedMessagesState, setSchedMessagesState] = useState<{id: string; text: string; from: 'user'|'driver'; time: string}[]>([]);
  const [isSavingObsState, setIsSavingObsState] = useState(false);
  const [aiMessage, setAiMessage] = useState("Olá! Sou seu assistente Izi. Percebi que você gosta de culinária japonesa. Que tal conferir as ofertas do Sushi Zen?");
  const [isIziBlackMembership, setIsIziBlackMembership] = useState(false);
  const [iziCashbackEarned, setIziCashbackEarned] = useState(0);
  const [showIziBlackCard, setShowIziBlackCard] = useState(false);
  const [showIziBlackWelcome, setShowIziBlackWelcome] = useState(false);
  const [showMasterPerks, setShowMasterPerks] = useState(false);
  const [activePerkDetail, setActivePerkDetail] = useState<string | null>(null);
  const [flashOffers, setFlashOffers] = useState<any[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>(null);

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('admin_settings_delivery')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle();
      if (data) setGlobalSettings(data);

      const { data: appData } = await supabase
        .from('app_settings_delivery')
        .select('*')
        .single();
      if (appData) setAppSettings(appData);
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
    }
  }, []);

  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);



// Fetch payment methods when entering payments screen




  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isShowingMyQR, setIsShowingMyQR] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [newCardData, setNewCardData] = useState({ number: "", expiry: "", cvv: "", brand: "Visa" });
  const [paymentsOrigin, setPaymentsOrigin] = useState<"checkout" | "profile" | "izi_black">("profile");

  const fetchSavedCards = async (uid: string) => {
    if (!uid) return;
    setIsLoadingCards(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    if (!error && data) {
      const cards = data.map((c: any) => ({
        id: c.id,
        brand: c.brand,
        last4: c.last_four,
        mp_token: c.token,
        active: c.is_default,
        color: c.brand === "Visa"
          ? "linear-gradient(135deg, #2563eb, #1e40af)"
          : c.brand === "Amex"
            ? "linear-gradient(135deg, #047857, #065f46)"
            : "linear-gradient(135deg, #1e293b, #0f172a)",
      }));
      setSavedCards(cards);
      // [Comentario Limpo pelo Sistema]
      const defaultCard = cards.find((c: any) => c.active);
      if (defaultCard) {
        setPaymentMethod("cartao");
        setSelectedCard(defaultCard);
      }
    }
    setIsLoadingCards(false);
  };
  const handleSetPrimaryCard = async (cardId: string) => {
    if (!userId) return;
    await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("payment_methods").update({ is_default: true }).eq("id", cardId);
    setSavedCards((prev: any[]) => prev.map((c: any) => ({ ...c, active: c.id === cardId })));
    setPaymentMethod("cartao");
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!userId) return;
    if (await showConfirm({ message: "Remover este cartão?" })) {
      await supabase.from("payment_methods").delete().eq("id", cardId).eq("user_id", userId);
      const updated = savedCards.filter((c: any) => c.id !== cardId);
      setSavedCards(updated);
      const wasActive = savedCards.find((c: any) => c.id === cardId)?.active;
      if (wasActive && updated.length > 0) {
        await handleSetPrimaryCard(updated[0].id);
      } else if (updated.length === 0) {
        setPaymentMethod("pix");
      }
    }
  };

  const fetchSavedAddresses = async (uid: string) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    if (!error && data) {
      const addresses = data.map((addr: any) => ({
        id: addr.id,
        label: addr.label,
        street: addr.street,
        details: addr.details,
        city: addr.city,
        active: addr.is_active,
      }));
      setSavedAddresses(addresses);
      // [Comentario Limpo pelo Sistema]
      const active = addresses.find(a => a.active);
      if (active) {
        setUserLocation(prev => ({ ...prev, address: active.street }));
      }
    }
  };
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(
    null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrDetails, setNewAddrDetails] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const resetAddressForm = () => {
    setNewAddrLabel(''); setNewAddrStreet(''); setNewAddrDetails(''); setNewAddrCity('');
    setEditingAddress(null); setIsAddingAddress(false);
  };

  const openEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setNewAddrLabel(addr.label || '');
    setNewAddrStreet(addr.street || '');
    setNewAddrDetails(addr.details || '');
    setNewAddrCity(addr.city || '');
    setIsAddingAddress(true);
  };

  const handleSaveAddress = async () => {
    if (!userId) return;
    if (!newAddrLabel.trim() || !newAddrStreet.trim()) {
      toastError('Preencha pelo menos o rótulo e a rua.');
      return;
    }
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        const { error } = await supabase.from('saved_addresses').update({
          label: newAddrLabel.trim(),
          street: newAddrStreet.trim(),
          address: newAddrStreet.trim(),
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
        }).eq('id', editingAddress.id);
        if (error) throw error;
        toastSuccess('Endereço atualizado!');
      } else {
        const { error } = await supabase.from('saved_addresses').insert({
          user_id: userId,
          label: newAddrLabel.trim(),
          street: newAddrStreet.trim(),
          address: newAddrStreet.trim(),
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
          is_active: savedAddresses.length === 0,
        });
        if (error) throw error;
        toastSuccess('Endereço salvo com sucesso!');
      }
      resetAddressForm();
      fetchSavedAddresses(userId);
    } catch (e) {
      toastError('Erro ao salvar: ' + e.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('saved_addresses').delete().eq('id', addrId);
      if (error) throw error;
      toastSuccess('Endereço removido.');
      fetchSavedAddresses(userId);
    } catch (e) {
      toastError('Erro ao remover: ' + e.message);
    }
  };

  const handleSetActiveAddress = async (addrId) => {
    if (!userId) return;
    try {
      await supabase.from('saved_addresses').update({ is_active: false }).eq('user_id', userId);
      const { error } = await supabase.from('saved_addresses').update({ is_active: true }).eq('id', addrId);
      if (error) throw error;
      toastSuccess('Endereço padrão atualizado!');
      fetchSavedAddresses(userId);
    } catch (e) {
      toastError('Erro ao definir endereço: ' + e.message);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchFlashOffers();
    fetchGlobalSettings();
    fetchBeveragePromo();
    const interval = setInterval(fetchMarketData, 20000);
    const flashChannel = supabase.channel('flash_offers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_offers' }, fetchFlashOffers)
      .subscribe();

    const settingsChannel = supabase.channel('settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings_delivery' }, fetchGlobalSettings)
      .subscribe();

    // In-App Broadcaster (Popups Administrativos)
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
        const lastSeen = localStorage.getItem('last_izi_broadcast');
        if (lastSeen !== data[0].id) {
          setActiveBroadcast(data[0]);
        }
      }
    };

    initBroadcasts();

    const broadcastSub = supabase
      .channel('broadcast-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' }, (payload) => {
        const notif = payload.new;
        if ((notif.type === 'popup' || notif.type === 'both') && (notif.target_type === 'all' || notif.target_type === 'users')) {
           setActiveBroadcast(notif);
        }
      })
      .subscribe();

    // Sincronizacao em tempo real do Perfil do Usuario (Wallet, IZI Black, etc)
    let userProfileSub: any = null;
    if (userId) {
      userProfileSub = supabase
        .channel(`user_sync_${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users_delivery', filter: `id=eq.${userId}` },
          (payload) => {
            console.log("[REALTIME] Perfil do usuário atualizado:", payload.new);
            const data = payload.new as any;
            if (data) {
              setWalletBalance(data.wallet_balance || 0);
              setIsIziBlackMembership(data.is_izi_black || false);
              setIziCashbackEarned(data.cashback_earned || 0);
              setUserXP(data.user_xp || 0);
              setIziCoins(data.izi_coins || 0);
              setProfileCpf(data.cpf || "");
            }
          }
        )
        .subscribe();
    }

    // Sincronização em tempo real das Transações da Carteira
    let walletTxSub: any = null;
    if (userId) {
      walletTxSub = supabase
        .channel(`wallet_tx_sync_${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${userId}` },
          (payload) => {
            console.log("[REALTIME] Nova transação detectada:", payload.new);
            setWalletTransactions(prev => [payload.new, ...prev].slice(0, 50));
          }
        )
        .subscribe();
    }



    return () => {
      clearInterval(interval);
      supabase.removeChannel(flashChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(broadcastSub);
      if (userProfileSub) supabase.removeChannel(userProfileSub);
      if (walletTxSub) supabase.removeChannel(walletTxSub);
    };
  }, [userId]);

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

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('[PUSH] Token registrado:', token.value);
          await supabase
            .from('users_delivery')
            .update({ push_token: token.value })
            .eq('id', userId);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PUSH] Recebida:', notification);
          showToast(`${notification.title}: ${notification.body}`, 'info');
        });

      } catch (err) {
        console.error('[PUSH] Falha na configuracao:', err);
      }
    };

    setupPush();

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
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

  const fetchWalletBalance = async (uid: string) => {
    if (!uid) return;
    try {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("wallet_balance, is_izi_black, cashback_earned, user_xp, izi_coins, cpf")
        .eq("id", uid)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWalletBalance(data.wallet_balance || 0);
        setIsIziBlackMembership(data.is_izi_black || false);
        setIziCashbackEarned(data.cashback_earned || 0);
        setUserXP(Number(data.user_xp || 0));
        setIziCoins(Number(data.izi_coins || 0));
        setProfileCpf(data.cpf || "");
      } else {
        console.log("[SYNC] Perfil não encontrado. Criando registro inicial...");
        await supabase.from("users_delivery").insert({
          id: uid,
          name: userName || "Usuário Izi",
          wallet_balance: 0,
          izi_coins: 0,
          user_xp: 0
        });
      }

      // Buscar transacoes reais
      const { data: txData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);
      if (txData) setWalletTransactions(txData);
    } catch (err) {
      console.error("Erro ao buscar carteira:", err);
    }
  };

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

  const updateLocation = (onSuccess?: (address: string) => void) => {
    setUserLocation((prev) => ({ ...prev, loading: true }));

    const processCoords = async (latitude: number, longitude: number) => {
      try {
        let address = "";

        // Tenta reverse geocode via Google Maps Geocoder (browser)
        if ((window as any).google?.maps) {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          });
          if (response.results[0]) {
            address = response.results[0].formatted_address;
          }
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
            }
          } catch { /* silent */ }
        }

        // Fallback: Nominatim (OpenStreetMap)
        if (!address) {
          const nomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const nomData = await nomRes.json();
          address = nomData.display_name?.split(",").slice(0, 3).join(",").trim() || "Localização atual";
        }

        setUserLocation({ address, loading: false, lat: latitude, lng: longitude });
        setTransitData((prev) => ({ ...prev, origin: address }));
        if (onSuccess) onSuccess(address);
      } catch {
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
              timeout: 10000,
            });
            await processCoords(pos.coords.latitude, pos.coords.longitude);
          } else {
            setUserLocation({ address: "Permissão de localização negada", loading: false });
          }
        } catch {
          setUserLocation({ address: "Erro ao obter localização", loading: false });
        }
      })();
      return;
    }

    // --- Caminho Web (Browser via navigator.geolocation) ---
    if (!("geolocation" in navigator)) {
      setUserLocation({ address: "Geolocalização não disponível", loading: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await processCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setUserLocation({ address: "Permissão de localização negada", loading: false });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    if (user) {
      setView("app");
      window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
      
      fetchMyOrders(userId!);
      fetchWalletBalance(userId!);
      fetchSavedCards(userId!);
      fetchSavedAddresses(userId!);
      fetchCartData(userId!);
      fetchCoupons();
      fetchBeveragePromo();
      fetchFlashOffers();
    } else if (!authInitLoading) {
      setView("login");
    }
  }, [user, authInitLoading]);
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

          // Sempre atualizar a lista local para refletir no F5 ou navegações
          if (userIdRef.current) fetchMyOrders(userIdRef.current);

          // Verificar transições de status para Toasts
          const statusChanged = oldOrder && oldOrder.status && newOrder.status !== oldOrder.status;
          
          if (statusChanged || !oldOrder) {
            const statusMessages: Record<string, string> = {
              'novo': 'Pagamento aprovado! O lojista já recebeu seu pedido. ⚡',
              'pendente_pagamento': 'Aguardando confirmação do pagamento... 💳',
              'pendente': 'O lojista recebeu seu pedido! 🥳',
              'aceito': 'O estabelecimento aceitou seu pedido! 🥳',
              'confirmado': 'Pedido confirmado! O preparo começou. ✅',
              'preparando': 'Seu pedido está sendo preparado com carinho! 🥗',
              'no_preparo': 'Seu pedido já está no preparo! 🥗',
              'waiting_driver': 'Pedido aceito! Buscando o melhor entregador para você. 🛵',
              'pronto': 'Pedido pronto! Aguardando o motoboy para coleta. 📦',
              'saiu_para_coleta': 'O motoboy aceitou e está indo retirar seu pedido! 🛵',
              'chegou_coleta': 'O motoboy chegou ao estabelecimento para retirar seu pedido! 🛵',
              'picked_up': 'Pedido coletado! O motoboy iniciou a entrega para você. 🚀',
              'a_caminho': 'Motoboy a caminho! Sua entrega está em rota. 🛵',
              'saiu_para_entrega': 'Fique atento! Seu pedido saiu para entrega! 🛵',
              'em_rota': 'Motoboy a caminho! Prepare-se para receber seu Izi. 🛵',
              'no_local': 'O motoboy chegou ao seu endereço! 🔔',
              'concluido': 'Pedido entregue com sucesso! Bom apetite. ✨',
              'cancelado': 'Ah não! Seu pedido foi cancelado. ⚠️',
              'recusado': 'Desculpe, o estabelecimento não pôde aceitar o pedido agora. ⚠️'
            };

            const msg = statusMessages[newOrder.status] || `Status do pedido atualizado: ${newOrder.status}`;
            showToast(msg, newOrder.status === 'cancelado' ? 'warning' : 'success');
          }

          // Monitoramento de Sucesso de Pagamento (Bitcoin / Pix / Geral)
          // NOTA: !oldOrder foi removido — sem ele, pedidos de dinheiro/maquininha (que são INSERTs novos)
          // não disparam incorretamente o fluxo de confirmação digital.
          const isPaid = newOrder.payment_status === 'paid' || (newOrder.status === 'novo' && oldOrder?.status === 'pendente_pagamento');
          
          if (isPaid) {
            const isPaymentSubView = ["lightning_payment", "pix_payment", "payment_processing", "card_payment"].includes(subViewRef.current);
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

          // Feedback de conclusão
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
                if (userIdRef.current) fetchWalletBalance(userIdRef.current);
              } else {
                setSubView("order_feedback");
              }
            }, 2000);
          }

          // Transições de estados de espera
          if ((subViewRef.current === "waiting_merchant" || subViewRef.current === "lightning_payment" || subViewRef.current === "pix_payment") && 
              ["novo", "paid", "pago", "aceito", "confirmado", "preparando", "pendente", "no_preparo", "pronto", "waiting_driver"].includes(newOrder.status)) {
            showToast("Pagamento confirmado! 🥳", "success");
            setSelectedItem(newOrder); 
            setTimeout(() => setSubView("active_order"), 1000);
          }

          if (subViewRef.current === "waiting_merchant" && newOrder.status === "cancelado") {
            showToast("Seu pedido foi recusado.", "warning");
            setSubView("none");
          }

          if (subViewRef.current === "waiting_driver" && ["a_caminho", "em_rota", "no_local", "picked_up", "saiu_para_entrega"].includes(newOrder.status)) {
            setSelectedItem(newOrder);
            setTimeout(() => setSubView("active_order"), 1500);
          }

          if (subViewRef.current === "waiting_driver" && newOrder.status === "cancelado") {
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

    // Sincronização em tempo real de Perfil (Saldo, XP, Coins, Izi Black, Carrinho)
    const userSub = supabase
      .channel(`user_sync_${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users_delivery", filter: `id=eq.${userId}` },
        (payload: any) => {
          console.log("[SYNC] Perfil do usuário atualizado remotamente.");
          fetchWalletBalance(userId);
          
          // Sincronizar carrinho se a mudança veio de outro dispositivo
          const remoteCart = payload.new?.cart_data;
          if (Array.isArray(remoteCart)) {
            // Verificar se o carrinho local é diferente para evitar loops infinitos ou 'ressurreição' indesejada
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

    // Sincronização de Endereços Salvos em tempo real
    const addrSub = supabase
      .channel(`addr_sync_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_addresses", filter: `user_id=eq.${userId}` },
        () => {
          console.log("[SYNC] Endereços salvos atualizados, sincronizando...");
          fetchSavedAddresses(userId);
        }
      )
      .subscribe();

    // Sincronização de Pedidos em tempo real para o cliente
    const orderSub = supabase
      .channel(`order_sync_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders_delivery", filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("[SYNC] Pedido atualizado, atualizando lista e visualização...");
          fetchMyOrders(userId);
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
  
  const fetchMyOrders = async (uid: string) => {
    if (!uid) return;
    const { data } = await supabase
      .from("orders_delivery")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    
    if (data) {
      setMyOrders(data);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    console.log("[DEBUG] Iniciando cancelamento do pedido:", orderId);
    if (!orderId) {
      toastError("ID do pedido não encontrado.");
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

      console.log("[DEBUG] Pedido cancelado/excluído no banco com sucesso.");
      toastSuccess("Pedido cancelado com sucesso!");
      
      if (userId) fetchMyOrders(userId);
      setSelectedItem(null);
      setTab("orders");
      setSubView("none");
    } catch (err: any) {
      console.error("Erro ao cancelar pedido:", err);
      toastError(`Não foi possível cancelar: ${err.message || 'Erro de rede'}`);
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

  const hasBenefitBeenUsed = async (sourceType: "coupon" | "flash_offer", sourceId: string) => {
    const filters: string[] = [];
    if (userId) filters.push(`user_id.eq.${userId}`);

    const trackedCpf = getBenefitTrackingCpf();
    if (trackedCpf) filters.push(`cpf.eq.${trackedCpf}`);
    if (filters.length === 0) return false;

    const { data, error } = await supabase
      .from("benefit_redemptions_delivery")
      .select("id")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .or(filters.join(","))
      .limit(1);

    if (error) {
      console.error(`Erro ao verificar uso de ${sourceType}:`, error);
      return false;
    }

    return Boolean(data && data.length > 0);
  };

  const validateCouponRules = async (coupon: any, subtotal: number) => {
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return "Este cupom já expirou.";
    }

    if (subtotal < (coupon.min_order_value || 0)) {
      return `O valor mínimo para este cupom é R$ ${coupon.min_order_value.toFixed(2)}.`;
    }

    if (coupon.usage_count >= coupon.max_usage) {
      return "Este cupom já atingiu o limite de usos.";
    }

    if (coupon.is_vip && !isIziBlackMembership) {
      return "Este cupom é exclusivo para membros IZI Black.";
    }

    if (coupon.id && await hasBenefitBeenUsed("coupon", coupon.id)) {
      return "Este cupom já foi utilizado por este CPF/usuário.";
    }

    return null;
  };

  const validateFlashOfferRules = async (item: any) => {
    const sourceId = getFlashOfferSourceId(item);
    if (!item?.is_flash_offer || !sourceId) return null;
    if (await hasBenefitBeenUsed("flash_offer", sourceId)) {
      return "Esta oferta já foi utilizada por este CPF/usuário.";
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
      console.warn("[BENEFIT] Falha crítica ao registrar uso:", e);
    }
  };

  const ensureCartBenefitsAreAvailable = async () => {
    const subtotal = cart.reduce((sum, item) => {
      const basePrice = Number(item.price) || 0;
      const addonsPrice = Array.isArray(item.addonDetails) 
        ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
        : 0;
      return sum + basePrice + addonsPrice;
    }, 0);

    if (appliedCoupon) {
      const couponError = await validateCouponRules(appliedCoupon, subtotal);
      if (couponError) return couponError;
    }

    const flashOfferIds = [...new Set(
      cart
        .filter((item: any) => item.is_flash_offer)
        .map((item: any) => getFlashOfferSourceId(item))
        .filter(Boolean)
    )];
    for (const offerId of flashOfferIds) {
      const flashOfferError = await validateFlashOfferRules({ id: offerId, is_flash_offer: true });
      if (flashOfferError) return flashOfferError;
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
        setCouponError("Cupom inválido ou expirado.");
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

    // 1. Feedback Visual Imediato (Animação)
    if (e && triggerCartAnimation) {
      triggerCartAnimation(e, item.img || "");
    }

    processingItemsRef.current.add(item.id);

    try {
      // 2. Validações básicas rápidas
      const flashOfferError = await validateFlashOfferRules(item);
      if (flashOfferError) {
        showToast(flashOfferError, "error" as any);
        processingItemsRef.current.delete(item.id);
        return;
      }

      // 3. Verificação de Opcionais
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

    // 4. Adição Real ao Carrinho
    setCart((prev: any[]) => [...prev, { ...item, timestamp: Date.now() }]);
    setUserXP((prev: number) => prev + 10);
    processingItemsRef.current.delete(item.id);
  };

  const handleShopClick = async (shop: any) => {
    if (!shop.isOpen) {
      toastError(`Desculpe! ${shop.name} está fechado no momento. 🕒`);
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


      // 2. Buscar redenções do usuário para desativar ofertas já utilizadas
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
        // 3. Filtrar ofertas ativas que o usuário ainda NÃO utilizou
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
          const cat = p.category || p.subcategory || (isRestaurant ? "Cardápio" : "Produtos");
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
      toastError("Cupom inválido ou expirado.");
      return;
    }

    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
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
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const couponDiscount = appliedCoupon
      ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100)
      : 0;
    
    const total = Math.max(0, subtotal - couponDiscount);
    
    // BENEFÍCIO IZI BLACK: Multiplicadores Dinâmicos
    const baseRate = Number(globalSettings?.izi_coin_rate || 1);
    const blackRate = Number(globalSettings?.izi_black_cashback || 5);
    const coinRate = isIziBlackMembership ? blackRate : baseRate;
    
    // O cashback é em porcentagem (ex: 1 = 1%, 5 = 5%)
    const earnedCoins = Number((total * (coinRate / 100)).toFixed(8));
    const finalCoins = isUsingCoins ? earnedCoins : (Number(iziCoins) + earnedCoins);
    
    // BENEFÍCIO IZI BLACK: XP Dinâmico
    const baseXP = 50;
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
      fetchMyOrders(userId);
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
      // 1. Busca todas as ofertas relâmpago ativas que ainda não expiraram
      const { data, error: offersError } = await supabase
        .from('flash_offers')
        .select('*, admin_users(store_name, store_logo)')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      if (!data) return;

      // 2. Busca resgates do usuário para marcar como 'Resgatado' em vez de ocultar
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
      const offersWithStatus = data.map((offer: any) => ({
        ...offer,
        is_redeemed: redeemedIds.has(offer.id)
      }));

      setFlashOffers(offersWithStatus);
    } catch (error) {
      console.error("Erro ao buscar ofertas relâmpago:", error);
    }
  };

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponInput, setCouponInput] = useState("");
  const [, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [cart, setCart] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("izi_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Evitar sobrescrever a nuvem com carrinho vazio de um novo aparelho (Race condition do Login)
  const isFirstEmptySync = useRef(cart.length === 0);

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

  const [quests] = useState([
    { id: 1, title: 'Explorador Urbano', desc: 'Peça em 3 categorias diferentes hoje', xp: 500, progress: 1, total: 3, icon: 'explore', color: '#fbbf24' },
    { id: 2, title: 'Amigo do Peito', desc: 'Indique um amigo para a Izi', xp: 1000, progress: 0, total: 1, icon: 'group_add', color: '#10b981' },
    { id: 3, title: 'Madrugador Izi', desc: 'Peça café da manhã antes das 9h', xp: 300, progress: 0, total: 1, icon: 'wb_sunny', color: '#f59e0b' },
  ]);

      // [Comentario Limpo pelo Sistema]
  const viewRef = useRef(view);
  const tabRef = useRef(tab);
  const subViewRef = useRef(subView);
  const userIdRef = useRef(userId);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const selectedItemRef = useRef(selectedItem);
  const cartRef = useRef(cart);

  useEffect(() => { subViewRef.current = subView; }, [subView]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  useEffect(() => { selectedItemRef.current = selectedItem; }, [selectedItem]);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const orderStatusLabels: Record<string, string> = {
    pending: "Aguardando",
    pendente: "Aguardando",
    pendente_pagamento: "Aguardando Pagamento",
    novo: "Processando",
    waiting_merchant: "Aguardando Loja",
    waiting_driver: "Pedido em Preparação",
    aceito: "Confirmado",
    confirmado: "Confirmado",
    preparando: "Em Preparação",
    no_preparo: "Em Preparação",
    pronto: "Pronto para Retirada",
    a_caminho_coleta: "Entregador a Caminho da Coleta",
    chegou_coleta: "Entregador no Local de Retirada",
    no_local_coleta: "Entregador no Local de Retirada",
    a_caminho: "Entregador a Caminho da Entrega",
    picked_up: "Pedido Coletado",
    em_rota: "A Caminho da Entrega",
    saiu_para_entrega: "Entregador Sugeriu Chegada",
    no_local: "Entregador no seu Local!",
    concluido: "Concluído",
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

  const getOrderAddress = (order: any) =>
    String(order?.delivery_address || "Endereço não informado")
      .split("| ITENS:")[0]
      .split("| OBS:")[0]
      .trim();

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

    return `Olá! Aqui é ${contactName}. Como posso ajudar com seu pedido?`;
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
        showToast("Informações copiadas para compartilhar.", "success");
        return;
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        showToast("Não foi possível compartilhar agora.", "warning");
      }
      return;
    }

    showToast("Compartilhamento não disponível neste dispositivo.", "warning");
  };

  const handleFavoriteAction = (label: string) => {
    showToast(`${label} salvo nos favoritos.`, "success");
  };

  const handleCallOrderContact = () => {
    const rawPhone = selectedItem?.driver_phone || selectedItem?.merchant_phone || selectedItem?.phone;
    if (!rawPhone) {
      openOrderChat("Preciso falar com alguém sobre este pedido");
      return;
    }

    const phone = String(rawPhone).replace(/[^\d+]/g, "");
    window.location.href = `tel:${phone}`;
  };

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { subViewRef.current = subView; }, [subView]);
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
  useEffect(() => { subViewRef.current = subView; }, [subView]);

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
    return () => window.removeEventListener("popstate", handlePopState);
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
    // [Comentario Limpo pelo Sistema]
    // 1. Identificar o Lojista Atual (Prioridade para selectedShop, fallback mapeando pelo carrinho para persistência pós-refresh)
    const activeShop = selectedShop || (cart.length > 0 ? ESTABLISHMENTS.find(e => e.id === cart[0].merchant_id || e.id === cart[0].store_id) : null);
    if (!activeShop) return 0;

    if (activeShop) {
      // Prioridade Máxima: Frete Grátis do Lojista (Configurado no Painel do Lojista via Toggle ou Taxa Zero explícita)
      const isExplicitlyFree = activeShop.free_delivery === true || activeShop.freeDelivery === true || (activeShop.service_fee !== null && Number(activeShop.service_fee) === 0);
      
      if (isExplicitlyFree) {
        console.log(`[DELIVERY] Frete Grátis aplicado pela loja: ${activeShop.name}`);
        return 0;
      }
    }

    // 2. IZI Black (Benefício do Usuário)
    // Verificamos se o usuário é IZI Black e se atingiu o pedido mínimo (se houver)
    if (isIziBlackMembership) {
       const minOrderIziBlack = Number(appSettings?.iziBlackMinOrderFreeShipping || 0);
       const subtotal = cart.reduce((sum, item: any) => {
         const itemTotal = (Number(item.price) || 0) * (item.quantity || 1);
         const addonsTotal = (item.addonDetails || []).reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0) * (item.quantity || 1);
         return sum + itemTotal + addonsTotal;
       }, 0);
       
       if (minOrderIziBlack === 0 || subtotal >= minOrderIziBlack) {
         console.log(`[DELIVERY] Frete Grátis aplicado via Izi Black Master (Subtotal: ${subtotal} >= Min: ${minOrderIziBlack})`);
         return 0;
       }
    }

    // 3. Fallback: Taxa de Entrega informada no item (Legado/Compatibilidade)
    if (cart.length > 0) {
       const first = cart[0];
       if (first.merchant_free_delivery === true || first.free_delivery === true) {
           return 0;
       }
    }

    // 4. PADRÃO: Modo Lojista (Raio vs Bairros)
    if (activeShop.coverageMode === 'neighborhoods' && activeShop.zones) {
       const userAddrLower = (userLocation.address || "").toLowerCase();
       // Simplest match: verifica se algum bairro ativo está na string de endereço
       const matchedZone = Object.entries(activeShop.zones as Record<string, {active: boolean, price: number}>)
           .find(([zName, cfg]) => cfg.active && userAddrLower.includes(zName.toLowerCase()));
           
       if (matchedZone) {
          console.log(`[DELIVERY] Zona de bairro encontrada: ${matchedZone[0]} -> R$ ${matchedZone[1].price}`);
          return matchedZone[1].price;
       }
    }

    // 5. MODO RAIO (Taxa Base + KM) ou Fallback
    const bv = marketConditions.settings.baseValues;
    const surge = bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0;
    
    const typeMapping: Record<string, {min: string, km: string, int: string}> = {
      "restaurant": { min: 'food_min', km: 'food_km', int: 'food_km_interval' },
      "market": { min: 'market_min', km: 'market_km', int: 'market_km_interval' },
      "pharmacy": { min: 'pharmacy_min', km: 'pharmacy_km', int: 'pharmacy_km_interval' },
      "beverages": { min: 'beverage_min', km: 'beverage_km', int: 'beverage_km_interval' },
    };
    
    const metric = typeMapping[activeShop.type] || typeMapping["restaurant"];
    const fallbackBase = globalSettings?.base_fee ?? appSettings?.baseFee ?? 5.90;
    
    // Usa os valores do Admin, ou fallback
    const baseFare = parseFloat(String(bv[metric.min] ?? fallbackBase));
    const distRate = parseFloat(String(bv[metric.km] ?? 2.5));
    const distInt  = Math.max(0.1, parseFloat(String(bv[metric.int] ?? 1.0)));
    
    let distKm = activeShop.distKm || 1.5;
    
    // Se a loja não usar frete do app (configuração rígida dela de fallback legacy)
    const fixedShopFee = activeShop.service_fee !== undefined && activeShop.service_fee !== null ? Number(activeShop.service_fee) : null;
    
    // Se tiver radius e valores de admin, aplicamos a dinamica
    const dynamicCalculated = parseFloat((baseFare + (distRate * Math.ceil(distKm / distInt) * surge)).toFixed(2));
    
    const finalFee = activeShop.coverageMode === 'radius' ? dynamicCalculated : (fixedShopFee !== null ? fixedShopFee : dynamicCalculated);

    console.log(`[DELIVERY] Aplicando Taxa (Modo: ${activeShop.coverageMode}): R$ ${finalFee}`);
    return finalFee;
  };

  const handlePlaceOrder = async (useCoins = false) => {
    if (!paymentMethod) { alert("Selecione uma forma de pagamento."); return; }
    if (!userId) { alert("Faça login para continuar."); return; }
    if (cart.length === 0) { alert("Seu carrinho está vazio."); return; }
    
    setIsUsingCoins(useCoins);

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
    
    const coinValue = globalSettings?.izi_coin_value || 0.01;
    const coinDiscount = useCoins ? (iziCoins || 0) * coinValue : 0;
    const deliveryFee = calculateDeliveryFee();
    const serviceFeePercent = globalSettings?.service_fee_percent || 0;
    const rawServiceFee = (subtotal * serviceFeePercent) / 100;
    const serviceFeeAmount = isIziBlackMembership ? 0 : rawServiceFee;
    const totalRaw = subtotal + deliveryFee + serviceFeeAmount - couponDiscount - coinDiscount;
    const total = Math.max(0, Number(totalRaw.toFixed(2)));

    // Garantir que shopId seja capturado de qualquer forma (Loja selecionada ou primeiro item do carrinho)
    const shopId = selectedShop?.id || cart[0]?.merchant_id || cart.find(i => i.merchant_id)?.merchant_id || null;
    const shopName = selectedShop?.name || cart[0]?.merchant_name || cart[0]?.store || "Estabelecimento";
    const activeShop = ESTABLISHMENTS.find(e => e.id === shopId) || selectedShop;
    const orderDistance = activeShop?.distKm || 0;

    const orderBase = {
      user_id: userId,
      merchant_id: shopId,
      merchant_name: shopName,
      user_name: userName,
      status: "novo",
      total_price: Number(total.toFixed(2)),
      delivery_fee: deliveryFee,
      service_fee: Number(serviceFeeAmount.toFixed(2)),
      items: cart,
      pickup_address: shopName,
      delivery_address: `${userLocation?.address || "Endereço não informado"}`,
      payment_method: paymentMethod,
      service_type: activeShop?.type || "restaurant",
      notes: (paymentMethod === "dinheiro" && changeFor) ? `TROCO PARA: R$ ${changeFor}` : "",
      route_distance_km: Number(orderDistance.toFixed(2))
    };

    console.log("[DIAG] handlePlaceOrder acionado:", { paymentMethod, total, shopId });

    if (total <= 0) {
       toastError("O valor total do pedido não pode ser R$ 0,00.");
       setIsLoading(false);
       return;
    }

    // 1. Verificação de Uso Único para Izi Flash (por CPF/ID)
    const flashOfferItem = cart.find(i => i.is_flash_offer && i.flash_offer_id);
    if (flashOfferItem) {
      const trackedCpf = getBenefitTrackingCpf();
      if (userId || trackedCpf) {
          const filters = [];
          if (userId) filters.push(`user_id.eq.${userId}`);
          if (trackedCpf) filters.push(`cpf.eq.${trackedCpf}`);

          const { data: redemptions } = await supabase
            .from("benefit_redemptions_delivery")
            .select("id")
            .eq("source_id", flashOfferItem.flash_offer_id)
            .eq("source_type", "flash_offer")
            .or(filters.join(","));

          if (redemptions && redemptions.length > 0) {
            toastError("Você já aproveitou esta oferta Izi Flash (uso único por CPF).");
            setIsLoading(false);
            return;
          }
      }
      
      // Também verifica se a oferta ainda é válida (tempo)
      if (flashOfferItem.expires_at && new Date(flashOfferItem.expires_at) < new Date()) {
         toastError("Esta oferta Izi Flash expirou. Remova-a da sacola para continuar.");
         setIsLoading(false);
         return;
      }
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

          console.log("Invocando create-lightning-invoice com total:", total, "orderId:", order.id);
          const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
            body: { amount: total, orderId: order.id, customerName: userName, memo: `IziDelivery #${order.id.slice(0,8).toUpperCase()}` }
          });

          if (lnErr || !lnData?.payment_request) {
            console.error("LN Error Details:", lnErr, lnData);
            throw new Error(lnData?.error || "Não foi possível gerar a fatura Bitcoin.");
          }

          setSelectedItem({ ...order, total_price: total, lightningInvoice: lnData.payment_request, satoshis: lnData.satoshis, btc_price_brl: lnData.btc_price_brl });
          
          // Persistir os dados da fatura no banco de dados para evitar perda em refresh
          await supabase.from("orders_delivery").update({ 
            lightning_invoice: lnData.payment_request,
            satoshis: lnData.satoshis,
            btc_price_brl: lnData.btc_price_brl
          }).eq("id", order.id);

          // O cart NÃO deve ser limpo aqui. Só após o pagamento ser confirmado via Realtime/Webhook
          navigateSubView("lightning_payment");
          return;
        } catch (e: any) {
          console.error("LN Error:", e);
          alert(`Erro ao iniciar pagamento Bitcoin: ${e.message || "Tente outro método."}`);
          return;
        }
      }

      if (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega") {
        if (!shopId) { 
          console.error("[CRITICAL] Checkout abortado: merchant_id não encontrado no carrinho nem na loja.", { cart });
          toastError("Houve um erro técnico: Loja não identificada. Por favor, tente adicionar os itens novamente.");
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

          setSelectedItem(order);
          
          // Limpeza do carrinho em bloco try/catch isolado para não afetar a criação com sucesso
          try {
            if (cart.length > 0) await clearCart(order.id);
          } catch (clearErr) {
            console.warn("Aviso: Carrinho não foi limpo, mas pedido foi criado:", clearErr);
          }

          navigateSubView("waiting_merchant");
        } catch (dbErr) {
          console.error("DB Error:", dbErr);
          toastError("Erro de conexão. Verifique sua rede.");
          setIsLoading(false);
        }
        return;
      }

      if (paymentMethod === "saldo") {
        const coinValue = globalSettings?.izi_coin_value || 0.01;
        const requiredCoins = Math.ceil(total / coinValue);

        if (iziCoins < requiredCoins) {
          toastError("Saldo de IZI COINS insuficiente.");
          setIsLoading(false);
          return;
        }

        const { data: order, error: orderErr } = await supabase.from("orders_delivery")
          .insert({ ...orderBase, status: "waiting_merchant", payment_status: "paid" })
          .select().single();

        if (orderErr) throw orderErr;

        if (order) {
          // Debitar coins
          await supabase.from("users_delivery").update({ 
            izi_coins: iziCoins - requiredCoins 
          }).eq("id", userId);

          // Registrar transacao (valor unitario em coins para o historico)
          await supabase.from("wallet_transactions").insert({ 
            user_id: userId, 
            type: "pagamento", 
            amount: requiredCoins,
            description: `Pagamento Pedido #${order.id.slice(0,6)}` 
          });

          setSelectedItem(order);
          if (cart.length > 0) await clearCart(order.id);
          navigateSubView("waiting_merchant");
        }
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
  const [activeService, setActiveService] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [pixConfirmed, setPixConfirmed] = useState<boolean>(false);
  const [pixCpf, setPixCpf] = useState<string>("");

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

  const [tempQuantity, setTempQuantity] = useState(1);
  const [filterTab, setFilterTab] = useState<"ativos" | "historico">("ativos");
  const [transitData, setTransitData] = useState({
    origin: "",
    destination: "",
    stops: [] as string[],
    type: "mototaxi" as "mototaxi" | "carro" | "van" | "utilitario" | "frete",
    estPrice: 0,
    scheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    receiverName: "",
    receiverPhone: "",
    packageDesc: "",
    weightClass: "Pequeno (até 5kg)",
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

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    const isRemembered = localStorage.getItem("rememberMe") === "true";
    if (isRemembered && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);
  const [ESTABLISHMENTS, setESTABLISHMENTS] = useState<any[]>([]);

  const isStoreOpen = useCallback((openingHours: any, manualOpen: boolean, mode: string = 'auto') => {
    // 1. Prioridade Máxima: Botão de Override Manual (is_open)
    // Se o lojista DESLIGOU a loja manualmente, ela fica FECHADA independente do modo.
    // Isso garante que o lojista possa fechar a loja rapidamente em emergências.
    if (manualOpen === false) return false;

    // 2. Se o modo for 'manual' e o botão estiver ligado (true), a loja está ABERTA.
    if (mode === 'manual') return manualOpen === true;

    // 3. Modo Automático: Segue o horário programado
    // Se não houver horários configurados, assume que está aberta (já verificamos manualOpen !== false acima).
    if (!openingHours || Object.keys(openingHours).length === 0) return true;

    const now = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const today = days[now.getDay()];
    const config = openingHours[today];

    if (!config || !config.active) return false;

    try {
      const [openH, openM] = config.open.split(':').map(Number);
      const [closeH, closeM] = config.close.split(':').map(Number);
      
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      const nowInMinutes = nowH * 60 + nowM;
      const openInMinutes = openH * 60 + openM;
      let closeInMinutes = closeH * 60 + closeM;

      // Suporte para Horário que vira a noite (Ex: 18:00 até 02:00)
      if (closeInMinutes < openInMinutes) {
        // Se o horário de fechamento for menor que o de abertura, a loja fecha no dia seguinte.
        // Estamos abertos se: agora >= abertura OU agora <= fechamento
        return nowInMinutes >= openInMinutes || nowInMinutes <= closeInMinutes;
      }

      return nowInMinutes >= openInMinutes && nowInMinutes <= closeInMinutes;
    } catch (e) {
      console.warn("Erro ao processar horário de funcionamento:", e);
      return true; // Fallback seguro para aberta se houver erro na configuração
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
      
        const realEstabs = data?.map(m => {
          const isOpen = isStoreOpen(m.opening_hours, m.is_open, m.opening_mode);
          
          let distKm = 1.5; // fallback
          if (userLocation.lat && userLocation.lng && m.latitude && m.longitude) {
            distKm = getDistanceKm(userLocation.lat, userLocation.lng, m.latitude, m.longitude);
            // Multiplique por 1.3 por causa de conversão (distância de ruas vs linha reta)
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
            freeDelivery: !!m.free_delivery || (m.service_fee !== null && Number(m.service_fee) === 0),
            free_delivery: !!m.free_delivery || (m.service_fee !== null && Number(m.service_fee) === 0),
            service_fee: m.free_delivery ? 0 : (m.service_fee !== undefined && m.service_fee !== null ? Number(m.service_fee) : null),
            fee: m.free_delivery || Number(m.service_fee) === 0 ? "Grátis" : `R$ ${Number(m.service_fee ?? globalSettings?.base_fee ?? appSettings?.baseFee ?? 5.90).toFixed(2).replace('.', ',')}`,
            latitude: m.latitude,
            longitude: m.longitude,
            coverageMode: m.delivery_coverage_mode || 'radius',
            zones: zonesByMerchant[m.id] || {}
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
      "Percebi que você gosta de culinária japonesa. Que tal conferir as ofertas do Sushi Zen?",
      "Hoje é sexta! Temos cupons especiais de 20% em bebidas para membros Izi Black. ÃÆ’Â°Ãâ€¦Â¸Ãâ€šÂ Ãâ€šÂ»",
      "Baseado no seu histórico, você costuma pedir em mercados ÃÆ’ s 19h. Deseja agendar suas compras?",
      "O trÃÂ¢nsito está pesado hoje. Sugiro usar o Mototáxi para chegar mais rápido ao seu destino.",
      "Você está a apenas 250 XP de subir para o nível 13! Que tal um pedido extra hoje?"
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % aiTips.length;
      setAiMessage(aiTips[index]);
    }, 15000);

      // [Comentario Limpo pelo Sistema]
    const channel = supabase
      .channel('admin_users_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users',
          filter: 'role=eq.merchant'
        },
        () => {
          fetchRealEstablishments();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchRealEstablishments]);

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
          fetchMyOrders(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [userId]);
  
  const [myOrders, setMyOrders] = useState<any[]>([]);

  // Atualiza automaticamente as telas PIX/Lightning se o pagamento for confirmado em tempo real
  // Usa selectedItem.id (não o objeto inteiro) como dependência para evitar loops de re-render
  useEffect(() => {
    if ((subView !== "pix_payment" && subView !== "lightning_payment")) return;
    if (!selectedItem?.id || selectedItem.id === "temp") return;

    const liveOrder = myOrders.find((o: any) => o.id === selectedItem.id);
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
      toastSuccess("Pagamento Confirmado! 🎉");
      return; // Sair imediatamente para não processar o bloco abaixo
    }

    // PRIORIDADE 2: Pedido cancelado/recusado enquanto aguardando pagamento
    if (liveOrder.status === "cancelado" || liveOrder.status === "recusado") {
      toastError("Pagamento recusado ou pedido cancelado.");
      setSubView("payment_error");
    }
  }, [myOrders, subView, selectedItem?.id]); // selectedItem.id previne loop

  // Sincroniza logistics_tracking em tempo real
  useEffect(() => {
    if (subView !== "logistics_tracking") return;
    if (!selectedItem?.id) return;

    const liveOrder = myOrders.find((o: any) => o.id === selectedItem.id);
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

    // Se pedido concluído, atualiza UI
    if (liveOrder.status === "concluido") {
      toastSuccess("Entrega concluída com sucesso! 🎉");
    }

    // Se cancelado
    if (liveOrder.status === "cancelado" || liveOrder.status === "recusado") {
      toastError("Serviço cancelado.");
    }
  }, [myOrders, subView, selectedItem?.id, selectedItem?.status, selectedItem?.driver_id]);
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
    lat?: number;
    lng?: number;
  }>({
    address: "Buscando localização...",
    loading: true,
  });
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
  const [walletBalance, setWalletBalance] = useState(0);
  const [driverPos, setDriverPos] = useState({ lat: -23.5505, lng: -46.6333 });
  const [adIndex, setAdIndex] = useState(0);
  const [beverageBanners, setBeverageBanners] = useState<any[]>([]);
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

  const [establishmentTypes, setEstablishmentTypes] = useState<any[]>([]);

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
    // Categorias Master que compõem o ecossistema de "Food"
    const foodMasterValues = ['restaurant', 'candy', 'comida'];
    const foodMasterParents = establishmentTypes.filter(t => foodMasterValues.includes(t.value) && !t.parent_id);
    const foodMasterIds = foodMasterParents.map(p => p.id);
    
    // Pegamos as especialidades de todos esses pais
    const specialties = establishmentTypes.filter(t => t.parent_id && foodMasterIds.includes(t.parent_id));

    const base = [
      { id: "all",        name: "Todos",         icon: "restaurant",    action: () => { setRestaurantInitialCategory("Todos"); navigateSubView("explore_restaurants"); } },
      { id: "promocoes",  name: "Promoções",     icon: "percent",       action: () => { setRestaurantInitialCategory("Promoções"); navigateSubView("explore_restaurants"); } },
    ];

    const dynamic = specialties.map(s => ({
      id: s.value,
      name: s.name,
      icon: s.icon || "restaurant",
      action: () => { setRestaurantInitialCategory(s.value); navigateSubView("explore_restaurants"); }
    }));

    // Fallback se não houver dinâmicas ainda
    if (dynamic.length === 0) {
      return [
        ...base,
        { id: "burguer",    name: "Burguer",       icon: "lunch_dining",  action: () => { setRestaurantInitialCategory("burguer"); navigateSubView("explore_restaurants"); } },
        { id: "pizza",      name: "Pizza",         icon: "local_pizza",   action: () => { setRestaurantInitialCategory("pizza"); navigateSubView("explore_restaurants"); } },
        { id: "doces",      name: "Doces e Bolos", icon: "cake",          action: () => { setRestaurantInitialCategory("doces"); navigateSubView("explore_restaurants"); } },
        { id: "japones",    name: "Japonês",       icon: "set_meal",      action: () => { setRestaurantInitialCategory("japones"); navigateSubView("explore_restaurants"); } },
      ];
    }

    return [...base, ...dynamic, { id: "daily", name: "Do Dia", icon: "today", action: () => navigateSubView("daily_menus") }];
  }, [establishmentTypes]);

  const lunchCategories = [
    { id: "all",     name: "Todos",           icon: "restaurant" },
    { id: "promo",   name: "Promoção do Dia", icon: "percent" },
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
        shippingPriorities: ratesData?.find(r => r.type === 'shipping_priorities')?.metadata || {},
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
      
      // Sincronização Real: O clima é definido pelo Admin. Se nenhum estiver ativo, usa lógica temporal.
      let currentWeather = (hour > 18 || hour < 6) ? "Nublado" : "Ensolarado";
      if (config.weather?.storm?.active) currentWeather = "Tempestade";
      else if (config.weather?.rain?.active) currentWeather = "Chuva Leve";
      else if (config.weather?.snow?.active) currentWeather = "Nublado"; // Neve mapeado para nublado visualmente aqui

      const drivers = onlineDrivers || 1; 
      const orders = pendingOrders || 0;
      const ratio = orders / drivers;

      // --- LOGICA DE SURGE (%) ---
      let surge = 1.0;

      // 1. Modo Inteligente (Algoritmo de Equilíbrio)
      const { threshold, sensitivity, maxSurge } = config.equilibrium;
      if (config.flowControl?.mode === 'auto') {
        if (ratio > threshold) {
          surge = 1.0 + (ratio - threshold) * sensitivity;
        }
      }

      // 2. Regras de Clima
      if (currentWeather === "Tempestade" && config.weather?.storm?.active) surge += (config.weather.storm.multiplier - 1);
      if (currentWeather === "Chuva Leve" && config.weather?.rain?.active) surge += (config.weather.rain.multiplier - 1);
      
      // 3. Regras de Horário de Pico (Peak Hours do Admin)
      config.peakHours.forEach((rule: any) => {
        if (rule.active) {
            // No momento usamos apenas multiplicador global se houver, mas podemos expandir para labels
            // Ex: "Acréscimo Noturno"
            surge += (rule.multiplier - 1);
        }
      });

      // 4. Overrides do Admin (Surge Crítico)
      if (config.flowControl?.highDemandActive) {
        surge = Math.max(surge, 1.5); // Força pelo menos 1.5x
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
  const calculateDistancePrices = (origin: string, destination: string) => {
    if (!origin || !destination || !window.google?.maps) return;
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
              origin: { address: origin },
              destination: { address: destination },
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE',
              computeAlternativeRoutes: false,
              languageCode: 'pt-BR',
              units: 'METRIC'
            })
          });

          const data = await res.json();
          setIsCalculatingPrice(false);

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distKm = (route.distanceMeters || 0) / 1000;
            
            // Converter duração (string "123s") para minutos
            const durationSeconds = route.duration ? parseInt(route.duration.replace('s', '')) : 0;
            const durationMin = Math.ceil(durationSeconds / 60);
            
            const distText = distKm.toFixed(1).replace('.', ',') + " km";
            const durationText = durationMin + " min";
            
            setRouteDistance(`${distText} • ${durationText}`);
            setDistanceValueKm(distKm);

            // Decodificar Polyline para exibir no mapa
            if (route.polyline?.encodedPolyline && window.google?.maps?.geometry?.encoding) {
              const path = window.google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);
              const points = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
              setRoutePolyline(points as any);
            }

            // Continuar com o cálculo de preços (que usa distKm e marketConditions já no escopo pai)
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
            
            const utilitario_min = parseFloat(String(bv.utilitario_min)) || 10.0;
            const utilitario_km  = parseFloat(String(bv.utilitario_km))  || 3.0;
            const utilitario_int = Math.max(0.1, parseFloat(String(bv.utilitario_km_interval)) || 1.0);
            
            const logistica_min  = parseFloat(String(bv.logistica_min))  || 45.0;
            const logistica_km   = parseFloat(String(bv.logistica_km))   || 8.0;
            const logistica_int  = Math.max(0.1, parseFloat(String(bv.logistica_km_interval)) || 1.0);

            // Logística Customizada por Veículo (Resiliência de chaves snake_case e camelCase)
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
              utilitario: parseFloat(((utilitario_min + (utilitario_km * (distKm / utilitario_int))) * surge).toFixed(2)),
              logistica:  parseFloat(((logistica_min  + (logistica_km  * (distKm / logistica_int)))  * surge).toFixed(2)),
              // Preços específicos de logística - Agora puramente Lineares (KM * Distância)
              fiorino:    parseFloat(((fiorino_min + (fiorino_km * distKm)) * surge).toFixed(2)),
              bau_p:      parseFloat(((bau_p_min   + (bau_p_km   * distKm)) * surge).toFixed(2)),
              bau_m:      parseFloat(((bau_m_min   + (bau_m_km   * distKm)) * surge).toFixed(2)),
              bau_g:      parseFloat(((bau_g_min   + (bau_g_km   * distKm)) * surge).toFixed(2)),
              aberto:     parseFloat(((aberto_min  + (aberto_km  * distKm)) * surge).toFixed(2)),
              van_carga:  parseFloat(((van_min     + (van_km     * distKm)) * surge).toFixed(2)),
            };
            setDistancePrices(newPrices);
            setTransitData(prev => {
              // Se já houver um valor orçado no wizard de logística, não sobrescreve com o genérico
              if ((prev.type === 'logistica' || prev.type === 'frete') && prev.vehicleCategory) {
                return prev;
              }
              return { ...prev, estPrice: newPrices[prev.type] || newPrices.mototaxi };
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
    setSubView("mobility_payment");
  };

  const handleConfirmMobility = async (paymentMethod: string) => {
    if (!userId) {
      toastWarning("Faça login para continuar");
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
            "Caminhão Baú Pequeno": { min: 'bau_p_min', km: 'bau_p_km', int: 'bau_p_km_interval' },
            "Caminhão Baú Médio": { min: 'bau_m_min', km: 'bau_m_km', int: 'bau_m_km_interval' },
            "Caminhão Baú Grande": { min: 'bau_g_min', km: 'bau_g_km', int: 'bau_g_km_interval' },
            "Caminhão Aberto": { min: 'aberto_min', km: 'aberto_km', int: 'aberto_km_interval' }
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
                "Caminhão Baú Pequeno": 1.6,
                "Caminhão Baú Médio": 2.2,
                "Caminhão Baú Grande": 3.5,
                "Caminhão Aberto": 1.9,
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
          stopRate: 15, // Mover para settings se necessário
          isDaily: transitData.tripType === 'hourly',
          hours: 4,
          hourlyRate: 45
       }).totalPrice;
    } else {
      // Para outros tipos (mototaxi, carro, utilitario), usamos o preço já calculado no preview
      // que agora também é aditivo por padrão.
      const rawP = distancePrices[transitData.type];
      finalPrice = isNaN(rawP) || !rawP ? (basePrices[transitData.type] || 6.90) : rawP;
    }
    
    // Inserindo lógica de prioridade de envio (Turbo, Light, etc)
    const priorityId = transitData.priority;
    const priorityConfig = marketConditions.settings?.shippingPriorities?.[priorityId as keyof typeof marketConditions.settings.shippingPriorities];
    
    if (priorityConfig && priorityConfig.active) {
      if ((priorityConfig as any).km_fee > 0) {
        // Cálculo independente por prioridade (Base + KM * Distância)
        finalPrice = (priorityConfig.min_fee || 0) + ((priorityConfig as any).km_fee * distanceValueKm);
      } else {
        // Cálculo baseado em multiplicador (Legado)
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

    const orderBase: any = {
      user_id: userId,
      merchant_id: null,
      status: "waiting_driver",
      total_price: finalPrice,
      service_type: transitData.type,
      pickup_address: transitData.origin,
      delivery_address: `${typeof transitData.destination === 'object' ? (transitData.destination.formatted_address || transitData.destination.address || JSON.stringify(transitData.destination)) : transitData.destination} | OBS: ${
        transitData.type === 'van'
          ? `EXCURSÃO: ${transitData.excursionData.passengers} passageiros. Tipo: ${transitData.excursionData.tripType === 'ida_e_volta' ? 'Ida e Volta' : 'Somente Ida'}. Partida: ${transitData.excursionData.departureDate}. ${transitData.excursionData.notes || ''}`
          : (transitData.type === 'logistica' || transitData.type === 'frete')
            ? `FRETE: ${transitData.vehicleCategory}. ${transitData.helpers || 0} ajudantes. ${
                (transitData.accessibility?.stairsAtOrigin || transitData.accessibility?.stairsAtDestination) ? 'Necessário subir ESCADAS.' : 'Sem escadas.'
              }`
            : isShipping
              ? `ENVIO: ${transitData.packageDesc || 'Objeto'} (${transitData.weightClass}). Recebedor: ${transitData.receiverName} (${transitData.receiverPhone})`
              : `VIAGEM: Transporte de passageiro (${transitData.type === 'mototaxi' ? 'MotoTáxi' : 'Particular'})`
      }`,
      payment_method: paymentMethod,
      payment_status: (paymentMethod === 'dinheiro' || paymentMethod === 'pix' || paymentMethod === 'bitcoin_lightning') ? 'pending' : 'paid',
      scheduled_at: (transitData.scheduled || transitData.type === 'van') ? (transitData.type === 'van' ? transitData.excursionData.departureDate : `${transitData.scheduledDate}T${transitData.scheduledTime}:00`) : null,
      route_polyline: routePolyline
    };

    try {
      // 1. Validar saldo se for saldo
      if (paymentMethod === "saldo") {
        if (walletBalance < finalPrice) {
          toastError("Saldo insuficiente na carteira");
          setIsLoading(false);
          return;
        }
        await supabase.from("wallet_transactions").insert({
          user_id: userId,
          type: "pagamento",
          amount: finalPrice,
          description: `Viagem: ${transitData.origin.split(',')[0]} para ${transitData.destination.split(',')[0]}`
        });
        setWalletBalance(prev => prev - finalPrice);
      }

      const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(orderBase).select().single();
      if (insertError) throw insertError;

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
      }

      const newHistory = [transitData.destination, ...transitHistory.filter(h => h !== transitData.destination)].slice(0, 10);
      setTransitHistory(newHistory);
      localStorage.setItem("transitHistory", JSON.stringify(newHistory));
      setSelectedItem(order);
      
      if (paymentMethod !== 'pix' && paymentMethod !== 'bitcoin_lightning') {
        const isLogisticsService = ['frete', 'logistica', 'van'].includes(transitData.type);
        if (transitData.scheduled) {
          toastSuccess("Agendamento confirmado com sucesso!");
          setSubView("payment_success");
        } else if (isLogisticsService) {
          toastSuccess("Solicitação de logística enviada! Buscando motorista...");
          setSubView("logistics_tracking");
        } else {
          toastSuccess("Procurando motorista...");
          setSubView("active_order");
        }
      }
    } catch (err: any) {
      console.error("Erro no fluxo de mobilidade:", err);
      toastError("Não foi possível criar seu pedido: " + err.message);
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

  // Capturar localização atual obrigatoriamente ao entrar em fluxos de mobilidade/logística
  useEffect(() => {
    const mobilityWizardViews = ["taxi_wizard", "freight_wizard", "van_wizard", "excursion_wizard", "transit_selection"];
    if (mobilityWizardViews.includes(subView)) {
      updateLocation(); // Garante atualização real e recente
    }
  }, [subView]);

  // Definir tipo de serviço correto ao entrar no FreightWizard
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
    const isLunchMode = restaurantInitialCategory === "Almoço";
    
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
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-white">Cardápios do Dia</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Sugestões Especiais</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-10 pt-8">
           <div className="bg-pink-500/5 p-8 rounded-[45px] border border-pink-500/10 mb-2">
             <h2 className="text-lg font-black text-pink-600  mb-2 leading-none uppercase tracking-tighter">Ofertas de Hoje</h2>
             <p className="text-xs font-medium text-zinc-500">Seus pratos favoritos com preços exclusivos para hoje.</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
                {specials.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={p.id}
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
        desc: (f.description || 'Oferta imperdível por tempo limitado!') + `\n\nðŸ“Œ Vendido por: ${f.admin_users?.store_name || 'Loja Parceira'}`
      })) : [];
    }

    let h = "00", m = "00", s = "00";
    if (displayDeals.length > 0 && displayDeals[0].expires_at) {
      const diffMs = new Date(displayDeals[0].expires_at).getTime() - nowTick;
      if (diffMs > 0) {
        h = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0');
        m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        s = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
      }
    }

    return (
      <div className="absolute inset-0 z-[100] bg-zinc-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-10">
        {/* Luxury Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] bg-yellow-400/[0.02] blur-[120px] rounded-full -translate-y-1/2" />
        </div>

        <header className="relative z-10 p-8 flex flex-col items-center gap-8 pt-12">
          <div className="w-full flex items-center justify-between">
            <button 
              onClick={() => {
                setSubView("none");
                setSelectedItem(null);
              }} 
              className="size-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center active:scale-90 transition-all group"
            >
              <Icon name="arrow_back" />
            </button>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="bolt" />
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">Ofertas Flash</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Por tempo limitado</p>
            </div>

            <div className="size-12 rounded-full bg-yellow-400/5 border border-yellow-400/10 flex items-center justify-center">
              <Icon name="timer" />
            </div>
          </div>

          {/* Luxury Timer Panel */}
          <div className="relative w-full max-w-[340px] rounded-[40px] bg-white/[0.02] border border-white/[0.05] p-8 flex flex-col items-center justify-center gap-2 overflow-hidden shadow-none">
             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">A oferta termina em:</p>
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{h}</span>
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Horas</span>
                </div>
                <span className="text-4xl font-black text-yellow-400 -mt-2">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{m}</span>
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Minutos</span>
                </div>
                <span className="text-4xl font-black text-yellow-400 -mt-2">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{s}</span>
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Segundos</span>
                </div>
             </div>
          </div>
        </header>

        <main className="relative z-10 px-6 py-4 flex flex-col items-center gap-10">
          {displayDeals.map((deal, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              key={deal.id}
              onClick={() => { 
                setSelectedItem(deal);
                setSubView("product_detail"); 
              }}
              className="w-full max-w-[340px] bg-zinc-900/50 rounded-[50px] overflow-hidden border border-white/[0.05] flex flex-col items-center group cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-900"
            >
              <div className="w-full h-80 relative">
                <img src={deal.img} className="size-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute top-6 left-6 bg-yellow-400 px-6 py-2 rounded-full shadow-lg shadow-yellow-400/20">
                  <span className="text-[10px] text-black font-black uppercase tracking-widest">{deal.off}</span>
                </div>
              </div>
              
              <div className="p-10 flex flex-col items-center text-center -mt-16 relative z-10 w-full">
                <h3 className="text-2xl font-black text-white tracking-tighter leading-tight mb-2 drop-shadow-xl">{deal.name}</h3>
                <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-4 opacity-80">{deal.store}</p>
                <p className="text-[11px] text-zinc-500 font-medium mb-8 max-w-[260px] line-clamp-2">{deal.desc}</p>
                
                <div className="w-full flex flex-col items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-zinc-700 line-through tracking-widest mb-1">R$ {deal.oldPrice.toFixed(2).replace('.', ',')}</span>
                    <span className="text-4xl font-black text-white tracking-tighter flex items-center gap-2">
                      <span className="text-yellow-400 text-lg uppercase font-black">R$</span>
                      {deal.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  <div className="w-full bg-white/[0.03] border border-white/5 py-4 rounded-full group-hover:bg-yellow-400 group-hover:border-yellow-400 transition-all flex items-center justify-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-black transition-colors">Adicionar ao Carrinho</span>
                    <Icon name="add_circle" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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
      "Farmácia": "local_pharmacy", "Mercado": "local_mall",
      "Gás & Ã gua": "propane_tank", "Açougue": "kebab_dining", "Padaria": "bakery_dining", "Hortifruti": "nutrition"
    };
    const icon = categoryIcons[title] || "storefront";

    return (
      <EstablishmentListView
        title={title}
        subtitle="Disponível agora"
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
      title="Farmácias"
      subtitle="Saúde e bem-estar"
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
      title="Todas as Farmácias"
      subtitle="Unidades Próximas"
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
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.2em]">Seleção Premium de Ofertas</p>
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
                      <h2 className="text-4xl font-black tracking-tighter leading-tight max-w-[250px] italic text-yellow-400">
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
                  key={item.id}
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
    // Re-computar activeStories similar ao HomeView para consistência
    const activeStorieslist = (flashOffers || []).map((offer: any) => {
      const expiresAt = new Date(offer.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const timeLeft = diffHrs > 0 ? diffHrs + "h" : diffMins + "min";
      
      let finalPrice = Number(offer.discounted_price);
      if (!finalPrice && offer.original_price && offer.discount_percent) {
          finalPrice = Number(offer.original_price) * (1 - (Number(offer.discount_percent) / 100));
      }
      
      const originalPrice = Number(offer.original_price);
      return {
        id: offer.id,
        merchant: offer.admin_users?.store_name || offer.merchant_name || "Loja",
        name: offer.product_name,
        finalPrice: finalPrice ? finalPrice.toFixed(2).replace('.', ',') : "Flash",
        originalPrice: originalPrice ? originalPrice.toFixed(2).replace('.', ',') : "",
        timeLeft,
        img: offer.product_image || offer.admin_users?.store_logo || "",
        isMaster: (userLevel || 0) >= 10 && offer.is_vip,
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
    
    // Normalização agressiva de cotação
    const btcPrice = Number(
      selectedItem?.btcPrice || 
      selectedItem?.btc_price_brl || 
      lightningData?.btcPrice || 
      lightningData?.btc_price_brl || 
      appSettings?.lastBtcPrice || 
      500000 // Fallback final para evitar divisão por zero
    );
    
    const satoshisRaw = Number(selectedItem?.satoshis || selectedItem?.amount_sats || lightningData?.satoshis || 0);
    let amountBrl = Number(selectedItem?.total_price || selectedItem?.amount_brl || 0);
    
    let finalSatoshis = satoshisRaw;

    // Se satoshis vier zerado mas temos o valor em BRL e a cotação, recalculamos no frontend
    if (finalSatoshis <= 0 && amountBrl > 0 && btcPrice > 0) {
      finalSatoshis = Math.floor((amountBrl / btcPrice) * 100_000_000);
    }
    
    // Fallback inverso: se temos sats mas não BRL (raro, mas possível)
    if (amountBrl <= 0 && finalSatoshis > 0 && btcPrice > 0) {
      amountBrl = (finalSatoshis * btcPrice) / 100_000_000;
    }

    console.log("[LN Debug]", { amountBrl, btcPrice, satoshisRaw, finalSatoshis });
    
    return (
      <div className="absolute inset-0 z-[200] bg-black text-zinc-100 flex flex-col overflow-hidden pb-10">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg flex items-center gap-4 px-5 py-6 border-b border-white/5">
          <button 
            onClick={() => {
              if (selectedItem?.service_type === 'coin_purchase') {
                setSubView("none");
              } else {
                setSubView("checkout");
              }
            }} 
            className="size-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-black tracking-tight leading-none mb-1">Bitcoin Lightning</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Pagamento Instantâneo</p>
          </div>
          <div className="size-11 rounded-2xl bg-yellow-400/5 border border-yellow-400/10 flex items-center justify-center">
             <span className="material-symbols-outlined text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-4">
          <div className="mb-6 relative">
             <div className="absolute -inset-6 bg-yellow-400/10 blur-[40px] rounded-full animate-pulse" />
             <div className="relative group p-3 border-2 border-dashed border-yellow-400/30 rounded-[35px] bg-zinc-950/50">
               <div className="bg-white p-5 rounded-[28px] shadow-2xl transition-all duration-700">
                <img
                  src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(invoice)}
                  alt="Lightning QR"
                  className="size-[200px] rounded-xl"
                />
               </div>
             </div>
          </div>

          <div className="space-y-1 mb-6 w-full max-w-xs">
            <h3 className="text-2xl font-black text-white tracking-tighter flex flex-col items-center justify-center gap-1">
              <span className="tabular-nums">{(finalSatoshis / 100_000_000).toFixed(8)}</span>
              <span className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em]">Bitcoin (BTC)</span>
            </h3>
            {amountBrl > 0 && (
              <p className="text-zinc-400 text-xs font-bold">
                ≈ R$ {amountBrl.toFixed(2).replace(".", ",")}
              </p>
            )}
          </div>

          <div className="w-full space-y-3 max-w-xs">
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(invoice);
                 toastSuccess("Fatura copiada!");
               }}
               className="w-full h-14 rounded-[20px] bg-white text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5"
             >
               <span className="material-symbols-outlined text-lg">content_copy</span>
               Copiar Invoice
             </button>
             
             <button 
               onClick={() => {
                 window.open(`lightning:${invoice}`);
               }}
               className="w-full h-14 rounded-[20px] bg-zinc-900 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
             >
               <span className="material-symbols-outlined text-lg">open_in_new</span>
               Abrir na Carteira
             </button>

             <button 
               onClick={async () => {
                if (window.confirm("Deseja realmente cancelar esta solicitação de recarga?")) {
                  await handleCancelOrder(selectedItem?.id);
                  setSubView("none");
                  setSelectedItem(null);
                }
               }}
               className="w-full h-14 rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
             >
               <span className="material-symbols-outlined text-lg">close</span>
               Cancelar Pagamento
             </button>
             
             <div className="pt-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                   <div className="size-1.5 bg-yellow-400 rounded-full animate-ping" />
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Aguardando pagamento...</p>
                </div>
                <p className="text-[9px] text-zinc-600 max-w-[180px] leading-relaxed font-medium">Não feche esta tela até que o pagamento seja detectado automaticamente.</p>
             </div>
          </div>
        </main>
      </div>
    );
  };

  const renderPixPayment = () => {
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
    const cartTotal = Math.max(0, subtotal - discount);
    const total = (selectedItem?.total_price) ? Number(selectedItem.total_price) : cartTotal;

    const formatCpf = (v: string) => v.replace(/\D/g,"").slice(0,11)
      .replace(/(\d{3})(\d)/,"$1.$2")
      .replace(/(\d{3})(\d)/,"$1.$2")
      .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

    const handlePixConfirm = async () => {
      if (pixCpf.replace(/\D/g,"").length < 11) { alert("CPF inválido."); return; }
      console.log("Iniciando fluxo PIX para total:", total);
      setPixConfirmed(true);
      try {
        let orderId = selectedItem?.id;
        let orderRef = selectedItem;

        const isSubscription = paymentsOrigin === "izi_black";

        // Se o pedido ainda não existe, precisamos criá-lo
        if (!orderId || orderId === "temp") {
          if (!isSubscription && !selectedShop?.id && !selectedItem?.merchant_id) { 
            console.error("Erro: Estabelecimento não selecionado durante criação de pedido PIX.");
            alert("Erro: Estabelecimento não identificado. Por favor, volte e selecione a loja novamente."); 
            setPixConfirmed(false); 
            return; 
          }

          console.log("Criando pedido inicial 'pendente_pagamento' para " + (isSubscription ? "assinatura" : "delivery") + "...");
          const orderPayload = {
              user_id: userId,
              merchant_id: isSubscription ? null : (selectedShop?.id || selectedItem?.merchant_id),
              status: "pendente_pagamento",
              total_price: Number(total.toFixed(2)),
              pickup_address: isSubscription ? "Assinatura Izi Black" : (selectedShop?.name || selectedItem?.pickup_address || "Endereço do Estabelecimento"),
              delivery_address: isSubscription ? "Serviço Digital" : (selectedItem?.delivery_address || `${userLocation.address || "Endereço não informado"}`),
              items: selectedItem?.items || cart,
              payment_method: "pix",
              service_type: isSubscription ? "subscription" : (selectedItem?.service_type || selectedShop?.type || "restaurant"),
              delivery_fee: selectedItem?.delivery_fee || 0,
              notes: selectedItem?.notes || "",
            };

          console.log("[DIAG] Payload PIX preparado:", orderPayload);

          const { data: order, error: orderErr } = await supabase
            .from("orders_delivery")
            .insert(orderPayload)
            .select()
            .single();

          if (orderErr || !order) {
            console.error("Erro ao criar pedido:", orderErr);
            alert("Não foi possível registrar o pedido. Detalhe: " + (orderErr?.message || "Erro desconhecido"));
            setPixConfirmed(false);
            return;
          }
          orderId = order.id;
          orderRef = order;
          console.log("Pedido de checkout delivery criado para PIX:", orderId);
        } else {
          console.log("Fluxo PIX em pedido existente ID:", orderId);
          await supabase.from("orders_delivery").update({ 
            status: "pendente_pagamento", 
            payment_method: "pix" 
          }).eq("id", orderId);
        }

        // 2. Chamar Edge Function do Mercado Pago
        console.log("Chamando edge function process-mp-payment...");
        const cleanCpf = pixCpf.replace(/\D/g, "");
        const cleanEmail = (user?.email || loginEmail || "cliente@izidelivery.com").trim().toLowerCase();

        if (cleanCpf.length !== 11) {
          toastError("CPF inválido. Por favor, verifique.");
          return;
        }

        const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
          body: {
            amount: Number(total.toFixed(2)),
            orderId: orderId,
            payment_method_id: 'pix',
            email: cleanEmail,
            customer: {
              cpf: cleanCpf,
              name: userName || "Cliente IziDelivery",
            },
            description: selectedItem?.service_type === 'coin_purchase' ? `Compra de IZI COINS - R$ ${total.toFixed(2)}` : undefined
          },
        });

        if (fnErr || !(fnData?.qrCode || fnData?.qr_code)) {
          console.error("Erro MP PIX:", fnErr, fnData);
          
          let detail = "Erro ao gerar os dados do QR Code no Mercado Pago.";
          // No SDK do Supabase, o corpo do erro (se status for 4xx) pode estar no fnData ou no fnErr
          const source = fnData || fnErr;
          
          if (source?.details?.cause?.[0]?.description) {
            detail = `MP: ${source.details.cause[0].description}`;
          } else if (source?.error) {
            detail = typeof source.error === 'string' ? source.error : JSON.stringify(source.error);
          } else if (fnErr?.message) {
            // Tenta remover a mensagem padrão chata do Supabase se houver detalhe
            detail = fnErr.message === "Edge Function returned a non-2xx status code" ? "Erro no servidor de pagamentos." : fnErr.message;
          }
          
          setSelectedItem({ ...orderRef, pixError: true, pixErrorMessage: detail });
          setPixConfirmed(true);
          return;
        }

        // 3. Atualizar UI com QR real
        console.log("[DEBUG] DADOS BRUTOS MP (STRING):", JSON.stringify(fnData));
        
      // [Comentario Limpo pelo Sistema]
        const qr = fnData?.qrCode || 
                   fnData?.qr_code || 
                   fnData?.emv ||
                   fnData?.point_of_interaction?.transaction_data?.qr_code ||
                   fnData?.point_of_interaction?.transaction_data?.emv;
                   
        const qrBase64 = fnData?.qrCodeBase64 || 
                         fnData?.qr_code_base64 || 
                         fnData?.image ||
                         fnData?.point_of_interaction?.transaction_data?.qr_code_base64 ||
                         fnData?.point_of_interaction?.transaction_data?.image_base64;
                         
        const copyPaste = fnData?.copyPaste || 
                          fnData?.copy_paste || 
                          fnData?.ticket_url ||
                          fnData?.point_of_interaction?.transaction_data?.ticket_url ||
                          fnData?.point_of_interaction?.transaction_data?.qr_code;

        if (!qr && !qrBase64 && !copyPaste) {
          console.error("[DEBUG] Erro: Nenhum dado de PIX (QR ou Link) detectado na resposta.");
          toastError("Erro: Resposta incompleta do servidor de pagamentos.");
        }

        console.log("[DEBUG] Mapeamento Cruzado Final:", { 
          temQr: !!qr, 
          temBase64: !!qrBase64, 
          temCopiaeCola: !!copyPaste 
        });

        setSelectedItem((prev: any) => ({ 
          ...(prev || {}), 
          id: orderId,
          pixQrCode: qr, 
          pixQrBase64: qrBase64, 
          pixCopyPaste: copyPaste || qr, // Fallback do copia e cola para o EMV se necessário
          pixError: false 
        }));
        
      // [Comentario Limpo pelo Sistema]
        // O carrinho agora é limpo somente via Realtime quando o pagamento é CONFIRMADO (liveOrder.status !== 'pendente_pagamento')

      } catch (e: any) {
        const qr = selectedItem?.pix_qr_code || selectedItem?.pixQrCode || "";
        const qrBase64 = selectedItem?.pix_qr_base64 || selectedItem?.pixQrBase64 || "";
        const copyPaste = selectedItem?.pix_copy_paste || selectedItem?.pixCopyPaste || qr;
        console.error("Exceção crítica no fluxo PIX:", e);
        const errDetail = e.message || "Erro de conexão. Tente novamente.";
        setSelectedItem((prev: any) => ({ ...prev, pixError: true, pixErrorMessage: errDetail }));
        setPixConfirmed(true);
      }
    };

    const pixReady = !!(selectedItem?.pixQrCode || selectedItem?.pixQrBase64 || selectedItem?.pixCopyPaste) && pixConfirmed;
    console.log("[DEBUG] Render Check Final:", { 
      pixConfirmed, 
      pixReady, 
      hasQr: !!selectedItem?.pixQrCode, 
      hasBase64: !!selectedItem?.pixQrBase64,
      hasCP: !!selectedItem?.pixCopyPaste,
      id: selectedItem?.id
    });

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
        <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
          <button onClick={() => { setSubView("checkout"); setPixConfirmed(false); setPixCpf(""); }}
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-white uppercase tracking-tight">Pagamento PIX</h1>
        </header>

        <main className="px-5 pt-8 flex flex-col items-center gap-6 max-w-sm mx-auto w-full">

          {/* Valor */}
          <div className="text-center">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total a pagar</p>
            <p className="text-4xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}>
              R$ {total.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {/* CPF */}
          {!pixConfirmed && (
            <div className="w-full space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CPF do Pagador</label>
              <input
                type="text"
                inputMode="numeric"
                value={pixCpf}
                onChange={(e) => setPixCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium tracking-widest"
              />
            </div>
          )}

          {/* Botão confirmar */}
          {pixCpf.replace(/\D/g,"").length === 11 && !pixConfirmed && (
            <button onClick={handlePixConfirm}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
              Gerar QR Code PIX
            </button>
          )}

          {/* Loading */}
          {pixConfirmed && !pixReady && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8">
              <div className="size-12 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm font-black uppercase tracking-wider">Gerando PIX...</p>
            </motion.div>
          )}

          {/* QR Code real ou Erro */}
          {pixReady && !selectedItem?.pixError && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-5">
              <div className="w-52 h-52 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,215,9,0.2)] p-3">
                {selectedItem?.pixQrBase64 ? (
                  <img src={`data:image/png;base64,${selectedItem.pixQrBase64}`} className="w-full h-full" alt="QR PIX" />
                ) : (
                  <span className="material-symbols-outlined text-[120px] text-zinc-800">qr_code_2</span>
                )}
              </div>
              <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <p className="text-zinc-400 text-xs font-mono truncate flex-1">{selectedItem?.pixCopyPaste?.slice(0, 40)}...</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(selectedItem?.pixCopyPaste || ""); toastSuccess("PIX copiado!"); }}
                  className="text-yellow-400 active:scale-90 transition-all shrink-0">
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Aguardando pagamento...</p>
              </div>
              <button
                onClick={() => { setTab("orders"); setSubView("none"); setPixConfirmed(false); setPixCpf(""); setSelectedItem(null); }}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:border-yellow-400/30 hover:text-yellow-400 transition-all active:scale-95">
                Ver Meus Pedidos
              </button>
            </motion.div>
          )}

          {pixConfirmed && selectedItem?.pixError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center gap-6 py-6 text-center">
               <div className="size-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Ops! Falha no QR Code</h3>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed px-4">
                     O pedido foi enviado ao lojista, mas não conseguimos gerar o QR Code Pix agora. 
                     {selectedItem.pixErrorMessage ? ` Detalhe: ${selectedItem.pixErrorMessage}` : " Você pode tentar pagar através de outro método ou falar com o suporte."}
                  </p>
               </div>
               <div className="w-full space-y-3">
                  <button onClick={() => { setTab("orders"); setSubView("none"); setSelectedItem(null); }}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest">
                    Acompanhar Pedido
                  </button>
                  <button onClick={() => { setSubView("checkout"); setPixConfirmed(false); }}
                    className="w-full py-4 rounded-2xl text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                    Tentar outro método
                  </button>
               </div>
            </motion.div>
          )}

          {!pixConfirmed && (
            <button onClick={() => setSubView("checkout")} className="text-zinc-600 text-sm font-black uppercase tracking-widest hover:text-zinc-400 transition-colors">
              Cancelar
            </button>
          )}

        </main>
      </div>
    );
  };

  const renderCardPayment = () => {
    const isCoinPurchase = selectedItem?.service_type === 'coin_purchase';
    const isSubscription = paymentsOrigin === "izi_black";
    
    let total = 0;
    if (isCoinPurchase || isSubscription) {
      total = selectedItem?.total_price || 0;
    } else {
      const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
      const discountValue = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
      total = Math.max(0, subtotal - discountValue);
    }

    const handleConfirmCard = async (token: string, _issuer: string, _installments: number, brand: string, _last4: string) => {
        setIsLoading(true);
        try {
            const isSubscription = paymentsOrigin === "izi_black";
            const isCoinPurchase = selectedItem?.service_type === 'coin_purchase';
            
            let orderId = selectedItem?.id;

            if (!isCoinPurchase) {
              const orderBase = {
                  user_id: userId,
                  merchant_id: isSubscription ? null : (selectedShop?.id || null),
                  total_price: total,
                  status: "pendente_pagamento",
                  pickup_address: isSubscription ? "Assinatura Izi Black" : (selectedShop?.name || "Estabelecimento"),
                  delivery_address: isSubscription ? "Serviço Digital" : (userLocation.address || "Endereço não informado"),
                  items: cart,
                  payment_method: "cartao",
                  service_type: isSubscription ? "subscription" : "restaurant",
              };

              console.log("[DIAG] Payload Cartão preparado:", orderBase);
              const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(orderBase).select().single();
              
              if (insertError || !order) { 
                toastError("Erro ao criar pedido: " + (insertError?.message || "Erro desconhecido")); 
                return; 
              }
              orderId = order.id;
            } else {
              // Se for compra de moedas, apenas garante que o status está correto
              await supabase.from("orders_delivery").update({ status: "pendente_pagamento" }).eq("id", orderId);
            }

            const cleanEmail = (user?.email || loginEmail || "cliente@izidelivery.com").trim().toLowerCase();
            const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
                body: {
                    amount: Number(total.toFixed(2)),
                    orderId: orderId,
                    payment_method_id: brand.toLowerCase().includes('visa') ? 'visa' : 'master',
                    token: token,
                    email: cleanEmail,
                    installments: 1
                },
            });

            const isSuccess = !fnErr && fnData && fnData.success === true && fnData.status === 'approved';

            if (!isSuccess) {
                const mpMsg = fnData?.details || fnData?.error || fnErr?.message || "O cartão foi recusado pela operadora.";
                toastError(`Pagamento não aprovado: ${mpMsg}`);
                
                if (fnData?.raw) {
                   console.error("[DETALHES BRUTOS MP]:", fnData.raw);
                }
                if (isSubscription) {
                  setSubView("izi_black_purchase");
                } else if (isCoinPurchase) {
                  setShowDepositModal(true);
                  setSubView("none");
                } else {
                  setSubView("checkout");
                }
                return;
            }

            if (isSubscription) {
                await supabase.from('users_delivery').update({ is_izi_black: true }).eq('id', userId);
                setIsIziBlackMembership(true);
                setIziBlackStep('success');
                setSubView("izi_black_purchase");
            } else if (isCoinPurchase) {
                setSubView("izi_coin_tracking");
            } else {
                const { data: updatedOrder } = await supabase.from("orders_delivery").select().eq("id", orderId).single();
                setSelectedItem(updatedOrder || { id: orderId });
                await clearCart(orderId);
                setTab("orders");
                setSubView("none");
            }
            toastSuccess(isSubscription ? "Assinatura IZI Black ativada!" : "Pedido aprovado!");

        } catch (err: any) {
            console.error("Card processing error:", err);
            toastError("Instabilidade na rede. Tente novamente.");
            if (isSubscription) {
              setSubView("izi_black_purchase");
            } else if (isCoinPurchase) {
              setShowDepositModal(true);
              setSubView("none");
            } else {
              setSubView("checkout");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <div className="absolute inset-0 z-40 bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-10">
        <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-6 border-b border-zinc-900 text-white">
          <button onClick={() => {
              if (selectedItem?.service_type === 'coin_purchase') {
                setShowDepositModal(true);
                setSubView("none");
              } else if (paymentsOrigin === "izi_black") {
                setSubView("izi_black_purchase");
              } else {
                setSubView("checkout");
              }
            }}
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <div className="flex flex-col text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none">Cartão de Crédito</h1>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{selectedShop?.name || 'Venda Digital'}</p>
          </div>
        </header>

        <main className="px-5 pt-10 max-w-sm mx-auto w-full space-y-10">
          <div className="text-center">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Valor Final</p>
            <p className="text-5xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,215,9,0.2)" }}>R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-900/50 p-6 rounded-[40px] shadow-2xl">
              <MercadoPagoCardForm onConfirm={handleConfirmCard} publicKey={appSettings?.mercadopago_public_key} />
          </div>
          
          <div className="flex flex-col items-center gap-4 py-4">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-zinc-700 text-sm">enhanced_encryption</span>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Certificado pela PCI DSS</p>
             </div>
             <p className="text-[10px] text-center text-zinc-700 uppercase tracking-widest font-bold max-w-[200px] leading-relaxed">
               Seus dados são encriptados de ponta a ponta e nunca armazenados em nossos servidores.
             </p>
          </div>
        </main>
      </div>
    );
  };

  const renderOrders = () => {
    const FINISHED_STATUSES = ["concluido", "cancelado"];
    const activeOrders    = myOrders.filter(o => o && !FINISHED_STATUSES.includes(o.status) && !o.scheduled_at);
    const scheduledOrders = myOrders.filter(o => o && o.scheduled_at && !FINISHED_STATUSES.includes(o.status));
    const pastOrders      = myOrders.filter(o => o && FINISHED_STATUSES.includes(o.status));

    const statusLabel: Record<string, string> = {
      pending: "Aguardando", pendente: "Aguardando", novo: "Processando",
      waiting_driver: "Buscando Condutor",
      aceito: "Confirmado", confirmado: "Confirmado", preparando: "Em Preparação", pronto: "Pronto para Coleta",
      a_caminho: "Em Rota", a_caminho_coleta: "Motorista a Caminho", chegou_coleta: "Motorista no Local de Coleta", 
      no_local: "Motorista no seu Local", picked_up: "Coletado / Em Viagem", 
      em_rota: "A Caminho do Destino", saiu_para_entrega: "Saindo para Entrega",
      concluido: "Concluído", cancelado: "Cancelado",
    };

    const isMobility = (o: any) => ["mototaxi", "carro", "van", "utilitario"].includes(o.service_type);

    return (
      <div className="flex flex-col h-full bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar">

        <main className="px-5 pt-8 pb-10 max-w-2xl mx-auto w-full">

          {/* TABS */}
          <nav className="flex items-center gap-8 mb-10 overflow-x-auto no-scrollbar">
            {[
              { id: "ativos",     label: "Ativos",     count: activeOrders.length },
              { id: "agendados",  label: "Agendados",  count: scheduledOrders.length },
              { id: "historico",  label: "Histórico",  count: 0 },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id)}
                className="relative pb-2 group shrink-0"
              >
                <span className={`font-extrabold text-lg transition-colors ${filterTab === t.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                  {t.label}
                  {t.count > 0 && (
                    <span className="ml-2 text-[10px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded-full">{t.count}</span>
                  )}
                </span>
                <div className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${filterTab === t.id ? "w-full bg-yellow-400" : "w-0 bg-zinc-700"}`} />
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">

            {/* ATIVOS */}
            {filterTab === "ativos" && (
              <motion.div key="ativos" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-14">
                {activeOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <span className="material-symbols-outlined text-5xl text-zinc-800">shopping_bag</span>
                    <p className="text-zinc-600 text-sm font-medium">Nenhum pedido ativo no momento</p>
                  </div>
                ) : activeOrders.map((order) => (
                  <motion.article
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex flex-col md:flex-row items-start md:items-center gap-5"
                  >
                    <div className="relative w-28 h-28 shrink-0 bg-zinc-900/50 rounded-3xl flex items-center justify-center border border-zinc-800 overflow-hidden">
                      <div className="absolute inset-0 bg-zinc-900/60" />
                        <span
                        className="material-symbols-outlined absolute text-5xl text-yellow-400"
                        style={{ filter: "drop-shadow(0 0 15px rgba(255,215,9,0.5))", fontVariationSettings: "'FILL' 1" }}
                      >
                        {isMobility(order) ? (order.service_type === 'mototaxi' ? "two_wheeler" : "directions_car") : "restaurant"}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-1 block">
                            {statusLabel[order.status] || order.status}
                          </span>
                          <h3 className="font-extrabold text-xl text-white tracking-tight">
                            {order.merchant_name || (isMobility(order) ? (order.service_type === 'mototaxi' ? "Izi Moto" : "Izi Car") : "Pedido")}
                          </h3>
                        </div>
                        <span className="text-yellow-400 text-[10px] font-black bg-yellow-400/10 px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                          {statusLabel[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm max-w-xs">
                        {order.delivery_address || "Endereço de entrega"}
                      </p>
                      <div className="pt-3 flex items-center gap-3">
                        <button
                          onClick={() => { setSelectedItem(order); setSubView("order_detail"); }}
                          className="bg-yellow-400 text-black font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(255,215,9,0.25)] hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider"
                        >
                          Detalhes
                        </button>
                        <button
                          onClick={() => { setSelectedItem(order); setSubView("order_chat"); }}
                          className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors active:scale-95"
                        >
                          <span className="material-symbols-outlined">chat_bubble</span>
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}

            {/* AGENDADOS */}
            {filterTab === "agendados" && (
              <motion.div key="agendados" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-14">
                {scheduledOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <span className="material-symbols-outlined text-5xl text-zinc-800">event</span>
                    <p className="text-zinc-600 text-sm font-medium">Nenhum pedido agendado</p>
                  </div>
                ) : scheduledOrders.map((order) => (
                  <motion.article key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="relative flex flex-col md:flex-row items-start md:items-center gap-5"
                  >
                    <div className="relative w-28 h-28 shrink-0 bg-zinc-900/50 rounded-3xl flex items-center justify-center border border-zinc-800">
                      <span className="material-symbols-outlined text-5xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black block">Agendado</span>
                      <h3 className="font-extrabold text-xl text-white">{order.merchant_name || "Pedido Agendado"}</h3>
                      <p className="text-zinc-400 text-sm">{order.scheduled_at ? new Date(order.scheduled_at).toLocaleString("pt-BR") : ""}</p>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}

            {/* HISTÃÆ’ââ‚¬Å“RICO */}
            {filterTab === "historico" && (
              <motion.div key="historico" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {pastOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <span className="material-symbols-outlined text-5xl text-zinc-800">history</span>
                    <p className="text-zinc-600 text-sm font-medium">Nenhum pedido no histórico</p>
                  </div>
                ) : pastOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { setSelectedItem(order); setSubView("order_detail"); }}
                    className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-yellow-400/20 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl text-zinc-500 group-hover:text-yellow-400 transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isMobility(order) ? (order.service_type === 'mototaxi' ? "two_wheeler" : "directions_car") : "restaurant"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-white truncate">{order.merchant_name || "Pedido"}</h4>
                      <p className="text-zinc-500 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString("pt-BR")} ÃÂ¢ââ€šÂ¬Â¢ R$ {Number(order.total_price || 0).toFixed(2).replace(".", ",")}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${order.status === "concluido" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>

          {/* BOTTOM HINT */}
          <div className="mt-20 pt-8 border-t border-zinc-900 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-zinc-800 text-4xl mb-3">shopping_bag</span>
            <p className="text-zinc-600 text-sm font-medium">
              Não vê um pedido?{" "}
              <button onClick={() => userId && fetchMyOrders(userId)} className="text-yellow-400/60 hover:text-yellow-400 transition-colors">
                Atualizar lista
              </button>
            </p>
          </div>

        </main>
      </div>
    );
  };

  const renderPaymentProcessing = () => (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
      <div className="size-20 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-6" />
      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Processando Pagamento</h2>
      <p className="text-zinc-400 mt-2 font-medium">Aguarde um instante, estamos confirmando tudo... ⚡</p>
    </div>
  );

  const renderOrderDetail = () => {
    if (!selectedItem) return null;

    const items = getOrderItems(selectedItem);
    const statusLabel = getOrderStatusLabel(selectedItem.status);
    const statusTone = getOrderStatusTone(selectedItem.status);
    const address = getOrderAddress(selectedItem);
    const orderDate = selectedItem.created_at
      ? new Date(selectedItem.created_at).toLocaleString("pt-BR")
      : "Agora";
    const isTrackable = isOrderTrackable(selectedItem.status);
    const isCompleted = selectedItem.status === "concluido";
    const serviceIcon = ["mototaxi", "carro", "van", "utilitario"].includes(selectedItem.service_type)
      ? selectedItem.service_type === "mototaxi"
        ? "two_wheeler"
        : "directions_car"
      : "restaurant";

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-zinc-900 px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => setSubView("none")}
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Detalhes do Pedido</p>
            <h1 className="text-base font-extrabold text-white truncate">
              {selectedItem.merchant_name || "Pedido Izi"}
            </h1>
          </div>
          <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusTone}`}>
            {statusLabel}
          </div>
        </header>

        <main className="px-5 py-8 space-y-6">
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-[32px] p-6 flex items-start gap-4">
            <div className="size-14 rounded-3xl bg-yellow-400/10 border border-yellow-400/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                {serviceIcon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pedido #{String(selectedItem.id).slice(-8).toUpperCase()}</p>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">
                {selectedItem.merchant_name || "Pedido Izi"}
              </h2>
              <p className="text-zinc-500 text-xs mt-2">{orderDate}</p>
              <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                {address}
              </p>
            </div>
          </section>

          <section className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Itens</h3>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item: any, index: number) => (
                  <div key={item.id || `${item.name}-${index}`} className="flex items-start justify-between gap-4 border-b border-zinc-800/80 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-yellow-400 shrink-0">
                        {item.quantity || 1}x
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{item.name || item.product_name || "Produto"}</p>
                        {item.options && item.options.length > 0 && (
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                            {item.options.map((option: any) => option.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {typeof item.price === "number" ? (
                        <p className="text-sm font-black text-white">
                          R$ {Number((item.price || 0) * (item.quantity || 1)).toFixed(2).replace(".", ",")}
                        </p>
                      ) : (
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Incluído</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-zinc-800">receipt_long</span>
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">Itens não disponíveis neste pedido</p>
              </div>
            )}
          </section>

          <section className="bg-zinc-900/30 border border-zinc-800 rounded-[32px] p-6 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Resumo Financeiro</h3>
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
              <span>Subtotal</span>
              <span className="text-zinc-300">
                R$ {Number((selectedItem.total_price || 0) - (selectedItem.delivery_fee || 0) + (selectedItem.discount || 0)).toFixed(2).replace(".", ",")}
              </span>
            </div>
            {(selectedItem.delivery_fee || 0) > 0 && (
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
                <span>Entrega</span>
                <span className="text-yellow-400">+ R$ {Number(selectedItem.delivery_fee || 0).toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            {(selectedItem.discount || 0) > 0 && (
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
                <span>Desconto</span>
                <span className="text-rose-400">- R$ {Number(selectedItem.discount || 0).toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Total</span>
              <span className="text-2xl font-black text-white italic tracking-tight">
                R$ {Number(selectedItem.total_price || 0).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Pago via {String(selectedItem.payment_method || "pix").toUpperCase()}
            </p>
          </section>

          <section className="grid grid-cols-1 gap-3">
            {isTrackable && (
              <button
                onClick={() => setSubView("active_order")}
                className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black text-[11px] uppercase tracking-widest shadow-[0_0_24px_rgba(255,215,9,0.2)] active:scale-95 transition-all"
              >
                Acompanhar Pedido
              </button>
            )}
            {isCompleted && (
              <button
                onClick={() => setSubView("order_feedback")}
                className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
              >
                Avaliar Experiência
              </button>
            )}
            <button
              onClick={() => setSubView("order_support")}
              className="w-full py-4 rounded-2xl border border-zinc-800 text-zinc-300 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Preciso de Ajuda
            </button>
          </section>
        </main>
      </div>
    );
  };
  
  const renderPaymentError = () => (
    <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-red-500/5 blur-[120px] rounded-full animate-pulse" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm clay-card-dark rounded-[50px] p-10 text-center relative border border-white/5"
      >
        <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <span className="material-symbols-outlined text-4xl text-red-500 fill-1">error</span>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ops! Algo deu errado</h2>
        <p className="text-zinc-500 mt-2 mb-8 font-bold text-xs uppercase tracking-widest leading-relaxed">
          Não conseguimos processar seu pagamento. Verifique os dados e tente novamente. ⚠️
        </p>
        <button onClick={() => setSubView("checkout")} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all">
          Tentar Novamente
        </button>
      </motion.div>
    </div>
  );

  const renderPaymentSuccess = () => (
    <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm clay-card-dark rounded-[50px] p-10 text-center relative border border-white/5"
      >
        <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <span className="material-symbols-outlined text-4xl text-emerald-500 fill-1">check_circle</span>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pagamento Aprovado!</h2>
        <p className="text-zinc-500 mt-2 mb-8 font-bold text-xs uppercase tracking-widest leading-relaxed">
          Sucesso! Seu pedido já está com o estabelecimento. Prepare-se para uma experiência incrível. ✨
        </p>
        <button onClick={() => { setTab("orders"); setSubView("none"); }} className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-[0_15px_30px_rgba(16,185,129,0.2)]">
          Acompanhar Pedido
        </button>
      </motion.div>
    </div>
  );

  const renderWaitingMerchant = () => (
    <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm clay-card-dark rounded-[50px] p-10 text-center relative border border-white/5"
      >
        <div className="size-24 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          <span className="material-symbols-outlined text-5xl text-blue-500 relative z-10 fill-1">storefront</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
            Aguardando <br/>
            <span className="text-blue-500">Loja</span>
          </h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-relaxed px-4">
            O estabelecimento está analisando seu pedido agora mesmo. Fique de olho! ⏱️
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
            <span className="size-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="size-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          
          <button 
            onClick={() => setSubView("none")} 
            className="w-full py-5 bg-zinc-900/50 border border-white/5 rounded-[24px] text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </motion.div>
    </div>
  );

      // [Comentario Limpo pelo Sistema]

  // renderOrderChat removido (funcionalidade em renderOrderChatFlow)

  // renderOrderSupport removido (funcionalidade em renderOrderSupportFlow)

      // [Comentario Limpo pelo Sistema]

      // [Comentario Limpo pelo Sistema]


  const renderAddresses = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => { if (isAddingAddress) { resetAddressForm(); } else { setSubView("none"); } }} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">{isAddingAddress ? (editingAddress ? 'Editar Endereço' : 'Novo Endereço') : 'Endereços'}</h1>
          </div>
          {!isAddingAddress && (
            <button onClick={() => { resetAddressForm(); setIsAddingAddress(true); }} className="text-yellow-400 active:scale-90 transition-all">
              <span className="material-symbols-outlined">add</span>
            </button>
          )}
        </header>

        <main className="px-5 pt-2 flex flex-col flex-1">
          <AnimatePresence mode="wait">
            {isAddingAddress ? (
              <motion.div key="address-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 py-4">
                {/* Seleção rápida de rótulo */}
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Tipo de endereço</p>
                  <div className="flex gap-3">
                    {[
                      { label: 'Casa', icon: 'home' },
                      { label: 'Trabalho', icon: 'work' },
                      { label: 'Outro', icon: 'location_on' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setNewAddrLabel(opt.label === 'Outro' ? '' : opt.label)}
                        className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
                          newAddrLabel === opt.label
                            ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo Rótulo (personalizado) */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Rótulo</label>
                  <input
                    type="text"
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    placeholder="Ex: Casa, Trabalho, Mãe..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* Campo Rua/Endereço com Autocomplete */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Endereço Completo</label>
                  <AddressSearchInput
                    placeholder="Busque rua, nÃÆ’Âºmero, bairro..."
                    initialValue={newAddrStreet}
                    userCoords={userLocation?.lat && userLocation?.lng ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(place: any) => {
                      setNewAddrStreet(place.formatted_address || "");
      // [Comentario Limpo pelo Sistema]
                      if (place.address_components) {
                        const cityComp = place.address_components.find((c: any) => c.types.includes("administrative_area_level_2"));
                        if (cityComp) setNewAddrCity(cityComp.long_name);
                      }
                    }}
                    onClear={() => setNewAddrStreet("")}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* Campo Complemento */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Complemento (opcional)</label>
                  <input
                    type="text"
                    value={newAddrDetails}
                    onChange={(e) => setNewAddrDetails(e.target.value)}
                    placeholder="Apto 201, Bloco B..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* Campo Cidade */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cidade (opcional)</label>
                  <input
                    type="text"
                    value={newAddrCity}
                    onChange={(e) => setNewAddrCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* Botão Salvar */}
                <button
                  onClick={handleSaveAddress}
                  disabled={isSavingAddress || !newAddrLabel.trim() || !newAddrStreet.trim()}
                  className="w-full bg-yellow-400 text-black font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-yellow-400/20 active:scale-[0.97] transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 mt-2"
                >
                  {isSavingAddress ? (
                    <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      {editingAddress ? 'Atualizar Endereço' : 'Salvar Endereço'}
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div key="address-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {savedAddresses.length === 0 ? (
                  <div className="flex flex-col items-center py-24 gap-5">
                    <div className="size-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-zinc-700">location_off</span>
                    </div>
                    <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Nenhum endereço salvo</p>
                    <button
                      onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                      className="bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-yellow-400/20"
                    >
                      Adicionar primeiro endereço
                    </button>
                  </div>
                ) : savedAddresses.map((addr: any, i: number) => (
                  <motion.div key={addr.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0 w-full group">
                    {/* ÃÆ’ cone + Info */}
                    <button
                      onClick={() => handleSetActiveAddress(addr.id)}
                      className="flex items-center gap-4 flex-1 min-w-0 text-left active:opacity-60 transition-all"
                    >
                      <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${addr.active ? 'bg-yellow-400/15 text-yellow-400' : 'bg-zinc-900 text-zinc-600'}`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {addr.label?.toLowerCase().includes("casa") ? "home" : addr.label?.toLowerCase().includes("trabalho") ? "work" : "location_on"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-white">{addr.label || "Endereço"}</p>
                          {addr.active && <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Padrão</span>}
                        </div>
                        <p className="text-zinc-600 text-xs mt-0.5 truncate">{addr.street}{addr.details ? `, ${addr.details}` : ""}</p>
                      </div>
                    </button>
                    {/* AçÃÆ’Âµes */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditAddress(addr)}
                        className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-blue-400 active:scale-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 active:scale-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
                {savedAddresses.length > 0 && (
                  <button
                    onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                    className="flex items-center gap-3 py-5 text-zinc-700 hover:text-yellow-400 transition-all active:scale-[0.98] mt-2"
                  >
                    <span className="material-symbols-outlined text-xl">add_location</span>
                    <span className="text-sm font-black uppercase tracking-wider">Adicionar novo endereço</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  };

  const renderPayments = () => {
    const handleBack = () => {
      if (paymentsOrigin === "checkout") setSubView("checkout");
      else if (paymentsOrigin === "izi_black") setSubView("izi_black_purchase");
      else setSubView("none");
    };

    return (
      <>
        <PaymentMethodsView 
          savedCards={savedCards}
          onBack={handleBack}
          onAddCard={() => setIsAddingCard(true)}
          onSetDefault={handleSetPrimaryCard}
          onDelete={handleDeleteCard}
          isLoading={isLoadingCards}
          onDepositPix={() => {
            setDepositPaymentMethod("pix");
            setShowDepositModal(true);
          }}
        />

        {/* MODAL: ADD CARD */}
        <AnimatePresence>
          {isAddingCard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-white tracking-tight">Novo Cartão</h3>
                  <button onClick={() => setIsAddingCard(false)} className="size-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400">close</span>
                  </button>
                </div>
                
                <MercadoPagoCardForm 
                  publicKey={appSettings?.mercadopago_public_key}
                  onConfirm={async (token, issuer, _installments, brand, last4) => {
                   setIsLoadingCards(true);
                   try {
                     const { data: inserted, error } = await supabase.from("payment_methods").insert({
                       user_id: userId,
                       brand: brand,
                       last_four: last4,
                       is_default: savedCards.length === 0,
                       token: token
                     }).select().single();

                     if (error) throw error;

                     if (userId) await fetchSavedCards(userId);
                     setIsAddingCard(false);
                     toastSuccess("Cartão adicionado!");
                     
                     if (paymentsOrigin === "checkout") {
                        setSubView("checkout");
                        setPaymentMethod("cartao");
                        if (inserted) setSelectedCard({
                          id: inserted.id,
                          brand: inserted.brand,
                          last4: inserted.last_four,
                          mp_token: inserted.token
                        });
                     }
                   } catch (err: any) {
                     toastError("Erro ao salvar: " + err.message);
                   } finally {
                     setIsLoadingCards(false);
                   }
                }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };


  
  const renderMyQRModal = () => (
    <AnimatePresence>
      {isShowingMyQR && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[45px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 size-48 bg-yellow-400/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 size-48 bg-yellow-400/5 rounded-full blur-[80px]" />
            
            <button onClick={() => setIsShowingMyQR(false)} className="absolute top-6 right-6 size-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-500">close</span>
            </button>

            <div className="size-20 rounded-[28px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-4xl text-yellow-400">qr_code_2</span>
            </div>
            
            <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Meu IZI Code</h3>
            <p className="text-zinc-500 text-xs font-medium mb-10 leading-relaxed px-4">Compartilhe para receber transferências instantâneas de IZI COINS.</p>

            <div className="p-6 bg-white rounded-[40px] shadow-inner mb-10 relative group">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=izi:transfer:${userId}:${loginEmail}:${phone}`} 
                alt="QR Code" 
                className="size-56 object-contain"
              />
              <div className="absolute inset-0 border-[12px] border-white rounded-[40px] pointer-events-none" />
            </div>

            <div className="space-y-1">
              <p className="font-black text-white text-base tracking-tight">{userName}</p>
              <p className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest">{loginEmail}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  
  const renderTransferModal = () => (
    <AnimatePresence>
      {transferTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[50px] p-8 text-center space-y-8 relative">
            
            <button onClick={() => setTransferTarget(null)} className="absolute top-6 right-6 size-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-500">close</span>
            </button>

            <div className="size-24 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-2">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${transferTarget.email}`} className="size-full rounded-full" />
            </div>

            <div className="space-y-1">
              <p className="font-black text-2xl text-white tracking-tight">Transferir IZI COINS</p>
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Para: {transferTarget.email}</p>
              <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">{transferTarget.phone || "Sem telefone"}</p>
            </div>

            <div className="bg-zinc-950 p-6 rounded-[35px] border border-white/5">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Valor da Transferência</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-black text-yellow-400 opacity-40 italic">IZI</span>
                <input 
                  type="number" 
                  placeholder="0,00"
                  className="bg-transparent border-none text-4xl font-black text-white text-center w-full focus:ring-0 placeholder:text-zinc-800"
                />
              </div>
            </div>

            <button className="w-full bg-yellow-400 text-black font-black text-sm uppercase tracking-widest py-6 rounded-3xl shadow-xl shadow-yellow-400/20 active:scale-95 transition-all">
              Confirmar Envio Instantâneo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );



  const renderWallet = () => {
    return (
      <WalletView 
        mercadopagoPublicKey={appSettings?.mercadopago_public_key}
        walletTransactions={walletTransactions}
        myOrders={myOrders}
        userXP={userXP}
        iziCoins={iziCoins}
        setIziCoins={setIziCoins}
        iziCashback={iziCashbackEarned}
        savedCards={savedCards}
        paymentMethod={paymentMethod}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        userId={userId}
        userName={userName}
        showToast={showToast as any}
        setShowDepositModal={setShowDepositModal}
        iziCoinValue={appSettings?.iziCoinRate || globalSettings?.izi_coin_rate || 1.0}
        iziCoinRate={appSettings?.iziCoinRate || globalSettings?.izi_coin_rate || 1.0}
        iziBlackRate={globalSettings?.izi_black_cashback || 5.0}
      />
    );
  };

  const renderOrderFeedback = () => {
    const handleSubmit = async () => {
      if (shopRating === 0 || driverRating === 0) { 
        showToast("Por favor, avalie o estabelecimento e o entregador.", "warning");
        return; 
      }
      
      setFbIsSubmitting(true);
      try {
        if (selectedItem?.id) {
          await supabase.from("orders_delivery").update({ 
            rating: shopRating, 
            feedback: fbComment,
            driver_rating: driverRating
          }).eq("id", selectedItem.id);
        }
        
        setUserXP((prev: number) => prev + 50);
        showToast("Obrigado pelo seu feedback! +50 XP", "success");
        setSubView("none");
      } catch (e) { 
        console.error(e); 
        showToast("Erro ao enviar avaliação.", "warning");
      } finally {
        setFbIsSubmitting(false);
      }
    };

    if (!selectedItem) {
      console.warn("Feedback tentou carregar sem selectedItem");
      return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 text-center">
          <div className="size-20 bg-yellow-400/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="material-symbols-outlined text-yellow-500 text-4xl">inventory_2</span>
          </div>
          <h2 className="text-white font-black uppercase text-lg tracking-widest mb-2">Carregando Pedido...</h2>
          <p className="text-zinc-600 text-xs">Sintonizando com a central Izi Delivery</p>
          <button onClick={() => setSubView("none")} className="mt-8 text-yellow-500 text-[10px] font-black uppercase tracking-widest">Fechar</button>
        </div>
      );
    }

    const orderId = selectedItem?.id || activeOrderId || "000000";

    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="fixed inset-0 z-[100] bg-black flex flex-col pt-12"
      >
        <div className="px-6 flex justify-between items-center mb-8">
          <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Feedback Izi</p>
            <p className="text-xs text-zinc-500 font-bold">Pedido #DT-{String(orderId).slice(0,6).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-10 pb-10">
          <header className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Sua Experiência</h2>
            <p className="text-zinc-500 text-sm font-medium">Como foi o serviço hoje?</p>
          </header>

          <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px] space-y-5">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-500">storefront</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm uppercase tracking-wider">{selectedItem?.merchant_name || 'Estabelecimento'}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Avalie os produtos e preparo</p>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setShopRating(s)} className="p-1">
                  <span className={`material-symbols-outlined text-4xl transition-all duration-300 ${s <= shopRating ? 'text-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-zinc-800'}`} style={{ fontVariationSettings: s <= shopRating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px] space-y-5">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-500">delivery_dining</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black text-sm uppercase tracking-wider">O Entregador</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Avalie a agilidade e educação</p>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setDriverRating(s)} className="p-1">
                  <span className={`material-symbols-outlined text-4xl transition-all duration-300 ${s <= driverRating ? 'text-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-zinc-800'}`} style={{ fontVariationSettings: s <= driverRating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                </button>
              ))}
            </div>
          </section>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">ObservaçÃÆ’Âµes adicionais</label>
            <textarea 
              value={fbComment}
              onChange={(e) => setFbComment(e.target.value)}
              placeholder="Escreva algo sobre sua experiência..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-[24px] p-5 text-zinc-100 text-sm focus:border-yellow-500 outline-none transition-all min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-black border-t border-zinc-900">
          <button 
            onClick={handleSubmit}
            disabled={fbIsSubmitting}
            className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${fbIsSubmitting ? 'bg-zinc-800 text-zinc-500' : 'bg-yellow-500 text-black hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] active:scale-95'}`}
          >
            {fbIsSubmitting ? 'Enviando...' : 'Confirmar Avaliação'}
            {!fbIsSubmitting && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
          </button>
        </div>
      </motion.div>
    );
  };


  const renderOrderChatFlow = () => {
    const backView = isOrderTrackable(selectedItem?.status) ? "active_order" : "order_support";

    const sendMsg = () => {
      if (!chatInput.trim()) return;

      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat-user-${Date.now()}`,
          sender: "user",
          text: chatInput,
          time: "agora",
        },
      ]);
      setChatInput("");
    };

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col">
        <header className="bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView(backView)} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <div>
            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Chat</h1>
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">
              {selectedItem?.driver_name || selectedItem?.merchant_name || "Suporte Izi"} Online
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-4">
          {chatMessages.map((message, index) => (
            <div key={message.id || index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium ${message.sender === "user" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-300"}`}>
                <p>{message.text}</p>
                <p className={`text-[9px] mt-1 ${message.sender === "user" ? "text-black/50" : "text-zinc-600"} text-right`}>{message.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-zinc-900 flex items-center gap-3">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-zinc-900/50 border-b border-zinc-900 rounded-2xl py-3 px-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/20 transition-all"
          />
          <button onClick={sendMsg} className="size-11 rounded-full bg-yellow-400 flex items-center justify-center active:scale-90 transition-all shrink-0">
            <span className="material-symbols-outlined text-black" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>
    );
  };

  const renderOrderSupportFlow = () => {
    const topics = [
      { icon: "local_shipping", label: "Meu pedido está atrasado" },
      { icon: "cancel", label: "Quero cancelar meu pedido" },
      { icon: "swap_horiz", label: "Item errado ou faltando" },
      { icon: "payments", label: "Problema com pagamento" },
      { icon: "help", label: "Outro problema" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Suporte</h1>
        </header>

        <main className="px-5 py-8 space-y-10">
          <div>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-2">Central de Ajuda</p>
            <h2 className="text-2xl font-extrabold text-white tracking-tighter">Como podemos<br/>te ajudar?</h2>
          </div>

          <div className="flex flex-col">
            {topics.map((topic, index) => (
              <motion.button
                key={topic.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => openOrderChat(topic.label)}
                className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0 active:opacity-60 transition-all text-left group w-full"
              >
                <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400 transition-colors text-xl">{topic.icon}</span>
                <p className="font-black text-sm text-white flex-1">{topic.label}</p>
                <span className="material-symbols-outlined text-zinc-800 group-hover:text-yellow-400/50 transition-colors text-lg">chevron_right</span>
              </motion.button>
            ))}
          </div>

          <div className="pt-4">
            <p className="text-zinc-700 text-xs text-center mb-4">Ou fale diretamente com nosso time</p>
            <button
              onClick={() => openOrderChat()}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 border border-zinc-900 text-zinc-400 hover:border-yellow-400/20 hover:text-yellow-400"
            >
              <span className="material-symbols-outlined text-xl">chat_bubble</span>
              Iniciar Chat com Suporte
            </button>
          </div>
        </main>
      </div>
    );
  };

  const renderAIConcierge = () => {
    return <AIConciergePanel
      isOpen={isAIOpen}
      onClose={() => setIsAIOpen(false)}
      userName={userName}
      walletBalance={walletBalance}
      userLocation={userLocation}
      myOrders={myOrders}
      ESTABLISHMENTS={ESTABLISHMENTS}
    />;
  };

  const renderQuestCenter = () => {
    const quests = [
      { id: 1, title: "Explorador Urbano", desc: "Faça 3 pedidos em categorias diferentes", xp: 150, progress: 33, icon: "explore", color: "text-blue-400", bg: "bg-blue-400/10" },
      { id: 2, title: "Cliente Fiel",      desc: "Peça do mesmo restaurante 3 vezes",        xp: 100, progress: 66, icon: "favorite", color: "text-rose-400", bg: "bg-rose-400/10" },
      { id: 3, title: "Madrugador",        desc: "Faça um pedido antes das 9h",              xp: 80,  progress: 0,  icon: "wb_sunny", color: "text-amber-400", bg: "bg-amber-400/10" },
      { id: 4, title: "Gourmet",           desc: "Experimente 5 restaurantes diferentes",    xp: 200, progress: 20, icon: "restaurant", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    ];

    const ranking = [
      { rank: 1, name: "Izi Master", xp: 12450, medal: "text-yellow-400", avatar: "IM" },
      { rank: 2, name: "Pedro Silva", xp: 8900,  medal: "text-zinc-300", avatar: "PS" },
      { rank: 3, name: "Ana Souza",  xp: 7200,  medal: "text-orange-500", avatar: "AS" },
      { rank: 15, name: "Você",       xp: userXP, isMe: true, avatar: "VC" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
          <div className="flex items-center gap-5">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setSubView("none")} 
              className="size-12 rounded-[20px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl active:scale-95 px-0 py-0"
            >
              <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
            </motion.button>
            <div>
              <h1 className="font-black text-2xl text-white tracking-tighter uppercase italic leading-none">Quests & Ranking</h1>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2">Nível {userLevel} • {userXP} XP Acumulado</p>
            </div>
          </div>
        </header>

        <main className="px-6 py-10 space-y-12">

          {/* XP PROGRESS CARD - CLAY */}
          <section className="bg-zinc-900/40 p-8 rounded-[45px] border border-white/5 shadow-[20px_20px_40px_rgba(0,0,0,0.6),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[60px] rounded-full" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Infinity Tier</p>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-4xl font-black text-white italic tracking-tighter">Nível {userLevel}</h3>
                   <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                   </div>
                </div>
              </div>
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="size-16 rounded-[28px] bg-yellow-400 flex items-center justify-center shadow-[10px_10px_25px_rgba(250,204,21,0.2),inset_4px_4px_10px_rgba(255,255,255,0.6),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] border-2 border-yellow-300/30"
              >
                <span className="material-symbols-outlined text-3xl text-black/80 font-black" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              </motion.div>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">XP Progress</span>
                <span className="text-sm font-black text-white italic tabular-nums">{userXP} <span className="text-zinc-600 text-[10px] font-bold">/ {nextLevelXP}</span></span>
              </div>
              <div className="h-4 w-full bg-black/60 rounded-full p-1.5 shadow-inner border border-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min((userXP/nextLevelXP)*100,100)}%` }}
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-[length:200%_auto] animate-gradient-x rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
                />
              </div>
            </div>
          </section>

          {/* ACTIVE QUESTS - GRID */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
               <h2 className="font-black text-xl text-white tracking-tighter uppercase italic">Missões Ativas</h2>
               <div className="size-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-500 text-lg">bolt</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              {quests.map((q, i) => (
                <motion.div 
                  key={q.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-900/40 p-6 rounded-[35px] border border-white/5 shadow-[12px_12px_24px_rgba(0,0,0,0.3),-4px_-4px_12px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)] flex items-center gap-5 group"
                >
                  <div className={`size-14 rounded-[22px] ${q.bg} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0`}>
                    <span className={`material-symbols-outlined ${q.color} text-2xl`}>{q.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-black text-sm text-white tracking-tight leading-tight">{q.title}</p>
                      <div className="px-2 py-0.5 rounded-lg bg-yellow-400/10">
                         <span className="text-yellow-400 text-[9px] font-black">+{q.xp} XP</span>
                      </div>
                    </div>
                    <p className="text-zinc-500 text-[10px] leading-tight mb-3 opacity-70">{q.desc}</p>
                    <div className="h-1.5 w-full bg-black shadow-inner rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${q.progress}%` }}
                        className={`h-full bg-gradient-to-r ${q.progress === 100 ? 'from-emerald-400 to-green-500' : 'from-yellow-500 to-orange-500'}`} 
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* RANKING GLOBAL - CLAY LIST */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
               <h2 className="font-black text-xl text-white tracking-tighter uppercase italic">Ranking Semanal</h2>
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cidade: São Paulo</span>
            </div>

            <div className="bg-zinc-900/30 rounded-[45px] border border-white/5 p-4 shadow-inner space-y-2">
               {ranking.map((row, i) => (
                 <motion.div 
                   key={row.name}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 + (i * 0.1) }}
                   className={`flex items-center gap-4 p-4 rounded-[30px] border transition-all ${row.isMe ? 'bg-yellow-400 border-yellow-300 shadow-[8px_8px_16px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5)]' : 'bg-transparent border-transparent'}`}
                 >
                    <div className={`size-10 rounded-2xl flex items-center justify-center font-black text-xs ${row.isMe ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-500 shadow-inner'}`}>
                       {row.rank}
                    </div>
                    <div className={`size-12 rounded-full flex items-center justify-center font-black text-sm border ${row.isMe ? 'bg-black/20 border-black/10 text-black' : 'bg-zinc-900 border-white/5 text-zinc-300'}`}>
                       {row.avatar}
                    </div>
                    <div className="flex-1">
                       <p className={`font-black text-sm ${row.isMe ? 'text-black' : 'text-white'}`}>{row.name}</p>
                       <p className={`text-[9px] font-bold ${row.isMe ? 'text-black/60' : 'text-zinc-600'}`}>{row.xp.toLocaleString()} XP TOTAL</p>
                    </div>
                    {i < 3 && !row.isMe && (
                       <span className={`material-symbols-outlined text-2xl ${row.medal}`} style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    )}
                 </motion.div>
               ))}
            </div>
          </section>

        </main>
      </div>
    );
  };

  const renderNotificationsCenter = () => {
    const notifications = [
      { id: 1, title: 'Pedido Confirmado', content: 'Seu pedido da Casa do Baleiro está a caminho.', time: '2 min atrás', icon: 'shopping_bag', color: 'text-emerald-400', bg: 'bg-emerald-400/10', unread: true },
      { id: 2, title: 'Nova Quest Disponível', content: 'Complete 3 pedidos hoje e ganhe 50 XP extras!', time: '1h atrás', icon: 'bolt', color: 'text-yellow-400', bg: 'bg-yellow-400/10', unread: true },
      { id: 3, title: 'Promoção Izi Flash', content: 'Hambúrguer Gourmet com 50% de desconto por tempo limitado.', time: '3h atrás', icon: 'local_fire_department', color: 'text-orange-400', bg: 'bg-orange-400/10', unread: false },
      { id: 4, title: 'Izi Pay: Depósito', content: 'Seu depósito de R$ 50,00 foi processado com sucesso.', time: '5h atrás', icon: 'account_balance_wallet', color: 'text-blue-400', bg: 'bg-blue-400/10', unread: false },
      { id: 5, title: 'Nível Avançado!', content: 'Parabéns! Você alcançou o Nível 12 e desbloqueou novos badges.', time: '1 dia atrás', icon: 'military_tech', color: 'text-purple-400', bg: 'bg-purple-400/10', unread: false },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
          <div className="flex items-center gap-5">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setSubView("none")} 
              className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl active:scale-95 px-0 py-0"
            >
              <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
            </motion.button>
            <div>
              <h1 className="font-black text-2xl text-white tracking-tighter uppercase italic leading-none">Notificações</h1>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Seu resumo de atividades Izi</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-zinc-900/50 border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest active:scale-95 transition-all">
            Limpar
          </button>
        </header>

        <main className="px-6 py-10 space-y-6">
          {notifications.map((n, i) => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`p-6 rounded-[35px] border-2 flex items-start gap-5 transition-all active:scale-[0.98]
                ${n.unread 
                  ? 'bg-zinc-900/40 border-yellow-400/20 shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02)]' 
                  : 'bg-transparent border-white/5 shadow-none'
                }`}
            >
              <div className={`size-14 rounded-[22px] ${n.bg} flex items-center justify-center shadow-inner shrink-0 relative`}>
                <span className={`material-symbols-outlined ${n.color} text-2xl`}>{n.icon}</span>
                {n.unread && (
                  <div className="absolute -top-1 -right-1 size-3 bg-yellow-400 rounded-full border-2 border-black animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                   <p className={`font-black text-sm tracking-tight ${n.unread ? 'text-white' : 'text-zinc-400'}`}>{n.title}</p>
                   <span className="text-[9px] font-black text-zinc-600 uppercase italic shrink-0 ml-2">{n.time}</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${n.unread ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>{n.content}</p>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const handlePurchaseCoins = async (amount: number, method: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // 1. Criar um "pedido" de compra de moedas
      const { data: orderData, error: orderError } = await supabase
        .from("orders_delivery")
        .insert({
          user_id: userId,
          status: "pendente_pagamento",
          total_price: amount,
          pickup_address: `Compra de ${amount} IZI COINS`,
          delivery_address: "Recarga de Carteira",
          service_type: "coin_purchase",
          payment_method: method === "lightning" ? "bitcoin_lightning" : "cartao",
          delivery_fee: 0
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{activeBroadcast.title}</h3>
                 <p className="text-[12px] text-zinc-400 leading-relaxed font-medium">{activeBroadcast.message}</p>
               </div>

               <motion.button 
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   localStorage.setItem('last_izi_broadcast', activeBroadcast.id);
                   setActiveBroadcast(null);
                 }}
                 className="w-full bg-yellow-400 text-black font-black py-5 rounded-[22px] shadow-xl shadow-yellow-400/10 uppercase tracking-widest text-[10px]"
               >
                 Aproveitar
               </motion.button>
            </div>

            <button 
              onClick={() => {
                localStorage.setItem('last_izi_broadcast', activeBroadcast.id);
                setActiveBroadcast(null);
              }}
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
    const minVal = 1;
    const maxVal = 500; 

    const coinsToReceive = (Number(depositAmount) || 0) / coinRate;
    const integerPart = Math.floor(coinsToReceive);
    const fractionalPart = (coinsToReceive - integerPart).toFixed(8).substring(2);

    return (
      <AnimatePresence>
        {showDepositModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 italic"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className="w-full max-w-lg bg-[#111111] border-2 border-white/5 rounded-[60px] shadow-[25px_25px_50px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.02)] relative max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Glow Premium */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none" />
              
              <header className="shrink-0 px-10 pt-10 pb-6 flex items-center justify-between relative z-50">
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Izi Store</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Câmbio Instantâneo</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDepositModal(false)}
                  className="size-14 rounded-[28px] bg-[#0d0d0d] border-2 border-white/5 flex items-center justify-center text-white shadow-[10px_10px_20px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02)]"
                >
                  <span className="material-symbols-outlined font-black text-2xl">close</span>
                </motion.button>
              </header>

              <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-10 space-y-12 relative z-10 italic">
                {/* Display de Conversão Claymorphism */}
                <section className="relative py-10 rounded-[45px] bg-[#0d0d0d] border-2 border-white/5 shadow-inner flex flex-col items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-yellow-400/[0.02] pointer-events-none" />
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.6em] mb-6 relative z-10">Você Receberá</p>
                      <div className="flex items-baseline justify-center relative z-10">
                         <span className="text-6xl font-black text-white tracking-tighter italic tabular-nums">
                           {integerPart.toLocaleString('pt-BR')}
                         </span>
                         <span className="text-2xl font-black text-yellow-400/50 tracking-tighter italic ml-1 tabular-nums">
                           ,{fractionalPart}
                         </span>
                         <div className="size-16 ml-6 drop-shadow-[0_8px_15px_rgba(250,204,21,0.2)]">
                            <img 
                              src={iziCoinImg} 
                              alt="Izi Coin" 
                              className="w-full h-full object-contain"
                            />
                         </div>
                      </div>
                   <div className="mt-8 px-5 py-2 rounded-full bg-black/40 border border-white/5">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Taxa Fixa: <span className="text-emerald-400">1 IZI = R$ {coinRate.toFixed(2).replace(".", ",")}</span></p>
                   </div>
                </section>

                {/* Slider Control Claymorphism */}
                <section className="space-y-10 px-2">
                  <div className="flex justify-between items-end">
                     <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Valor em Reais</label>
                        <h4 className="text-3xl font-black text-white italic tracking-tight">R$ {Number(depositAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                     </div>
                     <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Limite Diário</span>
                        <span className="text-[10px] font-black text-white italic">R$ 5K</span>
                     </div>
                  </div>
                  
                  <div className="relative pt-2">
                    <input 
                      type="range"
                      min={minVal}
                      max={maxVal}
                      step={1}
                      value={depositAmount || minVal}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full h-4 appearance-none bg-[#0a0a0a] rounded-full outline-none shadow-inner border border-white/5
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-10 
                               [&::-webkit-slider-thumb]:bg-yellow-400 [&::-webkit-slider-thumb]:rounded-[18px] 
                               [&::-webkit-slider-thumb]:shadow-[inset_4px_4px_8px_rgba(255,255,255,0.7),0_10px_20px_rgba(250,204,21,0.2)]
                               [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                               active:[&::-webkit-slider-thumb]:scale-90"
                    />
                    <div className="flex justify-between mt-6">
                       <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em]">Mín R$ {minVal}</span>
                       <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em]">Máx R$ {maxVal}</span>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="flex items-center gap-5 bg-[#0a0a0a] border-2 border-white/5 rounded-[40px] py-2 pl-10 pr-2 focus-within:border-yellow-400/20 transition-all shadow-inner">
                       <span className="text-zinc-700 font-black text-xl italic">R$</span>
                       <input 
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0,00"
                        className="flex-1 bg-transparent border-none text-2xl font-black text-white outline-none italic py-5 tabular-nums"
                      />
                      <div className="size-14 rounded-[24px] bg-zinc-900 flex items-center justify-center border border-white/5 shadow-xl">
                        <span className="material-symbols-outlined text-yellow-400 text-2xl font-black">keyboard</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Métodos de Pagamento Claymorphism */}
                <section className="space-y-6">
                   <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] px-2">Método de Checkout</h3>
                   <div className="grid grid-cols-3 gap-5 pb-4">
                      {[
                        { id: 'cartao', icon: 'credit_card', label: 'Cartão', color: 'text-blue-400' },
                        { id: 'pix', icon: 'pix', label: 'Pix', color: 'text-emerald-400' },
                        { id: 'lightning', icon: 'bolt', label: 'Bitcoin Lightning', color: 'text-orange-400' }
                      ].map((method) => (
                       <button
                         key={method.id}
                         onClick={() => setDepositPaymentMethod(method.id)}
                         className={`p-6 rounded-[35px] border-2 transition-all flex flex-col items-center justify-center gap-3 group italic relative active:scale-95
                           ${depositPaymentMethod === method.id 
                             ? "bg-yellow-400 border-yellow-400 text-black shadow-[15px_15px_30px_rgba(250,204,21,0.1),inset_4px_4px_8px_rgba(255,255,255,0.6)]" 
                             : "bg-[#0d0d0d] border-white/5 text-zinc-600 hover:border-white/10 shadow-[8px_8px_16px_rgba(0,0,0,0.2)]"
                           }`}
                       >
                         <div className={`size-12 rounded-[18px] flex items-center justify-center shadow-inner ${depositPaymentMethod === method.id ? 'bg-black/10' : 'bg-black/40'}`}>
                           <span className={`material-symbols-outlined text-2xl font-black ${depositPaymentMethod === method.id ? 'text-black' : method.color + ' opacity-40'}`}>{method.icon}</span>
                         </div>
                         <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${depositPaymentMethod === method.id ? 'text-black' : 'text-zinc-700'}`}>{method.label}</span>
                       </button>
                     ))}
                   </div>
                </section>
              </div>

              <footer className="shrink-0 p-10 pt-4 bg-[#0a0a0a] border-t border-white/5 relative z-20">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!depositAmount || Number(depositAmount) <= 0 || isLoading}
                  onClick={() => handlePurchaseCoins(Number(depositAmount), depositPaymentMethod)}
                  className="w-full bg-yellow-400 text-black font-black h-[100px] rounded-[45px] shadow-[inset_4px_4px_12px_rgba(255,255,255,0.7),0_20px_40px_rgba(250,204,21,0.15)] flex justify-center items-center gap-5 group relative overflow-hidden italic"
                >
                  {isLoading ? (
                    <div className="size-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="uppercase tracking-[0.5em] text-sm pt-1">Iniciar Checkout</span>
                      <div className="size-12 rounded-[18px] bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <span className="material-symbols-outlined text-2xl font-black group-hover:translate-x-1 transition-transform">rocket_launch</span>
                      </div>
                    </>
                  )}
                </motion.button>
                <div className="flex items-center justify-center gap-3 mt-10 opacity-30">
                   <div className="h-px w-8 bg-zinc-800" />
                   <span className="text-[10px] font-black text-zinc-600 italic tracking-[0.8em] uppercase">Powered by Izi Pay</span>
                   <div className="h-px w-8 bg-zinc-800" />
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderIziBlackPurchase = () => {
    const iziBlackPrice = appSettings?.iziBlackFee || 29.90;
    
    const handleClose = () => {
      setSubView(iziBlackOrigin === 'checkout' ? 'checkout' : 'none');
    };

    const handleSubscribeReal = async () => {
      if (!userId) return;
      setIsLoading(true);
      
      const total = iziBlackPrice;
      
      try {
        // 1. Criar um "pedido" de assinatura em orders_delivery
        const { data: orderData, error: orderError } = await supabase
          .from("orders_delivery")
          .insert({
            user_id: userId,
            status: (paymentMethod === "cartao" || paymentMethod === "bitcoin_lightning") ? "pendente_pagamento" : "novo",
            total_price: total,
            pickup_address: "Assinatura Izi Black",
            delivery_address: "Serviço Digital",
            service_type: "subscription",
            payment_method: paymentMethod,
            cpf_invoice: cpf,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Disparar o fluxo de pagamento correto
        if (paymentMethod === "cartao") {
          setSelectedItem(orderData);
          setPaymentsOrigin("izi_black");
          if (selectedCard) {
            handleConfirmSavedCardShortcut(orderData.id, total, "izi_black");
            return;
          }
          setIsLoading(false);
          setSubView("card_payment");
          return;
        } else if (paymentMethod === "pix") {
          setSubView("payment_processing");
          const cleanCpf = (cpf || "").replace(/\D/g, "");
          const cleanEmail = (user?.email || loginEmail || "cliente@izidelivery.com").trim().toLowerCase();

          if (cleanCpf.length !== 11) {
            toastError("CPF do perfil incompleto ou inválido para gerar o PIX.");
            setIsLoading(false);
            return;
          }

          const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
            body: {
              amount: Number(total.toFixed(2)),
              orderId: orderData.id,
              payment_method_id: 'pix',
              email: cleanEmail,
              customer: { name: userName || "Cliente Izi", cpf: cleanCpf }
            },
          });

          if (fnErr || !(fnData?.qrCode || fnData?.qr_code)) {
            const mpErr = fnData?.details?.cause?.[0]?.description || fnData?.error || fnErr?.message || "Erro MP PIX";
            throw new Error(`Falha no pagamento: ${mpErr}`);
          }

          setSelectedItem({ ...orderData, pixQrCode: fnData.qrCode, pixQrBase64: fnData.qrCodeBase64, pixCopyPaste: fnData.copyPaste });
          setPaymentsOrigin("izi_black");
          setSubView("pix_payment");
        } else if (paymentMethod === "bitcoin_lightning") {
          setSubView("payment_processing");
          const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
            body: { amount: total, orderId: orderData.id, memo: "Assinatura Izi Black" },
          });
          if (lnErr) throw lnErr;
          setSelectedItem({ 
            ...orderData, 
            lightningInvoice: lnData.payment_request, 
            satoshis: lnData.satoshis, 
            btc_price_brl: lnData.btc_price_brl 
          });
          setPaymentsOrigin("izi_black");
          setSubView("lightning_payment");
        } else if (paymentMethod === "saldo") {
          // Deduz do saldo
          const { error: walletErr } = await supabase
            .from("wallet_transactions")
            .insert({
              user_id: userId,
              amount: total,
              type: "pagamento",
              description: "Assinatura Izi Black"
            });
          if (walletErr) throw walletErr;
          
      // [Comentario Limpo pelo Sistema]
          await supabase.from("orders_delivery").update({ status: "concluido" }).eq("id", orderData.id);
          
          // Ativa Izi Black no perfil
          await supabase.from('users_delivery').update({ is_izi_black: true }).eq('id', userId);
          setIsIziBlackMembership(true);
          setIziBlackStep('success');
        }
      } catch (err: any) {
        toastError(err.message || "Erro ao processar assinatura.");
      } finally {
        setIsLoading(false);
      }
    };

      // [Comentario Limpo pelo Sistema]
    if (iziBlackStep === 'success') {
      return (
        <div className="absolute inset-0 z-50 bg-[#000000] flex flex-col items-center justify-center px-6 gap-12 overflow-hidden">
          <motion.div 
            initial={{ scale: 0, rotate: -20, opacity: 0 }} 
            animate={{ scale: 1, rotate: 0, opacity: 1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-yellow-400/10 blur-[100px] rounded-full" />
            <div className="size-32 rounded-full flex items-center justify-center relative overflow-hidden group">
              <span className="material-symbols-outlined text-7xl text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
          </motion.div>

          <div className="text-center space-y-4">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-yellow-500 text-[11px] font-black uppercase tracking-[0.6em]"
            >
              Protocolo Ativado
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl font-black text-white uppercase tracking-tighter leading-none italic"
            >
              IZI <span className="text-yellow-500">BLACK</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed font-medium"
            >
              Bem-vindo Ã  elite. Seus privilégios exclusivos já estão vinculados Ã  sua conta com sucesso.
            </motion.p>
          </div>

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => { setSubView("none"); setIziBlackStep("info"); }}
            className="w-full max-w-xs py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all text-zinc-900"
            style={{ backgroundColor: "#FBBF24" }}
          >
            Começar Experiência Elite
          </motion.button>
        </div>
      );
    }

    if (iziBlackStep === 'payment') {
      const walletBal = walletTransactions.reduce((acc: number, t: any) =>
        ["deposito","reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 0);

      const subOptions = [
        { id: "cartao",            icon: "credit_card",            label: "Cartão de Crédito" },
        { id: "pix",               icon: "pix",                    label: "PIX" },
        { id: "saldo",             icon: "account_balance_wallet", label: `Saldo IZI (R$ ${walletBal.toFixed(2)})`, disabled: walletBal < iziBlackPrice },
        { id: "bitcoin_lightning", icon: "bolt",                   label: "Bitcoin Lightning" },
      ];

      return (
        <div className="absolute inset-0 z-50 bg-[#000000] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
          <header className="bg-transparent sticky top-0 z-50 flex items-center gap-4 px-5 py-6">
            <button onClick={() => setIziBlackStep("info")} className="size-10 flex items-center justify-center active:scale-90 transition-all text-white">
              <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
            </button>
            <h1 className="font-black text-base text-white uppercase tracking-tight">Checkout IZI Black</h1>
          </header>
          <main className="px-5 py-6 max-w-sm mx-auto w-full space-y-12">
            <div className="text-center space-y-1">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Plano de Elite</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-black text-white mt-2">R$</span>
                <p className="font-black text-white leading-none tracking-tighter" style={{ fontSize: "72px" }}>
                  {Math.floor(iziBlackPrice)}
                  <span className="text-3xl text-zinc-500 font-black">,{((iziBlackPrice % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                </p>
              </div>
              <p className="text-zinc-600 text-[10px] font-bold mt-2 uppercase text-center">Mensal, cancele quando quiser</p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Pagamento</p>
              <div className="flex flex-col">
                {subOptions.map((m) => (
                  <button key={m.id} 
                    onClick={() => !m.disabled && setPaymentMethod(m.id as any)}
                    disabled={m.disabled}
                    className={`w-full flex items-center gap-4 py-6 transition-all border-b border-zinc-900 last:border-0 ${m.disabled ? "opacity-30 cursor-not-allowed" : "active:opacity-75"}`}>
                    <div className={`flex items-center justify-center ${paymentMethod === m.id ? "text-yellow-500" : "text-zinc-600"}`}>
                      <span className="material-symbols-outlined text-xl">{m.icon}</span>
                    </div>
                    <span className={`font-black text-sm flex-1 text-left ${paymentMethod === m.id ? "text-white" : "text-zinc-500"}`}>{m.label}</span>
                    <div className="flex items-center justify-center">
                      <span className={`material-symbols-outlined text-lg ${paymentMethod === m.id ? "text-yellow-500" : "text-transparent"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Documento (CPF)</p>
              <input type="text" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-transparent border-b border-zinc-900 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-yellow-500 focus:border-b-2 text-sm font-black tracking-widest transition-all" />
            </div>

            <button onClick={handleSubscribeReal} disabled={isLoading}
              className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30 text-zinc-900"
              style={{ backgroundColor: "#FBBF24" }}>
              {isLoading ? "Processando..." : "Ativar Assinatura Elite"}
            </button>
          </main>
        </div>
      );
    }

    const perks = [
      { id: 1, icon: "delivery_dining", title: "Taxa Zero Izi", desc: "Entrega gratuita em estabelecimentos selecionados.", yellow: true },
      { id: 2, icon: "confirmation_number", title: "Cupons Black", desc: "Acesso a cupons exclusivos de alto valor.", yellow: false },
      { id: 3, icon: "stars", title: "Cashback 5%", desc: "Receba parte do valor de volta em todos os pedidos.", yellow: false },
      { id: 4, icon: "bolt", title: "Prioridade Izi", desc: "Seus pedidos são preparados e entregues primeiro.", yellow: true },
    ];

    return (
      <div className="absolute inset-0 z-50 bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-24">
        {/* Header com Voltar */}
        <header className="sticky top-0 z-[100] px-5 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="size-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest italic">Clube <span className="text-yellow-400">Izi Black</span></h1>
        </header>

        <main className="max-w-xl mx-auto px-6 pt-12 space-y-10 w-full mb-10">
          {/* Hero Section: Claymorphism Card */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="clay-card bg-zinc-900/80 rounded-3xl p-8 text-center relative overflow-visible">
              {/* Floating 3D Icon Overlay */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center clay-card-yellow shadow-2xl">
                <span className="material-symbols-outlined text-black text-4xl font-black fill-1">diamond</span>
              </div>
              
              <div className="mt-10 space-y-3">
                <p className="text-[10px] text-zinc-500 font-extrabold tracking-[0.2em] uppercase">Economia total com o Clube</p>
                <div className="flex items-center justify-center gap-1">
                   <span className="text-xl font-black text-yellow-400 mb-4 italic">R$</span>
                   <h2 className="font-black text-yellow-400 text-6xl tracking-tighter italic">76,50</h2>
                </div>
                <p className="text-zinc-400 text-[11px] px-4 font-medium leading-relaxed">Usuários que assinam o Clube economizam em média R$ 120 por mês.</p>
              </div>

              {!isIziBlackMembership ? (
                <button 
                  onClick={() => setIziBlackStep("payment")}
                  className="clay-button w-full mt-8 py-5 rounded-3xl text-black font-black tracking-widest uppercase text-[11px] flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all"
                >
                  Quero entrar pro Clube
                  <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
                </button>
              ) : (
                <div className="clay-card-yellow mt-8 py-5 rounded-3xl text-black flex items-center justify-center gap-3">
                   <span className="material-symbols-outlined font-black fill-1">verified</span>
                   <span className="text-[11px] font-black uppercase tracking-widest">Assinatura Ativa</span>
                </div>
              )}
            </div>
          </motion.section>

          {/* Benefícios Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-end px-1">
              <h3 className="font-black text-2xl tracking-tighter text-white italic">Benefícios do Clube</h3>
              <span className="text-yellow-400 font-black text-xs uppercase tracking-widest cursor-pointer">Ver tudo</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {perks.map((perk, idx) => (
                <motion.div 
                  key={perk.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className={`${perk.yellow ? 'clay-card-yellow' : 'clay-card bg-zinc-900 border border-white/5'} rounded-3xl p-6 flex flex-col items-start justify-between min-h-[170px] overflow-hidden group relative`}
                >
                  <div className="relative w-full">
                    <span 
                      className={`material-symbols-outlined ${perk.yellow ? 'text-black/30' : 'text-yellow-400/20'} text-6xl absolute -right-2 -top-2 transition-transform group-hover:scale-110 fill-1`}
                    >
                      {perk.icon}
                    </span>
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    <p className={`font-black text-base leading-tight tracking-tight ${perk.yellow ? 'text-black' : 'text-white'}`}>{perk.title}</p>
                    <p className={`text-[10px] font-bold leading-relaxed ${perk.yellow ? 'text-black/70' : 'text-zinc-500'}`}>{perk.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Assinaturas e Parcerias Section */}
          <section className="space-y-6">
            <h3 className="font-black text-2xl tracking-tighter text-white italic">Assinaturas e Parcerias</h3>
            
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl overflow-hidden min-h-[180px] flex items-center group cursor-pointer"
            >
              <img 
                alt="Uber Partnership" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800" 
              />
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
              
              <div className="relative z-10 w-full p-6 flex justify-between items-center bg-zinc-900/40 backdrop-blur-md border border-white/10 m-4 rounded-3xl shadow-2xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-400 text-black font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">CLUBE</span>
                    <span className="text-white font-black text-2xl tracking-tighter">+</span>
                    <span className="text-white font-black text-2xl tracking-tighter italic">Uber</span>
                  </div>
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Vantagens exclusivas para suas viagens.</p>
                </div>
                <div className="size-10 rounded-full bg-yellow-400 flex items-center justify-center text-black shadow-lg">
                  <span className="material-symbols-outlined font-black">chevron_right</span>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Secondary CTA Grid */}
          <section className="grid grid-cols-1 gap-4 pb-10">
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className="clay-card bg-zinc-900/50 p-6 rounded-3xl flex items-center justify-between border border-white/5 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className="size-14 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-400 border border-yellow-400/10 shadow-inner">
                  <span className="material-symbols-outlined text-2xl fill-1">card_giftcard</span>
                </div>
                <div>
                  <p className="font-black text-sm text-white uppercase tracking-tight">Indique e ganhe</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Ganhe cupons indicando amigos</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-colors">arrow_forward</span>
            </motion.div>
          </section>
        </main>
      </div>
    );
  };
  const renderIziBlackWelcome = () => {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[56px] p-12 overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.07)]"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
          <div className="absolute -top-40 -right-40 size-80 bg-yellow-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 size-80 bg-yellow-600/10 rounded-full blur-[100px]" />

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.5, bounce: 0.6 }}
              className="size-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[32px] flex items-center justify-center shadow-[0_15px_40px_rgba(234,179,8,0.3)] mb-10"
            >
              <Icon name="workspace_premium" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                VOCÃÆ’Ã…Â  ESTÃÆ’Ã†â€™Ãâ€šÂ <span className="text-yellow-500">DENTRO</span>.
              </h1>
              <p className="text-zinc-400 font-medium text-lg leading-relaxed mb-12">
                Seja bem-vindo ao <span className="text-white font-bold">Izi Black</span>. 
                Seus privilégios exclusivos foram ativados com sucesso.
              </p>
            </motion.div>

            {/* Perks Preview */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-2 gap-4 w-full mb-12"
            >
              {[
                { icon: 'bolt', label: 'Cashback 5%' },
                { icon: 'local_shipping', label: 'Frete Grátis' },
                { icon: 'star', label: 'VIP Perks' },
                { icon: 'support_agent', label: 'Suporte Elite' }
              ].map((perk, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-3">
                  <Icon name={perk.icon} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{perk.label}</span>
                </div>
              ))}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowIziBlackWelcome(false);
                if (userId) {
                  fetchWalletBalance(userId);
                  fetchMyOrders(userId);
                }
              }}
              className="w-full bg-white text-black font-black py-7 rounded-[32px] text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
            >
              Começar Experiência Elite
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderIziBlackCard = () => {
    const iziCoins = Math.floor(userXP * 2.5);
    const nextTierCoins = Math.floor(nextLevelXP * 2.5);
    const progressPercent = Math.min(100, (iziCoins / nextTierCoins) * 100);
    
    const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
    const currentTierName = tierNames[Math.min(userLevel - 1, tierNames.length - 1)] || 'Bronze';
    const nextTierName = tierNames[Math.min(userLevel, tierNames.length - 1)] || 'Master';
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (progressPercent / 100) * circumference;

    const perks = [
      { id: 'frete', icon: 'local_shipping', label: 'Frete Grátis', active: true },
      { id: 'cashback', icon: 'monetization_on', label: 'Cashback 5%', active: true },
      { id: 'priority', icon: 'support_agent', label: 'Priority', active: true },
      { id: 'seguro', icon: 'shield', label: 'Seguro', active: userLevel >= 2 },
      { id: 'surprise', icon: 'card_giftcard', label: 'Surprise', active: userLevel >= 3 },
      { id: 'fastmatch', icon: 'bolt', label: 'Fast Match', active: userLevel >= 4 },
    ];

    return (
      <div className="bg-black absolute inset-0 z-[170] bg-[#020617] flex flex-col hide-scrollbar overflow-y-auto pb-32 text-zinc-100">
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] -mt-96 pointer-events-none z-0">
          <div className="absolute inset-0 rounded-full bg-yellow-400/[0.1] blur-[180px] animate-pulse" />
        </div>

        <header className="px-8 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/5">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Izi <span className="text-yellow-400">Black</span></h2>
            <p className="text-[9px] text-yellow-400/40 font-black uppercase tracking-[0.4em]">Protocolo VIP</p>
          </div>
          <button onClick={() => setShowIziBlackCard(false)} className="size-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all shadow-2xl">
            <Icon name="close" size={24} />
          </button>
        </header>

        <main className="relative z-10 px-8 py-10 space-y-16">
          {/* Progress Section */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col items-center text-center">
            <div className="relative mb-10 group cursor-pointer">
              <div className="absolute inset-0 bg-yellow-400/20 blur-[40px] rounded-full scale-75 group-hover:scale-100 transition-all duration-700 opacity-0 group-hover:opacity-100" />
              <svg width="200" height="200" viewBox="0 0 120 120" className="-rotate-90 relative z-10 drop-shadow-[0_0_15px_rgba(255,217,0,0.2)]">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#cardProgressGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 3, ease: "easeOut" }} />
                <defs><linearGradient id="cardProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#B45309" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="text-6xl font-black text-white leading-none tracking-tighter italic">{userLevel}</motion.span>
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.4em] mt-1 italic">Nível</span>
              </div>
            </div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-4">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 shadow-xl">
                 <div className="size-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_white]" />
                 <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{currentTierName} Member</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-tight">Membro <span className="text-yellow-400 italic">Fundador</span></h1>
              <div className="flex items-center justify-center gap-3">
                 <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-yellow-400" />
                 </div>
                 <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{progressPercent.toFixed(0)}% para {nextTierName}</p>
              </div>
            </motion.div>
          </motion.section>

          {/* Wallet Balance Hero */}
          <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="bg-gradient-to-br from-slate-900 to-black p-10 rounded-[50px] border border-white/10 relative overflow-hidden shadow-2xl text-center">
            <div className="absolute top-0 left-0 p-8 opacity-5">
              <Icon name="monetization_on" size={100} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="size-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_white]" />
                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">IziCoin Balance</p>
              </div>
              <h2 className="text-7xl font-black text-white tabular-nums tracking-tighter leading-none mb-4 italic">{iziCoins < 1 ? iziCoins.toFixed(8).replace(".", ",") : iziCoins.toLocaleString('pt-BR')}</h2>
              <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                Acumule {globalSettings?.izi_coin_rate || 1} coins a cada R$ 1,00 gasto
              </div>
            </div>
          </motion.section>

          {/* Global Stats */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="grid grid-cols-3 gap-6 bg-white/5 rounded-[40px] p-8 border border-white/5 shadow-2xl">
            {[
              { value: myOrders.length, label: 'Pedidos', icon: 'package' },
              { value: `R$${iziCashbackEarned.toFixed(0)}`, label: 'Cashback', icon: 'monetization_on' },
              { value: `R$${(myOrders.length * 5).toFixed(0)}`, label: 'Economia', icon: 'shield' },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2 group">
                <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-yellow-400 group-hover:scale-110 transition-all border border-white/5">
                   <Icon name={stat.icon} size={18} />
                </div>
                <div>
                   <p className="text-lg font-black text-white tracking-tight leading-none italic">{stat.value}</p>
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.section>

          {/* Perks Section */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-8">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic leading-none">Vantagens de Membro</h3>
               <span className="text-[9px] font-black text-yellow-400/40 uppercase tracking-widest">Protocolo Ativado</span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-10">
              {perks.map((perk, i) => (
                <motion.div 
                   key={i} 
                   initial={{ opacity: 0, x: 20 }} 
                   animate={{ opacity: perk.active ? 1 : 0.2, x: 0 }} 
                   transition={{ delay: 0.9 + i * 0.05 }} 
                   whileTap={{ scale: 0.95 }} 
                   onClick={() => perk.active && perk.id ? setActivePerkDetail(activePerkDetail === perk.id ? null : perk.id) : null}
                   className={`shrink-0 flex items-center gap-4 py-4 px-8 rounded-[30px] border transition-all cursor-pointer ${
                     activePerkDetail === perk.id 
                       ? 'bg-yellow-400/10 border-yellow-400/30 shadow-lg shadow-primary/10' 
                       : perk.active ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5'
                   }`}
                >
                   <div className={`${perk.active ? 'text-yellow-400' : 'text-white/10'}`}>
                      <Icon name={perk.icon} size={22} />
                   </div>
                   <div className="text-left">
                      <p className={`text-[11px] font-black uppercase tracking-tight whitespace-nowrap ${perk.active ? 'text-white' : 'text-white/10'}`}>{perk.label}</p>
                      {perk.active && perk.id && (
                        <div className="flex items-center gap-1 mt-0.5 opacity-20 group-hover:opacity-100 transition-opacity">
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/80">Detalhes</p>
                           <Icon name={activePerkDetail === perk.id ? 'expand_less' : 'expand_more'} size={10} />
                        </div>
                      )}
                   </div>
                   {!perk.active && <Icon name="shield" size={14} className="text-white/10" />}
                </motion.div>
              ))}
            </div>

            {/* Expandable Details */}
            <AnimatePresence mode="wait">
              {activePerkDetail && (
                <motion.div
                  key={activePerkDetail}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-white/5 rounded-[40px] border border-white/10 mx-2"
                >
                  <div className="p-8">
                    {activePerkDetail === 'frete' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                           <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                             <Icon name="local_shipping" size={20} />
                           </div>
                           <h4 className="text-[13px] font-black text-white italic uppercase tracking-tighter">Frete Grátis Ativado</h4>
                        </div>
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">Você possui frete grátis ilimitado em todos os pedidos acima de R$ 50,00. O benefício é aplicado automaticamente no seu checkout.</p>
                      </div>
                    )}

                    {activePerkDetail === 'cashback' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                           <div className="size-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                             <Icon name="monetization_on" size={20} />
                           </div>
                           <h4 className="text-[13px] font-black text-white italic uppercase tracking-tighter">Cashback Elite</h4>
                        </div>
                        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Acumulado</p>
                              <p className="text-3xl font-black text-white italic tracking-tighter">R$ {iziCashbackEarned.toFixed(2)}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest leading-none">5% OFF</p>
                              <p className="text-[8px] text-white/10 font-bold uppercase tracking-widest mt-1">Sempre ativo</p>
                           </div>
                        </div>
                      </div>
                    )}

                    {activePerkDetail === 'surprise' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                           <div className="size-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                             <Icon name="card_giftcard" size={20} />
                           </div>
                           <h4 className="text-[13px] font-black text-white italic uppercase tracking-tighter">Izi Surprise</h4>
                        </div>
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">Como membro nível 3, você recebe mimos exclusivos todos os meses. Fique atento Ã s suas notificações!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <div className="mx-7 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Integration Links */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="py-10 px-7 space-y-2">
            {[
              { icon: 'military_tech', title: 'Izi Battle Pass', sub: 'Missões e Ranking Global', action: () => { setShowIziBlackCard(false); setSubView("quest_center"); }, active: true },
              { icon: 'workspace_premium', title: 'Próximas Recompensas', sub: 'O que vem por aí', action: () => setShowMasterPerks(true), active: true },
            ].map((item, i) => (
              <Fragment key={i}>
                <motion.div whileTap={{ scale: 0.98 }} onClick={item.action} className="flex items-center justify-between py-6 px-6 rounded-[32px] bg-white/[0.03] border border-white/5 cursor-pointer group hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-2xl bg-yellow-400/[0.08] flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-all shadow-lg border border-primary/10">
                      <Icon name={item.icon} size={24} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-black text-white tracking-tight leading-none mb-1.5">{item.title}</h4>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">{item.sub}</p>
                    </div>
                  </div>
                  <div className="size-10 rounded-full flex items-center justify-center text-white/20 group-hover:text-yellow-400 transition-colors">
                     <Icon name="arrow_forward" size={16} />
                  </div>
                </motion.div>
              </Fragment>
            ))}
          </motion.section>

          <div className="text-center pt-8 pb-4">
            <p className="text-[8px] font-black text-white/[0.06] uppercase tracking-[0.5em] italic">Izi Black Â· Membro Fundador desde 2024</p>
          </div>
        </main>
      </div>
    );
  };

  const renderMasterPerks = () => {
    const perks = [
      { icon: "delivery_dining",    title: "Taxa Zero",          desc: "Entrega grátis em toda a cidade, sem limite de pedidos" },
      { icon: "bolt",              title: "Prioridade Máxima",  desc: "Seus pedidos são processados primeiro, sempre" },
      { icon: "workspace_premium", title: "Suporte VIP 24/7",   desc: "Atendimento exclusivo via canal prioritário" },
      { icon: "confirmation_number","title": "Cupons Exclusivos", desc: "Ofertas e descontos só para membros Black" },
      { icon: "stars",             title: "Cashback Duplo",     desc: "2x mais pontos em todos os pedidos" },
      { icon: "qr_code_scanner",   title: "Acesso Antecipado",  desc: "Novidades e lançamentos antes de todos" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base text-white uppercase tracking-tight">IZI Black</h1>
          <div className="size-10" />
        </header>

        <main className="px-5 py-8 space-y-10">

          {/* HERO */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em]">Privilégio Elite</p>
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tighter">O melhor do<br/>ecossistema IZI.</h2>
            <p className="text-zinc-600 text-sm">Acesso completo a todos os benefícios premium da plataforma.</p>
          </div>

          {/* CTA */}
          <button onClick={() => setSubView("izi_black_purchase")}
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Assinar IZI Black
          </button>

          {/* BENEFÃÆ’ÂCIOS */}
          <div>
            <h3 className="font-extrabold text-base text-white uppercase tracking-tight mb-2">O que está incluso</h3>
            <div className="flex flex-col">
              {perks.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0">
                  <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  <div>
                    <p className="font-black text-sm text-white">{p.title}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </main>
      </div>
    );
  };

  const [productAddonGroups, setProductAddonGroups] = useState<any[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<any>({});
  const [addonsLoading, setAddonsLoading] = useState(false);

  const getGroupSelections = (groupId: string) => selectedOptions[groupId] || [];
  const getGroupSelectedCount = (groupId: string) =>
    getGroupSelections(groupId).reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0);
  const getOptionQuantity = (groupId: string, itemId: string) =>
    getGroupSelections(groupId).find((item: any) => item.id === itemId)?.quantity || 0;
  const getSelectedOptionEntries = (optionsState: any = selectedOptions) =>
    Object.entries(optionsState).flatMap(([groupId, items]: [string, any]) =>
      (Array.isArray(items) ? items : []).map((item: any) => ({
        ...item,
        group_id: groupId,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.price) || 0,
        total_price: (Number(item.price) || 0) * (Number(item.quantity) || 0),
      }))
    );
  const calculateAddonsPrice = (optionsState: any = selectedOptions) =>
    getSelectedOptionEntries(optionsState).reduce((acc: number, item: any) => acc + item.total_price, 0);
  const buildCartItemDetails = (product: any, optionsState: any) => {
    const detailedOptions = getSelectedOptionEntries(optionsState)
      .filter((item: any) => item.quantity > 0)
      .map((item: any) => {
        const group = productAddonGroups.find((addonGroup: any) => addonGroup.id === item.group_id);
        return {
          ...item,
          group_name: group?.name || item.group_name || "Complemento",
        };
      });

    return {
      addonDetails: detailedOptions,
      addonSummaryText: detailedOptions.length > 0
        ? detailedOptions.map((item: any) => `${item.group_name}: ${item.name} x${item.quantity} (R$ ${item.total_price.toFixed(2).replace(".", ",")})`).join("; ")
        : "",
    };
  };
  const formatCartItemSummary = (item: any) =>
    `${item.name} (R$ ${Number(item.price || 0).toFixed(2)})${item.addonSummaryText ? ` [${item.addonSummaryText}]` : ""}`;

  const updateOptionQuantity = (group: any, item: any, delta: number) => {
    let didHitLimit = false;

    setSelectedOptions((prev: any) => {
      const current = Array.isArray(prev[group.id]) ? prev[group.id] : [];
      const maxAllowed = Math.max(Number(group.max_select) || 1, 1);
      const currentCount = current.reduce((acc: number, currentItem: any) => acc + (Number(currentItem.quantity) || 0), 0);
      const existingIndex = current.findIndex((currentItem: any) => currentItem.id === item.id);
      const existingQuantity = existingIndex >= 0 ? Number(current[existingIndex].quantity) || 0 : 0;
      let nextGroup = [...current];

      if (delta > 0) {
        if (maxAllowed === 1) {
          nextGroup = [{ ...item, quantity: 1 }];
        } else {
          if (currentCount >= maxAllowed) {
            didHitLimit = true;
            return prev;
          }

          if (existingIndex >= 0) {
            nextGroup[existingIndex] = { ...nextGroup[existingIndex], quantity: existingQuantity + 1 };
          } else {
            nextGroup.push({ ...item, quantity: 1 });
          }
        }
      } else if (delta < 0) {
        if (existingIndex === -1) return prev;

        const nextQuantity = existingQuantity + delta;
        if (nextQuantity <= 0) {
          nextGroup.splice(existingIndex, 1);
        } else {
          nextGroup[existingIndex] = { ...nextGroup[existingIndex], quantity: nextQuantity };
        }
      } else {
        return prev;
      }

      const nextState = { ...prev };
      if (nextGroup.length > 0) {
        nextState[group.id] = nextGroup;
      } else {
        delete nextState[group.id];
      }

      return nextState;
    });

    if (didHitLimit) {
      showToast(`Limite de ${group.max_select} seleções em ${group.name}`, "error");
    }
  };

  const fetchProductAddons = async (productId: string) => {
    setAddonsLoading(true);
    try {
      const { data: groups, error: gErr } = await supabase
        .from('product_options_groups_delivery')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
        
      if (gErr) throw gErr;
      if (!groups || groups.length === 0) {
        setProductAddonGroups([]);
        return;
      }

      const gIds = groups.map(g => g.id);
      const { data: items, error: iErr } = await supabase
        .from('product_options_items_delivery')
        .select('*')
        .in('group_id', gIds)
        .order('sort_order', { ascending: true });
        
      if (iErr) throw iErr;
      
      const assembled = groups.map(g => ({
        ...g,
        items: items?.filter(i => i.group_id === g.id) || []
      }));
      setProductAddonGroups(assembled);
    } catch (err) {
      console.error('Error fetching addons:', err);
    } finally {
      setAddonsLoading(false);
    }
  };

  useEffect(() => {
    if (subView === "product_detail" && (selectedItem?.id || selectedItem?.uid)) {
       fetchProductAddons(selectedItem.id || selectedItem.uid);
       setTempQuantity(1);
    } else if (subView !== "product_detail") {
       setProductAddonGroups([]);
       setSelectedOptions({});
       setTempQuantity(1);
    }
  }, [subView, selectedItem?.id, selectedItem?.uid]);

  const renderProductDetail = () => {
    if (!selectedItem) return null;

    const handleBack = () => {
      if (selectedShop) {
        setSubView("restaurant_menu");
      } else if (activeService) {
        if (activeService.type === "market") setSubView("market_list");
        else if (activeService.type === "pharmacy") setSubView("pharmacy_list");
        else setSubView("generic_list");
      } else {
        setSubView("none");
      }
    };

    const itemImage = selectedItem.img || "";
    const addonsPrice = calculateAddonsPrice();
    const totalProductPrice = selectedItem.price + addonsPrice;

    return (
      <div className="absolute inset-0 z-[70] bg-zinc-950 flex flex-col hide-scrollbar overflow-y-auto">
        <div className="relative w-full h-[40vh] bg-cover bg-center shrink-0" style={{ backgroundImage: "url('" + itemImage + "')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/20"></div>
          <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <button onClick={handleBack} className="flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20">
              <Icon name="arrow_back" />
            </button>
            <button onClick={() => handleFavoriteAction(selectedItem.name)} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20">
              <Icon name="favorite" />
            </button>
          </header>
        </div>

        <div className="relative z-10 -mt-12 bg-zinc-950 rounded-t-[40px] px-8 pt-10 pb-32 space-y-8 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-white tracking-tighter">{selectedItem.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-400 font-black text-2xl">R$ {selectedItem.price.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
            {selectedShop && (
               <div className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 flex flex-col items-center min-w-[64px]">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Loja</span>
                  <div className="size-8 rounded-lg bg-cover bg-center" style={{ backgroundImage: "url('" + selectedShop.img + "')" }}></div>
               </div>
            )}
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Descricao</h3>
              <p className="text-zinc-400 text-base leading-relaxed">{selectedItem.desc || "Produto premium selecionado."}</p>
            </section>

            <div className="space-y-8">
              {productAddonGroups.map((group) => (
                <section key={group.id} className="space-y-4">
                  <h3 className="text-lg font-black text-white tracking-tight">{group.name}</h3>
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const qty = getOptionQuantity(group.id, item.id);
                      const isSelected = qty > 0;
                      return (
                        <div key={item.id} onClick={() => updateOptionQuantity(group, item, 1)}
                           className={"p-4 rounded-3xl border transition-all flex items-center justify-between cursor-pointer " + (isSelected ? 'bg-yellow-400 border-yellow-400' : 'bg-white/5 border-white/10')}>
                          <div className="flex items-center gap-4">
                            <span className={"font-bold " + (isSelected ? 'text-black' : 'text-white')}>{item.name}</span>
                          </div>
                          <span className={"font-black text-xs " + (isSelected ? 'text-black' : 'text-yellow-400')}>+ R$ {item.price.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-10 left-8 right-8 z-[80]">
          <button onClick={() => {
            const details = buildCartItemDetails(selectedItem, selectedOptions);
            const items = Array.from({ length: tempQuantity }, (_, i) => ({ 
              ...selectedItem, 
              ...details,
              timestamp: Date.now(),
              cartId: selectedItem.id + "-" + Date.now() + "-" + i 
            }));
            setCart([...cart, ...items]);
            handleBack();
            showToast("Item adicionado!", "success");
          }} className="w-full bg-slate-900 text-white p-5 rounded-[28px] flex items-center justify-between">
            <span className="font-bold text-lg">Adicionar</span>
            <span className="font-black text-xl bg-white/10 px-4 py-1.5 rounded-2xl">R$ {(totalProductPrice * tempQuantity).toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderFreightWizard = () => {
    return (
      <FreightWizard 
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        routeDistance={routeDistance}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        distanceValueKm={distanceValueKm}
        marketConditions={marketConditions}
        setShowDatePicker={setShowDatePicker}
        setShowTimePicker={setShowTimePicker}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
      />
    );
  };

  const renderVanWizard = () => {
    return (
      <VanWizard 
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        isCalculatingPrice={isCalculatingPrice}
        marketConditions={marketConditions}
        paymentMethod={paymentMethod}
        userLevel={userLevel}
        routeDistance={routeDistance}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
        calculateVanPrice={calculateVanPrice}
      />
    );
  };

  const renderExcursionWizard = () => {
    return (
      <ExcursionWizard 
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        isCalculatingPrice={isCalculatingPrice}
        marketConditions={marketConditions}
        paymentMethod={paymentMethod}
        userLevel={userLevel}
        routeDistance={routeDistance}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
      />
    );
  };

  const renderTaxiWizard = () => {
    return (
      <TaxiWizard 
        transitData={transitData}
        setTransitData={setTransitData}
        mobilityStep={mobilityStep}
        setMobilityStep={setMobilityStep}
        userLocation={userLocation}
        updateLocation={updateLocation}
        routePolyline={routePolyline}
        driverLocation={driverLocation}
        distancePrices={distancePrices}
        isCalculatingPrice={isCalculatingPrice}
        marketConditions={marketConditions}
        paymentMethod={paymentMethod}
        userLevel={userLevel}
        routeDistance={routeDistance}
        setPaymentsOrigin={setPaymentsOrigin}
        setSubView={setSubView}
        navigateSubView={navigateSubView}
        showToast={showToast}
      />
    );
  };

  const renderMobilityPayment = () => {
    return (
      <MobilityPaymentView 
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        transitData={transitData}
        isIziBlackMembership={isIziBlackMembership}
        walletBalance={walletBalance}
        selectedCard={selectedCard}
        handleConfirmMobility={handleConfirmMobility}
        navigateSubView={navigateSubView}
        marketConditions={marketConditions}
        calculateDynamicPrice={calculateDynamicPrice}
        serviceFee={globalSettings?.service_fee_percent || 0}
      />
    );
  };

  const renderExploreEnvios = () => {
    const services = [
      { id: "express", name: "Izi Express", desc: "Documentos e pequenos volumes", icon: "bolt", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "express" }); navigateSubView("shipping_priority"); } },
      { id: "coleta",  name: "Click e Retire Izi", desc: "Retirada rápida em lojas parceiras", icon: "inventory_2", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "coleta" }); navigateSubView("shipping_details"); } },
    ];
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar">
        <div className="fixed inset-0 pointer-events-none opacity-20">
           <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-400/20 rounded-full blur-[120px]" />
           <div className="absolute top-40 left-0 w-60 h-60 bg-yellow-400/10 rounded-full blur-[100px]" />
        </div>

        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-6 border-b border-zinc-900/50">
          <div className="flex items-center gap-5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("none")} className="size-11 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center shadow-lg transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </motion.button>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">Izi Envios</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Entregamos qualquer coisa</p>
            </div>
          </div>
        </header>

        <main className="px-6 pt-10 flex flex-col gap-6 relative z-10">
          {services.map((svc, i) => (
            <motion.div 
              key={svc.id} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={svc.action} 
              className="relative group bg-zinc-800 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 rounded-[40px] p-7 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="size-16 rounded-[22px] bg-yellow-400 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/20">
                  <span className="material-symbols-outlined text-3xl text-black font-black">{svc.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-white group-hover:text-yellow-400 transition-all duration-300 tracking-tight">{svc.name}</h3>
                  <p className="text-zinc-500 text-[11px] mt-1 font-medium leading-tight">{svc.desc}</p>
                </div>
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-all">
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-4 p-8 rounded-[45px] bg-zinc-800 shadow-[20px_20px_40px_rgba(0,0,0,0.6),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-yellow-400/20 relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="text-white font-black text-lg tracking-tight mb-2">Izi Versátil</h4>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px]">Transporte de cargas pesadas, utilitários e vans para empresas ou particulares.</p>
                <div className="mt-6 flex flex-col gap-3">
                    <button onClick={() => { setTransitData({ ...transitData, type: "van", scheduled: true }); setSubView("excursion_wizard"); setMobilityStep(1); }} className="px-6 py-4 bg-yellow-400 text-black text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] active:scale-95 transition-all text-center">Excursões & Viagens</button>
                    <button onClick={() => setShowLojistasModal(true)} className="px-6 py-4 bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.02)] text-white text-[11px] font-black rounded-2xl uppercase tracking-widest border border-white/5 active:scale-95 transition-all text-center">Ver Parceiros</button>
                 </div>
             </div>
             <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[130px] text-yellow-400/5 rotate-12">local_shipping</span>
          </div>

          <section className="mt-8 space-y-4">
             <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] px-2">Diferenciais Izi</h5>
             <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: 'verified_user', label: 'Seguro Total', desc: 'Sua carga protegida' },
                  { icon: 'speed', label: 'Entrega Real', desc: 'Tempo recorde' },
                  { icon: 'share_location', label: 'Real-time', desc: 'Rastreio preciso' },
                  { icon: 'support_agent', label: 'Suporte 24h', desc: 'Fale com humanos' }
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)]">
                     <span className="material-symbols-outlined text-yellow-400 text-xl mb-3">{item.icon}</span>
                     <p className="text-[10px] font-black text-white uppercase tracking-tight">{item.label}</p>
                     <p className="text-[9px] text-zinc-500 font-medium mt-1">{item.desc}</p>
                  </div>
                ))}
             </div>
          </section>
        </main>
      </div>
    );
  };

  const renderIziExpressPriority = () => {
    const priorities = [
      { id: "turbo", name: "Izi Turbo Flash", desc: "Entrega ultra-rápida até 15 min", time: "15 min", icon: "bolt", color: "text-amber-400", bg: "bg-amber-400/10" },
      { id: "light", name: "Izi Light Flash", desc: "Entrega agilizada até 30 min", time: "30 min", icon: "electric_bolt", color: "text-yellow-400", bg: "bg-yellow-400/10" },
      { id: "normal", name: "Izi Express", desc: "Categoria normal de entrega", time: "1 hr", icon: "moped", color: "text-zinc-400", bg: "bg-zinc-800" },
      { id: "scheduled", name: "Izi Agendado", desc: "Você escolhe data e horário", time: "Agendar", icon: "event", color: "text-blue-400", bg: "bg-blue-400/10" },
    ];

    const getPriorityPrice = (priorityId: string) => {
      const basePrice = distancePrices[transitData.type as keyof typeof distancePrices] || distancePrices.mototaxi || 0;
      const settings = marketConditions.settings;
      if (!settings || !settings.shippingPriorities) return basePrice;
      
      const config = settings.shippingPriorities[priorityId as keyof typeof settings.shippingPriorities];
      if (!config) return basePrice;

      // Prioridade com preço independente?
      if ((config as any).km_fee > 0) {
        const p = (config.min_fee || 0) + ((config as any).km_fee * distanceValueKm);
        return parseFloat(p.toFixed(2));
      }
      
      let price = basePrice * (config.multiplier || 1.0);
      if (price < (config.min_fee || 0)) price = config.min_fee;
      return price;
    };

    return (
      <div className="absolute inset-0 z-40 bg-black text-white flex flex-col hide-scrollbar overflow-y-auto pb-4">
        <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50 border-b border-white/5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigateSubView("explore_envios")} className="size-12 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center text-white active:scale-90 transition-all leading-none">
            <span className="material-symbols-outlined">arrow_back</span>
          </motion.button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Prioridade</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Escolha a prioridade</p>
          </div>
        </header>

        <main className="px-6 space-y-8 mt-10">
          <div className="text-center mb-10">
            <motion.div 
               animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="size-24 rounded-[35px] bg-yellow-400 flex items-center justify-center mx-auto mb-5 shadow-[15px_15px_30px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.6),inset_-4px_-4px_10px_rgba(0,0,0,0.2)] border-2 border-yellow-300/30 relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-[35px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="material-symbols-outlined text-5xl text-black/80 drop-shadow-sm relative z-10">speed</span>
            </motion.div>
            <h3 className="text-xl font-black text-white tracking-tight">Qual a sua urgência?</h3>
            <p className="text-zinc-500 text-xs font-semibold mt-2 max-w-[240px] mx-auto opacity-80">Diferentes níveis de prioridade para sua necessidade</p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {priorities.map((p, i) => {
              const isSelected = transitData.priority === p.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, type: "spring", damping: 20 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const finalPrice = getPriorityPrice(p.id);
                    setTransitData({ 
                      ...transitData, 
                      priority: p.id as any,
                      scheduled: p.id === "scheduled",
                      estPrice: finalPrice
                    });
                    navigateSubView("shipping_details");
                  }}
                  className={`p-7 rounded-[40px] border cursor-pointer transition-all flex items-center gap-6 relative overflow-hidden group ${
                    isSelected 
                      ? "bg-yellow-400 border-yellow-400 shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" 
                      : "bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border-white/5"
                  }`}
                >
                  <div className={`size-16 rounded-[22px] flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-black/10' : p.bg + ' group-hover:scale-110 shadow-inner'}`}>
                    <span className={`material-symbols-outlined text-3xl ${isSelected ? 'text-black' : p.color}`}>{p.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-black text-lg tracking-tight ${isSelected ? 'text-black' : 'text-white'}`}>{p.name}</h4>
                      <div className="flex flex-col items-end">
                         <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSelected ? 'text-black/60' : p.color}`}>{p.time}</span>
                         <span className={`text-xs font-black mt-0.5 ${isSelected ? 'text-black' : 'text-white'}`}>
                            R$ {getPriorityPrice(p.id).toFixed(2).replace('.', ',')}
                         </span>
                      </div>
                    </div>
                    <p className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-black/50' : 'text-zinc-500 opacity-80'}`}>{p.desc}</p>
                  </div>
                  {isSelected && (
                    <motion.div layoutId="priority-check" className="absolute right-4 top-4 size-6 bg-black rounded-full flex items-center justify-center">
                       <Icon name="check" className="text-yellow-400 text-[14px]" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 p-7 rounded-[40px] flex items-center gap-5 mt-10">
            <div className="size-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center shrink-0 border border-yellow-400/10">
               <span className="material-symbols-outlined text-yellow-400 text-xl font-bold">info</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
              Os tempos de entrega são estimativas calculadas pelo nosso algoritmo baseado na frota disponível em tempo real.
            </p>
          </div>
        </main>
      </div>
    );
  };

  const renderShippingDetails = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-black text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500 pb-6">
        <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50">
          <button
            onClick={() =>
              navigateSubView(
                transitData.subService === "express"
                  ? "shipping_priority"
                  : "explore_envios",
              )
            }
            className="size-12 rounded-2xl bg-zinc-900 shadow-xl flex items-center justify-center text-white active:scale-90 transition-all border border-zinc-800"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
              Detalhes
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Informacoes de Entrega</p>
          </div>
        </header>

        <main className="px-6 space-y-10 pb-40">
          {transitData.subService === "express" && (
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <Icon name="location_on" />
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Roteiro de Entrega</h3>
              </div>
              
              <div className="space-y-4">
                {/* ORIGEM (COLETA) */}
                <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-4 ml-1">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">Origem (Onde Coletar?)</p>
                     <button 
                       onClick={() => updateLocation()}
                       disabled={userLocation.loading}
                       className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors active:scale-95 px-2 py-1 rounded-full bg-yellow-400/5 disabled:opacity-50"
                     >
                        {userLocation.loading
                          ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" /><path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                          : <span className="material-symbols-outlined text-xs">my_location</span>
                        }
                        <span className="text-[8px] font-black uppercase tracking-widest">{userLocation.loading ? 'Buscando...' : 'Localização Atual'}</span>
                     </button>
                  </div>
                  <AddressSearchInput 
                    initialValue={transitData.origin}
                    placeholder="Endereço de partida..."
                    className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white placeholder:text-zinc-600"
                    userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(place) => {
                      const ori = place.formatted_address || "";
                      setTransitData(prev => ({ ...prev, origin: ori }));
                      if (ori && transitData.destination) {
                        setDistancePrices({});
                        setRouteDistance("");
                        calculateDistancePrices(ori, transitData.destination);
                      }
                    }}
                  />
                </div>

                {/* DESTINO */}
                <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Para onde levar?</p>
                   <AddressSearchInput 
                     initialValue={transitData.destination}
                     placeholder="Digite o endereço de destino..."
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white placeholder:text-zinc-600"
                     userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                     onSelect={(place) => {
                       const dest = place.formatted_address || "";
                       setTransitData(prev => ({ ...prev, destination: dest }));
                       if (dest && transitData.origin) {
                         setDistancePrices({});
                         setRouteDistance("");
                         calculateDistancePrices(transitData.origin, dest);
                       }
                     }}
                   />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="swap_horiz" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                {transitData.subService === 'coleta' ? 'selecionar ponto de retirada' : 'Enviar ou Receber?'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-3 mb-4">
                {transitData.subService === "express" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTransitData({...transitData, operationType: "enviar"})}
                      className={`py-8 rounded-[35px] border transition-all flex flex-col items-center justify-center gap-3 ${transitData.operationType === "enviar" ? "bg-yellow-400 border-yellow-400 text-black shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" : "bg-zinc-800 border-white/5 text-zinc-500 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)]"}`}
                    >
                      <span className="material-symbols-outlined text-3xl">outbox</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Vou Enviar</span>
                    </button>
                    <button 
                      onClick={() => setTransitData({...transitData, operationType: "retirar"})}
                      className={`py-8 rounded-[35px] border transition-all flex flex-col items-center justify-center gap-3 ${transitData.operationType === "retirar" ? "bg-yellow-400 border-yellow-400 text-black shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" : "bg-zinc-800 border-white/5 text-zinc-500 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)]"}`}
                    >
                      <span className="material-symbols-outlined text-3xl">store</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-2">Retirar em Loja</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowLojistasModal(true)}
                    className="w-full py-10 rounded-[40px] border bg-yellow-400 border-yellow-400 text-black shadow-[8px_8px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] flex flex-col items-center gap-3 active:scale-[0.98] transition-all group"
                  >
                    <div className="size-14 rounded-full bg-black/10 flex items-center justify-center mb-1">
                      <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">storefront</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-center px-6">
                      {transitData.receiverName ? `Loja: ${transitData.receiverName}` : "Selecionar Loja Parceira"}
                    </span>
                  </button>
                )}
              </div>

              {transitData.subService === "express" && (
                <>
                  <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Nome de quem recebe</p>
                     <input 
                       type="text" 
                       value={transitData.receiverName || ""}
                       onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                       placeholder="Ex: João Silva"
                       className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-white"
                     />
                  </div>

                  <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Telefone de Contato</p>
                     <input 
                       type="tel" 
                       value={transitData.receiverPhone || ""}
                       onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                       placeholder="(11) 99999-9999"
                       className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-white"
                     />
                  </div>
                </>
              )}

              {transitData.subService === "coleta" && (
                <div className="space-y-4">
                  <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Endereço de Coleta (Origem/Parceiro)</p>
                     <AddressSearchInput 
                       initialValue={transitData.origin || ""}
                       placeholder="Confirme o endereço do parceiro..."
                       onSelect={(data) => setTransitData(prev => ({ ...prev, origin: data.formatted_address || "" }))}
                       className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                     />
                  </div>
                  <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Endereço de Entrega (Destino)</p>
                   <AddressSearchInput 
                     initialValue={transitData.destination || ""}
                     placeholder="Onde devemos entregar?"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white placeholder:text-zinc-600"
                     userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                     onSelect={(place) => {
                       const dest = place.formatted_address || "";
                       setTransitData(prev => ({ ...prev, destination: dest }));
                       if (dest && transitData.origin) {
                         calculateDistancePrices(transitData.origin, dest);
                       }
                     }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {transitData.subService === "coleta" && (
            <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <Icon name="business" />
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Detalhes do Parceiro Izi</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Nome do Parceiro / Loja</p>
                   <input 
                     type="text" 
                     value={transitData.receiverName || ""}
                     onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                     placeholder="Ex: Hub Logístico Izi"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>

                <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Telefone do Parceiro</p>
                   <input 
                     type="tel" 
                     value={transitData.receiverPhone || ""}
                     onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                     placeholder="(11) 99999-9999"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>

                <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Cód. do Pedido / Retirada</p>
                   <input 
                     type="text" 
                     value={transitData.pickupCode || ""}
                     onChange={(e) => setTransitData({...transitData, pickupCode: e.target.value})}
                     placeholder="Ex: ABC123456"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>

                <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Setor / Guichê</p>
                   <input 
                     type="text" 
                     value={transitData.pickupSector || ""}
                     onChange={(e) => setTransitData({...transitData, pickupSector: e.target.value})}
                     placeholder="Piso / Corredor"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>
              </div>
            </motion.section>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="inventory_2" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Detalhes da Retirada</h3>
            </div>

            <div className="space-y-4">
               <div className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Descrição do Item</p>
                  <textarea 
                    value={transitData.packageDesc || ""}
                    onChange={(e) => setTransitData({...transitData, packageDesc: e.target.value})}
                    placeholder="Ex: 2 Camisetas, 1 Par de Tênis..."
                    rows={3}
                    className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white resize-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {['Pequeno (até 5kg)', 'Médio (até 15kg)', 'Grande (até 30kg)', 'Pesado (+30kg)'].map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setTransitData({...transitData, weightClass: weight})}
                      className={`py-5 px-4 rounded-[30px] text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        transitData.weightClass === weight 
                          ? 'bg-yellow-400 border-yellow-400 text-black shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]' 
                          : 'bg-zinc-800 border-white/5 text-zinc-500 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)] hover:border-zinc-700'
                      }`}
                    >
                      {weight}
                    </button>
                  ))}
               </div>
            </div>
          </section>

          {transitData.scheduled && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <Icon name="event_upcoming" />
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Agendamento da Coleta</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setShowDatePicker(true)} className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] cursor-pointer active:scale-95 transition-all">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Data</p>
                   <div className="flex items-center justify-between">
                     <span className="text-base font-bold text-white">{transitData.scheduledDate || "Selecionar data"}</span>
                     <span className="material-symbols-outlined text-yellow-400 text-sm">calendar_month</span>
                   </div>
                </div>
                <div onClick={() => setShowTimePicker(true)} className="bg-zinc-800 p-6 rounded-[35px] border border-white/5 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] cursor-pointer active:scale-95 transition-all">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Horário</p>
                   <div className="flex items-center justify-between">
                     <span className="text-base font-bold text-white">{transitData.scheduledTime || "Selecionar hora"}</span>
                     <span className="material-symbols-outlined text-yellow-400 text-sm">schedule</span>
                   </div>
                </div>
              </div>
            </motion.section>
          )}

          <div className="bg-zinc-800 p-7 rounded-[40px] border border-amber-400/20 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] flex items-start gap-5">
             <div className="size-12 rounded-2xl bg-amber-400/10 flex items-center justify-center shrink-0 border border-amber-400/20 shadow-inner">
               <span className="material-symbols-outlined text-amber-400 text-xl font-bold">warning</span>
             </div>
             <p className="text-[10px] font-black text-amber-400/70 leading-relaxed uppercase tracking-[0.1em]">
               Certifique-se de que o objeto esteja bem embalado. Não transportamos itens proibidos por lei ou inflamáveis.
             </p>
          </div>

          {transitData.origin && transitData.destination && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-800 border border-white/10 p-8 rounded-[45px] shadow-[20px_20px_40px_rgba(0,0,0,0.6),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 size-32 bg-yellow-400/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">distance</span>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{routeDistance || 'Calculando rota...'}</p>
                  </div>
                  <h4 className="text-3xl font-black text-white tracking-tighter italic">
                    {isCalculatingPrice ? (
                      <span className="animate-pulse opacity-50">Calculando...</span>
                    ) : (
                      <>R$ {(distancePrices[transitData.type] || 0).toFixed(2).replace(".", ",")}</>
                    )}
                  </h4>
                </div>
                <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                  <span className="material-symbols-outlined text-yellow-400 text-2xl">receipt_long</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-3">
                 <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] italic">Preço Izi Garantido • Inclui Taxas</p>
              </div>
            </motion.div>
          )}
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-8 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
          <button
            disabled={isLoading}
            onClick={handleRequestTransit}
            className="w-full bg-yellow-400 text-black font-black text-xl py-6 rounded-[30px] shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-30 flex justify-center items-center gap-4 group"
          >
            {isLoading ? (
              <div className="size-7 border-4 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="uppercase tracking-[0.1em]">Continuar</span>
                <Icon name="arrow_forward" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderWaitingDriver = () => {
    if (!selectedItem) return null;

    const serviceLabels: Record<string, { label: string; icon: string; color: string }> = {
      mototaxi: { label: "MotoTáxi", icon: "motorcycle", color: "text-yellow-400" },
      carro: { label: "Carro Executivo", icon: "directions_car", color: "text-zinc-500" },
      van: { label: "Excursão", icon: "airport_shuttle", color: "text-blue-500" },
      utilitario: { label: "Izi Express", icon: "bolt", color: "text-purple-500" },
    };
    const service = serviceLabels[selectedItem.service_type] || { label: "Serviço", icon: "local_shipping", color: "text-yellow-400" };

    return (
      <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] rounded-full animate-pulse" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-sm clay-card-dark rounded-[50px] p-10 text-center relative border border-white/5"
        >
          {/* Radar */}
          <div className="relative size-24 mx-auto mb-10">
            <motion.div animate={{ scale: [1, 2.5], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 bg-yellow-400/20 rounded-full" />
            <motion.div animate={{ scale: [1, 2], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }} className="absolute inset-0 bg-yellow-400/20 rounded-full" />
            <div className="relative size-full bg-yellow-400/10 border border-yellow-400/30 rounded-full flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.1)]">
              <span className={`material-symbols-outlined text-4xl ${service.color} fill-1`}>{service.icon}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              Buscando <br/>
              <span className="text-yellow-400">{service.label}</span>
            </h2>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
              Estamos enviando seu convite para os melhores parceiros da região.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-center gap-1.5">
              <span className="size-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="size-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="size-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>

            <button
              onClick={async () => {
                if (!selectedItem?.id || !userId) return;
                if (!await showConfirm({ message: "Cancelar a solicitação?" })) return;
                await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", selectedItem.id);
                setSubView("none");
                fetchMyOrders(userId);
                toastSuccess("Solicitação cancelada.");
              }}
              className="w-full py-5 bg-zinc-900/50 border border-white/5 rounded-[24px] text-red-500/70 font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
            >
              Cancelar Solicitação
            </button>
          </div>
        </motion.div>
      </div>
    );
  };


  const renderScheduledOrder = () => {
    if (!selectedItem) return null;
    const svcIcons: Record<string,string> = { mototaxi:'motorcycle', carro:'directions_car', van:'airport_shuttle', utilitario:'bolt' };
    const svcLabels: Record<string,string> = { mototaxi:'MotoTáxi', carro:'Carro Executivo', van:'Excursão', utilitario:'Izi Express' };
    const icon = svcIcons[selectedItem.service_type] || 'event';
    const label = svcLabels[selectedItem.service_type] || 'Serviço';
    const scheduledAt = selectedItem.scheduled_at 
      ? new Date(selectedItem.scheduled_at).toLocaleString('pt-BR', { weekday:'long', day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })
      : null;
    const hasDriver = !!selectedItem.driver_id;

    const saveObservation = async () => {
      if (!selectedItem?.id || !schedObsState.trim()) return;
      setIsSavingObsState(true);
      await supabase.from('orders_delivery').update({ order_notes: schedObsState }).eq('id', selectedItem.id);
      setIsSavingObsState(false);
      toastSuccess('Observação salva!');
    };

    const sendScheduledMessage = () => {
      if (!schedChatInputState.trim()) return;
      const msg = { id: Date.now().toString(), text: schedChatInputState.trim(), from: 'user' as const, time: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) };
      setSchedMessagesState(prev => [...prev, msg]);
      setSchedChatInputState('');
    };

    return (
      <div className="absolute inset-0 z-[120] bg-black flex flex-col overflow-hidden">
        <header className="px-6 py-5 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4 shrink-0">
          <button onClick={() => { setSubView('none'); setFilterTab('agendados' as any); }} className="size-11 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center active:scale-90 transition-all">
            <Icon name="arrow_back" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-black text-white tracking-tight">Agendamento</h2>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
          </div>
          <button onClick={async () => {
            if (!selectedItem?.id || !userId) return;
            if (!await showConfirm({ message: 'Cancelar este agendamento?' })) return;
            await supabase.from('orders_delivery').update({ status: 'cancelado' }).eq('id', selectedItem.id);
            setSubView('none'); 
            fetchMyOrders(userId); 
            toastSuccess('Agendamento cancelado.');
          }} className="px-4 py-2 border border-red-900 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Cancelar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">
          <div className={`rounded-[28px] p-5 flex items-center gap-4 ${hasDriver ? 'bg-emerald-900/20 border border-emerald-900' : 'bg-blue-900/20 border border-blue-900'}`}>
            <div className={`size-12 rounded-[18px] flex items-center justify-center ${hasDriver ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
              <span className={`material-symbols-outlined text-2xl ${hasDriver ? 'text-emerald-500' : 'text-blue-500'}`}>{hasDriver ? 'verified' : 'pending'}</span>
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${hasDriver ? 'text-emerald-500' : 'text-blue-400'}`}>{hasDriver ? 'Motorista Confirmado' : 'Aguardando Confirmação'}</p>
              <h3 className="text-base font-black text-white">{hasDriver ? 'Seu motorista está confirmado!' : 'Buscando motorista disponível...'}</h3>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-[28px] border border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon name={icon} />
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Serviço</p>
                <p className="text-sm font-black text-white">{label}</p>
              </div>
            </div>
            {scheduledAt && (
              <div className="flex items-center gap-3">
                <Icon name="event" />
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Agendado para</p>
                  <p className="text-sm font-black text-white capitalize">{scheduledAt}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Icon name="trip_origin" />
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Origem</p>
                <p className="text-sm font-bold text-zinc-300">{selectedItem.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="location_on" />
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Destino</p>
                <p className="text-sm font-bold text-white">{selectedItem.delivery_address}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Valor Total</span>
              <span className="text-lg font-black text-white">R$ {(selectedItem.total_price || 0).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-[28px] border border-zinc-800 p-5 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Observações para o Motorista</p>
            <textarea
              value={schedObsState}
              onChange={(e) => setSchedObsState(e.target.value)}
              placeholder="Ex: endereço tem portão azul, preciso de nota fiscal..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={saveObservation}
              disabled={isSavingObsState}
              className="w-full py-3 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isSavingObsState ? 'Salvando...' : 'Salvar Observação'}
            </button>
          </div>

          <div className="bg-zinc-900 rounded-[28px] border border-zinc-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
              <Icon name="chat" />
              <p className="text-sm font-black text-white">Chat</p>
            </div>
            <div className="p-4 min-h-[100px] space-y-3">
              {schedMessagesState.length === 0 && (
                <p className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest py-4">
                  {hasDriver ? 'Inicie a conversa com seu motorista' : 'Disponível após confirmação do motorista'}
                </p>
              )}
              {schedMessagesState.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-[18px] ${msg.from === 'user' ? 'bg-blue-500 text-white rounded-tr-[6px]' : 'bg-zinc-800 text-white rounded-tl-[6px]'}`}>
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <input
                value={schedChatInputState}
                onChange={(e) => setSchedChatInputState(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
              <button onClick={sendScheduledMessage} className="size-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white active:scale-95 transition-all">
                <Icon name="send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BottomNav = () => {
    const navItems = [
      { id: "home", icon: "explore", label: "Inicio" },
      { id: "wallet", icon: "account_balance_wallet", label: "IZI Pay" },
      { id: "cart", icon: "shopping_cart", label: cart.length > 0 ? `R$ ${cart.reduce((sum: number, item: any) => sum + (item.price || 0), 0).toFixed(2).replace(".", ",")}` : "Carrinho", isCart: true },
      { id: "orders", icon: "receipt_long", label: "Pedidos" },
      { id: "quests", icon: "military_tech", label: "Quests" },
    ];

    return (
      <nav
        className="fixed bottom-0 left-0 z-[1000] flex w-full items-center justify-around bg-black/95 px-2 pb-6 pt-3 backdrop-blur-3xl border-t border-white/5"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)",
          height: "105px",
        }}
      >
        {navItems.map((item) => {
          const isActive = item.isCart ? subView === 'cart' : (tab === item.id && subView === 'none');

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isCart) {
                  navigateSubView("cart");
                } else if (item.id === "quests") {
                  setSubView("quest_center");
                } else {
                  setTab(item.id as any);
                  setSubView("none");
                  window.history.replaceState(
                    { view: "app", tab: item.id, subView: "none" },
                    "",
                  );
                }
              }}
              className="relative flex flex-col items-center justify-center flex-1 transition-all active:scale-95"
            >
              <div 
                className={`relative flex size-12 items-center justify-center rounded-[20px] transition-all duration-500 ${
                  isActive 
                    ? "bg-yellow-400 shadow-[6px_6px_12px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] scale-110" 
                    : "bg-zinc-900 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.02)]"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[24px] transition-all ${isActive ? 'text-black font-black' : 'text-zinc-600'}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>

                {item.isCart && cart.length > 0 && (
                  <span className={`absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[9px] font-black transition-colors ${isActive ? 'bg-black text-yellow-400' : 'bg-red-500 text-white shadow-lg'}`}>
                    {cart.length > 99 ? "99+" : cart.length}
                  </span>
                )}
              </div>

              <span
                className={`mt-2 text-[8px] font-black uppercase tracking-[0.05em] transition-all text-center ${
                  isActive ? "text-yellow-400" : "text-zinc-600"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-black selection:bg-yellow-400/30">
      <AnimatePresence mode="wait">

        {view === "loading" && !showSplash && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity }} className="size-24 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-yellow-400 italic tracking-tighter">IZI</span>
              </div>
            </div>
            <p className="mt-8 text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Carregando Experiência</p>
          </motion.div>
        )}

        {view === "login" && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <LoginView loginEmail={loginEmail} setLoginEmail={setLoginEmail} loginPassword={loginPassword} setLoginPassword={setLoginPassword} authMode={authMode} setAuthMode={setAuthMode} handleLogin={handleLogin} handleSignUp={handleSignUp} isLoading={isLoading} loginError={loginError} phone={phone} setPhone={setPhone} userName={userName} setUserName={setUserName} />
          </motion.div>
        )}

        {view === "app" && (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen relative overflow-hidden bg-black">
            <AnimatePresence mode="wait">
              {tab === "home" && (
                <motion.div key="home-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <HomeView userLevel={userLevel} userId={userId} userLocation={userLocation} isIziBlackMembership={isIziBlackMembership} cart={cart} myOrders={myOrders} navigateSubView={navigateSubView} setSubView={setSubView} subView={subView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSelectedItem={setSelectedItem} onOpenDepositModal={() => setShowDepositModal(true)} onReturnToPayment={(order) => {
                    setSelectedItem(order);
                    const method = order?.payment_method;
                    if (method === 'pix') setSubView("pix_payment");
                    else if (method === 'lightning' || method === 'bitcoin_lightning') setSubView("lightning_payment");
                    else setSubView("card_payment");
                  }} availableCoupons={availableCoupons.filter((c: any) => c.coupon_code)} banners={availableCoupons.filter((c: any) => !c.coupon_code && c.image_url)} copiedCoupon={copiedCoupon} setCopiedCoupon={setCopiedCoupon} showToast={showToast} setShowMasterPerks={setShowMasterPerks} ESTABLISHMENTS={ESTABLISHMENTS} handleShopClick={handleShopClick} flashOffers={flashOffers} setActiveService={setActiveService} transitData={transitData} setTransitData={setTransitData} setExploreCategoryState={setExploreCategoryState} setRestaurantInitialCategory={setRestaurantInitialCategory} setTab={setTab} />
                </motion.div>
              )}
              {tab === "orders" && (
                <motion.div key="orders-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                   <OrderListView myOrders={myOrders} userId={userId} setSubView={setSubView} setSelectedItem={setSelectedItem} navigateSubView={navigateSubView} fetchMyOrders={fetchMyOrders} tab={tab} />
                </motion.div>
              )}
              {tab === "wallet" && (
                <motion.div key="wallet-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                   <WalletView 
                     mercadopagoPublicKey={appSettings?.mercadopago_public_key}
                     walletTransactions={walletTransactions} 
                     myOrders={myOrders} 
                     userXP={userXP} 
                     savedCards={savedCards} 
                     paymentMethod={paymentMethod} 
                     setPaymentsOrigin={setPaymentsOrigin} 
                     setSubView={setSubView} 
                     showToast={showToast} 
                     userId={userId} 
                     userName={userName} 
                     iziCoins={iziCoins} 
                     iziCashback={iziCashbackEarned} 
                     setShowDepositModal={setShowDepositModal} 
                     iziCoinValue={globalSettings?.izi_coin_value || 0.01} 
                     iziCoinRate={globalSettings?.izi_coin_value || 1.0} 
                   />
                </motion.div>
              )}
              {tab === "profile" && (
                <motion.div key="profile-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-black">
                   <ProfileView userId={userId} userName={userName} userLevel={userLevel} userXP={userXP} walletBalance={iziCoins} setSubView={setSubView} logout={logout} setTab={setTab} isIziBlackMembership={isIziBlackMembership} />
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
                    setSubView={setSubView} 
                    navigateSubView={navigateSubView}
                    merchantProducts={selectedShop?.products || []}
                    merchantName={selectedShop?.name || ""}
                    handleAddToCart={handleAddToCart}
                    iziCoinRate={globalSettings?.izi_coin_rate || 1}
                    isIziBlack={isIziBlackMembership} 
                    iziBlackRate={appSettings?.iziBlackCashback || 1}
                    deliveryFee={calculateDeliveryFee()} 
                  />
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
                    iziCoinValue={globalSettings?.izi_coin_value || 0.01} 
                    iziCoinRate={globalSettings?.izi_coin_rate || 1}
                    deliveryFee={calculateDeliveryFee()} 
                    serviceFee={globalSettings?.service_fee_percent || 0}
                    isIziBlack={isIziBlackMembership}
                    iziBlackCashback={appSettings?.iziBlackCashback || 1}
                    iziBlackCashbackMultiplier={appSettings?.izi_black_cashback_multiplier || 1}
                    paymentMethodsActive={globalSettings?.payment_methods_active}
                  />
                </motion.div>
              )}

              {subView === "explore_restaurants" && (
                <motion.div key="explore_restaurants" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderExploreRestaurants()}
                </motion.div>
              )}
              {subView === "daily_menus" && (
                <motion.div key="daily_menus" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderDailyMenus()}
                </motion.div>
              )}
              {subView === "exclusive_offer" && (
                <motion.div key="exclusive_offer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[125]">
                  {renderExclusiveOffer()}
                </motion.div>
              )}
              {subView === "market_list" && (
                <motion.div key="market_list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderMarketList()}
                </motion.div>
              )}
              {subView === "beverages_list" && (
                <motion.div key="beverages_list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderBeveragesList()}
                </motion.div>
              )}
              {subView === "beverage_offers" && (
                <motion.div key="beverage_offers" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderBeverageOffers()}
                </motion.div>
              )}
              {subView === "pharmacy_list" && (
                <motion.div key="pharmacy_list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderPharmacyList()}
                </motion.div>
              )}
              {subView === "all_pharmacies" && (
                <motion.div key="all_pharmacies" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderAllPharmacies()}
                </motion.div>
              )}
              {subView === "health_plantao" && (
                <motion.div key="health_plantao" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderHealthPlantao()}
                </motion.div>
              )}
              {subView === "generic_list" && (
                <motion.div key="generic_list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderGenericList()}
                </motion.div>
              )}
              {(subView === "restaurant_menu" || subView === "shop") && (
                <motion.div key="restaurant_menu" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[125]">
                  {renderRestaurantMenu()}
                </motion.div>
              )}
              {(subView === "product" || subView === "product_detail") && (
                <motion.div key="product_detail" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[130]">
                  {renderProductDetail()}
                </motion.div>
              )}
              {subView === "order_detail" && (
                <motion.div key="odetail" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[140]">
                   {renderOrderDetail()}
                </motion.div>
              )}
              {subView === "addresses" && (
                <motion.div key="addres" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                  {renderAddresses()}
                </motion.div>
              )}
              {subView === "payments" && (
                <motion.div key="payments" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                  {renderPayments()}
                </motion.div>
              )}
              {subView === "wallet_internal" && (
                <motion.div key="wallet" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                  {renderWallet()}
                </motion.div>
              )}
              {subView === "explore_envios" && (
                <motion.div key="exp_envios" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderExploreEnvios()}
                </motion.div>
              )}
              {subView === "shipping_priority" && (
                <motion.div key="ship_priority" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderIziExpressPriority()}
                </motion.div>
              )}
              {subView === "shipping_details" && (
                <motion.div key="ship_det" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderShippingDetails()}
                </motion.div>
              )}
              {subView === "order_support" && (
                <motion.div key="osupport" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                  {renderOrderSupportFlow()}
                </motion.div>
              )}
              {subView === "order_feedback" && (
                <motion.div key="ofeedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[160]">
                  {renderOrderFeedback()}
                </motion.div>
              )}
              {subView === "order_chat" && (
                <motion.div key="ochat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderOrderChatFlow()}
                </motion.div>
              )}
              {subView === "quest_center" && (
                <motion.div key="quests" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[190]">
                  {renderQuestCenter()}
                </motion.div>
              )}
              {subView === "notifications_center" && (
                <motion.div key="notifs" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[190]">
                  {renderNotificationsCenter()}
                </motion.div>
              )}
              {subView === "pix_payment" && (
                <motion.div key="pixpay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderPixPayment()}
                </motion.div>
              )}
              {subView === "lightning_payment" && (
                <motion.div key="lnpay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] h-full overflow-hidden bg-black">
                  {renderLightningPayment()}
                </motion.div>
              )}
              {subView === "card_payment" && (
                <motion.div key="cardpay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] h-full overflow-hidden bg-black">
                  {renderCardPayment()}
                </motion.div>
              )}
              {subView === "explore_category" && (
                <motion.div key="expcat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                  {renderExploreCategory()}
                </motion.div>
              )}
              {subView === "taxi_wizard" && (
                <motion.div key="taxi_wiz" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[110]">
                  {renderTaxiWizard()}
                </motion.div>
              )}
              {subView === "freight_wizard" && (
                <motion.div key="freight" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderFreightWizard()}
                </motion.div>
              )}
              {subView === "excursion_wizard" && (
                <motion.div key="excv" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderExcursionWizard()}
                </motion.div>
              )}
              {subView === "mobility_payment" && (
                <motion.div key="mob_pay" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[115]">
                  {renderMobilityPayment()}
                </motion.div>
              )}
              {subView === "active_order" && (
                <motion.div key="aorder" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[100]">
                  <ActiveOrderView selectedItem={selectedItem} driverLocation={driverLocation} userLocation={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} routePolyline={routePolyline || selectedItem?.route_polyline} onMyLocationClick={updateLocation} setSubView={setSubView} onCancelOrder={handleCancelOrder} />
                </motion.div>
              )}
              {subView === "logistics_tracking" && (
                <motion.div key="logtrack" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[100]">
                  <LogisticsTrackingView 
                    order={selectedItem} 
                    driverLocation={driverLocation} 
                    userLocation={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
                    onBack={() => setSubView("none")} 
                    onCancel={() => handleCancelOrder(selectedItem?.id)} 
                  />
                </motion.div>
              )}
              {subView === "izi_coin_tracking" && (
                <motion.div key="izi_coin_tracking" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-0 z-[100] bg-black overflow-hidden h-full">
                  <IziCoinTrackingView 
                    order={selectedItem} 
                    onClose={() => setSubView("none")} 
                    onGoToWallet={() => { setTab("wallet"); setSubView("none"); }} 
                    onSupport={() => setSubView("order_support")} 
                    onReturnToPayment={() => {
                      const method = selectedItem?.payment_method;
                      if (method === 'pix') setSubView("pix_payment");
                      else if (method === 'lightning' || method === 'bitcoin_lightning') setSubView("lightning_payment");
                      else if (method === 'cartao') setSubView("card_payment");
                      else setSubView("card_payment"); // fallback final
                    }}
                  />
                </motion.div>
              )}
              {subView === "payment_processing" && (
                <motion.div key="pproc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderPaymentProcessing()}
                </motion.div>
              )}
              {subView === "payment_error" && (
                <motion.div key="perr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderPaymentError()}
                </motion.div>
              )}
              {subView === "payment_success" && (
                <motion.div key="psuccess" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderPaymentSuccess()}
                </motion.div>
              )}
              {subView === "waiting_merchant" && (
                <motion.div key="wmerchant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderWaitingMerchant()}
                </motion.div>
              )}
              {subView === "waiting_driver" && (
                <motion.div key="wdriver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderWaitingDriver()}
                </motion.div>
              )}
              {subView === "scheduled_order" && (
                <motion.div key="wsched" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderScheduledOrder()}
                </motion.div>
              )}
              {subView === "izi_black_purchase" && (
                <motion.div key="iziblackp" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.5 }} className="absolute inset-0 z-[180]">
                  {renderIziBlackPurchase()}
                </motion.div>
              )}
              {subView === "flash_offers_list" && (
                <motion.div key="flash_list" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderFlashOffersList()}
                </motion.div>
              )}
              {isAIOpen && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="fixed inset-0 z-[160]"
                >
                  {renderAIConcierge()}
                </motion.div>
              )}
              {showIziBlackWelcome && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[2000]"
                >
                  {renderIziBlackWelcome()}
                </motion.div>
              )}
              {showIziBlackCard && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="fixed inset-0 z-[170]"
                >
                  {renderIziBlackCard()}
                </motion.div>
              )}
              {showMasterPerks && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="fixed inset-0 z-[180]"
                >
                  {renderMasterPerks()}
                </motion.div>
              )}
            </AnimatePresence>

            {subView === "none" && <BottomNav />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Animations */}
      <AnimatePresence>
        {cartAnimations.map(anim => (
          <motion.img
            key={anim.id}
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
              ease: [0.175, 0.885, 0.32, 1.275] // nice curved path feel
            }}
            className="fixed z-[9999] size-16 object-cover rounded-full shadow-2xl border-2 border-primary pointer-events-none"
          />
        ))}
      </AnimatePresence>

      {renderMyQRModal()}
      {renderTransferModal()}

      {renderDepositModal()}
      {renderBroadcastPopup()}

      {toast && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[400px]"
        >
          <div className={`p-5 rounded-[32px] shadow-2xl backdrop-blur-3xl border flex items-center gap-4 ${
            toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
            toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' :
            toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
            'bg-slate-900/90 border-slate-700 text-white'
          }`}>
            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-white/20' : 'bg-black/20'
            }`}>
              <span className="material-symbols-outlined font-black">
                {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : toast.type === 'error' ? 'error_outline' : 'notifications_active'}
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-tight leading-tight flex-1">{toast.message}</p>
          </div>
        </motion.div>
      )}

      {/* GLOBAL MODALS (DATE, TIME, LOJISTAS) */}
      <AnimatePresence>
        {showLojistasModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[250] bg-black/98 backdrop-blur-3xl flex flex-col p-6"
          >
            <header className="flex items-center justify-between mb-8 bg-black/40 backdrop-blur-2xl border border-white/10 p-5 rounded-[36px] shadow-[20px_20px_40px_rgba(0,0,0,0.6),inset_8px_8px_16px_rgba(255,255,255,0.02),inset_-8px_-8px_16px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-4">
                 <div className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.03)]">
                    <span className="material-symbols-outlined text-yellow-400">storefront</span>
                 </div>
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Lojas Parceiras</h3>
              </div>
              <button 
                onClick={() => setShowLojistasModal(false)} 
                className="size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 active:scale-90 transition-all shadow-[6px_6px_12px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03)]"
              >
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </header>

            <div className="relative mb-8 group">
               <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors z-10 text-xl">search</span>
               <input 
                 type="text" 
                 placeholder="Buscar por nome ou região..." 
                 className="w-full bg-zinc-900 shadow-[10px_10px_20px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 rounded-[26px] py-4.5 pl-14 pr-6 text-sm font-black focus:outline-none text-white placeholder-zinc-700 transition-all" 
               />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-10">
               {partnerStores.map((store, i) => (
                  <motion.div 
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={store.id} 
                    onClick={() => { 
                      setTransitData(prev => ({
                        ...prev, 
                        receiverName: store.name || "", 
                        receiverPhone: store.phone || store.store_phone || "", 
                        origin: store.address || store.store_address || ""
                      })); 
                      setShowLojistasModal(false); 
                    }}
                    className="p-7 rounded-[40px] bg-zinc-800 border border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-10px_-10px_30px_rgba(255,255,255,0.01),inset_6px_6px_12px_rgba(255,255,255,0.03),inset_-6px_-6px_12px_rgba(0,0,0,0.4)] hover:border-yellow-400/30 transition-all group cursor-pointer relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     
                     <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 shadow-[inset_1px_1px_2px_rgba(250,204,21,0.1)]">
                           <div className="size-1 rounded-full bg-yellow-400 animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">{store.type || "Loja"}</span>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-3 py-1.5 rounded-xl shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)]">{store.hours || "Disponível"}</span>
                     </div>
                     <h4 className="font-black text-white text-base group-hover:text-yellow-400 transition-colors uppercase italic tracking-tight relative z-10">{store.name || "Sem Nome"}</h4>
                     <p className="text-[11px] font-bold text-zinc-400 mt-2 leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity relative z-10">{store.address || store.store_address || "Endereço Coleta Izi"}</p>
                     
                     <div className="mt-5 flex items-center justify-end">
                        <div className="size-10 rounded-[18px] bg-zinc-900 flex items-center justify-center text-zinc-600 group-hover:bg-yellow-400 group-hover:text-black transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.03)] group-hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                           <span className="material-symbols-outlined text-[18px] font-black">chevron_right</span>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
          </motion.div>
        )}

        {showDatePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-zinc-800 border border-white/5 rounded-[50px] p-8 overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.6),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
              <div className="text-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Próximos 30 dias</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mt-1">Selecione uma data</p>
              </div>
              <div className="grid grid-cols-1 gap-4 max-h-[45vh] overflow-y-auto no-scrollbar pr-2 py-2">
                {[...Array(30)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
                  const iso = d.toISOString().split('T')[0];
                  const isSelected = transitData.scheduledDate === iso;

                  return (
                    <button 
                      key={i} 
                      onClick={() => { setTransitData({...transitData, scheduledDate: iso}); setShowDatePicker(false); }} 
                      className={`w-full py-6 rounded-[30px] border transition-all font-black text-xs uppercase tracking-widest active:scale-95 ${
                        isSelected 
                          ? "bg-yellow-400 border-yellow-400 text-black shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" 
                          : "bg-zinc-800 border-white/5 text-zinc-400 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)] hover:border-zinc-700"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setShowDatePicker(false)} 
                className="mt-8 w-full py-5 text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] bg-zinc-900/50 border border-white/5 rounded-[25px] active:scale-95 transition-all shadow-xl"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}

        {showTimePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-zinc-800 border border-white/5 rounded-[50px] p-8 overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.6),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
              <div className="text-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Horário</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mt-1">Das 08:00 às 22:00</p>
              </div>
              <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2 py-2">
                {(() => {
                  const slots = [];
                  for (let h = 8; h <= 22; h++) {
                    const hh = h < 10 ? `0${h}` : `${h}`;
                    slots.push(`${hh}:00`);
                    if (h < 22) slots.push(`${hh}:30`);
                  }
                  return slots.map((h) => {
                    const isSelected = transitData.scheduledTime === h;
                    return (
                      <button 
                        key={h} 
                        onClick={() => { setTransitData({...transitData, scheduledTime: h}); setShowTimePicker(false); }} 
                        className={`py-4 rounded-[20px] border transition-all font-black text-xs active:scale-90 ${
                          isSelected 
                            ? "bg-yellow-400 border-yellow-400 text-black shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.5)]" 
                            : "bg-zinc-800 border-white/5 text-zinc-400 shadow-[4px_4px_8px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.02)] hover:border-zinc-700"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  });
                })()}
              </div>
              <button 
                onClick={() => setShowTimePicker(false)} 
                className="mt-8 w-full py-5 text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] bg-zinc-900/50 border border-white/5 rounded-[25px] active:scale-95 transition-all shadow-xl"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSplash && (
          <SplashScreenComponent finishLoading={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}


export default App;






