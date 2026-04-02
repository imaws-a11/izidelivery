import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { BespokeIcons } from "./lib/BespokeIcons";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { EstablishmentListView } from "./components/features/Establishment/EstablishmentListView";
import { ExploreRestaurantsView } from "./components/features/Home/ExploreRestaurantsView";
import { BeverageOffersView } from "./components/features/Home/BeverageOffersView";
import { RestaurantMenuView } from "./components/features/Home/RestaurantMenuView";
import { MarketExploreView } from "./components/features/Home/MarketExploreView";
import { PaymentMethodsView } from "./components/features/Profile/PaymentMethodsView";

import { useAuth } from "./hooks/useAuth";
import type { SavedAddress, Order, Quest } from "./types";

// Componentes agora em arquivos separados

function App() {
  const [view, setView] = useState<"login" | "app" | "loading">("loading");
  const [tab, setTab] = useState<"home" | "orders" | "wallet" | "profile">(
    "home",
  );

  // Carrega a Google Maps API uma Ãºnica vez para toda a aplicaÃ§Ã£o (singleton)
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
  const [cartAnimations, setCartAnimations] = useState<{id: string, x: number, y: number, img: string}[]>([]);

  const triggerCartAnimation = (e: React.MouseEvent, img: string) => {
    const id = Date.now().toString() + Math.random();
    setCartAnimations(prev => [...prev, { id, x: e.clientX, y: e.clientY, img }]);
    setTimeout(() => {
      setCartAnimations(prev => prev.filter(a => a.id !== id));
    }, 800);
  };

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
    | "van_wizard"
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
  >("none");
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
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [schedObsState, setSchedObsState] = useState('');
  const [schedChatInputState, setSchedChatInputState] = useState('');
  const [schedMessagesState, setSchedMessagesState] = useState<{id: string; text: string; from: 'user'|'driver'; time: string}[]>([]);
  const [isSavingObsState, setIsSavingObsState] = useState(false);
  const [aiMessage, setAiMessage] = useState("OlÃ¡! Sou seu assistente Izi. Percebi que vocÃª gosta de culinÃ¡ria japonesa. Que tal conferir as ofertas do Sushi Zen?");
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
        .single();
      if (data) setGlobalSettings(data);

      const { data: appData } = await supabase
        .from('app_settings_delivery')
        .select('*')
        .single();
      if (appData) setAppSettings(appData);
    } catch (e) {}
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
      // Se tem cartÃ£o padrÃ£o, define o mÃ©todo de pagamento
      const defaultCard = cards.find((c: any) => c.active);
      if (defaultCard) setPaymentMethod("cartao");
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
    if (await showConfirm({ message: "Remover este cartÃ£o?" })) {
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
      // Sincroniza o local atual se houver um endereÃ§o ativo no banco
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
      toastError('Preencha pelo menos o rÃ³tulo e a rua.');
      return;
    }
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        const { error } = await supabase.from('saved_addresses').update({
          label: newAddrLabel.trim(),
          street: newAddrStreet.trim(),
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
        }).eq('id', editingAddress.id);
        if (error) throw error;
        toastSuccess('EndereÃ§o atualizado!');
      } else {
        const { error } = await supabase.from('saved_addresses').insert({
          user_id: userId,
          label: newAddrLabel.trim(),
          street: newAddrStreet.trim(),
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
          is_active: savedAddresses.length === 0,
        });
        if (error) throw error;
        toastSuccess('EndereÃ§o salvo com sucesso!');
      }
      resetAddressForm();
      fetchSavedAddresses(userId);
    } catch (e: any) {
      toastError('Erro ao salvar: ' + e.message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId: string | number) => {
    if (!userId) return;
    try {
      const { error } = await supabase.from('saved_addresses').delete().eq('id', addrId);
      if (error) throw error;
      toastSuccess('EndereÃ§o removido.');
      fetchSavedAddresses(userId);
    } catch (e: any) {
      toastError('Erro ao remover: ' + e.message);
    }
  };

  const handleSetActiveAddress = async (addrId: string | number) => {
    if (!userId) return;
    try {
      await supabase.from('saved_addresses').update({ is_active: false }).eq('user_id', userId);
      const { error } = await supabase.from('saved_addresses').update({ is_active: true }).eq('id', addrId);
      if (error) throw error;
      toastSuccess('EndereÃ§o padrÃ£o atualizado!');
      fetchSavedAddresses(userId);
    } catch (e: any) {
      toastError('Erro ao definir endereÃ§o: ' + e.message);
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
    return () => {
      clearInterval(interval);
      supabase.removeChannel(flashChannel);
    };
  }, []);

  const fetchWalletBalance = async (uid: string) => {
    if (!uid) return;
    const { data } = await supabase
      .from("users_delivery")
      .select("wallet_balance, is_izi_black, cashback_earned, user_xp, izi_coins, cpf")
      .eq("id", uid)
      .single();
    if (data) {
      setWalletBalance(data.wallet_balance || 0);
      setIsIziBlackMembership(data.is_izi_black || false);
      setIziCashbackEarned(data.cashback_earned || 0);
      setUserXP(data.user_xp || 0);
      setIziCoins(data.izi_coins || 0);
      setProfileCpf(data.cpf || "");
    }

    // Buscar transacoes reais
    const { data: txData } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    if (txData) setWalletTransactions(txData);
  };

  const fetchCartData = async (uid: string) => {
    if (!uid) return;
    try {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("cart_data")
        .eq("id", uid)
        .single();
      
      if (data && data.cart_data && Array.isArray(data.cart_data)) {
        // Combinar localStorage com DB ou priorizar DB?
        // Priorizamos o banco para manter consistÃªncia entre aparelhos
        if (data.cart_data.length > 0) {
          setCart(data.cart_data);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar sacola sincronizada:", e);
    }
  };

  const isLoaded = true; // Loaded via index.html

  const updateLocation = (onSuccess?: (address: string) => void) => {
    setUserLocation((prev) => ({ ...prev, loading: true }));
    if (!("geolocation" in navigator)) {
      setUserLocation({ address: "GeolocalizaÃ§Ã£o nÃ£o disponÃ­vel", loading: false });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let address = "";

          // Tenta reverse geocode via Google Maps Geocoder
          if ((window as any).google?.maps) {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({
              location: { lat: latitude, lng: longitude },
            });
            if (response.results[0]) {
              address = response.results[0].formatted_address;
            }
          }

          // Fallback: Places API (New) reverse geocode via fetch
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

          // ÃƒÆ’Ã…Â¡ltimo fallback: Nominatim
          if (!address) {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const nomData = await nomRes.json();
            address = nomData.display_name?.split(",").slice(0, 3).join(",").trim() || "LocalizaÃ§Ã£o atual";
          }

          setUserLocation({ address, loading: false, lat: latitude, lng: longitude });
          setTransitData((prev) => ({ ...prev, origin: address }));
          if (onSuccess) onSuccess(address);
        } catch {
          setUserLocation((prev) => ({ ...prev, loading: false }));
        }
      },
      () => {
        setUserLocation({ address: "PermissÃ£o de localizaÃ§Ã£o negada", loading: false });
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
          
          if (newOrder.user_id !== userIdRef.current) return;

          // Se o status mudou, mostrar notificaÃ§Ã£o personalizada
          if (!oldOrder || (oldOrder && newOrder.status !== oldOrder.status)) {
             fetchMyOrders(userIdRef.current!);
          }

          // Se o status mudou, mostrar notificaÃ§Ã£o personalizada
          if (oldOrder && newOrder.status !== oldOrder.status) {
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
              'picked_up': 'Pedido coletado! O motoboy iniciou a entrega para vocÃª. ðŸš€',
              'a_caminho': 'Motoboy a caminho! Sua entrega estÃ¡ em rota. ðŸ›µ',
              'saiu_para_entrega': 'Fique atento! Seu pedido saiu para entrega! ðŸ›µ',
              'em_rota': 'Motoboy a caminho! Prepare-se para receber seu Izi. ðŸ›µ',
              'no_local': 'O motoboy chegou ao seu endereÃ§o! ðŸ””',
              'concluido': 'Pedido entregue com sucesso! Bom apetite. âœ¨',
              'cancelado': 'Ah nÃ£o! Seu pedido foi cancelado. âš ï¸',
              'recusado': 'Desculpe, o estabelecimento nÃ£o pÃ´de aceitar o pedido agora. âš ï¸'
            };

            const msg = statusMessages[newOrder.status] || `Status do pedido atualizado: ${newOrder.status}`;
            showToast(msg, newOrder.status === 'cancelado' ? 'warning' : 'success');

            // Se o pagamento lightning foi confirmado, fechar a tela de pagamento
            if (newOrder.payment_status === 'paid' && subViewRef.current === "lightning_payment") {
              setSubView("payment_success");
            }

            // Se o pagamento PIX ou outros foram aprovados (status 'novo')
            if (newOrder.status === 'novo' && (subViewRef.current === "pix_payment" || subViewRef.current === "payment_processing")) {
              setSubView("payment_success");
              fetchMyOrders(userIdRef.current!);
            }

            // Abrir tela de avaliaÃ§Ã£o ao concluir (exceto para assinaturas Izi Black)
            if (newOrder.status === 'concluido') {
              setSelectedItem(newOrder);
              
              setTimeout(() => {
                if (newOrder.service_type === 'subscription') {
                  setShowIziBlackWelcome(true);
                  setSubView("none");
                } else {
                  setSubView("order_feedback");
                }
              }, 2000);
            }

            // TransiÃ§ÃƒÆ’Âµes automÃ¡ticas de tela baseadas no status
            if (subViewRef.current === "waiting_merchant" && ["aceito", "confirmado", "preparando", "pendente", "no_preparo", "pronto", "waiting_driver"].includes(newOrder.status)) {
              showToast("Loja aceitou seu pedido! ðŸ¥³", "success");
              setSelectedItem(newOrder); 
              setTimeout(() => setSubView("active_order"), 1000);
            }
            if (subViewRef.current === "waiting_merchant" && newOrder.status === "cancelado") {
              showToast("Seu pedido foi recusado.", "warning");
              setSubView("none");
              fetchMyOrders(userIdRef.current!);
            }
            if (subViewRef.current === "waiting_driver" && 
                ["a_caminho", "aceito", "confirmado", "em_rota", "no_local", "picked_up", "saiu_para_entrega"].includes(newOrder.status)) {
              setSelectedItem(newOrder);
              setTimeout(() => setSubView("active_order"), 1500);
            }
            if (subViewRef.current === "waiting_driver" && newOrder.status === "cancelado") {
              setSubView("none");
              fetchMyOrders(userIdRef.current!);
            }

            if (selectedItemRef.current?.id === newOrder.id || !selectedItemRef.current) {
              setSelectedItem(newOrder);
            }
          }
          
          if (userIdRef.current) fetchMyOrders(userIdRef.current);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [userId, subView]);
  
  const fetchMyOrders = async (uid: string) => {
    if (!uid) return;
    const { data } = await supabase
      .from("orders_delivery")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setMyOrders(data);
  };

  const handleCancelOrder = async (orderId: string) => {
    console.log("[DEBUG] Iniciando cancelamento do pedido:", orderId);
    if (!orderId) {
      toastError("ID do pedido nÃ£o encontrado.");
      return;
    }

    try {
      const { error } = await supabase
        .from("orders_delivery")
        .update({ status: "cancelado" })
        .eq("id", orderId);

      if (error) {
        console.error("[DEBUG] Erro Supabase no cancelamento:", error);
        throw error;
      }

      console.log("[DEBUG] Pedido cancelado no banco com sucesso.");
      toastSuccess("Pedido cancelado com sucesso!");
      
      if (userId) fetchMyOrders(userId);
      setSelectedItem(null);
      setTab("orders");
      setSubView("none");
    } catch (err: any) {
      console.error("Erro ao cancelar pedido:", err);
      toastError(`NÃ£o foi possÃ­vel cancelar: ${err.message || 'Erro de rede'}`);
    }
  };

  const fetchCoupons = async () => {
    console.log("[DEBUG] Fetching coupons/banners...");
    const { data } = await supabase
      .from('promotions_delivery')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (data) {
      console.log("[DEBUG] Available promotions found:", data.length, data);
      setAvailableCoupons(data);
    }
  };

  const fetchBeveragePromo = useCallback(async () => {
    try {
      // 1. Buscar Banners especÃ­ficos para bebidas ou banners gerais ativos
      const { data: banners } = await supabase
        .from('promotions_delivery')
        .select('*')
        .eq('is_active', true)
        .is('coupon_code', null)
        .order('created_at', { ascending: false });
      
      if (banners) {
        // Filtra banners que mencionam bebidas no tÃ­tulo ou descriÃ§Ã£o
        const bevBanners = banners.filter(b => 
          (b.title?.toLowerCase().includes('bebida') || b.description?.toLowerCase().includes('bebida') ||
           b.title?.toLowerCase().includes('gelada') || b.description?.toLowerCase().includes('gelada'))
        );
        setBeverageBanners(bevBanners.length > 0 ? bevBanners : banners.slice(0, 1));
      }

      // 2. Buscar Produtos da categoria Bebidas para a tela de ofertas
      const { data: pDeals } = await supabase
        .from('products_delivery')
        .select('*')
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
          img: p.image_url || "https://images.unsplash.com/photo-1596753738914-7bc33e08f58b?q=80&w=400",
          cat: p.category || "Bebidas"
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

    if (coupon.id && await hasBenefitBeenUsed("coupon", coupon.id)) {
      return "Este cupom jÃ¡ foi utilizado por este CPF/usuÃ¡rio.";
    }

    return null;
  };

  const validateFlashOfferRules = async (item: any) => {
    const sourceId = getFlashOfferSourceId(item);
    if (!item?.is_flash_offer || !sourceId) return null;
    if (await hasBenefitBeenUsed("flash_offer", sourceId)) {
      return "Esta oferta jÃ¡ foi utilizada por este CPF/usuÃ¡rio.";
    }
    return null;
  };

  const registerBenefitUsage = async (sourceType: "coupon" | "flash_offer", sourceId: string, orderId?: string) => {
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

    if (error) throw error;
  };

  const ensureCartBenefitsAreAvailable = async () => {
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);

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
        setCouponError("Cupom invÃ¡lido ou expirado.");
        setAppliedCoupon(null);
        return;
      }

      const subtotal = cart.reduce((acc, item) => acc + (item.price || 0), 0);
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

  const handleAddToCart = async (item: any) => {
    try {
      const flashOfferError = await validateFlashOfferRules(item);
      if (flashOfferError) {
        showToast(flashOfferError, "error" as any);
        return;
      }

      // Verificar se o produto tem adicionais cadastrados no banco
      const { data: groups, error } = await supabase
        .from('product_options_groups_delivery')
        .select('id')
        .eq('product_id', item.id)
        .limit(1);

      if (groups && groups.length > 0) {
        // Se tiver opcionais, abre a tela de detalhes para o usuÃ¡rio escolher
        setSelectedItem(item);
        setSubView("product_detail");
        return;
      }
    } catch (e) {
      console.error("Erro ao verificar adicionais:", e);
    }

    // Se NÃƒO tiver adicionais, adiciona direto na sacola
    setCart((prev: any[]) => [...prev, { ...item }]);
    setUserXP((prev: number) => prev + 10);
    showToast("Adicionado Ã  sacola!", "success");
  };

  const handleShopClick = async (shop: any) => {
    setSelectedShop(shop);
    setActiveCategory("Destaques");
    const isRestaurant = shop.type === "restaurant";
    const targetView = "restaurant_menu";

    try {
      const { data: products } = await supabase
        .from("products_delivery")
        .select("*")
        .eq("merchant_id", shop.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      console.log("Produtos recebidos:", products?.length, products?.[0]);
      if (products && products.length > 0) {
        const activeProductOffers = (flashOffers || []).filter((offer: any) =>
          offer?.merchant_id === shop.id &&
          offer?.is_active &&
          (!offer?.expires_at || new Date(offer.expires_at).getTime() > Date.now())
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
            img: p.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600",
            merchant_id: shop.id,
            merchant_name: shop.name,
            store: shop.name,
            is_flash_offer: hasLinkedOffer,
            flash_offer_id: hasLinkedOffer ? linkedOffer.id : undefined,
          });
        });
        const categories = Object.entries(grouped).map(([name, items]) => ({ name, items }));
        setSelectedShop({ ...shop, categories });
      }
    } catch (e) {}

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

    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const couponError = await validateCouponRules(data, subtotal);
    if (couponError) {
      toastError(couponError);
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
    const coinRate = globalSettings?.izi_coin_rate || 1;
    const earnedCoins = Math.floor(total * coinRate);
    const finalCoins = isUsingCoins ? earnedCoins : (iziCoins + earnedCoins);
    
    await registerPendingBenefitUsages(orderId);

    setCart([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setUserXP((prev: number) => prev + 50);
    setIziCoins(finalCoins);
    
    if (userId) {
      await supabase.from("users_delivery").update({ 
        izi_coins: finalCoins,
        user_xp: (userXP + 50) 
      }).eq("id", userId);
    }
  };

  const calculateDeliveryFee = () => {
    let shop = selectedShop;
    if (!shop && cart.length > 0) {
      const merchantId = cart[0].merchant_id || cart[0].store_id;
      shop = ESTABLISHMENTS.find(e => e.id === merchantId);
    }
    if (!shop) return 0;
    
    // 1. Respeitar a configuraÃ§Ã£o do lojista no banco
    if (shop.freeDelivery === true || shop.free_delivery === true) return 0;
    
    // 2. BenefÃ­cio IZI Black (se aplicÃ¡vel)
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const minOrderIziBlack = Number(globalSettings?.izi_black_min_order_free_shipping || 50);
    
    // Se a recompensa de frete grÃ¡tis IZI Black estiver ativa (no painel admin) ou atingir o mÃ­nimo
    // Conecta com o widget do admin (IZI Black VIP > Exclusivos): lê promoções VIP ativas
    if (isIziBlackMembership) {
      const hasActiveVipFreeShipping = availableCoupons.some(
        (p: any) => p.is_vip === true && p.is_active === true && p.title === 'Frete Grátis'
      );
      if (hasActiveVipFreeShipping) return 0;
      if (subtotal >= minOrderIziBlack && minOrderIziBlack > 0) return 0;
    }
    
    // 3. Taxa individual do estabelecimento cadastrada no banco
    if (shop.service_fee !== undefined && shop.service_fee !== null) {
      return Number(shop.service_fee);
    }
    
    // Fallback: Taxa base global
    return Number(globalSettings?.base_fee || 5.90);
  };

  const handlePlaceOrder = async (useCoins: boolean = false) => {
    if (!paymentMethod) { alert("Selecione uma forma de pagamento."); return; }
    if (!userId) { alert("FaÃ§a login para continuar."); return; }
    if (cart.length === 0) { alert("Seu carrinho estÃ¡ vazio."); return; }

    const benefitError = await ensureCartBenefitsAreAvailable();
    if (benefitError) {
      toastError(benefitError);
      return;
    }
    
    setIsUsingCoins(useCoins);

    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const couponDiscount = appliedCoupon
      ? appliedCoupon.discount_type === "fixed"
        ? appliedCoupon.discount_value
        : (subtotal * appliedCoupon.discount_value) / 100
      : 0;
    
    const coinValue = globalSettings?.izi_coin_value || 0.01;
    const coinDiscount = useCoins ? iziCoins * coinValue : 0;
    const deliveryFee = calculateDeliveryFee();
    const total = Math.max(0, subtotal + deliveryFee - couponDiscount - coinDiscount);

    const orderBase = {
      user_id: userId,
      merchant_id: selectedShop?.id || cart[0]?.merchant_id || null,
      status: "novo",
      total_price: total,
      delivery_fee: deliveryFee,
      items: cart, // Adicionado para exibiÃ§Ã£o no ActiveOrderView
      pickup_address: selectedShop?.name || "EndereÃ§o do Estabelecimento",
      delivery_address: `${userLocation.address || "EndereÃ§o nÃ£o informado"} | ITENS: ${cart.map((i: any) => formatCartItemSummary(i)).join(', ')}`,
      payment_method: paymentMethod,
      service_type: selectedShop?.type || "restaurant",
      notes: paymentMethod === "dinheiro" && changeFor ? `TROCO PARA: R$ ${changeFor}` : "",
    };

    try {
      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ PAGAMENTOS DIGITAIS (Pendente ConfirmaÃ§Ã£o) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      const isDigital = ["pix", "cartao", "bitcoin_lightning", "google_pay"].includes(paymentMethod);
      const initialStatus = isDigital ? "pendente_pagamento" : (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega" ? "waiting_merchant" : "novo");

      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ PIX (Mercado Pago) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      if (paymentMethod === "pix") {
        setPixConfirmed(false);
        setPixCpf("");
        setSelectedItem({ total_price: total, merchant_id: selectedShop?.id, merchant_name: selectedShop?.name });
        navigateSubView("pix_payment");
        return;
      }

      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ BITCOIN LIGHTNING ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      if (paymentMethod === "bitcoin_lightning") {
        navigateSubView("payment_processing");
        const { data: order, error: insertError } = await supabase.from("orders_delivery").insert({ 
          ...orderBase, 
          status: "pendente_pagamento",
        }).select().single();
        
        if (insertError || !order) { 
          alert("NÃ£o foi possÃ­vel registrar o pedido para pagamento Lightning: " + (insertError?.message || "Erro desconhecido"));
          navigateSubView("payment_error"); 
          return; 
        }

        try {
          const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
            body: { 
              amount: Number(total.toFixed(2)), 
              orderId: order.id, 
              memo: `Pedido ${selectedShop?.name || "IziDelivery"}` 
            },
          });

          if (lnErr || !lnData?.payment_request) {
            console.error("Erro Lightning total:", lnErr, lnData);
            setSelectedItem({ ...order, lightningError: true });
            navigateSubView("lightning_payment");
            return;
          }

          const lData = { 
            lightningInvoice: lnData.payment_request, 
            satoshis: lnData.satoshis, 
            btc_price_brl: lnData.btc_price_brl 
          };
          setLightningData({ ...lData, payment_request: lData.lightningInvoice });
          setSelectedItem({ ...order, ...lData });
          
          await clearCart(order.id);
          navigateSubView("lightning_payment");
        } catch (err) {
          console.error("ExceÃ§Ã£o Lightning:", err);
          setSelectedItem({ ...order, lightningError: true });
          navigateSubView("lightning_payment");
        }
        return;
      }

      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ SALDO DA CARTEIRA ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      if (paymentMethod === "saldo") {
        const walletBal = walletTransactions.reduce((acc: number, t: any) =>
          ["deposito","reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 0);

        if (walletBal < total) {
          alert(`Saldo insuficiente. Seu saldo: R$ ${walletBal.toFixed(2).replace(".",",")}`);
          setIsLoading(false);
          return;
        }

        navigateSubView("payment_processing");
        const { data: order } = await supabase.from("orders_delivery").insert({ 
          ...orderBase, 
          status: "waiting_merchant",
          payment_status: "paid"
        }).select().single();
        
        if (!order) { 
          alert("Erro ao debitar saldo. Tente novamente.");
          navigateSubView("payment_error"); 
          return; 
        }

        await supabase.from("wallet_transactions").insert({
          user_id: userId, type: "pagamento", amount: total,
          description: `Pedido em ${selectedShop?.name || "Loja"}`,
        });

        setSelectedItem(order);
        await clearCart(order.id);
        navigateSubView("waiting_merchant");
        return;
      }

      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ GOOGLE PAY ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      if (paymentMethod === "google_pay") {
        setIsLoading(true);
        navigateSubView("payment_processing");
        // SimulaÃ§Ã£o de processamento Google Pay
        setTimeout(async () => {
          const { data: order, error } = await supabase.from("orders_delivery").insert({ 
            ...orderBase, 
            status: "waiting_merchant",
            payment_status: "paid"
          }).select().single();

          if (error || !order) {
            toastError("Erro ao processar Google Pay.");
            navigateSubView("payment_error");
            return;
          }
          setSelectedItem(order);
          await clearCart(order.id);
          navigateSubView("waiting_merchant");
          setIsLoading(false);
        }, 2000);
        return;
      }

      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ DINHEIRO / CARTÃƒÆ’Ã†â€™O NA ENTREGA ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      if (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega") {
        if (!selectedShop?.id) { alert("Erro: Estabelecimento nÃ£o selecionado."); setIsLoading(false); return; }
        
        const { data: order, error: insertError } = await supabase
          .from("orders_delivery")
          .insert({ 
            ...orderBase, 
            merchant_id: selectedShop.id,
            status: "waiting_merchant",
            total_price: Number(total.toFixed(2))
          })
          .select()
          .single();

        if (insertError || !order) {
          console.error(`Erro insert ${paymentMethod}:`, insertError);
          alert("NÃ£o foi possÃ­vel processar o pedido. Erro: " + (insertError?.message || "Tente novamente."));
          setIsLoading(false);
          return;
        }

        setSelectedItem(order);
        await clearCart(order.id);
        setChangeFor("");
        navigateSubView("waiting_merchant");
        return;
      }

      // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ CARTÃƒÆ’Ã†â€™O (Mercado Pago / Online Checkout) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
      if (paymentMethod === "cartao") {
        setSubView("card_payment");
        return;
      }

    } catch (e) {
      console.error("Erro ao criar pedido:", e);
      navigateSubView("payment_error");
    } finally {
      setIsLoading(false);
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
    const { data } = await supabase
      .from('flash_offers')
      .select('*, admin_users(store_name, store_logo)')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (data) setFlashOffers(data);
  };

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
    { id: 1, title: 'Explorador Urbano', desc: 'PeÃ§a em 3 categorias diferentes hoje', xp: 500, progress: 1, total: 3, icon: 'explore', color: '#fbbf24' },
    { id: 2, title: 'Amigo do Peito', desc: 'Indique um amigo para a Izi', xp: 1000, progress: 0, total: 1, icon: 'group_add', color: '#10b981' },
    { id: 3, title: 'Madrugador Izi', desc: 'PeÃ§a cafÃ© da manhÃ£ antes das 9h', xp: 300, progress: 0, total: 1, icon: 'wb_sunny', color: '#f59e0b' },
  ]);

  // Refs para manter o estado atual sempre acessÃ­vel nos handlers
  const viewRef = useRef(view);
  const tabRef = useRef(tab);
  const subViewRef = useRef(subView);
  const userIdRef = useRef(userId);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const selectedItemRef = useRef(selectedItem);

  const orderStatusLabels: Record<string, string> = {
    pending: "Aguardando",
    pendente: "Aguardando",
    pendente_pagamento: "Aguardando Pagamento",
    novo: "Processando",
    waiting_merchant: "Aguardando Loja",
    waiting_driver: "Aguardando Entregador",
    aceito: "Confirmado",
    confirmado: "Confirmado",
    preparando: "Em PreparaÃ§Ã£o",
    no_preparo: "Em PreparaÃ§Ã£o",
    pronto: "Pronto",
    a_caminho_coleta: "Indo para Coleta",
    chegou_coleta: "No Local da Coleta",
    a_caminho: "Em Rota",
    at_pickup: "No Local",
    picked_up: "Coletado",
    em_rota: "Em Rota",
    saiu_para_entrega: "Saiu para Entrega",
    no_local: "Chegando",
    concluido: "ConcluÃ­do",
    cancelado: "Cancelado",
  };

  const getOrderStatusLabel = (status?: string) =>
    orderStatusLabels[status || ""] || (status ? status.replace(/_/g, " ") : "Em processamento");

  const getOrderStatusTone = (status?: string) => {
    if (status === "concluido") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "cancelado") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (["waiting_driver", "a_caminho", "em_rota", "saiu_para_entrega", "no_local"].includes(status || "")) {
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
    String(order?.delivery_address || "EndereÃ§o nÃ£o informado")
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
  const partnerStores = [
    { id: 'izi_paulista', name: "Izi Hub Central - Paulista", address: "Av. Paulista, 1000, Bela Vista, SÃ£o Paulo - SP", phone: "(11) 98888-7777", hours: "08h - 22h", type: "Hub LogÃ­stico" },
    { id: 'posto_augusta', name: "Izi Posto Shell - Augusta", address: "Rua Augusta, 500, ConsolaÃ§Ã£o, SÃ£o Paulo - SP", phone: "(11) 97777-6666", hours: "24h", type: "Ponto de Retirada" },
    { id: 'loja_oscar', name: "Izi Express - Oscar Freire", address: "Rua Oscar Freire, 300, Jardins, SÃ£o Paulo - SP", phone: "(11) 96666-5555", hours: "07h - 23h", type: "Loja Parceira" }
  ];
  useEffect(() => { subViewRef.current = subView; }, [subView]);

  // Suporte ao botÃ£o voltar do hardware/navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { view: v, tab: t, subView: sv } = event.state;
        // Se o usuÃ¡rio estÃ¡ autenticado, nunca permitir voltar para login
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
        // Sem estado no histÃ³rico ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â se autenticado, manter no app
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
    weightClass: "Pequeno (atÃ© 5kg)",
    // Novos campos para Frete e Van
    vehicleCategory: "Fiorino/FurgÃ£o",
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
  });
  const [distancePrices, setDistancePrices] = useState<Record<string, number>>({});
  const [distanceValueKm, setDistanceValueKm] = useState(0);
  const [routePolyline, setRoutePolyline] = useState<string>("");
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [mobilityStep, setMobilityStep] = useState(1);

  // Sincronizar polilinha do mapa ao abrir um pedido ativo/histÃ³rico
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

  const isStoreOpen = useCallback((openingHours: any, manualOpen: boolean) => {
    // Prioridade total para o status manual definido pelo lojista na admin.
    // Se is_open for true no banco, a loja estÃ¡ aberta independentemente do horÃ¡rio.
    // Se is_open for false no banco, a loja estÃ¡ fechada.
    if (manualOpen !== undefined && manualOpen !== null) {
      return manualOpen;
    }

    // Fallback para horÃ¡rio caso o status manual nÃ£o esteja definido (ex: lojas antigas)
    if (!openingHours || Object.keys(openingHours).length === 0) return true;

    const now = new Date();
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const today = days[now.getDay()];
    const config = openingHours[today];

    if (!config || !config.active) return false;

    const [openH, openM] = config.open.split(':').map(Number);
    const [closeH, closeM] = config.close.split(':').map(Number);
    
    const nowH = now.getHours();
    const nowM = now.getMinutes();
    
    const nowInMinutes = nowH * 60 + nowM;
    const openInMinutes = openH * 60 + openM;
    const closeInMinutes = closeH * 60 + closeM;

    return nowInMinutes >= openInMinutes && nowInMinutes <= closeInMinutes;
  }, []);

  const fetchRealEstablishments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('role', 'merchant')
        .eq('is_active', true);
        
      if (error) throw error;
      
       const realEstabs = data?.map(m => {
         const isOpen = isStoreOpen(m.opening_hours, m.is_open);
         
         // Mapeamento de tipos do banco para os filtros do App
         const rawType = (m.store_type || "restaurant").toLowerCase().trim();
         let normalizedType = rawType;
         
         if (rawType.includes("restaurante")) normalizedType = "restaurant";
         else if (rawType === "saude") normalizedType = "pharmacy";
         else if (rawType === "mercado") normalizedType = "market";
         else if (rawType === "bebidas") normalizedType = "beverages";
         else if (rawType === "hamburguer") normalizedType = "restaurant";
         
         return {

          id: m.id,
          name: m.store_name || "Loja Parceira",
          tag: isOpen ? "Aberto Agora" : "Fechado",
          statusTag: isOpen ? "Aberto" : "Fechado",
          isOpen,
          rating: "4.9",
          dist: "1.5 km",
          time: m.estimated_time || "30-45 min",
          img: m.store_logo || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200",
          banner: m.store_banner || "https://images.unsplash.com/photo-1514933651103-005eec06ccc0?q=80&w=800",
          freeDelivery: !!m.free_delivery,
          type: normalizedType,
          foodCategory: m.food_category || "all",
          description: m.store_description || "",
        };
      }) || [];
      
      setESTABLISHMENTS(realEstabs);
    } catch (err) {
    }
  }, [isStoreOpen]);

  useEffect(() => {
    fetchRealEstablishments();

    // AI Dynamic Suggestions Cycle
    const aiTips = [
      "Percebi que vocÃª gosta de culinÃ¡ria japonesa. Que tal conferir as ofertas do Sushi Zen?",
      "Hoje Ã© sexta! Temos cupons especiais de 20% em bebidas para membros Izi Black. ÃƒÆ’Â°Ãƒâ€¦Â¸Ãƒâ€šÂÃƒâ€šÂ»",
      "Baseado no seu histÃ³rico, vocÃª costuma pedir em mercados ÃƒÆ’ s 19h. Deseja agendar suas compras?",
      "O trÃƒÂ¢nsito estÃ¡ pesado hoje. Sugiro usar o MototÃ¡xi para chegar mais rÃ¡pido ao seu destino.",
      "VocÃª estÃ¡ a apenas 250 XP de subir para o nÃ­vel 13! Que tal um pedido extra hoje?"
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % aiTips.length;
      setAiMessage(aiTips[index]);
    }, 15000);

    // InscriÃ§Ã£o em tempo real para atualizaÃ§ÃƒÆ’Âµes de status da loja
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
    
    // InscriÃ§Ã£o em tempo real para atualizaÃ§ÃƒÆ’Âµes dos pedidos do prÃ³prio cliente
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
  useEffect(() => {
    if ((subView === "pix_payment" || subView === "lightning_payment") && selectedItem?.id) {
      const liveOrder = myOrders.find((o) => o.id === selectedItem.id);
      if (liveOrder && liveOrder.status && liveOrder.status !== "pendente_pagamento") {
        if (liveOrder.status === "cancelado" || liveOrder.status === "recusado") {
            toastError("Pagamento recusado ou expirado.");
            setSubView("payment_error");
        } else {
            toastSuccess("Pagamento confirmado com sucesso!");
            setSubView("none");
            setTab("orders");
            setSelectedItem(null);
        }
      }
    }
  }, [myOrders, subView, selectedItem]);
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
        // Se a sacola comeÃ§ou vazia, NÃƒO sincronize o vazio com a nuvem durante o boot do componente. 
        // Deixe que o load da nuvem (fetchCartData) recupere a sacola real.
        // Assim evitamos sobrescrever o cart_data de um aparelho 1 com o localstorage vazio de um aparelho 2 recÃ©m-logado.
        if (isFirstEmptySync.current && cart.length === 0) {
            return;
        }
        
        isFirstEmptySync.current = false; // Destrava a nuvem a partir de agora!

        supabase.from("users_delivery")
          .update({ cart_data: cart })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) console.error("Erro ao sincronizar sacola na nuvem:", error);
          });
      }
    } catch {}
  }, [cart, userId]);
  const [userLocation, setUserLocation] = useState<{
    address: string;
    loading: boolean;
    lat?: number;
    lng?: number;
  }>({
    address: "Buscando localizaÃ§Ã£o...",
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
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponInput, setCouponInput] = useState("");
  const [, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
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

  // --- MOTOR DE PRECIFICAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O DINÃƒÆ’Ã¢â‚¬Å¡MICA (REAL-TIME DATA) ---
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
      baseValues: {
        mototaxi_min: 6.0, mototaxi_km: 2.5,
        carro_min: 14.0, carro_km: 4.5,
        van_min: 35.0, van_km: 8.0,
        utilitario_min: 10.0, utilitario_km: 3.0,
        isDynamicActive: true
      }
    }
  });

  const foodCategories = [
    { id: "all",        name: "Todos",         icon: "restaurant",    action: () => { setRestaurantInitialCategory("Todos"); navigateSubView("explore_restaurants"); } },
    { id: "promocoes",  name: "PromoÃ§Ãµes",     icon: "percent",       action: () => { setRestaurantInitialCategory("PromoÃ§Ãµes"); navigateSubView("explore_restaurants"); } },
    { id: "burguer",    name: "Burguer",       icon: "lunch_dining",  action: () => { setRestaurantInitialCategory("Burguer"); navigateSubView("explore_restaurants"); } },
    { id: "pizza",      name: "Pizza",         icon: "local_pizza",   action: () => { setRestaurantInitialCategory("Pizza"); navigateSubView("explore_restaurants"); } },
    { id: "doces",      name: "Doces e Bolos", icon: "cake",          action: () => { setRestaurantInitialCategory("Doces e Bolos"); navigateSubView("explore_restaurants"); } },
    { id: "salgados",   name: "Salgados",      icon: "bakery_dining", action: () => { setRestaurantInitialCategory("Salgados"); navigateSubView("explore_restaurants"); } },
    { id: "porcoes",    name: "PorÃ§Ãµes",       icon: "ramen_dining",  action: () => { setRestaurantInitialCategory("PorÃ§Ãµes"); navigateSubView("explore_restaurants"); } },
    { id: "japones",    name: "JaponÃªs",       icon: "set_meal",      action: () => { setRestaurantInitialCategory("JaponÃªs"); navigateSubView("explore_restaurants"); } },
    { id: "massas",     name: "Massas",        icon: "dinner_dining", action: () => { setRestaurantInitialCategory("Massas"); navigateSubView("explore_restaurants"); } },
    { id: "carnes",     name: "Carnes",        icon: "kebab_dining",  action: () => { setRestaurantInitialCategory("Carnes"); navigateSubView("explore_restaurants"); } },
    { id: "fit",        name: "Fit",           icon: "eco",           action: () => { setRestaurantInitialCategory("Fit"); navigateSubView("explore_restaurants"); } },
    { id: "acai",       name: "AÃ§aÃ­",          icon: "grass",         action: () => { setRestaurantInitialCategory("AÃ§aÃ­"); navigateSubView("explore_restaurants"); } },
    { id: "sorvetes",   name: "Sorvetes",      icon: "icecream",       action: () => { setRestaurantInitialCategory("Sorvetes"); navigateSubView("explore_restaurants"); } },
    { id: "padaria",    name: "Padaria",       icon: "breakfast_dining", action: () => { setRestaurantInitialCategory("Padaria"); navigateSubView("explore_restaurants"); } },
    { id: "daily",      name: "Do Dia",        icon: "today",         action: () => navigateSubView("daily_menus") },
  ];

  const lunchCategories = [
    { id: "all",     name: "Todos",           icon: "restaurant" },
    { id: "promo",   name: "PromoÃ§Ã£o do Dia", icon: "percent" },
    { id: "monte",   name: "Monte o seu",     icon: "flatware" },
    { id: "pratos",  name: "Pratos feitos",   icon: "rice_bowl" },
    { id: "marmita", name: "Marmitas",        icon: "lunch_dining" },
  ];

  const fetchMarketData = async () => {
    try {
      // 1. Buscar ConfiguraÃ§Ãµes Centrais do Admin
      const { data: ratesData } = await supabase
        .from('dynamic_rates_delivery')
        .select('*');
      
      const config = {
        equilibrium: ratesData?.find(r => r.type === 'equilibrium')?.metadata || marketConditions.settings.equilibrium,
        weather: ratesData?.find(r => r.type === 'weather_rules')?.metadata || marketConditions.settings.weather,
        baseValues: ratesData?.find(r => r.type === 'base_values')?.metadata || marketConditions.settings.baseValues
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

      // 4. Clima (SimulaÃ§Ã£o estruturada - pronta para API externa)
      const weathers = ["Ensolarado", "Nublado", "Chuva Leve", "Tempestade"];
      const hour = new Date().getHours();
      const currentWeather = (hour > 18 || hour < 6) ? "Nublado" : weathers[Math.floor(Math.random() * 2)];

      // 5. LÃ³gica de EquilÃ­brio de Marketplace usando ConfiguraÃ§Ãµes do Admin
      const drivers = onlineDrivers || 5; 
      const orders = pendingOrders || 0;
      const ratio = orders / drivers;

      // CÃ¡lculo do Multiplicador (Surge) baseado no Threshold e Sensibilidade do Admin
      let surge = 1.0;
      const { threshold, sensitivity, maxSurge } = config.equilibrium;
      
      if (ratio > threshold) {
        surge = 1.0 + (ratio - threshold) * sensitivity;
      }

      // 6. Aplicar Fatores ClimÃ¡ticos Ativos
      if (currentWeather === "Tempestade" && config.weather.storm.active) surge += (config.weather.storm.multiplier - 1);
      if (currentWeather === "Chuva Leve" && config.weather.rain.active) surge += (config.weather.rain.multiplier - 1);
      
      // HorÃ¡rio de Pico (Fixado ou DinÃ¢mico)
      if (hour >= 18 && hour <= 21) surge += 0.3; 

      // 7. Limites de SeguranÃ§a (Hard Caps vindos do Admin)
      const finalSurge = Math.max(1.0, Math.min(maxSurge, surge));

      setMarketConditions({
        demand: parseFloat(ratio.toFixed(2)),
        traffic: ratio > 1.5 ? "Congestionado" : "Normal",
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

  // Calcula preÃ§os usando Routes API (nova, nÃ£o deprecated)
  const calculateDistancePrices = async (origin: string, destination: string) => {
    if (!origin || !destination) return;
    setIsCalculatingPrice(true);
    setDistancePrices({}); // Limpar preÃ§os antigos para feedback visual
    try {
      const apiKey = GMAPS_KEY;
      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline",
        },
        body: JSON.stringify({
          origin: { address: origin },
          destination: { address: destination },
          travelMode: "DRIVE",
          languageCode: "pt-BR",
        }),
      });
      const data = await res.json();
      if (data?.routes?.[0]) {
        const route = data.routes[0];
        const distKm = (route.distanceMeters || 0) / 1000;
        const secs = parseInt(route.duration?.replace("s","") || "0");
        const mins = Math.round(secs / 60);
        const durationText = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}min` : `${mins} min`;
        const distText = distKm < 1 ? `${Math.round(distKm*1000)} m` : `${distKm.toFixed(1)} km`;
        setRouteDistance(`${distText} â€¢ ${durationText}`);
        setDistanceValueKm(distKm);
        if (route.polyline?.encodedPolyline) {
          setRoutePolyline(route.polyline.encodedPolyline);
        }
          const bv = marketConditions.settings.baseValues;
          const surge = (bv.isDynamicActive ? marketConditions.surgeMultiplier : 1.0) || 1.0;
          const mototaxi_min = parseFloat(String(bv.mototaxi_min)) || 6.0;
          const mototaxi_km  = parseFloat(String(bv.mototaxi_km))  || 2.5;
          const carro_min    = parseFloat(String(bv.carro_min))    || 14.0;
          const carro_km     = parseFloat(String(bv.carro_km))     || 4.5;
          const van_min      = parseFloat(String(bv.van_min))      || 35.0;
          const van_km       = parseFloat(String(bv.van_km))       || 8.0;
          const utilitario_min = parseFloat(String(bv.utilitario_min)) || 10.0;
          const utilitario_km  = parseFloat(String(bv.utilitario_km))  || 3.0;
          const newPrices = {
            mototaxi:   parseFloat((Math.max(mototaxi_min,   mototaxi_km   * distKm * surge)).toFixed(2)),
            carro:      parseFloat((Math.max(carro_min,       carro_km      * distKm * surge)).toFixed(2)),
            van:        parseFloat((Math.max(van_min,         van_km        * distKm * surge)).toFixed(2)),
            utilitario: parseFloat((Math.max(utilitario_min,  utilitario_km * distKm * surge)).toFixed(2)),
          };
          setDistancePrices(newPrices);
          // Atualizar estPrice no transitData para uso no pagamento
          setTransitData(prev => ({ ...prev, estPrice: newPrices[prev.type] || newPrices.mototaxi }));

          // Buscar motoristas online reais
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
      }
    } catch (err) {
      console.error("Error calculating routes:", err);
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const handleRequestTransit = () => {
    if (!transitData.origin || !transitData.destination) {
      toastError("Defina origem e destino");
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

    const isShipping = ['utilitario', 'van', 'frete'].includes(transitData.type);
    const bv = marketConditions.settings.baseValues;
    const basePrices: Record<string, number> = { 
      mototaxi: bv.mototaxi_min || 6, 
      carro: bv.carro_min || 14, 
      van: bv.van_min || 35, 
      utilitario: bv.utilitario_min || 10 
    };
    
    // Calcular preÃ§o final usando o novo motor de precificaÃ§Ã£o se disponÃ­vel ou o fallback dinÃƒÂ¢mico
    let finalPrice = 0;
    if (transitData.type === 'utilitario') {
       finalPrice = calculateFreightPrice({
          baseFare: 45,
          distanceInKm: distanceValueKm || 1,
          distanceRate: 2.8,
          helperCount: transitData.helpers,
          helperRate: 35,
          hasStairs: transitData.accessibility.stairsAtOrigin || transitData.accessibility.stairsAtDestination
       }).totalPrice;
    } else if (transitData.type === 'van') {
       finalPrice = calculateVanPrice({
          baseFare: 80,
          distanceInKm: distanceValueKm || 1,
          distanceRate: 3.5,
          stopCount: transitData.stops.length,
          stopRate: 15,
          isDaily: transitData.tripType === 'hourly',
          hours: 4,
          hourlyRate: 45
       }).totalPrice;
    } else {
       const rawP = distancePrices[transitData.type] || calculateDynamicPrice(basePrices[transitData.type] || 6);
       finalPrice = isNaN(rawP) || !rawP ? (basePrices[transitData.type] || 6) : rawP;
    }

    // Aplica benefÃ­cio IZI Black para serviÃ§os de Frete/Envio automaticamente
    if (isIziBlackMembership && isShipping) {
      finalPrice = 0;
    }

    setIsLoading(true);

    const orderBase: any = {
      user_id: userId,
      merchant_id: null,
      status: "waiting_driver",
      total_price: finalPrice,
      service_type: transitData.type,
      pickup_address: transitData.origin,
      delivery_address: `${transitData.destination} | OBS: ${isShipping 
        ? `ENVIO: ${transitData.packageDesc || 'Objeto'} (${transitData.weightClass}). Recebedor: ${transitData.receiverName} (${transitData.receiverPhone})`
        : `VIAGEM: Transporte de passageiro (${transitData.type === 'mototaxi' ? 'MotoTÃ¡xi' : 'Particular'})`}`,
      payment_method: paymentMethod,
      payment_status: (paymentMethod === 'dinheiro' || paymentMethod === 'pix' || paymentMethod === 'bitcoin_lightning') ? 'pending' : 'paid',
      scheduled_at: transitData.scheduled ? `${transitData.scheduledDate}T${transitData.scheduledTime}:00` : null,
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

      // 2. Criar o pedido no banco
      const { data: order, error: insertError } = await supabase
        .from("orders_delivery")
        .insert(orderBase)
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Se for PIX, redirecionar para tela de CPF + QR Code
      if (paymentMethod === 'pix') {
         setPixConfirmed(false);
         setPixCpf("");
         setSelectedItem({ ...order, total_price: finalPrice });
         setSubView('pix_payment');
      } else if (paymentMethod === 'bitcoin_lightning') {
          try {
            const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
              body: { amount: finalPrice, orderId: order.id, memo: `Viagem Izi #${order.id}` },
            });
            if (!lnErr && lnData?.payment_request) {
               setLightningData({ 
                 payment_request: lnData.payment_request, 
                 satoshis: Math.round(finalPrice * 2000), // Exemplo de conversÃ£o
                 btc_price_brl: 350000 
               });
               setSubView("lightning_payment");
            }
          } catch(e) {}
      }

      // Salvar no histÃ³rico
      const newHistory = [transitData.destination, ...transitHistory.filter(h => h !== transitData.destination)].slice(0, 10);
      setTransitHistory(newHistory);
      localStorage.setItem("transitHistory", JSON.stringify(newHistory));

      setSelectedItem(order);
      
      if (paymentMethod !== 'pix' && paymentMethod !== 'bitcoin_lightning') {
        toastSuccess(isShipping ? "Pedido de envio criado!" : "Procurando motorista mais prÃ³ximo...");
        if (transitData.scheduled) {
          setSubView("payment_success");
        } else {
          setSubView("active_order");
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

  // Monitorar mudanÃ§as em origem/destino para calcular preÃ§os em tempo real
  useEffect(() => {
    if ((subView === "taxi_wizard" || subView === "transit_selection") && transitData.origin && transitData.destination) {
      setIsCalculatingPrice(true);
      setDistancePrices({});
      const timer = setTimeout(() => {
        calculateDistancePrices(transitData.origin, transitData.destination);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [transitData.origin, transitData.destination, subView]);

  // Autopreencher origem se estiver vazia ao entrar no wizard
  useEffect(() => {
    if (subView === "taxi_wizard" && userLocation.address && !transitData.origin) {
      setTransitData(prev => ({ ...prev, origin: userLocation.address }));
    }
  }, [subView, userLocation.address]);

  useEffect(() => {
    const previousSubView = previousSubViewRef.current;
    const mobilityWizardViews = ["taxi_wizard", "freight_wizard", "van_wizard"];
    const isEnteringDifferentWizard =
      mobilityWizardViews.includes(subView) &&
      previousSubView !== subView &&
      previousSubView !== "mobility_payment";

    if (isEnteringDifferentWizard) {
      setMobilityStep(1);
    }

    previousSubViewRef.current = subView;
  }, [subView]);

    
  useEffect(() => {
    let html5QrCode: any = null;
    if (isScanningQR) {
      setTimeout(() => {
        const reader = document.getElementById('reader');
        if (reader && typeof (window as any).Html5Qrcode !== 'undefined') {
          html5QrCode = new (window as any).Html5Qrcode("reader");
          html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
              if (decodedText.startsWith("izi:transfer:")) {
                const parts = decodedText.split(":");
                const targetId = parts[2];
                const targetEmail = parts[3];
                const targetPhone = parts[4];
                setTransferTarget({ id: targetId, email: targetEmail, phone: targetPhone });
                setIsScanningQR(false);
                html5QrCode.stop();
                toastSuccess("UsuÃ¡rio Identificado!");
              }
            },
            () => {}
          ).catch((e: any) => console.error(e));
        }
      }, 500);
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((e: any) => console.error(e));
      }
    };
  }, [isScanningQR]);





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
          const type = estab.type.toLowerCase();
          const foodCat = (estab.foodCategory || "").toLowerCase();
          return type === catId || foodCat.includes(catId) || estab.description.toLowerCase().includes(catId);
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
        foodCategories={isLunchMode ? lunchCategories : foodCategories}
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
      <div className="absolute inset-0 z-40 bg-black text-white text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
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
        img: f.product_image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
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
        desc: (f.description || 'Oferta imperdÃ­vel por tempo limitado!') + `\n\nðŸ“Œ Vendido por: ${f.admin_users?.store_name || 'Loja Parceira'}`
      })) : [
        {
          id: 'vip-burger-1',
          name: 'The Ultimate Izi Black Burger',
          store: 'Burger Gourmet Lab',
          img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
          oldPrice: 59.90,
          price: 29.95,
          merchant_id: null,
          merchant_name: 'Burger Gourmet Lab',
          is_flash_offer: true,
          expires_at: new Date(Date.now() + 3600000 * 2).toISOString(),
          off: '50% OFF',
          desc: 'Blend de carne Angus 180g, queijo brie maÃ§aricado, cebola caramelizada no Jack Daniels e pÃ£o brioche artesanal.\n\nðŸ“Œ Vendido por: Burger Gourmet Lab'
        },
        {
          id: 'vip-pizza-1',
          name: 'Pizza Trufada Individual',
          store: 'Forneria d\'Oro',
          img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600',
          oldPrice: 72.00,
          price: 36.00,
          merchant_id: null,
          merchant_name: 'Forneria d\'Oro',
          is_flash_offer: true,
          expires_at: new Date(Date.now() + 1800000).toISOString(),
          off: '50% OFF',
          desc: 'Massa de fermentaÃ§Ã£o natural, mozzarella fior di latte, azeite de trufas brancas e manjericÃ£o fresco.\n\nðŸ“Œ Vendido por: Forneria d\'Oro'
        }
      ];
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
      <div className="absolute inset-0 z-[100] bg-zinc-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-40">
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
      "FarmÃ¡cia": "local_pharmacy", "Mercado": "local_mall",
      "GÃ¡s & Ãgua": "propane_tank", "AÃ§ougue": "kebab_dining", "Padaria": "bakery_dining", "Hortifruti": "nutrition"
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
      <div className="bg-black text-zinc-100 absolute inset-0 z-50 bg-zinc-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-32">
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
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-zinc-900/5 border border-white/10 flex items-center justify-center group active:scale-95 transition-all">
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
                     src={beverageBanners.length > 0 ? beverageBanners[bevBannerIndex].image_url : "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800"} 
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
      />
    );
  };

  const renderLightningPayment = () => {
    const invoice = selectedItem?.lightningInvoice || lightningData?.payment_request || "";
    const satoshis = selectedItem?.satoshis || lightningData?.satoshis || 0;
    const btcPrice = selectedItem?.btcPrice || selectedItem?.btc_price_brl || lightningData?.btc_price_brl || 0;

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
        <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView("checkout")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-white uppercase tracking-tight">Bitcoin Lightning</h1>
        </header>
        <main className="px-5 pt-8 flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
          <div className="text-center space-y-1">
            <div className="size-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl text-orange-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total em Satoshis</p>
            <p className="text-3xl font-black text-white">{satoshis.toLocaleString("pt-BR")} sats</p>
            {btcPrice > 0 && <p className="text-zinc-500 text-xs">1 BTC = R$ {btcPrice.toLocaleString("pt-BR")}</p>}
          </div>

          {invoice && !selectedItem?.lightningError ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-4">
              <div className="w-52 h-52 bg-white rounded-3xl flex items-center justify-center p-3 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                <img
                  src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(invoice)}
                  alt="Lightning QR"
                  className="w-full h-full rounded-2xl"
                />
              </div>
              <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <p className="text-zinc-400 text-xs font-mono truncate flex-1">{invoice.slice(0, 40)}...</p>
                <button onClick={() => { navigator.clipboard.writeText(invoice); toastSuccess("Invoice copiada!"); }}
                  className="text-orange-400 active:scale-90 transition-all shrink-0">
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-orange-400 rounded-full animate-pulse" />
                <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Aguardando pagamento Lightning...</p>
              </div>
              <button onClick={() => { setTab("orders"); setSubView("none"); }}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:border-orange-400/30 hover:text-orange-400 transition-all active:scale-95">
                Ver Meus Pedidos
              </button>
            </motion.div>
          ) : selectedItem?.lightningError ? (
            <div className="w-full flex flex-col items-center gap-6 text-center py-6">
               <div className="size-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-4xl text-orange-500">bolt_slash</span>
               </div>
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Falha na ConexÃ£o Lightning</h3>
               <p className="text-zinc-500 text-sm px-4">NÃ£o foi possÃ­vel gerar sua fatura agora. O pedido foi registrado mas o pagamento via Bitcoin estÃ¡ indisponÃ­vel.</p>
               <button onClick={() => { setTab("orders"); setSubView("none"); }}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest">
                  Ver Meus Pedidos
               </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="size-10 border-2 border-orange-400/20 border-t-orange-400 rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Gerando invoice Lightning...</p>
            </div>
          )}
        </main>
      </div>
    );
  };



  const renderPixPayment = () => {
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
    const cartTotal = Math.max(0, subtotal - discount);
    const total = (pixConfirmed && selectedItem?.total_price) ? Number(selectedItem.total_price) : cartTotal;

    const formatCpf = (v: string) => v.replace(/\D/g,"").slice(0,11)
      .replace(/(\d{3})(\d)/,"$1.$2")
      .replace(/(\d{3})(\d)/,"$1.$2")
      .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

    const handlePixConfirm = async () => {
      if (pixCpf.replace(/\D/g,"").length < 11) { alert("CPF invÃ¡lido."); return; }
      console.log("Iniciando fluxo PIX para total:", total);
      setPixConfirmed(true);
      try {
        let orderId = selectedItem?.id;
        let orderRef = selectedItem;

        const isSubscription = paymentsOrigin === "izi_black";

        // Se o pedido ainda não existe, precisamos criá-lo
        if (!orderId) {
          if (!isSubscription && !selectedShop?.id) { 
            console.error("Erro: Estabelecimento não selecionado durante criação de pedido PIX.");
            alert("Erro: Estabelecimento não identificado. Por favor, volte e selecione a loja novamente."); 
            setPixConfirmed(false); 
            return; 
          }

          console.log("Criando pedido inicial 'pendente_pagamento' para " + (isSubscription ? "assinatura" : "delivery") + "...");
          const { data: order, error: orderErr } = await supabase
            .from("orders_delivery")
            .insert({
              user_id: userId,
              merchant_id: isSubscription ? null : selectedShop.id,
              status: "pendente_pagamento",
              total_price: Number(total.toFixed(2)),
              pickup_address: isSubscription ? "Assinatura Izi Black" : (selectedShop.name || "Endereço do Estabelecimento"),
              delivery_address: isSubscription ? "Serviço Digital" : `${userLocation.address || "Endereço não informado"} | ITENS: ${cart.map((i: any) => formatCartItemSummary(i)).join(', ')}`,
              items: cart, // Adicionado para exibição no ActiveOrderView
              payment_method: "pix",
              service_type: isSubscription ? "subscription" : (selectedShop.type || "restaurant"),
            })
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
        
        // Mapeamento exaustivo (Tenta todas as variaÃ§Ãµes possÃ­veis)
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
          pixCopyPaste: copyPaste || qr, // Fallback do copia e cola para o EMV se necessÃ¡rio
          pixError: false 
        }));
        
        // Limpar sacola apÃ³s sucesso na geraÃ§Ã£o do PIX
        if (cart.length > 0) {
            console.log("Limpando sacola...");
            await clearCart(orderId);
        }

      } catch (e: any) {
        console.error("ExceÃ§Ã£o crÃ­tica no fluxo PIX:", e);
        const errDetail = e.message || "Erro de conexÃ£o. Tente novamente.";
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

          {/* BotÃ£o confirmar */}
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
                     O pedido foi enviado ao lojista, mas nÃ£o conseguimos gerar o QR Code Pix agora. 
                     {selectedItem.pixErrorMessage ? ` Detalhe: ${selectedItem.pixErrorMessage}` : " VocÃª pode tentar pagar atravÃ©s de outro mÃ©todo ou falar com o suporte."}
                  </p>
               </div>
               <div className="w-full space-y-3">
                  <button onClick={() => { setTab("orders"); setSubView("none"); setSelectedItem(null); }}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest">
                    Acompanhar Pedido
                  </button>
                  <button onClick={() => { setSubView("checkout"); setPixConfirmed(false); }}
                    className="w-full py-4 rounded-2xl text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                    Tentar outro mÃ©todo
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
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
    const total = Math.max(0, subtotal - discount);

    const handleConfirmCard = async (token: string, _issuer: string, _installments: number, brand: string, _last4: string) => {
        setIsLoading(true);
        try {
            const isSubscription = paymentsOrigin === "izi_black";
            const orderBase = {
                user_id: userId,
                merchant_id: isSubscription ? null : (selectedShop?.id || null),
                total_price: total,
                status: "pendente_pagamento",
                pickup_address: isSubscription ? "Assinatura Izi Black" : (selectedShop?.name || "Estabelecimento"),
                delivery_address: isSubscription ? "ServiÃ§o Digital" : (userLocation.address || "EndereÃ§o nÃ£o informado"),
                items: cart, // Adicionado para exibiÃ§Ã£o no ActiveOrderView
                payment_method: "cartao",
                service_type: isSubscription ? "subscription" : "restaurant",
            };

            const { data: order } = await supabase.from("orders_delivery").insert(orderBase).select().single();
            if (!order) { toastError("Erro ao criar pedido."); return; }

            const cleanEmail = (user?.email || loginEmail || "cliente@izidelivery.com").trim().toLowerCase();
            const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
                body: {
                    amount: Number(total.toFixed(2)),
                    orderId: order.id,
                    payment_method_id: brand.toLowerCase().includes('visa') ? 'visa' : 'master',
                    token: token,
                    email: cleanEmail,
                    installments: 1
                },
            });

            if (fnErr || (fnData && fnData.status !== 'approved')) {
                const mpMsg = fnData?.details?.cause?.[0]?.description || fnData?.error || fnErr?.message || "O cartão foi recusado pela operadora.";
                toastError(`Pagamento não aprovado: ${mpMsg}`);
                setSubView(isSubscription ? "izi_black_purchase" : "checkout");
                return;
            }

            if (isSubscription) {
                await supabase.from('users_delivery').update({ is_izi_black: true }).eq('id', userId);
                setIsIziBlackMembership(true);
                setIziBlackStep('success');
                setSubView("izi_black_purchase");
            } else {
                setSelectedItem(order);
                await clearCart(order.id);
                setTab("orders");
                setSubView("none");
            }
            toastSuccess(isSubscription ? "Assinatura IZI Black ativada!" : "Pedido aprovado!");

        } catch (err: any) {
            console.error("Card processing error:", err);
            toastError("Instabilidade na rede. Tente novamente.");
            setSubView(paymentsOrigin === "izi_black" ? "izi_black_purchase" : "checkout");
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <div className="absolute inset-0 z-40 bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-10">
        <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-6 border-b border-zinc-900 text-white">
          <button onClick={() => setSubView("checkout")}
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <div className="flex flex-col text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none">CartÃ£o de CrÃ©dito</h1>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{selectedShop?.name || 'Venda Digital'}</p>
          </div>
        </header>

        <main className="px-5 pt-10 max-w-sm mx-auto w-full space-y-10">
          <div className="text-center">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Valor Final</p>
            <p className="text-5xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,215,9,0.2)" }}>R$ {total.toFixed(2).replace(".", ",")}</p>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-900/50 p-6 rounded-[40px] shadow-2xl">
              <MercadoPagoCardForm onConfirm={handleConfirmCard} />
          </div>
          
          <div className="flex flex-col items-center gap-4 py-4">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-zinc-700 text-sm">enhanced_encryption</span>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Certificado pela PCI DSS</p>
             </div>
             <p className="text-[10px] text-center text-zinc-700 uppercase tracking-widest font-bold max-w-[200px] leading-relaxed">
               Seus dados sÃ£o encriptados de ponta a ponta e nunca armazenados em nossos servidores.
             </p>
          </div>
        </main>
      </div>
    );
  };

  const renderOrders = () => {
    const activeOrders    = myOrders.filter(o => o && !["concluido", "cancelado"].includes(o.status));
    const scheduledOrders = myOrders.filter(o => o && o.scheduled_at && !["concluido", "cancelado"].includes(o.status));
    const pastOrders      = myOrders.filter(o => o && ["concluido", "cancelado"].includes(o.status));

    const statusLabel: Record<string, string> = {
      pending: "Aguardando", pendente: "Aguardando", novo: "Processando",
      waiting_driver: "Buscando Condutor",
      aceito: "Confirmado", confirmado: "Confirmado", preparando: "Em PreparaÃ§Ã£o", pronto: "Pronto para Coleta",
      a_caminho: "Em Rota de Coleta", at_pickup: "No Local",
      picked_up: "Coletado / Em Viagem", 
      em_rota: "A Caminho do Destino", saiu_para_entrega: "Saindo para Entrega",
      concluido: "ConcluÃ­do", cancelado: "Cancelado",
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
              { id: "historico",  label: "HistÃ³rico",  count: 0 },
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
                        {order.delivery_address || "EndereÃ§o de entrega"}
                      </p>
                      <div className="pt-3 flex items-center gap-3">
                        <button
                          onClick={() => { setSelectedItem(order); setSubView("active_order"); }}
                          className="bg-yellow-400 text-black font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(255,215,9,0.25)] hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider"
                        >
                          Rastrear
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

            {/* HISTÃƒÆ’Ã¢â‚¬Å“RICO */}
            {filterTab === "historico" && (
              <motion.div key="historico" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {pastOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <span className="material-symbols-outlined text-5xl text-zinc-800">history</span>
                    <p className="text-zinc-600 text-sm font-medium">Nenhum pedido no histÃ³rico</p>
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
                      <p className="text-zinc-500 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString("pt-BR")} ÃƒÂ¢Ã¢â€šÂ¬Â¢ R$ {Number(order.total_price || 0).toFixed(2).replace(".", ",")}</p>
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
              NÃ£o vÃª um pedido?{" "}
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
      <p className="text-zinc-400 mt-2 font-medium">Aguarde um instante, estamos confirmando tudo... âš¡</p>
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
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">IncluÃ­do</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-zinc-800">receipt_long</span>
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">Itens nÃ£o disponÃ­veis neste pedido</p>
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
                Avaliar ExperiÃªncia
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
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
      <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ops! Algo deu errado</h2>
      <p className="text-zinc-400 mt-2 mb-8 font-medium">NÃ£o conseguimos processar seu pagamento. Verifique os dados e tente novamente. âš ï¸</p>
      <button onClick={() => setSubView("checkout")} className="w-full max-w-xs py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all">Tentar Novamente</button>
    </div>
  );

  const renderPaymentSuccess = () => (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center">
      <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
        <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pagamento Aprovado!</h2>
      <p className="text-zinc-400 mt-2 mb-8 font-medium">Sucesso! Seu pedido jÃ¡ foi enviado para o estabelecimento. Prepare-se para uma experiÃªncia incrÃ­vel. âœ¨</p>
      <button onClick={() => { setTab("orders"); setSubView("none"); }} className="w-full max-w-xs py-4 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]">Acompanhar Pedido</button>
    </div>
  );

  const renderWaitingMerchant = () => (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
      <div className="size-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
        <span className="material-symbols-outlined text-5xl text-blue-500 relative z-10">storefront</span>
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-3">Aguardando Loja</h2>
      <p className="text-zinc-400 font-medium max-w-[240px] leading-relaxed">
        O estabelecimento estÃ¡ analisando seu pedido agora mesmo. Fique de olho! â±ï¸
      </p>
      <button onClick={() => setSubView("none")} className="mt-12 px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Voltar ao InÃ­cio</button>
    </div>
  );

  // renderWaitingDriver movido para mais abaixo (versÃ£o completa)

  // renderOrderChat removido (funcionalidade em renderOrderChatFlow)

  // renderOrderSupport removido (funcionalidade em renderOrderSupportFlow)

  // renderOrderFeedback movido para mais abaixo (versÃ£o completa)

  // renderQuestCenter movido para mais abaixo (versÃ£o completa)


  const renderAddresses = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => { if (isAddingAddress) { resetAddressForm(); } else { setSubView("none"); } }} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">{isAddingAddress ? (editingAddress ? 'Editar EndereÃ§o' : 'Novo EndereÃ§o') : 'EndereÃ§os'}</h1>
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
                {/* SeleÃ§Ã£o rÃ¡pida de rÃ³tulo */}
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Tipo de endereÃ§o</p>
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

                {/* Campo RÃ³tulo (personalizado) */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">RÃ³tulo</label>
                  <input
                    type="text"
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    placeholder="Ex: Casa, Trabalho, MÃ£e..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* Campo Rua/EndereÃ§o com Autocomplete */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">EndereÃ§o Completo</label>
                  <AddressSearchInput
                    placeholder="Busque rua, nÃƒÆ’Âºmero, bairro..."
                    initialValue={newAddrStreet}
                    userCoords={userLocation?.lat && userLocation?.lng ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(place: any) => {
                      setNewAddrStreet(place.formatted_address || "");
                      // Tenta extrair cidade se disponÃ­vel
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
                    placeholder="SÃ£o Paulo"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-700 outline-none focus:border-yellow-400/50 transition-colors"
                  />
                </div>

                {/* BotÃ£o Salvar */}
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
                      {editingAddress ? 'Atualizar EndereÃ§o' : 'Salvar EndereÃ§o'}
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
                    <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Nenhum endereÃ§o salvo</p>
                    <button
                      onClick={() => { resetAddressForm(); setIsAddingAddress(true); }}
                      className="bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-yellow-400/20"
                    >
                      Adicionar primeiro endereÃ§o
                    </button>
                  </div>
                ) : savedAddresses.map((addr: any, i: number) => (
                  <motion.div key={addr.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0 w-full group">
                    {/* ÃƒÆ’ cone + Info */}
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
                          <p className="font-black text-sm text-white">{addr.label || "EndereÃ§o"}</p>
                          {addr.active && <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">PadrÃ£o</span>}
                        </div>
                        <p className="text-zinc-600 text-xs mt-0.5 truncate">{addr.street}{addr.details ? `, ${addr.details}` : ""}</p>
                      </div>
                    </button>
                    {/* AÃ§ÃƒÆ’Âµes */}
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
                    <span className="text-sm font-black uppercase tracking-wider">Adicionar novo endereÃ§o</span>
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
        />

        {/* MODAL: ADD CARD */}
        <AnimatePresence>
          {isAddingCard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-white tracking-tight">Novo CartÃ£o</h3>
                  <button onClick={() => setIsAddingCard(false)} className="size-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400">close</span>
                  </button>
                </div>
                
                <MercadoPagoCardForm onConfirm={async (token, issuer, _installments, brand, last4) => {
                   setIsLoadingCards(true);
                   try {
                     const { data: inserted, error } = await supabase.from("payment_methods").insert({
                       user_id: userId,
                       brand: brand,
                       last_four: last4,
                       active: savedCards.length === 0,
                       token: token
                     }).select().single();

                     if (error) throw error;

                     if (userId) await fetchSavedCards(userId);
                     setIsAddingCard(false);
                     toastSuccess("CartÃ£o adicionado!");
                     
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
            <p className="text-zinc-500 text-xs font-medium mb-10 leading-relaxed px-4">Compartilhe para receber transferÃªncias instantÃƒÂ¢neas de IZI Coins.</p>

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
              <p className="font-black text-2xl text-white tracking-tight">Transferir IZI Coins</p>
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Para: {transferTarget.email}</p>
              <p className="text-zinc-600 font-bold text-[9px] uppercase tracking-widest">{transferTarget.phone || "Sem telefone"}</p>
            </div>

            <div className="bg-zinc-950 p-6 rounded-[35px] border border-white/5">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Valor da TransferÃªncia</p>
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
              Confirmar Envio InstantÃƒÂ¢neo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderScanQRModal = () => (
    <AnimatePresence>
      {isScanningQR && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          
          <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-10">
            <button onClick={() => setIsScanningQR(false)} className="size-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px]">Escanear IZI Code</h3>
            <div className="size-12" />
          </div>

          <div id="reader" className="w-[85vw] h-[85vw] max-w-sm max-h-[400px] border-4 border-yellow-400/30 rounded-[40px] overflow-hidden relative shadow-[0_0_80px_rgba(255,184,0,0.1)]">
            <div className="absolute inset-0 border-2 border-yellow-400/10 rounded-[40px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 border-2 border-white/20 border-dashed rounded-3xl animate-pulse" />
          </div>

          <p className="mt-12 text-zinc-500 font-bold text-xs animate-pulse">Aponte para o QR Code de um amigo</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderWallet = () => {
    const walletBalance = walletTransactions.reduce((acc: number, t: any) =>
      ["deposito","reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 0);

    const txIcon: Record<string, { icon: string; color: string }> = {
      deposito:  { icon: "add_circle",           color: "text-emerald-400" },
      reembolso: { icon: "refresh",              color: "text-blue-400" },
      pagamento: { icon: "shopping_bag",         color: "text-zinc-400" },
      saque:     { icon: "arrow_outward",        color: "text-red-400" },
    };

    const totalGasto = walletTransactions
      .filter((t: any) => t.type === "pagamento")
      .reduce((a: number, t: any) => a + Number(t.amount), 0);

    const totalRecebido = walletTransactions
      .filter((t: any) => ["deposito","reembolso"].includes(t.type))
      .reduce((a: number, t: any) => a + Number(t.amount), 0);

    const pedidosMes = myOrders.filter((o: any) => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return (
      <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">

        {/* HERO SALDO */}
        <div className="px-5 pt-14 pb-8 border-b border-zinc-900">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-400 font-extrabold italic tracking-widest text-xs">IZI PAY</span>
            <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
          </div>
          <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase mb-1">Saldo DisponÃ­vel</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-extrabold text-2xl text-yellow-400 opacity-60">R$</span>
            <span className="font-extrabold text-5xl tracking-tighter text-white"
              style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}>
              {Math.abs(walletBalance).toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* AÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã¢â‚¬Â¢ES RÃƒÆ’ÂPIDAS */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "add",           label: "Adicionar" },
              { icon: "arrow_outward", label: "Transferir", action: () => setIsScanningQR(true) },
              { icon: "history",       label: "Extrato" },
              { icon: "qr_code_2", label: "Meu QR", action: () => setIsShowingMyQR(true) },
            ].map((a) => (
              <button key={a.icon} onClick={(a as any).action} className="flex flex-col items-center gap-2 py-4 active:scale-95 transition-all group">
                <div className="size-12 rounded-2xl bg-zinc-900/60 border border-zinc-900 flex items-center justify-center group-hover:border-yellow-400/20 transition-all">
                  <span className="material-symbols-outlined text-zinc-500 group-hover:text-yellow-400 transition-colors text-xl">{a.icon}</span>
                </div>
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <main className="px-5 py-8 space-y-10">

          {/* STATS */}
          <div className="grid grid-cols-3 gap-0 border border-zinc-900 rounded-2xl overflow-hidden">
            {[
              { label: "Gasto total",  value: `R$ ${totalGasto.toFixed(0)}`,    icon: "shopping_bag" },
              { label: "Recebido",     value: `R$ ${totalRecebido.toFixed(0)}`, icon: "add_circle" },
              { label: "Pedidos/mÃªs",  value: `${pedidosMes}`,                  icon: "receipt_long" },
            ].map((s, i) => (
              <div key={i} className={`flex flex-col items-center py-5 gap-1 ${i < 2 ? "border-r border-zinc-900" : ""}`}>
                <span className="material-symbols-outlined text-zinc-700 text-lg">{s.icon}</span>
                <p className="font-extrabold text-sm text-white">{s.value}</p>
                <p className="text-[9px] text-zinc-700 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>

          {/* CARTÃƒÆ’Ã¢â‚¬Â¢ES */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Meus CartÃƒÆ’Âµes</h2>
              <button onClick={() => { setPaymentsOrigin("profile"); setSubView("mobility_payment"); }}
                className="text-yellow-400 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">
                Gerenciar
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
              {/* Card IZI Digital */}
              <div className="min-w-[260px] h-40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-zinc-900/80 shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(255,215,9,0.04) 0%, rgba(0,0,0,0) 100%)" }}>
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-yellow-400/5 rounded-full blur-2xl" />
                <div className="flex justify-between items-start">
                  <span className="font-extrabold italic text-yellow-400/40 tracking-tighter">IZI</span>
                  <span className="material-symbols-outlined text-zinc-800 text-base">contactless</span>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 mb-1">CartÃ£o Digital</p>
                  <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ÃƒÂ¢Ã¢â€šÂ¬Â¢ 8820</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] text-zinc-700 uppercase tracking-widest">Val. 12/28</p>
                    <div className="size-7 rounded-full bg-yellow-400/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-yellow-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                  </div>
                </div>
              </div>
              {savedCards.map((card: any) => (
                <div key={card.id} className="min-w-[260px] h-40 border border-zinc-900/80 rounded-2xl p-5 flex flex-col justify-between shrink-0">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold italic text-zinc-700 tracking-tighter">{card.brand}</span>
                    <span className="material-symbols-outlined text-zinc-800 text-base">contactless</span>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 mb-1">CartÃ£o FÃ­sico</p>
                    <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ {card.last4}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] text-zinc-700 uppercase">{card.brand}</p>
                      <p className="text-[9px] text-zinc-600">Val. {card.expiry}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setPaymentsOrigin("profile"); setSubView("mobility_payment"); }}
                className="min-w-[120px] h-40 border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-2 shrink-0 active:scale-95 transition-all hover:border-yellow-400/20 group">
                <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-colors text-2xl">add</span>
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wider group-hover:text-zinc-500 transition-colors">Novo CartÃ£o</span>
              </button>
            </div>
          </section>

          {/* PONTOS E CASHBACK */}
          <div className="grid grid-cols-2 gap-0 border border-zinc-900 rounded-2xl overflow-hidden">
            <div className="flex flex-col gap-1 p-5 border-r border-zinc-900">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">IZI Points</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{(userXP * 10).toLocaleString("pt-BR")}</p>
              <p className="text-[9px] text-yellow-400/50">ÃƒÂ¢Ã¢â‚¬Â°Ã‹â€  R$ {(userXP * 0.1).toFixed(2).replace(".",",")} em descontos</p>
            </div>
            <div className="flex flex-col gap-1 p-5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Cashback</span>
              </div>
              <p className="text-2xl font-extrabold text-white">R$ 42,10</p>
              <p className="text-[9px] text-zinc-700">DisponÃ­vel para usar</p>
            </div>
          </div>

          {/* MÃƒÆ’Ã¢â‚¬Â°TODOS DE PAGAMENTO */}
          <section>
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight mb-2">Formas de Pagamento</h2>
            <div className="flex flex-col">
              {[
                { icon: "pix",                    label: "PIX",             desc: "Mercado Pago ÃƒÂ¢Ã¢â€šÂ¬Â¢ InstantÃƒÂ¢neo",    id: "pix" },
                { icon: "bolt",                   label: "Bitcoin Lightning", desc: "LNbits ÃƒÂ¢Ã¢â€šÂ¬Â¢ Satoshis",           id: "bitcoin_lightning" },
                { icon: "payments",               label: "Dinheiro",        desc: "Pague na entrega",              id: "dinheiro" },
                { icon: "account_balance_wallet", label: "Saldo IZI",       desc: `R$ ${Math.abs(walletBalance).toFixed(2).replace(".",",")} disponÃ­vel`, id: "saldo" },
              ].map((m) => (
                <div key={m.id} className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0">
                  <span className="material-symbols-outlined text-zinc-600 text-xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="font-black text-sm text-white">{m.label}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{m.desc}</p>
                  </div>
                  <div className={`size-2 rounded-full ${paymentMethod === m.id ? "bg-yellow-400" : "bg-zinc-800"}`} />
                </div>
              ))}
            </div>
          </section>

          {/* HISTÃƒÆ’Ã¢â‚¬Å“RICO */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-base text-white uppercase tracking-tight">HistÃ³rico</h2>
              <button className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Ver Tudo</button>
            </div>
            <div className="flex flex-col">
              {walletTransactions.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-zinc-900">receipt_long</span>
                  <p className="text-zinc-700 text-sm">Nenhuma transaÃ§Ã£o ainda</p>
                </div>
              ) : walletTransactions.slice(0, 20).map((t: any, i: number) => {
                const tx = txIcon[t.type] || { icon: "payments", color: "text-zinc-400" };
                return (
                  <div key={t.id || i} className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0">
                    <span className={`material-symbols-outlined text-xl ${tx.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {tx.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{t.description || t.type}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
                        {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} ÃƒÂ¢Ã¢â€šÂ¬Â¢ {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-extrabold text-sm ${["deposito","reembolso"].includes(t.type) ? "text-emerald-400" : "text-zinc-300"}`}>
                        {["deposito","reembolso"].includes(t.type) ? "+" : "-"} R$ {Number(t.amount).toFixed(2).replace(".",",")}
                      </p>
                      <p className="text-[9px] text-zinc-700 capitalize">{t.type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </main>
      </div>
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
        showToast("Erro ao enviar avaliaÃ§Ã£o.", "warning");
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
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Sua ExperiÃªncia</h2>
            <p className="text-zinc-500 text-sm font-medium">Como foi o serviÃ§o hoje?</p>
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
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Avalie a agilidade e educaÃ§Ã£o</p>
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
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">ObservaÃ§ÃƒÆ’Âµes adicionais</label>
            <textarea 
              value={fbComment}
              onChange={(e) => setFbComment(e.target.value)}
              placeholder="Escreva algo sobre sua experiÃªncia..."
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
            {fbIsSubmitting ? 'Enviando...' : 'Confirmar AvaliaÃ§Ã£o'}
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
      { icon: "local_shipping", label: "Meu pedido estÃ¡ atrasado" },
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
      { id: 1, title: "Explorador Urbano", desc: "FaÃ§a 3 pedidos em categorias diferentes", xp: 150, progress: 33, icon: "explore" },
      { id: 2, title: "Cliente Fiel",      desc: "PeÃ§a do mesmo restaurante 3 vezes",        xp: 100, progress: 66, icon: "favorite" },
      { id: 3, title: "Madrugador",        desc: "FaÃ§a um pedido antes das 9h",              xp: 80,  progress: 0,  icon: "wb_sunny" },
      { id: 4, title: "Gourmet",           desc: "Experimente 5 restaurantes diferentes",    xp: 200, progress: 20, icon: "restaurant" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <div>
              <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Quests & Ranking</h1>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">NÃ­vel {userLevel} ÃƒÂ¢Ã¢â€šÂ¬Â¢ {userXP} XP</p>
            </div>
          </div>
        </header>

        <main className="px-5 py-8 space-y-10">

          {/* XP PROGRESS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Infinity Tier</p>
                <p className="font-black text-white text-lg">NÃ­vel {userLevel}</p>
              </div>
              <div className="size-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">XP Progress</span>
                <span className="text-[9px] font-black text-yellow-400">{userXP} / {nextLevelXP}</span>
              </div>
              <div className="h-px w-full bg-zinc-900 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((userXP/nextLevelXP)*100,100)}%` }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400" />
              </div>
            </div>
          </div>

          {/* QUESTS */}
          <div>
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight mb-4">MissÃƒÆ’Âµes Ativas</h2>
            <div className="flex flex-col">
              {quests.map((q, i) => (
                <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 py-5 border-b border-zinc-900/60 last:border-0">
                  <span className="material-symbols-outlined text-zinc-600 text-xl mt-0.5">{q.icon}</span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-sm text-white">{q.title}</p>
                        <p className="text-zinc-600 text-xs mt-0.5">{q.desc}</p>
                      </div>
                      <span className="text-yellow-400 text-[10px] font-black shrink-0">+{q.xp} XP</span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-px w-full bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${q.progress}%` }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400" />
                      </div>
                      <p className="text-[9px] font-bold text-zinc-700 text-right">{q.progress}%</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </main>
      </div>
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
            delivery_address: "ServiÃ§o Digital",
            service_type: "subscription",
            payment_method: paymentMethod,
            cpf_invoice: cpf,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Disparar o fluxo de pagamento correto
        if (paymentMethod === "cartao") {
          setIsLoading(false);
          setPaymentsOrigin("izi_black");
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
          setSelectedItem({ ...orderData, lightningInvoice: lnData.payment_request });
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
          
          // Marca pedido como concluÃ­do
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

    // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ SUCESSO ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
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
              Bem-vindo Ã  elite. Seus privilÃ©gios exclusivos jÃ¡ estÃ£o vinculados Ã  sua conta com sucesso.
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
            ComeÃ§ar ExperiÃªncia Elite
          </motion.button>
        </div>
      );
    }

    if (iziBlackStep === 'payment') {
      const walletBal = walletTransactions.reduce((acc: number, t: any) =>
        ["deposito","reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 0);

      const subOptions = [
        { id: "cartao",            icon: "credit_card",            label: "CartÃ£o de CrÃ©dito" },
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
      { icon: "delivery_dining",    title: "Taxa Zero",        desc: "Entrega grÃ¡tis em toda a cidade, sem limite.",    highlight: true },
      { icon: "bolt",               title: "Prioridade IZI",   desc: "Seus pedidos sempre primeiro na fila.",           highlight: false },
      { icon: "stars",              title: "Cashback 5%",      desc: "Pontos dobrados em todos os pedidos.",            highlight: false },
      { icon: "support_agent",      title: "Suporte VIP",      desc: "Canal exclusivo 24 horas via App.",               highlight: false },
      { icon: "confirmation_number",title: "Cupons Black",     desc: "Ofertas exclusivas sÃ³ para membros.",             highlight: false },
      { icon: "qr_code_scanner",    title: "Early Access",     desc: "LanÃ§amentos e novidades antecipadas.",         highlight: false },
    ];

    return (
      <div className="absolute inset-0 z-50 bg-[#000000] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 z-[60] bg-transparent">
          <button onClick={handleClose}
            className="size-10 flex items-center justify-center active:scale-90 transition-all text-white drop-shadow-md">
            <span className="material-symbols-outlined text-zinc-100">close</span>
          </button>
          <div className="text-center drop-shadow-md">
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-0.5">Izi <span className="text-yellow-500">Black</span></h2>
            <p className="text-[8px] text-yellow-500 font-black uppercase tracking-[0.4em]">Elite</p>
          </div>
          <div className="size-10" />
        </header>

        <main className="relative z-10 flex flex-col">
          <section className="mb-12 mt-[-88px]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="relative h-[480px] overflow-hidden group"
              style={{ backgroundImage: 'url("/izi_black_allblack.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/90" />
              
              <div className="absolute inset-x-8 bottom-10 space-y-4">
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 animate-pulse">Status: Elite</span>
                  <h3 className="text-5xl font-black text-white leading-[0.9] uppercase tracking-tighter italic">
                    Izi<br/>Black.
                  </h3>
                </div>

                <div className="flex items-end gap-3 pt-4">
                  <div className="flex items-start gap-1">
                    <span className="text-zinc-600 font-black text-xl mt-1 italic">R$</span>
                    <span className="text-6xl font-black text-white tracking-tighter leading-none italic">{Math.floor(iziBlackPrice)}</span>
                    <span className="text-2xl font-black text-zinc-600 mt-1">,{((iziBlackPrice % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                  </div>
                  <div className="mb-1">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest italic">Por mÃªs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="px-8 space-y-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">Seus PrivilÃ©gios</h3>

            <div className="flex flex-col">
              {perks.map((p, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-6 py-6 border-b border-zinc-900 last:border-0 group"
                >
                  <div className={`mt-0.5 ${p.highlight ? 'text-yellow-500' : 'text-zinc-600'} transition-all duration-300`}>
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-white tracking-tight uppercase mb-0.5">{p.title}</p>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="px-8 mt-16 pb-12">
            {!isIziBlackMembership ? (
              <div className="space-y-6">
                <button onClick={() => setIziBlackStep("payment")}
                  className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all text-zinc-900 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                  style={{ backgroundColor: "#FBBF24" }}>
                  Quero ser IZI Black Agora
                </button>
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.3em]">Ambiente Seguro 256-bit</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-10 border-t border-b border-zinc-900">
                <div className="text-yellow-500 animate-pulse">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div className="text-center">
                  <h4 className="text-white font-black text-lg uppercase tracking-tight italic">Assinatura Ativa</h4>
                  <p className="text-zinc-500 text-xs mt-1">Sua jornada de elite jÃ¡ comeÃ§ou.</p>
                </div>
              </div>
            )}
            
            <p className="text-zinc-800 text-[10px] text-center mt-8 font-bold uppercase tracking-widest">Cancele quando quiser â€¢ Sem fidelidade</p>
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
                VOCÃƒÆ’Ã…Â  ESTÃƒÆ’Ã†â€™Ãƒâ€šÂ <span className="text-yellow-500">DENTRO</span>.
              </h1>
              <p className="text-zinc-400 font-medium text-lg leading-relaxed mb-12">
                Seja bem-vindo ao <span className="text-white font-bold">Izi Black</span>. 
                Seus privilÃ©gios exclusivos foram ativados com sucesso.
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
                { icon: 'local_shipping', label: 'Frete GrÃ¡tis' },
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
              ComeÃ§ar ExperiÃªncia Elite
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
      { id: 'frete', icon: 'local_shipping', label: 'Frete GrÃ¡tis', active: true },
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
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.4em] mt-1 italic">NÃ­vel</span>
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
              <h2 className="text-7xl font-black text-white tabular-nums tracking-tighter leading-none mb-4 italic">{iziCoins.toLocaleString('pt-BR')}</h2>
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
                           <h4 className="text-[13px] font-black text-white italic uppercase tracking-tighter">Frete GrÃ¡tis Ativado</h4>
                        </div>
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">VocÃª possui frete grÃ¡tis ilimitado em todos os pedidos acima de R$ 50,00. O benefÃ­cio Ã© aplicado automaticamente no seu checkout.</p>
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
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">Como membro nÃ­vel 3, vocÃª recebe mimos exclusivos todos os meses. Fique atento Ã s suas notificaÃ§Ãµes!</p>
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
              { icon: 'military_tech', title: 'Izi Battle Pass', sub: 'MissÃµes e Ranking Global', action: () => { setShowIziBlackCard(false); setSubView("quest_center"); }, active: true },
              { icon: 'workspace_premium', title: 'PrÃ³ximas Recompensas', sub: 'O que vem por aÃ­', action: () => setShowMasterPerks(true), active: true },
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
      { icon: "delivery_dining",    title: "Taxa Zero",          desc: "Entrega grÃ¡tis em toda a cidade, sem limite de pedidos" },
      { icon: "bolt",              title: "Prioridade MÃ¡xima",  desc: "Seus pedidos sÃ£o processados primeiro, sempre" },
      { icon: "workspace_premium", title: "Suporte VIP 24/7",   desc: "Atendimento exclusivo via canal prioritÃ¡rio" },
      { icon: "confirmation_number","title": "Cupons Exclusivos", desc: "Ofertas e descontos sÃ³ para membros Black" },
      { icon: "stars",             title: "Cashback Duplo",     desc: "2x mais pontos em todos os pedidos" },
      { icon: "qr_code_scanner",   title: "Acesso Antecipado",  desc: "Novidades e lanÃ§amentos antes de todos" },
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
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em]">PrivilÃ©gio Elite</p>
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tighter">O melhor do<br/>ecossistema IZI.</h2>
            <p className="text-zinc-600 text-sm">Acesso completo a todos os benefÃ­cios premium da plataforma.</p>
          </div>

          {/* CTA */}
          <button onClick={() => setSubView("izi_black_purchase")}
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Assinar IZI Black
          </button>

          {/* BENEFÃƒÆ’ÂCIOS */}
          <div>
            <h3 className="font-extrabold text-base text-white uppercase tracking-tight mb-2">O que estÃ¡ incluso</h3>
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
      showToast(`Limite de ${group.max_select} seleÃ§Ãµes em ${group.name}`, "error");
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

    const itemImage = selectedItem.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";
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
            const items = Array.from({ length: tempQuantity }, (_, i) => ({ ...selectedItem, cartId: selectedItem.id + "-" + Date.now() + "-" + i }));
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
    const categories = [
      { id: 'fiorino', name: 'Fiorino/FurgÃ£o', desc: 'Cargas pequenas', icon: 'local_shipping' },
      { id: 'caminhonete', name: 'Caminhonete', desc: 'Cargas mÃ©dias', icon: 'terminal' },
      { id: 'caminhao', name: 'CaminhÃ£o BaÃº', desc: 'MudanÃ§as grandes', icon: 'truck_front' }
    ];

    return (
      <div className="absolute inset-0 z-[120] bg-transparent text-zinc-100 flex flex-col overflow-hidden">
        <div className="absolute inset-0 z-0 h-full">
           <IziTrackingMap 
             routePolyline={routePolyline} 
             driverLoc={driverLocation} 
             userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
             onMyLocationClick={updateLocation} 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 pointer-events-none" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 pt-10">
          <button onClick={() => setSubView("none")} className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400">
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Frete & MudanÃ§a</h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">LogÃ­stica Profissional</p>
          </div>
        </header>

        <main className="relative z-40 mt-auto bg-zinc-900/60 backdrop-blur-3xl border-t border-white/10 flex flex-col h-[70vh] rounded-t-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.6)]">
           <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {mobilityStep === 1 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Roteiro do Frete</h3>
                   </div>
                   <div className="space-y-4">
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="bg-zinc-900/40 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl shadow-black/40 group transition-all">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2">Origem</p>
                         <AddressSearchInput 
                           userCoords={userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined ? { lat: Number(userLocation.lat), lng: Number(userLocation.lng) } : null}
                           initialValue={transitData.origin}
                           placeholder="Origem..."
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white"
                           onSelect={(p) => setTransitData({...transitData, origin: p.formatted_address || ""})}
                         />
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="bg-zinc-900/40 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl shadow-black/40 group transition-all">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2">Destino</p>
                         <AddressSearchInput 
                           userCoords={userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined ? { lat: Number(userLocation.lat), lng: Number(userLocation.lng) } : null}
                           initialValue={transitData.destination}
                           placeholder="Destino..."
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white"
                           onSelect={(p) => setTransitData({...transitData, destination: p.formatted_address || ""})}
                         />
                      </motion.div>
                   </div>
                </motion.section>
              )}

              {mobilityStep === 2 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-4">
                      {categories.map((cat) => (
                        <motion.div 
                          key={cat.id} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setTransitData({...transitData, vehicleCategory: cat.name})}
                           className={'p-6 rounded-[35px] border transition-all flex items-center gap-6 cursor-pointer backdrop-blur-3xl shadow-xl'} 
                           style={{ 
                             borderColor: transitData.vehicleCategory === cat.name ? '#facc15' : 'rgba(255,255,255,0.05)', 
                             background: transitData.vehicleCategory === cat.name ? '#facc15' : 'rgba(24, 24, 27, 0.4)'
                           }}>
                           <div className={'size-16 rounded-2xl flex items-center justify-center transition-all duration-300'} style={{ background: transitData.vehicleCategory === cat.name ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)', color: transitData.vehicleCategory === cat.name ? '#000' : '#fff' }}>
                              <span className="material-symbols-outlined text-4xl">{cat.icon}</span>
                           </div>
                           <div className="flex-1">
                              <h4 className={`font-black text-lg ${transitData.vehicleCategory === cat.name ? 'text-black' : 'text-white'}`}>{cat.name}</h4>
                              <p className={`text-xs ${transitData.vehicleCategory === cat.name ? 'text-black/60' : 'text-zinc-500'}`}>{cat.desc}</p>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </motion.section>
              )}
           </div>
           <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-zinc-950">
              <button 
                onClick={() => {
                  if (mobilityStep < 2) setMobilityStep(2);
                  else {
                    setTransitData({...transitData, type: 'frete'});
                    navigateSubView("mobility_payment");
                  }
                }}
                className="w-full bg-yellow-400 text-black font-black text-lg py-5 rounded-[28px]"
              >
                CONTINUAR
              </button>
           </div>
        </main>
      </div>
    );
  };

  const renderVanWizard = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-transparent text-zinc-100 flex flex-col overflow-hidden">
        {/* MAPA NO FUNDO */}
        <div className="absolute inset-0 z-0 h-full">
           <IziTrackingMap 
             routePolyline={routePolyline} 
             driverLoc={driverLocation} 
             userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
             onMyLocationClick={updateLocation} 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 pointer-events-none" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 pt-10">
          <button onClick={() => setSubView("none")} className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400">
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Van & Grupos</h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Capacidade & Conforto</p>
          </div>
        </header>

        <main className="relative z-40 mt-auto bg-zinc-900/60 backdrop-blur-3xl border-t border-white/10 flex flex-col h-[70vh] rounded-t-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.6)]">
           <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {/* STEP 1: ROTEIRO E PARADAS */}
              {mobilityStep === 1 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Roteiro da Viagem</h3>
                      <p className="text-zinc-500 text-xs font-medium">Vans podem fazer vÃ¡rias paradas para pegar passageiros.</p>
                   </div>
                   
                   <div className="space-y-4">
                      {/* ORIGEM */}
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="bg-zinc-900/40 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl shadow-black/40 group transition-all">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">InÃ­cio da Rota</p>
                         <AddressSearchInput 
                           userCoords={userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined ? { lat: Number(userLocation.lat), lng: Number(userLocation.lng) } : null}
                           initialValue={transitData.origin}
                           placeholder="Partida..."
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, origin: p.formatted_address || ""})}
                         />
                      </motion.div>

                       {transitData.stops.map((stop, idx) => (
                          <motion.div key={idx} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="bg-zinc-900/40 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl shadow-black/40 flex items-center gap-4 transition-all">
                              <div className="flex-1">
                                 <p className="text-[9px] font-black uppercase text-yellow-400/60 tracking-[0.2em] mb-3 ml-1">Parada Adicional</p>
                                 <AddressSearchInput 
                                   userCoords={userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined ? { lat: Number(userLocation.lat), lng: Number(userLocation.lng) } : null}
                                   initialValue={stop}
                                   placeholder="Recolher passageiro em..."
                                   className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0 placeholder:text-zinc-600"
                                   onSelect={(p) => {
                                     const newStops = [...transitData.stops];
                                     newStops[idx] = p.formatted_address || "";
                                     setTransitData({...transitData, stops: newStops});
                                   }}
                                 />
                              </div>
                              <button onClick={() => setTransitData({...transitData, stops: transitData.stops.filter((_, i) => i !== idx)})} className="size-10 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center hover:bg-red-400/20 transition-all">
                                 <span className="material-symbols-outlined text-xl">close</span>
                              </button>
                          </motion.div>
                       ))}

                      <button onClick={() => setTransitData({...transitData, stops: [...transitData.stops, ""]})} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-800 rounded-[30px] text-zinc-500 hover:text-yellow-400 transition-all">
                         <span className="material-symbols-outlined text-lg">add</span>
                         <span className="text-[10px] font-black uppercase tracking-widest">+ Adicionar Parada</span>
                      </button>

                      {/* DESTINO */}
                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Destino Final</p>
                         <AddressSearchInput 
                           userCoords={userLocation && userLocation.lat !== undefined && userLocation.lng !== undefined ? { lat: Number(userLocation.lat), lng: Number(userLocation.lng) } : null}
                           initialValue={transitData.destination}
                           placeholder="Onde termina a rota?"
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, destination: p.formatted_address || ""})}
                         />
                      </div>
                   </div>
                </motion.section>
              )}

              {/* STEP 2: TIPO E PASSAGEIROS */}
              {mobilityStep === 2 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Tipo de Viagem</h3>
                      <p className="text-zinc-500 text-xs font-medium">Defina a modalidade e a quantidade de pessoas.</p>
                   </div>

                   <div className="space-y-8">
                      <div className="grid grid-cols-3 gap-3">
                         {[
                            { id: 'only_one_way', label: 'Ida', icon: 'trending_flat' },
                            { id: 'round_trip', label: 'Ida e Volta', icon: 'sync' },
                            { id: 'hourly', label: 'DiÃ¡ria', icon: 'schedule' }
                         ].map((t) => (
                           <div key={t.id} onClick={() => setTransitData({...transitData, tripType: t.id as any})}
                             className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${transitData.tripType === t.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900/40 opacity-60'}`}>
                              <span className="material-symbols-outlined">{t.icon}</span>
                              <span className="text-[10px] font-black uppercase">{t.label}</span>
                           </div>
                         ))}
                      </div>

                      <div className="bg-zinc-900/60 p-6 rounded-[35px] border border-white/5">
                         <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">NÃƒâ€šÂº de Passageiros</p>
                            <span className="text-yellow-400 font-black text-lg">{transitData.passengers}</span>
                         </div>
                         <input 
                           type="range" min="1" max="20" step="1"
                           value={transitData.passengers}
                           onChange={(e) => setTransitData({...transitData, passengers: parseInt(e.target.value)})}
                           className="w-full accent-yellow-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                         />
                         <div className="flex justify-between mt-2 px-1">
                            <span className="text-[9px] font-bold text-zinc-600">1 Pessoa</span>
                            <span className="text-[9px] font-bold text-zinc-600">AtÃ© 20 Pessoas</span>
                         </div>
                      </div>
                   </div>
                </motion.section>
              )}

              {/* STEP 3: BAGAGEM E FINALIDADE */}
              {mobilityStep === 3 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Bagagem & Finalidade</h3>
                      <p className="text-zinc-500 text-xs font-medium">Garanta que a Van tenha o bagageiro correto.</p>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                         <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Volume de Bagagem</p>
                         <div className="grid grid-cols-3 gap-3">
                            {[
                               { id: 'none', label: 'Nenhuma', icon: 'check' },
                               { id: 'medium', label: 'Bordo', icon: 'luggage' },
                               { id: 'large', label: 'Grandes', icon: 'travel_luggage' }
                            ].map((l) => (
                              <div key={l.id} onClick={() => setTransitData({...transitData, luggage: l.id as any})}
                                className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${transitData.luggage === l.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900/40 opacity-60'}`}>
                                 <span className="material-symbols-outlined">{l.icon}</span>
                                 <span className="text-[10px] font-black uppercase">{l.label}</span>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-zinc-900/60 p-6 rounded-[35px] border border-white/5">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3 ml-1">Finalidade / ObservaÃ§ÃƒÆ’Âµes</p>
                         <textarea 
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0 resize-none"
                           rows={3}
                           placeholder="Ex: Transfer para aeroporto, Evento corporativo..."
                           value={transitData.purpose}
                           onChange={(e) => setTransitData({...transitData, purpose: e.target.value})}
                         />
                      </div>
                   </div>
                </motion.section>
              )}
           </div>

            {/* PREVIEW & PRICE */}
            <div className="px-8 mt-2">
              <div className="bg-zinc-900/60 p-6 rounded-[35px] border border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Estimativa do Fretamento</p>
                    <span className="text-xl font-black text-white">
                      R$ {(() => {
                        const res = calculateVanPrice({
                          baseFare: 80,
                          distanceInKm: distanceValueKm || 1, // Usando distÃƒÂ¢ncia real da Routes API
                          distanceRate: 3.5,
                          stopCount: transitData.stops.length,
                          stopRate: 15,
                          isDaily: transitData.tripType === 'hourly',
                          hours: 4,
                          hourlyRate: 45
                        });
                        return res.totalPrice.toFixed(2).replace(".", ",");
                      })()}
                    </span>
                 </div>
              </div>
            </div>

           {/* ACTIONS FOOTER */}
           <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
              <div className="flex gap-4">
                 {mobilityStep > 1 && (
                   <button onClick={() => setMobilityStep(prev => prev - 1)} className="size-16 rounded-[28px] bg-zinc-900 border border-white/5 flex items-center justify-center text-white active:scale-95 transition-all">
                      <Icon name="chevron_left" />
                   </button>
                 )}
                 <button 
                   onClick={() => mobilityStep < 3 ? setMobilityStep(prev => prev + 1) : navigateSubView("mobility_payment")}
                   className="flex-1 bg-yellow-400 text-black font-black text-lg py-5 rounded-[28px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                 >
                    <span className="uppercase tracking-widest">{mobilityStep < 3 ? "PrÃ³ximo Passo" : "Ver PreÃ§o & Pedir"}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{mobilityStep < 3 ? 'arrow_forward' : 'bolt'}</span>
                 </button>
              </div>
           </div>
        </main>
      </div>
    );
  };

  const renderExploreEnvios = () => {
    const services = [
      { id: "express", name: "Izi Express", desc: "Documentos e pequenos volumes", icon: "bolt", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "express" }); navigateSubView("shipping_priority"); } },
      { id: "coleta",  name: "Click e Retire Izi", desc: "Retirada rÃ¡pida em lojas parceiras", icon: "inventory_2", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "coleta" }); navigateSubView("shipping_details"); } },
    ];
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-6 py-6 border-b border-zinc-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("none")} className="size-11 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center shadow-lg transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </motion.button>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white">Envios</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Entregamos qualquer coisa</p>
            </div>
          </div>
        </header>

        <main className="px-6 pt-10 flex flex-col gap-6">
          {services.map((svc, i) => (
            <motion.div 
              key={svc.id} 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02, translateY: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={svc.action} 
              className="relative group bg-zinc-900/30 backdrop-blur-3xl border border-white/10 rounded-[35px] p-7 cursor-pointer shadow-xl shadow-black/40 transition-all hover:border-yellow-400/30"
            >
              <div className="flex items-center gap-6">
                <div className="size-16 rounded-[22px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 group-hover:bg-yellow-400/20 transition-all duration-500 shadow-inner">
                  <span className="material-symbols-outlined text-3xl text-yellow-400 transition-transform group-hover:scale-110">{svc.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg text-white group-hover:text-yellow-400 transition-all duration-300 tracking-tight">{svc.name}</h3>
                  <p className="text-zinc-500 text-[11px] mt-1 font-medium leading-tight">{svc.desc}</p>
                </div>
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-yellow-400 group-hover:text-black transition-all duration-500">
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-8 p-8 rounded-[40px] bg-gradient-to-br from-yellow-400/20 to-amber-500/5 border border-yellow-400/10 relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="text-white font-black text-lg tracking-tight mb-2">Transporte Local</h4>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-[200px]">Precisa de algo maior? Confira nossas vans e caminhÃµes para frete.</p>
                <div className="mt-5 flex gap-3">
                   <button onClick={() => setSubView("van_wizard")} className="px-4 py-2 bg-yellow-400 text-black text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-yellow-400/20">Vans</button>
                   <button onClick={() => setSubView("freight_wizard")} className="px-4 py-2 bg-white/10 text-white text-[10px] font-black rounded-xl uppercase tracking-widest border border-white/10">Fretes</button>
                </div>
             </div>
             <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[120px] text-yellow-400/10 rotate-12 group-hover:rotate-0 transition-transform duration-700">local_shipping</span>
          </div>
        </main>
      </div>
    );
  };

  const renderIziExpressPriority = () => {
    const priorities = [
      { id: "turbo", name: "Izi Turbo Flash", desc: "Entrega ultra-rÃ¡pida atÃ© 15 min", time: "15 min", icon: "bolt", color: "text-amber-400", bg: "bg-amber-400/10" },
      { id: "light", name: "Izi Light Flash", desc: "Entrega agilizada atÃ© 30 min", time: "30 min", icon: "electric_bolt", color: "text-yellow-400", bg: "bg-yellow-400/10" },
      { id: "normal", name: "Izi Express", desc: "Categoria normal de entrega", time: "1 hr", icon: "moped", color: "text-zinc-400", bg: "bg-zinc-800" },
      { id: "scheduled", name: "Izi Agendado", desc: "VocÃª escolhe data e horÃ¡rio", time: "Agendar", icon: "event", color: "text-blue-400", bg: "bg-blue-400/10" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-white flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50 border-b border-white/5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigateSubView("explore_envios")} className="size-12 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center text-white active:scale-90 transition-all leading-none">
            <span className="material-symbols-outlined">arrow_back</span>
          </motion.button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Prioridade</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Escolha a velocidade</p>
          </div>
        </header>

        <main className="px-6 space-y-8 mt-10">
          <div className="text-center mb-10">
            <motion.div 
               animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="size-24 rounded-[35px] bg-yellow-400/10 flex items-center justify-center mx-auto mb-5 border border-yellow-400/20 shadow-[0_0_50px_-10px_rgba(255,215,9,0.2)]"
            >
              <span className="material-symbols-outlined text-5xl text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,9,0.5)]">speed</span>
            </motion.div>
            <h3 className="text-xl font-black text-white tracking-tight">Qual a sua urgÃªncia?</h3>
            <p className="text-zinc-500 text-xs font-semibold mt-2 max-w-[240px] mx-auto opacity-80">Oferecemos diferentes nÃ­veis de prioridade de acordo com sua necessidade</p>
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
                    setTransitData({ 
                      ...transitData, 
                      priority: p.id as any,
                      scheduled: p.id === "scheduled"
                    });
                    navigateSubView("shipping_details");
                  }}
                  className={`p-7 rounded-[40px] border cursor-pointer transition-all flex items-center gap-6 shadow-2xl relative overflow-hidden group ${
                    isSelected 
                      ? "bg-yellow-400 border-yellow-400 shadow-yellow-400/10" 
                      : "bg-zinc-900/30 backdrop-blur-3xl border-white/5 hover:border-white/10 shadow-black/40"
                  }`}
                >
                  <div className={`size-16 rounded-[22px] flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-black/10' : p.bg + ' group-hover:scale-110 shadow-inner'}`}>
                    <span className={`material-symbols-outlined text-3xl ${isSelected ? 'text-black' : p.color}`}>{p.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-black text-lg tracking-tight ${isSelected ? 'text-black' : 'text-white'}`}>{p.name}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSelected ? 'text-black/60' : p.color}`}>{p.time}</span>
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

          <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-7 rounded-[40px] flex items-center gap-5 mt-10 shadow-xl">
            <div className="size-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center shrink-0 border border-yellow-400/10">
               <span className="material-symbols-outlined text-yellow-400 text-xl font-bold">info</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
              Os tempos de entrega sÃ£o estimativas calculadas pelo nosso algoritmo baseado na frota disponÃ­vel em tempo real.
            </p>
          </div>
        </main>
      </div>
    );
  };

  const renderShippingDetails = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-black text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500 pb-40">
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

        <main className="px-6 space-y-10">
          {transitData.subService === "express" && (
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <Icon name="location_on" />
                <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Roteiro de Entrega</h3>
              </div>
              
              <div className="space-y-4">
                {/* ORIGEM (COLETA) */}
                <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-1 ml-1">
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
                        <span className="text-[8px] font-black uppercase tracking-widest">{userLocation.loading ? 'Buscando...' : 'LocalizaÃ§Ã£o Atual'}</span>
                     </button>
                  </div>
                  <AddressSearchInput 
                    initialValue={transitData.origin}
                    placeholder="EndereÃ§o de partida..."
                    className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white placeholder:text-zinc-600"
                    userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                    onSelect={(place) => setTransitData(prev => ({ ...prev, origin: place.formatted_address || "" }))}
                  />
                </div>

                {/* DESTINO */}
                <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Para onde levar?</p>
                   <AddressSearchInput 
                     initialValue={transitData.destination}
                     placeholder="Digite o endereÃ§o de destino..."
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
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Enviar ou Receber?</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-3 mb-4">
                {transitData.subService === "express" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTransitData({...transitData, operationType: "enviar"})}
                      className={`py-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-2 ${transitData.operationType === "enviar" ? "bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20" : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}
                    >
                      <span className="material-symbols-outlined text-2xl">outbox</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-center">Vou Enviar Algo</span>
                    </button>
                    <button 
                      onClick={() => setTransitData({...transitData, operationType: "retirar"})}
                      className={`py-6 rounded-[30px] border-2 transition-all flex flex-col items-center gap-2 ${transitData.operationType === "retirar" ? "bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20" : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"}`}
                    >
                      <span className="material-symbols-outlined text-2xl">store</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">Retirar em Loja/Casa</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowLojistasModal(true)}
                    className="w-full py-8 rounded-[35px] border-2 bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20 flex flex-col items-center gap-2 active:scale-[0.98] transition-all group"
                  >
                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">storefront</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">
                      {transitData.receiverName ? `Loja: ${transitData.receiverName}` : "Selecionar Loja Parceira"}
                    </span>
                    {transitData.receiverName && (
                      <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest">{transitData.origin}</p>
                    )}
                  </button>
                )}
              </div>

              {transitData.subService === "express" && (
                <>
                  <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Nome de quem recebe</p>
                     <input 
                       type="text" 
                       value={transitData.receiverName}
                       onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                       placeholder="Ex: JoÃ£o Silva"
                       className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-white"
                     />
                  </div>

                  <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Telefone de Contato</p>
                     <input 
                       type="tel" 
                       value={transitData.receiverPhone}
                       onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                       placeholder="(11) 99999-9999"
                       className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-white"
                     />
                  </div>
                </>
              )}

              {transitData.subService === "coleta" && (
                <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl ring-1 ring-yellow-400/10">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">EndereÃ§o de Entrega (Destino)</p>
                   <AddressSearchInput 
                     initialValue={transitData.destination}
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
                <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Nome do Parceiro / Loja</p>
                   <input 
                     type="text" 
                     value={transitData.receiverName}
                     onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                     placeholder="Ex: Hub LogÃ­stico Izi"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>

                <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Telefone do Parceiro</p>
                   <input 
                     type="tel" 
                     value={transitData.receiverPhone}
                     onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                     placeholder="(11) 99999-9999"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>

                <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">CÃ³d. do Pedido / Retirada</p>
                   <input 
                     type="text" 
                     value={transitData.pickupCode}
                     onChange={(e) => setTransitData({...transitData, pickupCode: e.target.value})}
                     placeholder="Ex: ABC123456"
                     className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Nota Fiscal (NF)</p>
                     <input 
                       type="text" 
                       value={transitData.invoiceNumber}
                       onChange={(e) => setTransitData({...transitData, invoiceNumber: e.target.value})}
                       placeholder="Opcional"
                       className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                     />
                  </div>
                  <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                     <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Setor / GuichÃª</p>
                     <input 
                       type="text" 
                       value={transitData.pickupSector}
                       onChange={(e) => setTransitData({...transitData, pickupSector: e.target.value})}
                       placeholder="Piso / Corredor"
                       className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                     />
                  </div>
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
               <div className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">DescriÃ§Ã£o do Item</p>
                  <textarea 
                    value={transitData.packageDesc}
                    onChange={(e) => setTransitData({...transitData, packageDesc: e.target.value})}
                    placeholder="Ex: 2 Camisetas, 1 Par de TÃªnis..."
                    rows={3}
                    className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white resize-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {['Pequeno (atÃ© 5kg)', 'MÃ©dio (atÃ© 15kg)', 'Grande (atÃ© 30kg)', 'Pesado (+30kg)'].map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setTransitData({...transitData, weightClass: weight})}
                      className={`py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest border-2 transition-all ${transitData.weightClass === weight ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-transparent border-zinc-800 text-zinc-500'}`}
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
                <div onClick={() => setShowDatePicker(true)} className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl cursor-pointer active:scale-95 transition-all">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Data</p>
                   <div className="flex items-center justify-between">
                     <span className="text-base font-bold text-white">{transitData.scheduledDate || "Selecionar data"}</span>
                     <span className="material-symbols-outlined text-yellow-400 text-sm">calendar_month</span>
                   </div>
                </div>
                <div onClick={() => setShowTimePicker(true)} className="bg-transparent p-6 rounded-[35px] border border-zinc-800 shadow-xl cursor-pointer active:scale-95 transition-all">
                   <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">HorÃ¡rio</p>
                   <div className="flex items-center justify-between">
                     <span className="text-base font-bold text-white">{transitData.scheduledTime || "Selecionar hora"}</span>
                     <span className="material-symbols-outlined text-yellow-400 text-sm">schedule</span>
                   </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* LOJISTAS MODAL */}
          <AnimatePresence>
            {showLojistasModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/98 backdrop-blur-2xl flex flex-col p-6">
                <header className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-white">Lojas Parceiras</h3>
                  <button onClick={() => setShowLojistasModal(false)} className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </header>
                <div className="relative mb-6">
                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
                   <input type="text" placeholder="Buscar por nome ou regiÃ£o..." className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-1 focus:ring-yellow-400/50 outline-none text-white placeholder-zinc-600" />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                   {partnerStores.map((store) => (
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        key={store.id} 
                        onClick={() => { 
                          setTransitData({
                            ...transitData, 
                            receiverName: store.name, 
                            receiverPhone: store.phone, 
                            origin: store.address
                          }); 
                          setShowLojistasModal(false); 
                        }}
                        className="p-6 rounded-[30px] border border-zinc-800 hover:border-yellow-400/30 transition-all group cursor-pointer"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-yellow-400/10 text-yellow-400">{store.type}</span>
                            <span className="text-[10px] font-bold text-zinc-500">{store.hours}</span>
                         </div>
                         <h4 className="font-black text-white text-base group-hover:text-yellow-400 transition-colors">{store.name}</h4>
                         <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{store.address}</p>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DATE PICKER MODAL */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-black border border-zinc-800 rounded-[40px] p-8 overflow-hidden">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-black text-white">PrÃ³ximos 7 dias</h3>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Selecione uma data</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                    {[...Array(7)].map((_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() + i);
                      const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
                      const iso = d.toISOString().split('T')[0];
                      return (
                        <button key={i} onClick={() => { setTransitData({...transitData, scheduledDate: iso}); setShowDatePicker(false); }} className={`w-full py-5 rounded-[25px] border-2 transition-all font-bold text-sm capitalize ${transitData.scheduledDate === iso ? "bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20" : "bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800"}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setShowDatePicker(false)} className="mt-8 w-full py-4 text-zinc-500 font-black uppercase text-[10px] tracking-widest ring-1 ring-zinc-800 rounded-[20px]">Fechar</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TIME PICKER MODAL */}
          <AnimatePresence>
            {showTimePicker && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-black border border-zinc-800 rounded-[40px] p-8 overflow-hidden">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-black text-white">HorÃ¡rio</h3>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Das 08:00 ÃƒÆ’ s 22:00</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                    {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((h) => (
                      <button key={h} onClick={() => { setTransitData({...transitData, scheduledTime: h}); setShowTimePicker(false); }} className={`py-4 rounded-[20px] border-2 transition-all font-black text-xs ${transitData.scheduledTime === h ? "bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20" : "bg-transparent border-zinc-900 text-zinc-400 hover:border-zinc-800"}`}>
                        {h}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowTimePicker(false)} className="mt-8 w-full py-4 text-zinc-500 font-black uppercase text-[10px] tracking-widest ring-1 ring-zinc-800 rounded-[20px]">Fechar</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-amber-400/5  p-6 rounded-[35px] border border-amber-400/10  flex items-start gap-4">
             <div className="size-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-amber-400 text-sm">warning</span>
             </div>
             <p className="text-[10px] font-bold text-amber-400/80 leading-relaxed uppercase tracking-wider">
                Certifique-se de que o objeto esteja bem embalado. NÃ£o transportamos itens proibidos por lei ou inflamÃ¡veis.
             </p>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
          <button
            disabled={!transitData.origin || !transitData.destination || !transitData.receiverName || !transitData.receiverPhone || isLoading}
            onClick={handleRequestTransit}
            className="w-full bg-yellow-400 text-black font-black text-xl py-6 rounded-[32px] shadow-[0_20px_40px_rgba(255,215,9,0.2)] active:scale-[0.98] transition-all disabled:opacity-30 flex justify-center items-center gap-4 group"
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

  const renderTaxiWizard = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-transparent text-zinc-100 flex flex-col overflow-hidden">
        {/* MAPA NO FUNDO */}
        <div className="absolute inset-0 z-0 h-full">
           <IziTrackingMap 
             routePolyline={routePolyline} 
             driverLoc={driverLocation} 
             userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
             onMyLocationClick={updateLocation} 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-zinc-950/90 pointer-events-none" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 pt-10">
          <button onClick={() => setSubView("none")} className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400">
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
                {transitData.type === 'mototaxi' ? "MotoTÃ¡xi" : "Motorista Particular"}
             </h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Viagem RÃ¡pida & Segura</p>
          </div>
        </header>

        <main className="relative z-40 mt-auto bg-zinc-900/60 backdrop-blur-3xl border-t border-white/10 flex flex-col h-[60vh] rounded-t-[40px] shadow-[0_-20px_80px_rgba(0,0,0,0.6)]">
           <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {mobilityStep === 1 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Qual o seu destino?</h3>
                      <p className="text-zinc-500 text-xs font-medium">Confirme os pontos de partida e chegada.</p>
                   </div>
                   
                   <div className="space-y-6">
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="bg-zinc-900/40 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl shadow-black/40 group transition-all">
                         <div className="flex justify-between items-center mb-3">
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">Origem</p>
                            <button onClick={() => updateLocation()} disabled={userLocation.loading} className="text-[8px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-3 py-1.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all">
                               {userLocation.loading ? 'Buscando...' : 'Meu Local'}
                            </button>
                          </div>
                         <AddressSearchInput 
                           initialValue={transitData.origin}
                           placeholder="De onde vocÃª estÃ¡ saindo?"
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0 placeholder:text-zinc-600"
                           userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                           onSelect={(p) => {
                             const ori = p.formatted_address || "";
                             setTransitData(prev => ({...prev, origin: ori}));
                           }}
                         />
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="bg-zinc-900/40 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl shadow-black/40 group transition-all">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-3 ml-1">Destino</p>
                         <AddressSearchInput 
                           initialValue={transitData.destination}
                           placeholder="Para onde vamos?"
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0 placeholder:text-zinc-600"
                           userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                          onSelect={(p) => {
                            const dest = p.formatted_address || "";
                            setTransitData(prev => ({...prev, destination: dest}));
                          }}
                         />
                      </motion.div>

                      {/* VEÃCULO E PREÃ‡O IMEDIATO */}
                       <AnimatePresence>
                         {transitData.destination && transitData.origin && (
                           <motion.div 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="space-y-4 pt-2 overflow-hidden"
                           >
                              <div className="flex items-center gap-3 px-2">
                                 <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Tipo de Transporte</h4>
                                 <div className="h-px flex-1 bg-white/5" />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 pb-2">
                                 {[
                                   { id: 'mototaxi', label: 'MotoTÃ¡xi', icon: 'motorcycle', color: 'text-yellow-400', sub: 'RÃ¡pido & Ãgil' },
                                   { id: 'carro', label: 'Carro', icon: 'directions_car', color: 'text-white', sub: 'Executivo Premium' }
                                 ].map((v) => {
                                   const isSelected = transitData.type === v.id;
                                   const price = distancePrices[v.id] || 0;
                                   
                                   return (
                                     <motion.button
                                       whileHover={{ scale: 1.02, translateY: -2 }}
                                       whileTap={{ scale: 0.98 }}
                                       key={v.id}
                                       onClick={() => setTransitData(prev => ({ ...prev, type: v.id as any, estPrice: price }))}
                                       className={`p-6 rounded-[35px] transition-all duration-500 flex flex-col items-center gap-2 border relative group overflow-hidden backdrop-blur-3xl
                                         ${isSelected ? 'bg-yellow-400 border-yellow-400 shadow-[0_25px_50px_rgba(250,204,21,0.2)]' : 'bg-zinc-900/40 border-white/10 hover:border-white/20 shadow-xl shadow-black/20'}
                                       `}
                                     >
                                        <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500
                                          ${isSelected ? 'bg-black/10 scale-110' : 'bg-white/5 group-hover:bg-white/10'}
                                        `}>
                                           <span className={`material-symbols-outlined text-3xl ${isSelected ? 'text-black' : v.color}`}>{v.icon}</span>
                                        </div>
                                        <div className="text-center z-10">
                                           <p className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? 'text-black' : 'text-zinc-100'}`}>{v.label}</p>
                                           <p className={`text-[8px] font-black uppercase tracking-widest mt-1 opacity-50 ${isSelected ? 'text-black' : 'text-zinc-500'}`}>{v.sub}</p>
                                           <div className="mt-4">
                                              <p className={`text-base font-black tracking-tight ${isSelected ? 'text-black' : 'text-yellow-400'} ${isCalculatingPrice ? 'animate-pulse' : ''}`}>
                                                {isCalculatingPrice ? 'Calculando...' : price > 0 ? `R$ ${price.toFixed(2).replace(".", ",")}` : '---'}
                                              </p>
                                           </div>
                                        </div>
                                     </motion.button>
                                   );
                                 })}
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                   </div>
                </motion.section>
              )}

              {mobilityStep === 2 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Resumo da Viagem</h3>
                      <p className="text-zinc-500 text-xs font-medium">Confirme os detalhes e o preÃ§o antes de pedir.</p>
                   </div>

                   <div className="bg-zinc-900/40 border border-white/5 p-7 rounded-[40px] space-y-8 shadow-2xl">
                      {/* PAGAMENTO */}
                      <div className="flex items-center gap-5 cursor-pointer group" onClick={() => { setPaymentsOrigin("checkout"); setSubView("mobility_payment"); }}>
                         <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                            <span className="material-symbols-outlined text-blue-400 text-2xl">credit_card</span>
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1.5">Pagamento</p>
                            <div className="flex items-center justify-between">
                               <p className="text-sm font-black text-white italic">
                                 {paymentMethod === 'dinheiro' ? 'Dinheiro' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'bitcoin_lightning' ? 'BTC Lightning' : paymentMethod === 'saldo' ? 'Saldo IZI' : 'Escolher MÃ©todo'}
                               </p>
                               <span className="material-symbols-outlined text-zinc-700 text-sm group-hover:text-yellow-400 transition-colors">expand_more</span>
                            </div>
                         </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* PREÃ‡O E INFO */}
                      <div className="flex items-center gap-5">
                         <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                            <span className="material-symbols-outlined text-yellow-400 text-2xl italic">local_atm</span>
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1.5">PreÃ§o Estimado</p>
                            <div className="flex items-center gap-3">
                               <p className="text-3xl font-black text-yellow-400 tracking-tighter">
                                 {distancePrices[transitData.type] > 0 
                                   ? `R$ ${distancePrices[transitData.type].toFixed(2).replace(".", ",")}` 
                                   : isCalculatingPrice ? "..." : "---"}
                               </p>
                               {marketConditions.surgeMultiplier > 1 && (
                                 <div className="px-2 py-0.5 rounded flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20">
                                   <span className="material-symbols-outlined text-[10px] text-yellow-400 font-black italic">bolt</span>
                                   <span className="text-[9px] font-black text-yellow-400 tracking-tighter">{marketConditions.surgeMultiplier}x</span>
                                 </div>
                               )}
                            </div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                               <span className="material-symbols-outlined text-[12px]">schedule</span>
                               Tempo Est: {routeDistance ? `${Math.round(parseInt(routeDistance)/1000 * 2.2)} min` : '-- min'}
                            </p>
                         </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* CLIENTE LEVEL */}
                      <div className="flex items-center gap-5">
                         <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="material-symbols-outlined text-emerald-400 text-2xl">verified_user</span>
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1.5">Perfil do Passageiro</p>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-white tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">Tier {userLevel >= 10 ? 'Master' : 'Classic'}</span>
                               {userLevel >= 10 && <span className="material-symbols-outlined text-yellow-400 text-sm">workspace_premium</span>}
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.section>
              )}
           </div>

           <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
              <button 
                onClick={() => {
                  if (mobilityStep === 1) {
                    if (!transitData.origin || !transitData.destination) {
                      showToast("Preencha todos os endereÃ§os", "warning");
                      return;
                    }
                    setMobilityStep(2);
                  } else {
                    setPaymentsOrigin("checkout");
                    navigateSubView("mobility_payment");
                  }
                }}
                disabled={mobilityStep === 1 ? (!transitData.origin || !transitData.destination) : (!distancePrices[transitData.type] || isCalculatingPrice)}
                className="w-full bg-yellow-400 text-black font-black text-lg py-5 rounded-[30px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:grayscale"
              >
                 <span className="uppercase tracking-[0.2em] text-sm">{mobilityStep === 1 ? "PrÃ³ximo" : "Confirmar Viagem"}</span>
                 <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{mobilityStep === 1 ? 'arrow_forward' : 'bolt'}</span>
              </button>
           </div>
        </main>
      </div>
    );
  };

  const renderMobilityPayment = () => {
    const bv = marketConditions.settings.baseValues;
    const basePrices: Record<string, number> = { mototaxi: bv.mototaxi_min, carro: bv.carro_min, van: bv.van_min, utilitario: bv.utilitario_min };
    const isShippingService = ['utilitario', 'van', 'frete'].includes(transitData.type);
    const rawPrice = (transitData.estPrice > 0 ? transitData.estPrice : calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min)) ?? 0;
    const price = (isIziBlackMembership && isShippingService) ? 0 : rawPrice;

    const PaymentMethodButton = ({ id, icon, label, sub, colorClass, disabled = false }: any) => {
      const isSelected = paymentMethod === id;
      return (
        <motion.button 
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          disabled={disabled}
          onClick={() => setPaymentMethod(id)}
          className={`w-full group relative overflow-hidden flex items-center gap-4 p-5 rounded-[32px] transition-all duration-500 border
            ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'active:scale-[0.98]'}
            ${isSelected ? 'bg-yellow-400 font-bold border-yellow-400 shadow-[0_20px_40px_rgba(255,217,9,0.15)]' : 'bg-zinc-900/40 backdrop-blur-xl border-white/5 hover:border-white/10 shadow-2xl shadow-black/50'}
          `}
        >
          <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500
            ${isSelected ? 'bg-black/10' : `bg-white/5 ${colorClass}`}
          `}>
             <span className={`material-symbols-outlined text-2xl ${isSelected ? 'text-black' : ''}`}>{icon}</span>
          </div>
          <div className="flex-1 text-left">
             <p className={`text-[11px] font-black uppercase tracking-widest mb-1 leading-none ${isSelected ? 'text-black' : 'text-zinc-500'}`}>{label}</p>
             <p className={`text-[10px] font-bold tracking-tight ${isSelected ? 'text-black/60' : 'text-zinc-600'}`}>{sub}</p>
          </div>
          {disabled ? (
              <span className="text-[8px] font-black text-red-500/60 bg-red-500/10 px-3 py-1 rounded-lg uppercase tracking-widest">Bloqueado</span>
          ) : (
              <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-black/40' : 'text-zinc-800'}`}>chevron_right</span>
          )}
        </motion.button>
      );
    };

    return (
      <div className="absolute inset-0 z-[115] bg-black flex flex-col hide-scrollbar overflow-y-auto">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 py-8 flex items-center gap-4 border-b border-white/5">
          <button onClick={() => {
            if (transitData.type === 'van') navigateSubView("van_wizard");
            else if (transitData.type === 'utilitario') navigateSubView("shipping_details");
            else if (transitData.type === 'frete') navigateSubView("freight_wizard");
            else navigateSubView("taxi_wizard");
          }} className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl">
            <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
          </button>
          <div className="flex flex-col text-left">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none italic uppercase">Confirmar</h2>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-1.5 opacity-80">Check-out Premium</p>
          </div>
        </header>

        <div className="flex-1 px-5 py-6 space-y-10 pb-48">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Resumo do ServiÃ§o</h3>
              <div className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                <span className="text-xs font-black text-yellow-400 italic">R$ {price.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
            
            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 size-32 bg-yellow-400/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
               <div className="flex items-center gap-4 mb-8">
                  <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                    <span className="material-symbols-outlined text-yellow-400 text-2xl">
                      {transitData.type === 'mototaxi' ? 'motorcycle' : transitData.type === 'carro' ? 'directions_car' : transitData.type === 'van' ? 'airport_shuttle' : 'local_shipping'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">
                      {transitData.type === 'mototaxi' ? 'MotoTÃ¡xi' : transitData.type === 'carro' ? 'Particular' : transitData.type === 'van' ? 'Van & Grupos' : 'Frete & MudanÃ§a'}
                    </h4>
                    <p className="text-[9px] font-black text-yellow-400/60 uppercase tracking-[0.2em] mt-1">{transitData.vehicleCategory || 'ServiÃ§o sob demanda'}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6 mb-8">
                  {transitData.type === 'van' && (
                    <>
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Passageiros</p>
                        <p className="text-xs font-bold text-white">{transitData.passengers} pessoas</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Tipo</p>
                        <p className="text-xs font-bold text-white uppercase">{transitData.tripType === 'round_trip' ? 'Ida e Volta' : transitData.tripType === 'hourly' ? 'DiÃ¡ria' : 'Ida'}</p>
                      </div>
                    </>
                  )}
                  {(transitData.type === 'frete' || transitData.type === 'utilitario') && (
                    <>
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Ajudantes</p>
                        <p className="text-xs font-bold text-white">{transitData.helpers === 0 ? 'Sem ajudante' : `${transitData.helpers} ${transitData.helpers === 1 ? 'ajudante' : 'ajudantes'}`}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Escadas</p>
                        <p className="text-xs font-bold text-white">{(transitData.accessibility.stairsAtOrigin || transitData.accessibility.stairsAtDestination) ? 'Sim' : 'NÃ£o'}</p>
                      </div>
                    </>
                  )}
               </div>

               <div className="space-y-6">
                  <div className="flex items-start gap-5 text-left">
                     <div className="size-2 rounded-full bg-yellow-400 shrink-0 mt-1.5 shadow-[0_0_10px_rgba(255,217,9,1)]" />
                     <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Origem</p>
                        <p className="text-sm font-bold text-zinc-300 leading-relaxed line-clamp-2">{transitData.origin}</p>
                     </div>
                  </div>
                  <div className="h-4 w-px bg-zinc-800 ml-1" />
                  <div className="flex items-start gap-5 text-left">
                     <div className="size-2 rounded-full bg-zinc-700 shrink-0 mt-1.5" />
                     <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Destino</p>
                        <p className="text-sm font-bold text-zinc-400 leading-relaxed line-clamp-2">{transitData.destination || "Aguardando destino..."}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
              <span>Selecione o Pagamento</span>
              <div className="h-px flex-1 bg-white/5" />
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {/* CartÃ£o via App (Destaque se houver) */}
              <PaymentMethodButton 
                id="cartao" 
                icon="credit_card" 
                label="CartÃ£o via App" 
                sub={selectedCard ? `${selectedCard.brand} â€¢â€¢â€¢â€¢ ${selectedCard.last4}` : "Pague com seguranÃ§a pelo App"}
                colorClass="text-blue-400"
              />

              {/* PIX (Popular) */}
              <PaymentMethodButton 
                id="pix" 
                icon="pix" 
                label="PIX InstantÃ¢neo" 
                sub="AprovaÃ§Ã£o imediata via QR Code"
                colorClass="text-emerald-400"
              />

              {/* Bitcoin Lightning (Premium/Stealth) */}
              <PaymentMethodButton 
                id="bitcoin_lightning" 
                icon="bolt" 
                label="Bitcoin Lightning" 
                sub="Pagamento instantÃ¢neo em Satoshis"
                colorClass="text-orange-400"
              />

              {/* Saldo IZI */}
              <PaymentMethodButton 
                id="saldo" 
                icon="account_balance_wallet" 
                label="Saldo IZI Wallet" 
                sub={`R$ ${walletBalance.toFixed(2).replace(".", ",")} disponÃ­vel`}
                colorClass="text-cyan-400"
                disabled={walletBalance < price}
              />

              {/* CartÃ£o na Entrega */}
              <PaymentMethodButton 
                id="cartao_entrega" 
                icon="contactless" 
                label="CartÃ£o na Entrega" 
                sub="Pague com maquininha ao motoboy"
                colorClass="text-zinc-500"
              />

              {/* Dinheiro (EspÃ©cie) */}
              <PaymentMethodButton 
                id="dinheiro" 
                icon="payments" 
                label="Dinheiro em EspÃ©cie" 
                sub="Pague diretamente ao prestador"
                colorClass="text-zinc-600"
              />
            </div>
          </div>

          {/* Footer ultra-minimalista */}
          <div className="flex flex-col items-center gap-6 pt-10 pb-10">
             <div className="flex items-center gap-4 group cursor-help">
               <div className="size-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700 group-hover:text-yellow-400 group-hover:border-yellow-400/20 transition-all">
                  <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
               </div>
               <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">ProteÃ§Ã£o Izi Security â€¢ RSA 4096-bit</p>
             </div>
             
             <button className="text-[9px] font-black text-zinc-800 uppercase tracking-widest hover:text-zinc-500 transition-colors">
               Termos de Uso e PolÃ­tica de Privacidade
             </button>
          </div>
        </div>

        {/* BOTÃƒO DE CONFIRMAÃ‡ÃƒO FINAL */}
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <button 
              onClick={() => handleConfirmMobility(paymentMethod)}
              disabled={!paymentMethod}
              className="w-full bg-yellow-400 text-black font-black text-lg py-5 rounded-[30px] shadow-2xl active:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale group"
            >
              <span className="uppercase tracking-[0.2em] text-sm">Solicitar Viagem</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Comentario limpo
  const renderWaitingDriver = () => {
    if (!selectedItem) return null;

    const serviceLabels: Record<string, { label: string; icon: string; color: string }> = {
      mototaxi: { label: "MotoTÃ¡xi", icon: "motorcycle", color: "text-yellow-400" },
      carro: { label: "Carro Executivo", icon: "directions_car", color: "text-zinc-500" },
      van: { label: "Van de Carga", icon: "airport_shuttle", color: "text-blue-500" },
      utilitario: { label: "Izi Express", icon: "bolt", color: "text-purple-500" },
    };
    const service = serviceLabels[selectedItem.service_type] || { label: "ServiÃ§o", icon: "local_shipping", color: "text-yellow-400" };

    return (
      <div className="bg-black absolute inset-0 z-[115] bg-[#020617] flex flex-col items-center justify-center p-8 text-white overflow-hidden">
        {/* Fundo animado */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,217,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,217,0,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Radar */}
        <div className="relative mb-10">
          <motion.div animate={{ scale: [1, 2.5], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 bg-yellow-400/20 rounded-full" />
          <motion.div animate={{ scale: [1, 2], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }} className="absolute inset-0 bg-yellow-400/20 rounded-full" />
          <div className="relative size-24 bg-yellow-400/10 border border-yellow-400/30 rounded-full flex items-center justify-center">
            <span className={`material-symbols-outlined text-4xl ${service.color}`}>{service.icon}</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight text-center mb-2">Buscando Prestador</h2>
        <p className="text-white/40 text-sm text-center mb-8 max-w-xs">Estamos encontrando o melhor prestador disponÃ­vel para vocÃª</p>

        {/* Info do pedido */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">ServiÃ§o</span>
            <span className="text-sm font-black text-white">{service.label}</span>
          </div>
          <div className="h-px bg-white/5" />
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 size-2 rounded-full bg-yellow-400 shrink-0" />
              <p className="text-xs text-white/60 leading-tight">{selectedItem.pickup_address}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1.5 size-2 rounded-full bg-orange-500 shrink-0" />
              <p className="text-xs text-white/80 font-bold leading-tight">{selectedItem.delivery_address}</p>
            </div>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Valor</span>
            <span className="text-xl font-black text-yellow-400">R$ {Number(selectedItem.total_price).toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        {/* Cancelar */}
        <button
          onClick={async () => {
            if (!selectedItem?.id || !userId) return;
            if (!await showConfirm({ message: "Cancelar a solicitaÃ§Ã£o?" })) return;
            await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", selectedItem.id);
            setSubView("none");
            fetchMyOrders(userId);
            toastSuccess("SolicitaÃ§Ã£o cancelada.");
          }}
          className="text-white/30 font-black text-[10px] uppercase tracking-widest border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all active:scale-95"
        >
          Cancelar SolicitaÃ§Ã£o
        </button>

        {/* Auto-redireciona para active_order quando driver aceita */}
        {selectedItem?.status && ["a_caminho", "aceito", "confirmado", "em_rota", "no_local"].includes(selectedItem.status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-10 left-6 right-6"
          >
            <button
              onClick={() => setSubView("active_order")}
              className="w-full bg-yellow-400 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              <Icon name="navigation" />
              Motorista Encontrado! Acompanhar
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  const renderScheduledOrder = () => {
    if (!selectedItem) return null;
    const svcIcons: Record<string,string> = { mototaxi:'motorcycle', carro:'directions_car', van:'airport_shuttle', utilitario:'bolt' };
    const svcLabels: Record<string,string> = { mototaxi:'MotoTÃ¡xi', carro:'Carro Executivo', van:'Van de Carga', utilitario:'Izi Express' };
    const icon = svcIcons[selectedItem.service_type] || 'event';
    const label = svcLabels[selectedItem.service_type] || 'ServiÃ§o';
    const scheduledAt = selectedItem.scheduled_date && selectedItem.scheduled_time
      ? new Date(`${selectedItem.scheduled_date}T${selectedItem.scheduled_time}`).toLocaleString('pt-BR', { weekday:'long', day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })
      : null;
    const hasDriver = !!selectedItem.driver_id;

    const saveObservation = async () => {
      if (!selectedItem?.id || !schedObsState.trim()) return;
      setIsSavingObsState(true);
      await supabase.from('orders_delivery').update({ order_notes: schedObsState }).eq('id', selectedItem.id);
      setIsSavingObsState(false);
      toastSuccess('ObservaÃ§Ã£o salva!');
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
              <p className={`text-[9px] font-black uppercase tracking-widest ${hasDriver ? 'text-emerald-500' : 'text-blue-400'}`}>{hasDriver ? 'Motorista Confirmado' : 'Aguardando ConfirmaÃ§Ã£o'}</p>
              <h3 className="text-base font-black text-white">{hasDriver ? 'Seu motorista estÃ¡ confirmado!' : 'Buscando motorista disponÃ­vel...'}</h3>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-[28px] border border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon name={icon} />
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">ServiÃ§o</p>
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
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">ObservaÃ§Ãµes para o Motorista</p>
            <textarea
              value={schedObsState}
              onChange={(e) => setSchedObsState(e.target.value)}
              placeholder="Ex: endereÃ§o tem portÃ£o azul, preciso de nota fiscal..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={saveObservation}
              disabled={isSavingObsState}
              className="w-full py-3 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isSavingObsState ? 'Salvando...' : 'Salvar ObservaÃ§Ã£o'}
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
                  {hasDriver ? 'Inicie a conversa com seu motorista' : 'DisponÃ­vel apÃ³s confirmaÃ§Ã£o do motorista'}
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
      { id: "orders", icon: "receipt_long", label: "Pedidos" },
      { id: "profile", icon: "person", label: "Perfil" },
    ];

    return (
      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-white/5 bg-black/80 px-4 pt-4 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
          height: "80px",
        }}
      >
        {navItems.map((item) => {
          const isActive = tab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id as any);
                setSubView("none");
                window.history.replaceState(
                  { view: "app", tab: item.id, subView: "none" },
                  "",
                );
              }}
              className={`flex flex-col items-center justify-center transition-all duration-300 ease-out active:scale-90 ${
                isActive
                  ? "scale-110 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span
                className={`mt-1 text-[9px] font-black uppercase tracking-widest ${
                  isActive ? "text-yellow-400" : "text-zinc-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => navigateSubView("cart")}
          className="relative flex flex-col items-center justify-center text-zinc-500 transition-all ease-out hover:text-zinc-300 active:scale-90"
        >
          <div className="relative flex size-9 items-center justify-center rounded-2xl bg-yellow-400 shadow-[0_0_15px_rgba(255,215,9,0.3)]">
            <span
              className="material-symbols-outlined text-[20px] text-black"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shopping_cart
            </span>
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-black">
                {cart.length > 99 ? "99+" : cart.length}
              </span>
            )}
          </div>
          <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-yellow-400">
            {cart.length > 0
              ? `R$${cart
                  .reduce((sum: number, item: any) => sum + (item.price || 0), 0)
                  .toFixed(0)}`
              : "Cart"}
          </span>
        </button>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-black selection:bg-yellow-400/30">
      <AnimatePresence mode="wait">
        {view === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
            <div className="relative">
              <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity }} className="size-24 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-yellow-400 italic tracking-tighter">IZI</span>
              </div>
            </div>
            <p className="mt-8 text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] animate-pulse">Carregando ExperiÃªncia</p>
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
                  <HomeView userLevel={userLevel} userId={userId} userLocation={userLocation} isIziBlackMembership={isIziBlackMembership} cart={cart} myOrders={myOrders} navigateSubView={navigateSubView} setSubView={setSubView} subView={subView} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSelectedItem={setSelectedItem} availableCoupons={availableCoupons.filter((c: any) => c.coupon_code)} banners={availableCoupons.filter((c: any) => !c.coupon_code)} copiedCoupon={copiedCoupon} setCopiedCoupon={setCopiedCoupon} showToast={showToast} setShowMasterPerks={setShowMasterPerks} ESTABLISHMENTS={ESTABLISHMENTS} handleShopClick={handleShopClick} flashOffers={flashOffers} setActiveService={setActiveService} transitData={transitData} setTransitData={setTransitData} setExploreCategoryState={setExploreCategoryState} setRestaurantInitialCategory={setRestaurantInitialCategory} setTab={setTab} />
                </motion.div>
              )}
              {tab === "orders" && (
                <motion.div key="orders-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                   <OrderListView myOrders={myOrders} userId={userId} setSubView={setSubView} setSelectedItem={setSelectedItem} navigateSubView={navigateSubView} fetchMyOrders={fetchMyOrders} tab={tab} />
                </motion.div>
              )}
              {tab === "wallet" && (
                <motion.div key="wallet-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                   <WalletView walletTransactions={walletTransactions} myOrders={myOrders} userXP={userXP} savedCards={savedCards} paymentMethod={paymentMethod} setPaymentsOrigin={setPaymentsOrigin} setSubView={setSubView} showToast={showToast} userId={userId} userName={userName} iziCoins={iziCoins} iziCashback={iziCashbackEarned} setShowDepositModal={setShowDepositModal} iziCoinValue={globalSettings?.iziCoinRate || globalSettings?.izi_coin_rate || 1.0} iziCoinRate={globalSettings?.iziCoinRate || globalSettings?.izi_coin_rate || 1.0} />
                </motion.div>
              )}
              {tab === "profile" && (
                <motion.div key="profile-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-black">
                   <ProfileView userId={userId} userName={userName} userLevel={userLevel} userXP={userXP} walletBalance={walletBalance} setSubView={setSubView} logout={logout} setTab={setTab} isIziBlackMembership={isIziBlackMembership} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {subView === "cart" && (
                <motion.div key="cartv" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  <CartView 
                    cart={cart} 
                    setCart={setCart}
                    setSubView={(v: any) => setSubView(v)} 
                    navigateSubView={navigateSubView}
                    merchantProducts={selectedShop?.products || []}
                    merchantName={selectedShop?.name || ""}
                    handleAddToCart={handleAddToCart}
                    isIziBlack={isIziBlackMembership} 
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
                    iziCoinValue={globalSettings?.izi_coin_value || globalSettings?.iziCoinRate || 0.01} 
                    deliveryFee={calculateDeliveryFee()} 
                    isIziBlack={isIziBlackMembership}
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
              {subView === "pix_payment" && (
                <motion.div key="pixpay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderPixPayment()}
                </motion.div>
              )}
              {subView === "lightning_payment" && (
                <motion.div key="lnpay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
                  {renderLightningPayment()}
                </motion.div>
              )}
              {subView === "card_payment" && (
                <motion.div key="cardpay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150]">
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
              {subView === "van_wizard" && (
                <motion.div key="vanv" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
                  {renderVanWizard()}
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

            <BottomNav />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Animations */}
      <AnimatePresence>
        {cartAnimations.map(anim => (
          <motion.img
            key={anim.id}
            src={anim.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200"}
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
      {renderScanQRModal()}

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
    </div>
  );
}


export default App;






