import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AppContextData {
  // Configurações
  globalSettings: any;
  appSettings: any;
  isInitializing: boolean;
  initError: string | null;
  activeBroadcast: any | null;
  closeBroadcast: () => void;
  refreshSettings: () => Promise<void>;

  // Orquestração de View
  view: "login" | "app" | "loading";
  setView: (view: "login" | "app" | "loading") => void;
  tab: "home" | "orders" | "wallet" | "profile";
  setTab: (tab: "home" | "orders" | "wallet" | "profile") => void;
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
  updateLocation: (highAccuracy?: boolean) => Promise<void>;
  setUserLocation: (loc: any) => void;
}

const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authInitLoading, userId } = useAuth();
  
  // Estados de Configuração
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);

  // Estados de Orquestração (Movidos do App.tsx)
  const [view, setView] = useState<"login" | "app" | "loading">("loading");
  const [tab, setTab] = useState<"home" | "orders" | "wallet" | "profile">("home");
  const [subView, setSubView] = useState<string>("none");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [activeService, setActiveService] = useState<any | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentsOrigin, setPaymentsOrigin] = useState<"checkout" | "profile" | "izi_black">("profile");

  // Estados de Pagamento e Membership
  const [pixCpf, setPixCpf] = useState<string>("");
  const [pixConfirmed, setPixConfirmed] = useState<boolean>(false);
  const [isIziBlackMembership, setIsIziBlackMembership] = useState<boolean>(false);
  const [lightningData, setLightningData] = useState<any>(null);

  // Localização
  const [userLocation, setUserLocation] = useState({ lat: null as number | null, lng: null as number | null, loading: false, error: null as string | null, address: undefined as string | undefined });

  const updateLocation = async (highAccuracy = false) => {
    setUserLocation(prev => ({ ...prev, loading: true, error: null }));
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 0
        });
      });
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        loading: false,
        error: null
      });
    } catch (err: any) {
      setUserLocation(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const navigateSubView = (newView: string) => {
    setSubView(newView);
    window.history.pushState({ view: "app", subView: newView }, "");
  };

  const fetchSettings = useCallback(async () => {
    try {
      const { data: adminSettings } = await supabase
        .from('admin_settings_delivery')
        .select('*')
        .eq('key', 'global')
        .maybeSingle();
      
      if (adminSettings) setGlobalSettings(adminSettings.value || adminSettings);

      const { data: appData } = await supabase
        .from('app_settings_delivery')
        .select('*')
        .single();
      
      if (appData) setAppSettings(appData);
    } catch (e) {
      console.error("Erro ao carregar configurações globais:", e);
    }
  }, []);

  const initBroadcasts = useCallback(async () => {
    try {
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
    } catch (e) {
      console.warn("Erro ao carregar broadcasts:", e);
    }
  }, []);

  const closeBroadcast = () => {
    if (activeBroadcast) {
      localStorage.setItem('last_izi_broadcast', activeBroadcast.id);
      setActiveBroadcast(null);
    }
  };

  // Orquestrador de Inicialização
  useEffect(() => {
    const initializeApp = async () => {
      if (authInitLoading) return;

      setIsInitializing(true);
      setInitError(null);

      try {
        await Promise.all([
          fetchSettings(),
          initBroadcasts(),
          updateLocation()
        ]);

        const settingsChannel = supabase.channel('settings_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings_delivery' }, fetchSettings)
          .subscribe();

        const broadcastSub = supabase.channel('broadcast-notifs')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' }, (payload) => {
            const notif = payload.new;
            if ((notif.type === 'popup' || notif.type === 'both') && (notif.target_type === 'all' || notif.target_type === 'users')) {
              setActiveBroadcast(notif);
            }
          })
          .subscribe();

        setIsInitializing(false);
        if (userId) setView("app");
        else setView("login");

        return () => {
          supabase.removeChannel(settingsChannel);
          supabase.removeChannel(broadcastSub);
        };
      } catch (err: any) {
        console.error("Falha na inicialização do App:", err);
        setInitError(err.message || "Erro desconhecido ao carregar o aplicativo.");
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [authInitLoading, userId, fetchSettings, initBroadcasts]);

  return (
    <AppContext.Provider value={{
      globalSettings,
      appSettings,
      isInitializing,
      initError,
      activeBroadcast,
      closeBroadcast,
      refreshSettings: fetchSettings,
      view,
      setView,
      tab,
      setTab,
      subView,
      setSubView,
      navigateSubView,
      selectedItem,
      setSelectedItem,
      selectedShop,
      setSelectedShop,
      activeService,
      setActiveService,
      isLoading,
      setIsLoading,
      paymentsOrigin,
      setPaymentsOrigin,
      pixCpf,
      setPixCpf,
      pixConfirmed,
      setPixConfirmed,
      isIziBlackMembership,
      setIsIziBlackMembership,
      lightningData,
      setLightningData,
      userLocation,
      updateLocation,
      setUserLocation
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
