import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { BespokeIcons } from "./lib/BespokeIcons";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
import { auth } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";
import { toast, toastSuccess, toastError, toastWarning, showConfirm } from "./lib/useToast";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
// Mercado Pago
import { MercadoPagoCardForm } from "./components/MercadoPagoCardForm";
import { calculateFreightPrice, calculateVanPrice } from "./lib/pricing_engine";

function IziTrackingMap({ driverLoc, userLoc }: any) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBi3EJ41-Kh7-ZXjNQ9K1d9AqmoD8UNiO8"
  });

  if (!isLoaded || !driverLoc) return (
    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-sm z-10">
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Buscando Sinal do Flash...</p>
      </div>
    </div>
  );

  const center = driverLoc ? { lat: driverLoc.lat, lng: driverLoc.lng } : { lat: -23.5505, lng: -46.6333 };

  return (
    <div className="w-full h-full relative z-0">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={16}
        options={{
            disableDefaultUI: true,
            zoomControl: false,
            styles: [
                { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
                { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
                { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
                { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
                { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
                { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
                { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
                { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
                { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
            ]
        }}
      >
        <Marker position={center} />
        {userLoc && <Marker position={{ lat: userLoc.lat, lng: userLoc.lng }} />}
      </GoogleMap>
    </div>
  );
}





function Icon({ name, className = "", size = 20 }: { name: string; className?: string; size?: number }) {
  const icons: Record<string, any> = {
    'home': BespokeIcons.Home,
    'search': BespokeIcons.Search,
    'shopping_bag': BespokeIcons.Bag,
    'shopping_cart': BespokeIcons.Bag,
    'person': BespokeIcons.User,
    'chevron_left': BespokeIcons.ChevronLeft,
    'chevron_right': BespokeIcons.ChevronRight,
    'location_on': BespokeIcons.Pin,
    'pin_drop': BespokeIcons.Pin,
    'bolt': BespokeIcons.Bolt,
    'category': BespokeIcons.Bag,
    'map': BespokeIcons.Map,
    'more_vert': BespokeIcons.Menu,
    'close': BespokeIcons.X,
    'notifications': BespokeIcons.Notifications,
    'shield': BespokeIcons.Shield,
    'support_agent': BespokeIcons.Support,
    'help': BespokeIcons.Help,
    'history': BespokeIcons.History,
    'payments': BespokeIcons.Wallet,
    'wallet': BespokeIcons.Wallet,
    'account_balance_wallet': BespokeIcons.Wallet,
    'credit_card': BespokeIcons.CreditCard,
    'star': BespokeIcons.StarFilled,
    'check_circle': BespokeIcons.Check,
    'check': BespokeIcons.Check,
    'logout': BespokeIcons.Logout,
    'settings': BespokeIcons.User,
    'local_shipping': BespokeIcons.Truck,
    'monetization_on': BespokeIcons.Coins,
    'card_giftcard': BespokeIcons.Gift,
    'expand_more': BespokeIcons.ChevronDown,
    'expand_less': BespokeIcons.ChevronUp,
    'directions_car': BespokeIcons.Car,
    'two_wheeler': BespokeIcons.Motorcycle,
    'schedule': BespokeIcons.Clock,
    'workspace_premium': BespokeIcons.Bolt,
    'stars': BespokeIcons.Star,
    'qr_code_2': BespokeIcons.Check,
    'receipt_long': BespokeIcons.History,
    'smart_toy': BespokeIcons.Bolt,
    'military_tech': BespokeIcons.Shield,
    'sync': BespokeIcons.Clock,
    'diamond': BespokeIcons.Bolt,
    'arrow_back': BespokeIcons.ChevronLeft,
    'arrow_forward': BespokeIcons.ChevronRight,
    'delete': BespokeIcons.X,
    'edit': BespokeIcons.User,
    'local_pizza': BespokeIcons.Pizza,
    'pizza': BespokeIcons.Pizza,
    'fastfood': BespokeIcons.Burger,
    'burger': BespokeIcons.Burger,
    'local_cafe': BespokeIcons.Coffee,
    'coffee': BespokeIcons.Coffee,
    'package': BespokeIcons.Package,
    'inventory_2': BespokeIcons.Package,
  };

  const IconComp = icons[name] || BespokeIcons.Help;
  return <IconComp size={size} className={className} />;
}


interface SavedAddress {
  id: string | number;
  label: string;
  street: string;
  details: string;
  city: string;
  active: boolean;
}



const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? '';

// Carrega o Google Maps dinamicamente e chama callback quando pronto
function loadGoogleMapsScript(callback: () => void) {
  if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
    callback();
    return;
  }
  const existingScript = document.getElementById("gmaps-script");
  if (existingScript) {
    existingScript.addEventListener("load", callback);
    return;
  }
  (window as any).__gmapsCallback = callback;
  const script = document.createElement("script");
  script.id = "gmaps-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places,geometry&language=pt-BR&callback=__gmapsCallback`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

const AddressSearchInput = ({ placeholder, initialValue, onSelect, onClear, className }: any) => {
  const [query, setQuery] = useState(initialValue || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [googleReady, setGoogleReady] = useState(!!(window as any).google?.maps?.places);
  const debounceRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!googleReady) {
      loadGoogleMapsScript(() => setGoogleReady(true));
    }
  }, [googleReady]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateDropdownPos = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) { setSuggestions([]); setOpen(false); return; }
    try {
      const apiKey = GMAPS_KEY;
      const res = await fetch(
        `https://places.googleapis.com/v1/places:autocomplete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
          body: JSON.stringify({ input, includedRegionCodes: ["br"], languageCode: "pt-BR" }),
        }
      );
      const data = await res.json();
      const predictions = (data.suggestions || []).map((s: any) => ({
        description: s.placePrediction?.text?.text || "",
        place_id: s.placePrediction?.placeId || "",
        structured_formatting: {
          main_text: s.placePrediction?.structuredFormat?.mainText?.text || "",
          secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text || "",
        }
      })).filter((p: any) => p.description);
      if (predictions.length > 0) {
        setSuggestions(predictions);
        updateDropdownPos();
        setOpen(true);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val) {
      setSuggestions([]);
      setOpen(false);
      if (onClear) onClear();
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    if (onClear) onClear();
  };

  const handleSelect = (prediction: any) => {
    const description = prediction.description || "";
    setQuery(description);
    setOpen(false);
    setSuggestions([]);
    onSelect({ formatted_address: description });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length > 2) {
      e.preventDefault();
      setOpen(false);
      if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      } else {
        onSelect({ formatted_address: query });
      }
    }
  };

  const dropdown = open && suggestions.length > 0 ? createPortal(
    <div
      onMouseDown={e => e.preventDefault()}
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
        zIndex: 2147483647,
        overflow: "hidden",
        border: "1px solid #f1f5f9",
        maxHeight: "320px",
        overflowY: "auto",
      }}
    >
      {suggestions.map((s: any, i: number) => (
        <div
          key={i}
          onMouseDown={() => handleSelect(s)}
          style={{
            padding: "14px 20px",
            cursor: "pointer",
            borderTop: i > 0 ? "1px solid #f8fafc" : "none",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            background: "white",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
          onMouseLeave={e => (e.currentTarget.style.background = "white")}
        >
          <span style={{ fontSize: "18px", marginTop: "2px", flexShrink: 0 }}>ðŸ“</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.structured_formatting?.main_text || s.description}
            </div>
            {s.structured_formatting?.secondary_text && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.structured_formatting.secondary_text}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
          style={{ paddingRight: query ? "2.5rem" : undefined }}
          onFocus={() => {
            updateDropdownPos();
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            style={{ position: "absolute", right: "12px", background: "rgba(100,116,139,0.15)", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, zIndex: 10 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#94a3b8" }}>close</span>
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
};

// ─── AI Concierge Component ──────────
const AIConciergePanel = ({ isOpen, onClose, userName, walletBalance, userLocation, myOrders, ESTABLISHMENTS }: any) => {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalGasto = myOrders.filter((o: any) => o.status === 'concluido').reduce((s: number, o: any) => s + (o.total_price || 0), 0).toFixed(2);

  const systemPrompt = `Você é o Izi Concierge, assistente do app IziDelivery. Seja direto e útil.
Contexto: Nome: ${userName || 'Cliente'}, Saldo: R$${walletBalance?.toFixed(2)}, Total gasto: R$${totalGasto}
Responda em português, máx 3 linhas, use emojis com moderação.`;

  const sendMessage = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = { role: 'user' as const, content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 1000, system: systemPrompt, messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Não consegui processar. Tente novamente.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Problema de conexão. Tente novamente.' }]);
    } finally {
      setIsThinking(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const quickSuggestions = [
    myOrders.length > 0 ? 'Repetir meu último pedido' : 'O que está em promoção?',
    'Quanto gastei esse mês?',
    'Sugestão para jantar de hoje',
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[160] bg-[#020617]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
      <header className="px-8 py-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="size-14 rounded-[22px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shadow-lg shadow-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />
            <Icon name="bolt" size={28} className="text-yellow-400 relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none mb-1">Izi <span className="text-yellow-400">Concierge</span></h2>
            <div className="flex items-center gap-2">
              <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_white]" />
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em]">Sintonizado</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="size-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all shadow-premium">
          <Icon name="close" size={24} />
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="space-y-10">
            <div className="flex flex-col items-center text-center mt-12 mb-16">
              <div className="size-20 rounded-full bg-yellow-400/20 border-4 border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                <Icon name="bolt" size={40} className="text-yellow-400" />
              </div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">Olá, {userName?.split(" ")[0]}</h3>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[80%] mx-auto">Sua inteligência logística pessoal. O que deseja agilizar hoje?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 shadow-soft">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Dotação Izi</p>
                <p className="text-2xl font-black text-yellow-400 tracking-tighter">R$ {walletBalance?.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[30px] p-6 shadow-soft">
                <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Ciclo Operacional</p>
                <p className="text-2xl font-black text-white tracking-tighter">R$ {totalGasto.replace(".", ",")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-2 mb-4">Comandos Rápidos</p>
              {quickSuggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} className="w-full text-left bg-white/5 border border-white/5 rounded-[22px] px-6 py-4.5 text-sm text-white/60 font-black uppercase tracking-tight hover:bg-white/10 hover:text-white transition-all active:scale-[0.98] flex items-center justify-between group">
                  {s} <Icon name="arrow_forward" className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="size-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                <Icon name="bolt" size={20} className="text-yellow-400" />
              </div>
            )}
            <div className={`px-6 py-4.5 max-w-[85%] shadow-premium ${msg.role === "user" ? "bg-yellow-400 text-slate-950 font-black rounded-[28px] rounded-tr-[4px]" : "bg-white/5 border border-white/10 text-white/90 rounded-[28px] rounded-tl-[4px]"}`}>
              <p className="text-sm leading-relaxed tracking-tight">{msg.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-1">
              <Icon name="bolt" size={20} className="text-yellow-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[28px] rounded-tl-[4px] px-6 py-4.5">
              <div className="flex gap-2 items-center">
                <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
                <div className="size-2 bg-yellow-400/60 rounded-full animate-pulse delay-75" />
                <div className="size-2 bg-yellow-400/30 rounded-full animate-pulse delay-150" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-8 pb-10 pt-4 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[30px] px-6 py-3 shadow-inner">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Comando operacional..." className="flex-1 bg-transparent border-none outline-none text-white text-[15px] font-black placeholder:text-white/10 py-3 uppercase tracking-tight" />
          <button onClick={sendMessage} disabled={!input.trim() || isThinking} className="size-12 rounded-[20px] bg-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-10 shrink-0">
            <Icon name="arrow_forward" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState<"login" | "app" | "loading">("loading");
  const [tab, setTab] = useState<"home" | "orders" | "wallet" | "profile">(
    "home",
  );
  
  const [authInitLoading, setAuthInitLoading] = useState(true);
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
    | "restaurant_list"
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
    | "burger_list"
    | "pizza_list"
    | "acai_list"
    | "japonesa_list"
    | "store_catalog"
    | "all_pharmacies"
    | "health_plantao"
    | "explore_restaurants"
    | "brasileira_list"
    | "daily_menus"
    | "exclusive_offer"
    | "explore_mobility"
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
    | "izi_black_purchase"
  >("none");
  const [iziBlackOrigin, setIziBlackOrigin] = useState<"home" | "checkout">("home");
  const [iziBlackStep, setIziBlackStep] = useState<"info" | "payment" | "pix_qr" | "success">("info");
  const [iziBlackPixCode, setIziBlackPixCode] = useState("");

  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string; expirationDate: string } | null>(null);
  const [lightningData, setLightningData] = useState<{ payment_request: string; satoshis: number; btc_price_brl: number } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };
  const toastError = (message: string) => showToast(message, 'warning');

  // --- Izi Elite Client Features ---
  const [userXP, setUserXP] = useState(1250);
  const [userLevel] = useState(12);
  const [nextLevelXP] = useState(2500);
  const [isAIOpen, setIsAIOpen] = useState(false);
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

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('admin_settings_delivery')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000' as any)
        .single();
      if (data) setGlobalSettings(data);
    } catch (e) {}
  }, []);

  const [timeLeft, setTimeLeft] = useState<{h: string, m: string, s: string}>({h: '00', m: '00', s: '00'});

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
    { id: 1, title: 'Explorador Urbano', desc: 'Peça em 3 categorias diferentes hoje', xp: 500, progress: 1, total: 3, icon: 'explore', color: '#fbbf24' },
    { id: 2, title: 'Amigo do Peito', desc: 'Indique um amigo para a Izi', xp: 1000, progress: 0, total: 1, icon: 'group_add', color: '#10b981' },
    { id: 3, title: 'Madrugador Izi', desc: 'Peça café da manhã antes das 9h', xp: 300, progress: 0, total: 1, icon: 'wb_sunny', color: '#f59e0b' },
  ]);

  // Refs para manter o estado atual sempre acessível nos handlers
  const viewRef = useRef(view);
  const tabRef = useRef(tab);
  const subViewRef = useRef(subView);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { subViewRef.current = subView; }, [subView]);

  // Suporte ao botão voltar do hardware/navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { view: v, tab: t, subView: sv } = event.state;
        // Se o usuário está autenticado, nunca permitir voltar para login
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
        // Sem estado no histórico — se autenticado, manter no app
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

  const navigateSubView = (newSubView: typeof subView) => {
    setSubView(newSubView);
    window.history.pushState(
      { view: viewRef.current, tab: tabRef.current, subView: newSubView },
      "",
    );
  };
  const [activeService, setActiveService] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [pixConfirmed, setPixConfirmed] = useState<boolean>(false);
  const [pixCpf, setPixCpf] = useState<string>("");
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Destaques");
  const [activeMenuCategory, setActiveMenuCategory] = useState("Destaques");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);

  // Sistema de rastreamento do motoboy em tempo real para o cliente
  useEffect(() => {
    if (!selectedItem?.driver_id) {
      setDriverLocation(null);
      return;
    }

    const fetchDriverInitialLoc = async () => {
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
    type: "mototaxi" as "mototaxi" | "carro" | "van" | "utilitario",
    estPrice: 0,
    scheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    receiverName: "",
    receiverPhone: "",
    packageDesc: "",
    weightClass: "Pequeno (até 5kg)",
    // Novos campos para Frete e Van
    vehicleCategory: "Fiorino/Furgão",
    helpers: 0,
    accessibility: { stairsAtOrigin: false, stairsAtDestination: false, serviceElevator: false },
    cargoPhotos: [] as string[],
    passengers: 1,
    tripType: "only_one_way" as "only_one_way" | "round_trip" | "hourly",
    luggage: "none" as "none" | "medium" | "large",
    purpose: "",
  });
  const [distancePrices, setDistancePrices] = useState<Record<string, number>>({});
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [mobilityStep, setMobilityStep] = useState(1);

  const [transitHistory, setTransitHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("transitHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobilityExpanded, setIsMobilityExpanded] = useState(false);
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

  const [userId, setUserId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginEmail, setLoginEmail] = useState<string>("");
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);
  const [ESTABLISHMENTS, setESTABLISHMENTS] = useState<any[]>([]);

  const isStoreOpen = useCallback((openingHours: any, manualOpen: boolean) => {
    // Prioridade total para o status manual definido pelo lojista na admin.
    // Se is_open for true no banco, a loja está aberta independentemente do horário.
    // Se is_open for false no banco, a loja está fechada.
    if (manualOpen !== undefined && manualOpen !== null) {
      return manualOpen;
    }

    // Fallback para horário caso o status manual não esteja definido (ex: lojas antigas)
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
        // Normalização do tipo para garantir consistência nos filtros
        const normalizedType = (m.store_type || "restaurant").toLowerCase().trim();
        
        return {
          id: m.id,
          name: m.store_name || "Loja Parceira",
          tag: isOpen ? "Aberto Agora" : "Fechado",
          statusTag: isOpen ? "Aberto" : "Fechado",
          isOpen,
          rating: "4.9",
          dist: "1.5 km",
          time: "30-40 min",
          img: m.store_logo || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200",
          banner: m.store_banner || "https://images.unsplash.com/photo-1514933651103-005eec06ccc0?q=80&w=800",
          freeDelivery: true,
          type: normalizedType,
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
      "Percebi que você gosta de culinária japonesa. Que tal conferir as ofertas do Sushi Zen?",
      "Hoje é sexta! Temos cupons especiais de 20% em bebidas para membros Izi Black. ðŸ»",
      "Baseado no seu histórico, você costuma pedir em mercados às 19h. Deseja agendar suas compras?",
      "O trânsito está pesado hoje. Sugiro usar o Mototáxi para chegar mais rápido ao seu destino.",
      "Você está a apenas 250 XP de subir para o nível 13! Que tal um pedido extra hoje?"
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % aiTips.length;
      setAiMessage(aiTips[index]);
    }, 15000);

    // Inscrição em tempo real para atualizações de status da loja
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
    
    // Inscrição em tempo real para atualizações dos pedidos do próprio cliente
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
  const [cart, setCart] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("izi_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Persistir carrinho no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem("izi_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);
  const [userLocation, setUserLocation] = useState<{
    address: string;
    loading: boolean;
  }>({
    address: "Buscando localização...",
    loading: true,
  });
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro" | "cartao_entrega" | "saldo" | "bitcoin_lightning">(() => (localStorage.getItem("preferredPaymentMethod") as any) || "cartao");
  const [changeFor, setChangeFor] = useState("");
  useEffect(() => {
    localStorage.setItem("preferredPaymentMethod", paymentMethod);
  }, [paymentMethod]);
  const [deliveryType] = useState<"delivery" | "pickup">("delivery");

  const [cpf, setCpf] = useState<string>("");
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
  const [beverageOffers, setBeverageOffers] = useState<any[]>([]);

  // --- MOTOR DE PRECIFICAÇÃO DINÂMICA (REAL-TIME DATA) ---
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

  const fetchMarketData = async () => {
    try {
      // 1. Buscar Configurações Centrais do Admin
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

      // 4. Clima (Simulação estruturada - pronta para API externa)
      const weathers = ["Ensolarado", "Nublado", "Chuva Leve", "Tempestade"];
      const hour = new Date().getHours();
      const currentWeather = (hour > 18 || hour < 6) ? "Nublado" : weathers[Math.floor(Math.random() * 2)];

      // 5. Lógica de Equilíbrio de Marketplace usando Configurações do Admin
      const drivers = onlineDrivers || 5; 
      const orders = pendingOrders || 0;
      const ratio = orders / drivers;

      // Cálculo do Multiplicador (Surge) baseado no Threshold e Sensibilidade do Admin
      let surge = 1.0;
      const { threshold, sensitivity, maxSurge } = config.equilibrium;
      
      if (ratio > threshold) {
        surge = 1.0 + (ratio - threshold) * sensitivity;
      }

      // 6. Aplicar Fatores Climáticos Ativos
      if (currentWeather === "Tempestade" && config.weather.storm.active) surge += (config.weather.storm.multiplier - 1);
      if (currentWeather === "Chuva Leve" && config.weather.rain.active) surge += (config.weather.rain.multiplier - 1);
      
      // Horário de Pico (Fixado ou Dinâmico)
      if (hour >= 18 && hour <= 21) surge += 0.3; 

      // 7. Limites de Segurança (Hard Caps vindos do Admin)
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

  // Calcula preços usando Routes API (nova, não deprecated)
  const calculateDistancePrices = async (origin: string, destination: string) => {
    if (!origin || !destination) return;
    setIsCalculatingPrice(true);
    try {
      const apiKey = GMAPS_KEY;
      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: origin },
          destination: { address: destination },
          travelMode: "DRIVE",
          languageCode: "pt-BR",
        }),
      });
      const data = await res.json();
      setIsCalculatingPrice(false);
      if (data?.routes?.[0]) {
        const route = data.routes[0];
        const distKm = (route.distanceMeters || 0) / 1000;
        const secs = parseInt(route.duration?.replace("s","") || "0");
        const mins = Math.round(secs / 60);
        const durationText = mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}min` : `${mins} min`;
        const distText = distKm < 1 ? `${Math.round(distKm*1000)} m` : `${distKm.toFixed(1)} km`;
        setRouteDistance(`${distText} • ${durationText}`);
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
    } catch {
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
      toastWarning("Faça login para continuar");
      setView("login");
      return;
    }

    const isShipping = transitData.type === 'utilitario' || transitData.type === 'van';
    const bv = marketConditions.settings.baseValues;
    const basePrices: Record<string, number> = { 
      mototaxi: bv.mototaxi_min || 6, 
      carro: bv.carro_min || 14, 
      van: bv.van_min || 35, 
      utilitario: bv.utilitario_min || 10 
    };
    
    // Calcular preço final usando o novo motor de precificação se disponível ou o fallback dinâmico
    let finalPrice = 0;
    if (transitData.type === 'utilitario') {
       finalPrice = calculateFreightPrice({
          baseFare: 45,
          distanceInKm: 10,
          distanceRate: 2.8,
          helperCount: transitData.helpers,
          helperRate: 35,
          hasStairs: transitData.accessibility.stairsAtOrigin || transitData.accessibility.stairsAtDestination
       }).totalPrice;
    } else if (transitData.type === 'van') {
       finalPrice = calculateVanPrice({
          baseFare: 80,
          distanceInKm: 15,
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
        : `VIAGEM: Transporte de passageiro (${transitData.type === 'mototaxi' ? 'MotoTáxi' : 'Particular'})`}`,
      payment_method: paymentMethod,
      payment_status: (paymentMethod === 'dinheiro' || paymentMethod === 'pix' || paymentMethod === 'bitcoin_lightning') ? 'pending' : 'paid',
      scheduled_at: transitData.scheduled ? `${transitData.scheduledDate}T${transitData.scheduledTime}:00` : null
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

      // 3. Se for PIX ou Lightning, precisamos gerar a fatura real via Edge Function
      if (paymentMethod === 'pix') {
         try {
            const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
              body: {
                amount: finalPrice,
                orderId: order.id,
                payment_method_id: 'pix',
                email: email || "cliente@izidelivery.com",
                customer: { name: userName, cpf: "000.000.000-00" }
              },
            });
            
            if (!fnErr && fnData?.qrCode) {
               setPixData({ 
                 qrCode: fnData.qrCode, 
                 copyPaste: fnData.copyPaste, 
                 expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString() 
               });
               setShowPixPayment(true);
            } else {
               // Fallback para modal manual se a função falhar
               setShowPixPayment(true);
            }
         } catch (e) {
            setShowPixPayment(true); 
         }
      } else if (paymentMethod === 'bitcoin_lightning') {
          try {
            const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
              body: { amount: finalPrice, orderId: order.id, memo: `Viagem Izi #${order.id}` },
            });
            if (!lnErr && lnData?.payment_request) {
               setLightningData({ 
                 payment_request: lnData.payment_request, 
                 satoshis: Math.round(finalPrice * 2000), // Exemplo de conversão
                 btc_price_brl: 350000 
               });
               setSubView("lightning_payment");
            }
          } catch(e) {}
      }

      // Salvar no histórico
      const newHistory = [transitData.destination, ...transitHistory.filter(h => h !== transitData.destination)].slice(0, 10);
      setTransitHistory(newHistory);
      localStorage.setItem("transitHistory", JSON.stringify(newHistory));

      setSelectedItem(order);
      
      if (paymentMethod !== 'pix' && paymentMethod !== 'bitcoin_lightning') {
        toastSuccess(isShipping ? "Pedido de envio criado!" : "Procurando motorista mais próximo...");
        if (transitData.scheduled) {
          setSubView("payment_success");
        } else {
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

  // Recalcular preços ao entrar na tela transit_selection com rota já definida
  useEffect(() => {
    if (subView === "transit_selection" && transitData.origin && transitData.destination && Object.keys(distancePrices).length === 0) {
      setRouteDistance("");
      calculateDistancePrices(transitData.origin, transitData.destination);
    }
  }, [subView]);

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

  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardData, setNewCardData] = useState({ number: "", expiry: "", cvv: "", brand: "Visa" });
  // Controla de onde a tela de pagamentos foi aberta: "checkout" | "profile"
  const [paymentsOrigin, setPaymentsOrigin] = useState<"checkout" | "profile" | "izi_black">("profile");

  const fetchSavedCards = async (uid: string) => {
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
        last4: c.last4,
        expiry: c.expiry,
        active: c.is_default,
        stripe_payment_method_id: c.stripe_payment_method_id,
        color: c.brand === "Visa"
          ? "linear-gradient(135deg, #2563eb, #1e40af)"
          : c.brand === "Amex"
            ? "linear-gradient(135deg, #047857, #065f46)"
            : "linear-gradient(135deg, #1e293b, #0f172a)",
      }));
      setSavedCards(cards);
      // Se tem cartão padrão, define o método de pagamento
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
      // Sincroniza o local atual se houver um endereço ativo no banco
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
          details: newAddrDetails.trim() || null,
          city: newAddrCity.trim() || null,
          is_active: savedAddresses.length === 0,
        });
        if (error) throw error;
        toastSuccess('Endereço salvo com sucesso!');
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
      toastSuccess('Endereço removido.');
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
      toastSuccess('Endereço padrão atualizado!');
      fetchSavedAddresses(userId);
    } catch (e: any) {
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
    return () => {
      clearInterval(interval);
      supabase.removeChannel(flashChannel);
    };
  }, []);

  const fetchWalletBalance = async (uid: string) => {
    const { data } = await supabase
      .from("users_delivery")
      .select("wallet_balance, is_izi_black, cashback_earned")
      .eq("id", uid)
      .single();
    if (data) {
      setWalletBalance(data.wallet_balance || 0);
      setIsIziBlackMembership(data.is_izi_black || false);
      setIziCashbackEarned(data.cashback_earned || 0);
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

  const isLoaded = true; // Loaded via index.html

  const updateLocation = () => {
    setUserLocation((prev) => ({ ...prev, loading: true }));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            if (isLoaded) {
              const geocoder = new google.maps.Geocoder();
              const response = await geocoder.geocode({
                location: { lat: latitude, lng: longitude },
              });

              if (response.results[0]) {
                const address = response.results[0].formatted_address;
                setUserLocation({ address, loading: false });
                setTransitData((prev) => ({ ...prev, origin: address }));
              }
            } else {
              // Fallback para Nominatim se o Google ainda não carregou
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              );
              const data = await response.json();
              let address = data.display_name.split(",")[0];
              setUserLocation({ address, loading: false });
              setTransitData((prev) => ({ ...prev, origin: address }));
            }
          } catch (error) {
            setUserLocation({ address: "São Paulo, SP", loading: false });
          }
        },
        (error) => {
          setUserLocation({ address: "Endereço não identificado", loading: false });
        },
        { enableHighAccuracy: true },
      );
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName || user.email?.split("@")[0] || "Usuário");
        setEmail(user.email || "");
        
        // Sincronizar com o banco de dados Supabase (Somente se NAO for lojista ou entregador)
        const { data: isAdmin } = await supabase.from("admin_users").select("id").eq("id", user.uid).maybeSingle();
        const { data: isDriver } = await supabase.from("drivers_delivery").select("id").eq("id", user.uid).maybeSingle();

        if (!isAdmin && !isDriver) {
          await supabase.from("users_delivery").upsert({ 
            id: user.uid, 
            name: user.displayName || user.email?.split("@")[0] || "Usuário",
            email: user.email,
            wallet_balance: 0 // Saldo inicial sempre 0
          });
        }

        setView("app");
        setAuthInitLoading(false);
        window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
        
        fetchMyOrders(user.uid);
        fetchWalletBalance(user.uid);
        fetchSavedCards(user.uid);
        fetchSavedAddresses(user.uid);
        fetchCoupons();
        fetchBeveragePromo();
      } else {
        setView("login");
        setAuthInitLoading(false);
      }
    });

    const sub = supabase
      .channel("orders_tracking")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders_delivery" },
        (payload) => {
          const newOrder = payload.new as any;
          const oldOrder = payload.old as any;
          
          if (newOrder.user_id !== userIdRef.current) return;

          // Se o status mudou, mostrar notificação personalizada
          if (newOrder.status !== oldOrder.status) {
            const statusMessages: Record<string, string> = {
              'novo': 'Recebemos seu pedido! Já estamos processando. ⚡',
              'pendente_pagamento': 'Aguardando confirmação do pagamento... 💳',
              'pendente': 'O lojista recebeu seu pedido! 🎉',
              'aceito': 'O estabelecimento aceitou seu pedido! 🎉',
              'confirmado': 'Pedido confirmado! O preparo começou. ✅',
              'preparando': 'Seu pedido está sendo preparado com carinho! 🍳',
              'pronto': 'Pedido pronto! Aguardando o motoboy para coleta. 📦',
              'a_caminho': 'O motoboy aceitou e está indo coletar seu pedido! 🏍️',
              'picked_up': 'Pedido coletado! O motoboy está iniciando a entrega. 🚀',
              'saiu_para_entrega': 'Fique atento! Seu pedido saiu para entrega! 🛵',
              'em_rota': 'Motoboy a caminho! Prepare-se para receber seu Izi. 🏁',
              'no_local': 'O motoboy chegou ao seu endereço! 🔔',
              'concluido': 'Pedido entregue com sucesso! Bom apetite. ✨',
              'cancelado': 'Ah não! Seu pedido foi cancelado. ⚠️'
            };

            const msg = statusMessages[newOrder.status] || `Status do pedido atualizado: ${newOrder.status}`;
            showToast(msg, newOrder.status === 'cancelado' ? 'warning' : 'success');

            // Se o pagamento lightning foi confirmado, fechar a tela de pagamento
            if (newOrder.payment_status === 'paid' && subViewRef.current === "lightning_payment") {
              setSubView("payment_success");
            }

            // Abrir tela de avaliação ao concluir (exceto para assinaturas Izi Black)
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

            // Transições automáticas de tela baseadas no status
            if (subViewRef.current === "waiting_merchant" && ["aceito", "confirmado", "preparando", "pendente", "no_preparo", "pronto", "waiting_driver"].includes(newOrder.status)) {
              showToast("Loja aceitou seu pedido! 🎉", "success");
              setSelectedItem(newOrder); 
              setTimeout(() => setSubView("payment_success"), 1000);
            }
            if (subViewRef.current === "waiting_merchant" && newOrder.status === "cancelado") {
              showToast("Seu pedido foi recusado.", "warning");
              setSubView("none");
              fetchMyOrders(userId!);
            }
            if (subViewRef.current === "waiting_driver" && 
                ["a_caminho", "aceito", "confirmado", "em_rota", "no_local", "picked_up", "saiu_para_entrega"].includes(newOrder.status)) {
              setSelectedItem(newOrder);
              setTimeout(() => setSubView("active_order"), 1500);
            }
            if (subViewRef.current === "waiting_driver" && newOrder.status === "cancelado") {
              setSubView("none");
              fetchMyOrders(userId!);
            }

            if (selectedItem?.id === newOrder.id || !selectedItem) {
              setSelectedItem(newOrder);
            }
          }
          
          if (userIdRef.current) fetchMyOrders(userIdRef.current);
        },
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(sub);
    };
  }, [userId]);
  
  const fetchMyOrders = async (uid: string) => {
    const { data } = await supabase
      .from("orders_delivery")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (data) setMyOrders(data);
  };

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from('promotions_delivery')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setAvailableCoupons(data);
  };

  const fetchBeveragePromo = useCallback(async () => {
    try {
      // 1. Buscar Banners específicos para bebidas ou banners gerais ativos
      const { data: banners } = await supabase
        .from('promotions_delivery')
        .select('*')
        .eq('is_active', true)
        .is('coupon_code', null)
        .order('created_at', { ascending: false });
      
      if (banners) {
        // Filtra banners que mencionam bebidas no título ou descrição
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

      const subtotal = cart.reduce((acc, item) => acc + (item.price || 0), 0);
      if (data.min_order_value && subtotal < data.min_order_value) {
        setCouponError(`Pedido mínimo de R$ ${data.min_order_value.toFixed(2).replace(".", ",")} para este cupom.`);
        setAppliedCoupon(null);
        return;
      }

      // Validar data de expiração se houver
      if (data.end_date && new Date(data.end_date) < new Date()) {
        setCouponError("Este cupom já expirou.");
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

  const handleAuth = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register
        if (!userName.trim()) { setErrorMsg('Informe seu nome completo.'); setIsLoading(false); return; }
        if (!phone.trim()) { setErrorMsg('Informe seu telefone.'); setIsLoading(false); return; }
        if (password.length < 6) { setErrorMsg('A senha deve ter no mínimo 6 caracteres.'); setIsLoading(false); return; }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
          displayName: userName.trim()
        });

        // Sincronizar com o banco de dados Supabase (users_delivery)
        await supabase.from("users_delivery").upsert({ 
          id: user.uid, 
          name: userName.trim(), 
          phone: phone.trim(),
          email: email
        });
      }

      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("rememberMe");
      }

      setView("app");
      window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.code === 'auth/invalid-credential' ? 'Email ou senha incorretos.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemCount = (id: number) =>
    cart.filter((item) => item.id === id).length;

  const handleAddToCart = (item: any) => {
    setCart((prev: any[]) => [...prev, { ...item }]);
    setUserXP((prev: number) => prev + 10);
  };

  const handleShopClick = async (shop: any) => {
    setSelectedShop(shop);
    setActiveCategory("Destaques");
    const isRestaurant = shop.type === "restaurant";
    const targetView = isRestaurant ? "restaurant_menu" : "store_catalog";

    try {
      const { data: products } = await supabase
        .from("products_delivery")
        .select("*")
        .eq("merchant_id", shop.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      console.log("Produtos recebidos:", products?.length, products?.[0]);
      if (products && products.length > 0) {
        const grouped: Record<string, any[]> = {};
        products.forEach((p: any) => {
          const cat = p.category || p.subcategory || (isRestaurant ? "Cardápio" : "Produtos");
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push({
            id: p.id,
            name: p.name,
            desc: p.description || "",
            price: p.price,
            img: p.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600",
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
    const { data } = await supabase.from("promotions").select("*").eq("coupon_code", code.toUpperCase().trim()).eq("is_active", true).single();
    if (data) { setAppliedCoupon(data); setCouponInput(data.coupon_code); }
    else { alert("Cupom invalido ou expirado."); }
  };


  const handlePlaceOrder = async () => {
    if (!paymentMethod) { alert("Selecione uma forma de pagamento."); return; }
    if (!userId) { alert("Faça login para continuar."); return; }
    if (cart.length === 0) { alert("Seu carrinho está vazio."); return; }

    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const discount = appliedCoupon
      ? appliedCoupon.discount_type === "fixed"
        ? appliedCoupon.discount_value
        : (subtotal * appliedCoupon.discount_value) / 100
      : 0;
    const total = Math.max(0, subtotal - discount);

    const orderBase = {
      user_id: userId,
      merchant_id: selectedShop?.id || null,
      status: "novo",
      total_price: total,
      pickup_address: selectedShop?.name || "Endereço do Estabelecimento",
      delivery_address: `${userLocation.address || "Endereço não informado"} | ITENS: ${cart.map(i => `${i.name} (R$ ${Number(i.price).toFixed(2)})`).join(', ')}`,
      payment_method: paymentMethod,
      service_type: selectedShop?.type || "restaurant",
      notes: paymentMethod === "dinheiro" && changeFor ? `TROCO PARA: R$ ${changeFor}` : "",
    };

    const clearCart = () => {
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput("");
      setUserXP((prev: number) => prev + 50);
    };

    try {
      // ── PAGAMENTOS DIGITAIS (Pendente Confirmação) ───────────────────────
      const isDigital = ["pix", "cartao", "bitcoin_lightning"].includes(paymentMethod);
      const initialStatus = isDigital ? "pendente_pagamento" : (paymentMethod === "dinheiro" ? "waiting_merchant" : "novo");

      // ── PIX (Mercado Pago) ──────────────────────────────────────────────
      if (paymentMethod === "pix") {
        setPixConfirmed(false);
        setPixCpf("");
        navigateSubView("pix_payment");
        return;
      }

      // ── BITCOIN LIGHTNING ──────────────────────────────────────────────
      if (paymentMethod === "bitcoin_lightning") {
        navigateSubView("payment_processing");
        const { data: order, error: insertError } = await supabase.from("orders_delivery").insert({ 
          ...orderBase, 
          status: "pendente_pagamento",
        }).select().single();
        
        if (insertError || !order) { 
          alert("Não foi possível registrar o pedido para pagamento Lightning: " + (insertError?.message || "Erro desconhecido"));
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
            console.error("Erro Lightning:", lnErr);
            // Se o pedido já foi criado, vamos mostrar ele mas com erro na invoice
            setSelectedItem({ ...order, lightningError: true });
            navigateSubView("lightning_payment");
            return;
          }

          setSelectedItem({ 
            ...order, 
            lightningInvoice: lnData.payment_request, 
            satoshis: lnData.satoshis, 
            btcPrice: lnData.btc_price_brl 
          });
          clearCart();
          navigateSubView("lightning_payment");
        } catch (err) {
          console.error("Exceção Lightning:", err);
          setSelectedItem({ ...order, lightningError: true });
          navigateSubView("lightning_payment");
        }
        return;
      }

      // ── SALDO DA CARTEIRA ──────────────────────────────────────────────
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
        clearCart();
        navigateSubView("waiting_merchant");
        return;
      }

      // ── DINHEIRO / CARTÃO NA ENTREGA ─────────────────────────────────
      if (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega") {
        if (!selectedShop?.id) { alert("Erro: Estabelecimento não selecionado."); setIsLoading(false); return; }
        
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
          alert("Não foi possível processar o pedido. Erro: " + (insertError?.message || "Tente novamente."));
          setIsLoading(false);
          return;
        }

        setSelectedItem(order);
        clearCart();
        setChangeFor("");
        navigateSubView("waiting_merchant");
        return;
      }

      // ── CARTÃO (Mercado Pago) ──────────────────────────────────────────
      if (paymentMethod === "cartao") {
        setSubView("card_payment");
        return;
      }

    } catch (e) {
      console.error("Erro ao criar pedido:", e);
      navigateSubView("payment_error");
    }
  };





  const handleLogin = async () => {
    setLoginError("");
    setIsLoading(true);
    if (!loginEmail || !loginPassword) { 
      setLoginError("Preencha email e senha."); 
      setIsLoading(false);
      return; 
    }
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      console.error("Login error:", err); 
      setLoginError(err.code === 'auth/invalid-credential' ? 'Email ou senha inválidos.' : err.message); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoginError("");
    setIsLoading(true);
    if (!loginEmail || !loginPassword) { 
      setLoginError("Preencha email e senha."); 
      setIsLoading(false);
      return; 
    }
    if (loginPassword.length < 6) { 
      setLoginError("Senha deve ter pelo menos 6 caracteres."); 
      setIsLoading(false);
      return; 
    }
    if (!userName.trim()) {
      setLoginError("Informe seu nome completo.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: userName.trim()
      });

      // Sincronizar manual imediata (opcional, pois o useEffect cuidará disso ao disparar o onAuthStateChanged)
      await supabase.from("users_delivery").upsert({ 
        id: user.uid, 
        name: userName.trim(), 
        phone: phone.trim(),
        email: loginEmail
      });

    } catch (err: any) {
      console.error("SignUp error:", err);
      setLoginError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogin = () => (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-yellow-400/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-zinc-800/30 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-sm space-y-12 relative z-10 transition-all duration-500">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-3xl bg-zinc-900 shadow-2xl border border-zinc-800 mb-2"
          >
            <h1 className="text-4xl font-black tracking-[0.2em] italic text-yellow-400 uppercase"
              style={{ textShadow: "0 0 30px rgba(255,215,9,0.3)" }}>
              IZI
            </h1>
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {authMode === 'login' ? 'Seja bem-vindo de volta' : 'Crie sua conta IZI'}
            </h2>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
              {authMode === 'login' ? 'Stealth Luxury Delivery' : 'Experiência Premium em Segundos'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={authMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {authMode === 'register' && (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Nome Completo</p>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Como deseja ser chamado?"
                      className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Telefone / WhatsApp</p>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 0 0000-0000"
                      className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Endereço de E-mail</p>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Sua Chave de Acesso</p>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignUp())}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 py-4 px-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 text-sm font-medium transition-all rounded-t-xl" 
                />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="pt-6 space-y-4">
            <button 
              onClick={() => authMode === 'login' ? handleLogin() : handleSignUp()}
              disabled={isLoading}
              className="w-full py-5 rounded-[22px] font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
              style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 10px 30px rgba(255,215,9,0.15)" }}
            >
              {isLoading && <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
              <span>{authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}</span>
              <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setLoginError("");
              }}
              className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-900 text-zinc-500 hover:border-yellow-400/20 hover:text-yellow-400 transition-all active:scale-95"
            >
              {authMode === 'login' ? 'Novo por aqui? Criar uma conta' : 'Já possui conta? Fazer Login'}
            </button>
          </div>
        </div>

        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-red-400 text-lg">error</span>
            <p className="text-red-400 text-xs font-bold">{loginError}</p>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderHome = () => {
    const deliveryServices = [
      { icon: "restaurant",     label: "Restaurantes", type: "restaurant", action: null },
      { icon: "local_mall",     label: "Mercados",     type: "market",     action: null },
      { icon: "local_bar",      label: "Bebidas",      type: "beverages",  action: null },
      { icon: "local_pharmacy", label: "Saúde",        type: "pharmacy",   action: null },
      { icon: "pedal_bike",     label: "Logística",    type: null,         action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("explore_envios"); } },
      { icon: "pets",           label: "Petshop",      type: "generic",    action: () => { setExploreCategoryState({ id: "pets", title: "Pet Shop Premium", tagline: "Mimo para seu melhor amigo", primaryColor: "rose-500", icon: "pets", banner: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200" }); navigateSubView("explore_category"); } },
    ];

    const handleServiceSelection = (cat: any) => {
      if (cat.action) return cat.action();
      setActiveService(cat);
      if (cat.type === "restaurant") navigateSubView("restaurant_list");
      else if (cat.type === "market") navigateSubView("market_list");
      else if (cat.type === "pharmacy") navigateSubView("pharmacy_list");
      else if (cat.type === "beverages") navigateSubView("beverages_list");
      else navigateSubView("generic_list");
    };

    // IZI Flash — usa dados reais do Supabase (tabela flash_offers)
    const activeStories = flashOffers.map((offer: any) => {
      const expiresAt = new Date(offer.expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const timeLeft = diffHrs > 0 ? diffHrs + "h" : diffMins + "min";
      const discount = offer.discount_percent
        ? offer.discount_percent + "% OFF"
        : offer.discounted_price && offer.original_price
          ? "R$ " + Number(offer.discounted_price).toFixed(0)
          : "Oferta";
      return {
        id: offer.id,
        merchant: offer.admin_users?.store_name || offer.merchant_name || "Loja",
        discount,
        timeLeft,
        img: offer.product_image || offer.admin_users?.store_logo || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400",
        isMaster: userLevel >= 10 && offer.is_vip,
        offer,
      };
    });

    const activeOrder = myOrders.find(o => !["concluido", "cancelado"].includes(o.status));

    return (
      <div className="flex flex-col bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar h-full">

        {/* HEADER */}
        <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-5"
          style={{ background: "linear-gradient(to bottom, #000000 60%, transparent)" }}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSubView(subView === "addresses" ? "none" : "addresses")}>
            <div className="relative">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-yellow-400/20">
                <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" />
              </div>
              {userLevel >= 10 && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-[0_0_10px_rgba(255,215,9,0.5)]">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>workspace_premium</span>
                  VIP
                </div>
              )}
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Entregar em</p>
              <div className="flex items-center gap-1">
                <span className="text-zinc-100 font-bold text-sm tracking-tight max-w-[150px] truncate">
                  {userLocation.loading ? "Buscando..." : userLocation.address}
                </span>
                <span className="material-symbols-outlined text-yellow-400 text-sm">expand_more</span>
              </div>
            </div>
          </div>

          <h1 className="text-lg font-extrabold tracking-[0.4em] italic text-yellow-400 hidden md:block uppercase">IZI</h1>

          <div className="flex items-center gap-3">
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800/50 transition-all active:scale-95">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>
              )}
            </button>
            <button onClick={() => setSubView("quest_center")} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800/50 transition-all active:scale-95">
              <span className="material-symbols-outlined text-zinc-100">notifications</span>
            </button>
          </div>
        </header>

        <main className="px-5 pb-10 flex flex-col gap-8">

          {/* SEARCH */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-colors text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl py-4 pl-14 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all text-sm font-medium"
              placeholder="O que você deseja pedir hoje?"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-5 flex items-center">
              {searchQuery
                ? <button onClick={() => setSearchQuery("")}><span className="material-symbols-outlined text-zinc-500 text-sm">close</span></button>
                : <span className="material-symbols-outlined text-zinc-500 text-xl">tune</span>
              }
            </div>
          </div>

          {/* PEDIDO ATIVO */}
          {activeOrder && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { setSelectedItem(activeOrder); setSubView("active_order"); }}
              className="bg-yellow-400 text-black p-5 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
            >
              <div className="size-12 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">moped</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Pedido em andamento</p>
                <h4 className="font-black text-base leading-tight">Acompanhar entrega em tempo real</h4>
              </div>
              <div className="size-2 bg-red-500 rounded-full animate-ping shrink-0" />
            </motion.div>
          )}

          {/* BANNER PROMO */}
          <section>
            <div className="relative h-44 w-full rounded-2xl overflow-hidden group cursor-pointer" onClick={() => navigateSubView("exclusive_offer")}>
              <img className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700" src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800" alt="Promo" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent flex flex-col justify-center p-7">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Oferta VIP</span>
                <h2 className="text-2xl font-extrabold text-white leading-tight">Ganhe 50% OFF<br/>na Primeira Entrega</h2>
                <p className="text-zinc-300 text-xs mt-1.5 font-medium">Use o código: IZI-FIRST</p>
              </div>
            </div>
          </section>

          {/* CARD ELITE */}
          <section>
            <div className="relative overflow-hidden rounded-[2rem] h-48 flex items-center p-7 bg-gradient-to-br from-zinc-900/60 to-black border border-white/5">
              <div className="relative z-10 space-y-2">
                <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">Privilégio Elite</span>
                <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight">Taxa zero em<br/>toda a cidade.</h2>
                <p className="text-zinc-500 text-xs font-medium max-w-[190px]">A velocidade máxima do ecossistema IZI Black ao seu comando.</p>
              </div>
              <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-[160px] text-yellow-400" style={{ fontVariationSettings: "\'FILL\' 0" }}>delivery_dining</span>
              </div>
            </div>
          </section>

          {/* GRADE DE SERVIÇOS */}
          <section className="grid grid-cols-3 gap-y-10 gap-x-6">
            {deliveryServices.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleServiceSelection(svc)}
                className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-all"
              >
                <div className="relative w-24 h-24 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
                  <div className="absolute inset-0 bg-yellow-400/10 blur-[30px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="material-symbols-outlined text-6xl text-white group-hover:text-yellow-400 transition-colors" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,9,0.25))" }}>
                    {svc.icon}
                  </span>
                </div>
                <span className="text-[10px] font-black text-zinc-500 group-hover:text-yellow-400 tracking-[0.3em] uppercase transition-colors">{svc.label}</span>
              </motion.div>
            ))}
          </section>

          {/* CUPONS */}
          {availableCoupons.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black tracking-tight text-zinc-100">Cupons Disponíveis</h3>
                <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                  {availableCoupons.length} {availableCoupons.length === 1 ? "cupom" : "cupons"}
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
                {availableCoupons.map((coupon, i) => {
                  const isCopied = copiedCoupon === coupon.coupon_code;
                  return (
                    <motion.div key={coupon.id || i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex-shrink-0 w-64 h-28 bg-zinc-900/60 rounded-2xl p-5 flex justify-between items-center border border-zinc-800/60">
                      <div>
                        <p className="text-yellow-400 text-[10px] font-bold mb-1 uppercase tracking-wider">CUPOM ATIVO</p>
                        <h5 className="text-base font-black text-white font-mono tracking-widest">{coupon.coupon_code}</h5>
                        <p className="text-zinc-500 text-[10px] mt-1">
                          {coupon.discount_type === "fixed" ? `R$ ${coupon.discount_value?.toFixed(2)} OFF` : `${coupon.discount_value}% OFF`}
                          {coupon.min_order_value > 0 && ` • Mín R$${coupon.min_order_value}`}
                        </p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(coupon.coupon_code).catch(() => {}); setCopiedCoupon(coupon.coupon_code); setTimeout(() => setCopiedCoupon(null), 2000); }}
                        className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center active:scale-90 transition-all">
                        <span className={`material-symbols-outlined text-lg ${isCopied ? "text-emerald-400" : "text-yellow-400"}`}>
                          {isCopied ? "check_circle" : "content_copy"}
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* FLASH OFFERS — só aparece se tiver ofertas ativas */}
          {activeStories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-zinc-100 uppercase tracking-[0.2em]">Izi Flash</h3>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">Ao Vivo</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {activeStories.map(story => (
                <div key={story.id}
                  onClick={() => {
                    if (story.isMaster && userLevel < 10) showToast("Esta oferta é exclusiva para membros Tier MASTER.", "info");
                    else if (story.isMaster) setShowMasterPerks(true);
                    else showToast(`Izi Flash: Oferta de ${story.discount} ativada para ${story.merchant}!`, "success");
                  }}
                  className={`relative flex-shrink-0 size-24 rounded-[28px] p-[2px] bg-gradient-to-tr ${story.isMaster ? "from-amber-400 via-yellow-400 to-orange-600" : "from-yellow-400 via-orange-400 to-rose-500"} cursor-pointer active:scale-95 transition-all group`}>
                  <div className="size-full rounded-[26px] overflow-hidden bg-zinc-900 border-2 border-zinc-900 relative">
                    <img src={story.img} className="size-full object-cover opacity-70 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2.5">
                      <p className="text-[7px] font-black text-white uppercase tracking-tighter truncate">{story.merchant}</p>
                      <p className="text-[10px] font-black text-yellow-400 italic">{story.discount}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                      <p className="text-[6px] font-black text-white">{story.timeLeft}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}

          {/* FAVORITOS DA REGIÃO */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">Favoritos da Região</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Os mais pedidos agora</p>
              </div>
              <button className="text-yellow-400 text-xs font-bold hover:underline">Ver todos</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ESTABLISHMENTS.filter(e => e.type === 'restaurant').length > 0 && (
                <div className="md:col-span-2 group cursor-pointer" onClick={() => handleShopClick(ESTABLISHMENTS.find(e => e.type === 'restaurant'))}>
                  <div className="relative rounded-2xl overflow-hidden aspect-video">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={ESTABLISHMENTS[0].img} alt={ESTABLISHMENTS[0].name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-5 flex flex-col justify-end">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Exclusivo</span>
                        <div className="flex items-center text-yellow-400 text-xs font-bold">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "\'FILL\' 1" }}>star</span>
                          {ESTABLISHMENTS[0].rating}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-white">{ESTABLISHMENTS[0].name}</h4>
                      <p className="text-zinc-400 text-xs">{ESTABLISHMENTS[0].tag} • {ESTABLISHMENTS[0].time} • {ESTABLISHMENTS[0].freeDelivery ? "Grátis" : ESTABLISHMENTS[0].fee}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-6">
                {ESTABLISHMENTS.slice(1, 3).map((shop) => (
                  <div key={shop.id} className="group cursor-pointer" onClick={() => handleShopClick(shop)}>
                    <div className="relative rounded-2xl overflow-hidden aspect-video">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={shop.img} alt={shop.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 flex flex-col justify-end">
                        <h4 className="font-bold text-white text-sm">{shop.name}</h4>
                        <p className="text-zinc-400 text-xs">{shop.tag} • {shop.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* MOBILIDADE */}
          <section>
            <div className="mb-10 text-center">
              <p className="text-[10px] font-black text-yellow-400 tracking-[0.4em] uppercase mb-1">Ecossistema Urbano</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Mobilidade e Transporte</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-12 gap-x-8">
              {[
                { icon: "two_wheeler", label: "Mototáxi", action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false }); navigateSubView("taxi_wizard"); } },
                { icon: "airport_shuttle", label: "Van", action: () => { setTransitData({ ...transitData, type: "van", scheduled: false }); navigateSubView("van_wizard"); } },
                { icon: "directions_car", label: "Motorista\nParticular", action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false }); navigateSubView("taxi_wizard"); } },
                { icon: "local_shipping", label: "Frete", action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("freight_wizard"); } },
              ].map((svc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={svc.action}
                  className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-all"
                >
                  <div className="relative w-24 h-24 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
                    <div className="absolute inset-0 bg-yellow-400/10 blur-[30px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="material-symbols-outlined text-6xl text-white group-hover:text-yellow-400 transition-colors" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,9,0.25))" }}>
                      {svc.icon}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 group-hover:text-yellow-400 tracking-[0.3em] uppercase transition-colors text-center leading-tight">
                    {svc.label.split("\n").map((line: string, j: number) => (
                      <span key={j}>{line}{j < svc.label.split("\n").length - 1 && <br/>}</span>
                    ))}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>

        </main>
      </div>
    );
  };

  const renderBurgerList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4" style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("restaurant_list")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Burgers</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Artesanais & Smash</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>
        <main className="px-5 flex flex-col gap-4 pb-10">
          {ESTABLISHMENTS.filter((s: any) => 
            s.type === "restaurant" && 
            (s.description.toLowerCase().includes("burger") || s.name.toLowerCase().includes("burger")) && 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((shop: any, i: number) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleShopClick({ ...shop, type: "restaurant" })} className="group cursor-pointer active:scale-[0.98] transition-all">
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                    <span className={shop.freeDelivery ? "text-emerald-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      <span className="material-symbols-outlined text-[13px]">delivery_dining</span>
                      {shop.freeDelivery ? "Grátis" : shop.fee}
                    </span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ESTABLISHMENTS.filter((s: any) => (s.tag || s.type || "").toLowerCase().includes("burger") && s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
              <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado</p>
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderPizzaList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4" style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("restaurant_list")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Pizzas</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">As melhores da cidade</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>
        <main className="px-5 flex flex-col gap-4 pb-10">
          {ESTABLISHMENTS.filter((s: any) => 
            s.type === "restaurant" && 
            (s.description.toLowerCase().includes("pizza") || s.name.toLowerCase().includes("pizza")) && 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((shop: any, i: number) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleShopClick({ ...shop, type: "restaurant" })} className="group cursor-pointer active:scale-[0.98] transition-all">
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                    <span className={shop.freeDelivery ? "text-emerald-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      <span className="material-symbols-outlined text-[13px]">delivery_dining</span>
                      {shop.freeDelivery ? "Grátis" : shop.fee}
                    </span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ESTABLISHMENTS.filter((s: any) => (s.tag || s.type || "").toLowerCase().includes("pizza") && s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
              <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado</p>
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderAcaiList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4" style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("restaurant_list")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Açaí</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Cremoso e gelado</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>
        <main className="px-5 flex flex-col gap-4 pb-10">
          {ESTABLISHMENTS.filter((s: any) => 
            s.type === "restaurant" && 
            (s.description.toLowerCase().includes("açai") || s.description.toLowerCase().includes("açaí") || s.name.toLowerCase().includes("acai") || s.name.toLowerCase().includes("açaí")) && 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((shop: any, i: number) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleShopClick({ ...shop, type: "restaurant" })} className="group cursor-pointer active:scale-[0.98] transition-all">
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                    <span className={shop.freeDelivery ? "text-emerald-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      <span className="material-symbols-outlined text-[13px]">delivery_dining</span>
                      {shop.freeDelivery ? "Grátis" : shop.fee}
                    </span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ESTABLISHMENTS.filter((s: any) => ((s.tag || s.type || "").toLowerCase().includes("açai") || (s.tag || s.type || "").toLowerCase().includes("açaí") || (s.tag || s.type || "").toLowerCase().includes("acai")) && s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
              <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado</p>
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderJaponesaList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4" style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("restaurant_list")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Japonesa</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Sushi & temaki</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>
        <main className="px-5 flex flex-col gap-4 pb-10">
          {ESTABLISHMENTS.filter((s: any) => 
            s.type === "restaurant" && 
            (s.description.toLowerCase().includes("japones") || s.description.toLowerCase().includes("sushi") || s.name.toLowerCase().includes("sushi")) && 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((shop: any, i: number) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleShopClick({ ...shop, type: "restaurant" })} className="group cursor-pointer active:scale-[0.98] transition-all">
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                    <span className={shop.freeDelivery ? "text-emerald-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      <span className="material-symbols-outlined text-[13px]">delivery_dining</span>
                      {shop.freeDelivery ? "Grátis" : shop.fee}
                    </span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ESTABLISHMENTS.filter((s: any) => ((s.tag || s.type || "").toLowerCase().includes("japones") || (s.tag || s.type || "").toLowerCase().includes("sushi") || (s.tag || s.type || "").toLowerCase().includes("temaki")) && s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
              <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado</p>
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderExploreCategory = () => {
    if (!exploreCategoryState) return null;

    // Filtra os lojistas reais do banco de dados ao invés de usar dados engessados (hardcoded)
    const shops = ESTABLISHMENTS.filter((estab: any) => {
        const catId = (exploreCategoryState.id || "").toLowerCase();
        const type = estab.type.toLowerCase();
        // Filtro estrito: deve coincidir o tipo OU estar na descrição caso seja uma subcategoria
        return type === catId || estab.description.toLowerCase().includes(catId);
    }).map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-50 min",
      freeDelivery: estab.freeDelivery || true,
      fee: estab.freeDelivery ? undefined : "R$ 4,90",
      tag: estab.tag || "Loja Parceira",
      banner: estab.banner || estab.img,
      logo: estab.img || estab.banner,
      type: estab.type,
    }));

    const accentColor = exploreCategoryState.primaryColor;

    return (
      <div className="bg-black text-zinc-100 absolute inset-0 z-40 bg-zinc-900  flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <div className="relative h-72 shrink-0">
          <img src={exploreCategoryState.banner} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0F172A] via-black/20 to-transparent" />
          
          <div className="absolute top-8 left-6 right-6 flex items-center justify-between">
            <button 
              onClick={() => setSubView('none')} 
              className="size-12 rounded-[22px] bg-zinc-900/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all font-black"
            >
              <Icon name="arrow_back" />
            </button>
            <button className="size-12 rounded-[22px] bg-zinc-900/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all font-black">
              <Icon name="search" />
            </button>
          </div>

          <div className="absolute bottom-10 left-8">
             <div className={`px-4 py-1.5 rounded-full bg-${accentColor} text-white text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-3 shadow-lg shadow-${accentColor}/30`}>
                {exploreCategoryState.tagline}
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">
                {exploreCategoryState.title}
             </h1>
          </div>
        </div>

        <main className="px-6 space-y-8 -mt-6 relative z-10">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {['Em Destaque', 'Mais Próximos', 'Novidades', 'Melhor Avaliados'].map((filter, i) => (
              <button 
                key={i} 
                className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all ${i === 0 ? `bg-zinc-900  text-white  shadow-xl shadow-primary/20` : 'bg-zinc-900 bg-zinc-900 border border-zinc-800 border-zinc-800 text-zinc-500'}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {shops.map((shop, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={shop.id}
                onClick={() => handleShopClick({ ...shop, type: exploreCategoryState.id })}
                className="bg-zinc-900 bg-zinc-900 rounded-[45px] overflow-hidden shadow-2xl border border-zinc-800 border-zinc-800 group relative"
              >
                <div className="h-44 relative overflow-hidden">
                  <img src={shop.banner} className="size-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 bg-zinc-900/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
                     <Icon name="star" />
                     <span className="text-[11px] font-black text-white">{shop.rating}</span>
                  </div>
                </div>
                <div className="p-6 flex items-center gap-5">
                  <div className="size-14 rounded-[20px] bg-zinc-900 p-1 shadow-xl shrink-0 border border-slate-50">
                    <img src={shop.logo} className="size-full rounded-[15px] object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black tracking-tight text-white truncate">{shop.name}</h3>
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      <span className={`text-${accentColor}`}>{shop.tag}</span>
                      <span>•</span>
                      <span>{shop.time}</span>
                      <span>•</span>
                      <span className={shop.freeDelivery ? "text-emerald-500" : ""}>{shop.freeDelivery ? "Grátis" : shop.fee}</span>
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

  const renderExploreRestaurants = () => {
    const allShops = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-40 min",
      freeDelivery: estab.freeDelivery || true,
      fee: estab.freeDelivery ? "GRÁTIS" : (estab.fee || "R$ 9,00"),
      tag: estab.tag || "Restaurante",
      banner: estab.banner || estab.img,
      img: estab.img,
    }));

    const filtered = allShops.filter(shop =>
      ESTABLISHMENTS.find(e => e.id === shop.id)?.type === 'restaurant' &&
      (shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       shop.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md flex justify-between items-center w-full px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView("restaurant_list")} className="p-2 -ml-1 text-yellow-400 hover:bg-yellow-400/10 rounded-full transition-colors active:scale-90">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-yellow-400 text-black rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_15px_rgba(255,215,9,0.3)]">
            <span className="material-symbols-outlined text-sm">tune</span>
            Filtrar
          </button>
        </header>

        {/* SEARCH */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/50 border-0 border-b border-zinc-900 rounded-2xl py-3.5 pl-12 pr-10 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/20 text-sm font-medium transition-all"
              placeholder="Buscar por gênero ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-4 flex items-center">
                <span className="material-symbols-outlined text-zinc-500 text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* GRID */}
        <main className="px-5 pt-4 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {filtered.map((shop, i) => (
              <motion.article
                key={shop.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleShopClick({ ...shop, type: "restaurant" })}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] mb-3 overflow-hidden rounded-3xl transition-transform duration-500 group-hover:scale-[1.02] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                  <img src={shop.banner} alt={shop.name} className="w-full h-full object-cover transition-all duration-700" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 100%)" }} />
                  <div className="absolute bottom-4 left-4 right-4">
                    {shop.tag && (
                      <div className="mb-1.5">
                        <span className="bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">{shop.tag}</span>
                      </div>
                    )}
                    <h3 className="font-extrabold text-base tracking-tight text-white group-hover:text-yellow-400 transition-colors leading-tight">{shop.name}</h3>
                  </div>
                </div>
                <div className="flex flex-col gap-1 px-1">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-black text-xs text-white">{shop.rating}</span>
                    <span className="text-zinc-600 text-[10px] ml-1">• {shop.time}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold">
                    <span className={shop.freeDelivery ? "text-yellow-400 font-black" : "text-zinc-500"}>{shop.freeDelivery ? "GRÁTIS" : shop.fee}</span>
                  </div>
                </div>
              </motion.article>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-3">
                <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
                <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };

  const renderDailyMenus = () => {
    const specials: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-black text-white text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-black/80  backdrop-blur-3xl border-b border-slate-200/50 border-zinc-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white bg-zinc-900 shadow-2xl border border-zinc-800 border-zinc-800 flex items-center justify-center active:scale-90 transition-all group">
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

           <div className="grid grid-cols-1 gap-6">
                {specials.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={p.id}
                  onClick={() => { handleAddToCart(p); }}
                  className="bg-white bg-zinc-900 rounded-[50px] p-6 shadow-2xl border border-zinc-800 border-zinc-800 group relative active:scale-95 transition-all overflow-hidden"
                >
                  <div className="flex gap-6">
                    <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-2xl relative">
                       <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-3 left-3 bg-pink-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg">HOJE</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                       <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">{p.store}</p>
                       <h3 className="text-lg font-black text-white leading-tight mb-2 truncate group-hover:text-pink-500 transition-colors">{p.name}</h3>
                       <p className="text-[10px] text-zinc-500 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                       <div className="flex items-center justify-between">
                         <span className="text-xl font-black text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                         <div className="size-11 rounded-[18px] bg-pink-50  text-pink-500 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all shadow-lg">
                           <Icon name="add" />
                         </div>
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
    const displayDeals = flashOffers.length > 0 ? flashOffers.map(f => ({
      id: f.id,
      name: f.product_name,
      store: f.admin_users?.store_name || 'Loja Parceira',
      img: f.product_image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
      oldPrice: Number(f.original_price),
      price: Number(f.discounted_price),
      off: `${f.discount_percent}% OFF`,
      desc: f.description || 'Oferta exclusiva e por tempo limitado para membros Izi Black.'
    })) : [
      {
        id: 'vip-burger-1',
        name: 'The Ultimate Izi Black Burger',
        store: 'Burger Gourmet Lab',
        img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
        oldPrice: 59.90,
        price: 29.95,
        off: '50% OFF',
        desc: 'Blend de carne Angus 180g, queijo brie maçaricado, cebola caramelizada no Jack Daniels e pão brioche artesanal.'
      },
      {
        id: 'vip-pizza-1',
        name: 'Pizza Trufada Individual',
        store: 'Forneria d\'Oro',
        img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600',
        oldPrice: 72.00,
        price: 36.00,
        off: '50% OFF',
        desc: 'Massa de fermentação natural, mozzarella fior di latte, azeite de trufas brancas e manjericão fresco.'
      }
    ];

    return (
      <div className="absolute inset-0 z-[100] bg-zinc-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-40">
        {/* Luxury Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] bg-yellow-400/[0.02] blur-[120px] rounded-full -translate-y-1/2" />
        </div>

        <header className="relative z-10 p-8 flex flex-col items-center gap-8 pt-12">
          <div className="w-full flex items-center justify-between">
            <button 
              onClick={() => setSubView("none")} 
              className="size-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center active:scale-90 transition-all group"
            >
              <Icon name="arrow_back" />
            </button>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="bolt" />
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">Ofertas Flash</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Exclusivo Membros Izi Black</p>
            </div>

            <div className="size-12 rounded-full bg-yellow-400/5 border border-yellow-400/10 flex items-center justify-center">
              <Icon name="stars" />
            </div>
          </div>

          {/* Luxury Timer Panel */}
          <div className="relative w-full max-w-[340px] rounded-[40px] bg-white/[0.02] border border-white/[0.05] p-8 flex flex-col items-center justify-center gap-2 overflow-hidden shadow-none">
             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
             <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">As ofertas terminam em:</p>
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{timeLeft.h}</span>
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Horas</span>
                </div>
                <span className="text-4xl font-black text-yellow-400 -mt-2">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{timeLeft.m}</span>
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Minutos</span>
                </div>
                <span className="text-4xl font-black text-yellow-400 -mt-2">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{timeLeft.s}</span>
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
              onClick={() => { handleAddToCart(deal); }}
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

  const renderBrasileiraList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4" style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("restaurant_list")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Brasileira</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Comida de verdade</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>
        <main className="px-5 flex flex-col gap-4 pb-10">
          {ESTABLISHMENTS.filter((s: any) => 
            s.type === "restaurant" && 
            (s.description.toLowerCase().includes("brasileira") || s.description.toLowerCase().includes("caseira") || s.description.toLowerCase().includes("marmita")) && 
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((shop: any, i: number) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleShopClick({ ...shop, type: "restaurant" })} className="group cursor-pointer active:scale-[0.98] transition-all">
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                    <span className={shop.freeDelivery ? "text-emerald-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      <span className="material-symbols-outlined text-[13px]">delivery_dining</span>
                      {shop.freeDelivery ? "Grátis" : shop.fee}
                    </span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ESTABLISHMENTS.filter((s: any) => ((s.tag || s.type || "").toLowerCase().includes("brasileira") || (s.tag || s.type || "").toLowerCase().includes("caseira") || (s.tag || s.type || "").toLowerCase().includes("marmita")) && s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
              <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado</p>
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderHealthPlantao = () => {
    const healthOffers: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-black text-white text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-black/80  backdrop-blur-3xl border-b border-yellow-400/20 pb-6 shadow-xl">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => navigateSubView('pharmacy_list')} 
                className="size-12 rounded-[22px] bg-white bg-zinc-900 shadow-2xl border border-zinc-800 border-zinc-800 flex items-center justify-center active:scale-90 transition-all group"
              >
                <Icon name="arrow_back" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-white">Plantão de Saúde</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Ofertas Relâmpago de Hoje</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8 pt-8">
           <div className="bg-slate-900 text-white p-10 rounded-[60px] relative overflow-hidden shadow-2xl mb-4">
              <div className="relative z-10">
                <Icon name="medical_services" />
                <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none">Cuidado Premium <br />Pela Metade do Preço</h2>
                <p className="opacity-60 text-sm font-medium max-w-[200px]">Somente nas próximas 12 horas ou enquanto durarem os estoques.</p>
              </div>
              <div className="absolute -right-10 -bottom-10 size-64 bg-yellow-400/20 rounded-full blur-[100px]" />
           </div>

           <div className="grid grid-cols-1 gap-6">
              {healthOffers.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id}
                  onClick={() => { handleAddToCart(item); }}
                  className="p-6 bg-white bg-zinc-900 rounded-[50px] shadow-2xl border border-slate-50 border-zinc-800 flex items-center gap-6 group relative active:scale-95 transition-all overflow-hidden"
                >
                  <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
                     <img src={item.img} className="size-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-1">{item.store} • {item.cat}</p>
                    <h3 className="text-lg font-black text-white mb-3 leading-tight truncate group-hover:text-yellow-400 transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col">
                          <span className="text-2xl font-black text-white">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                          <span className="text-sm font-bold text-zinc-500 line-through opacity-60">R$ {item.oldPrice.toFixed(2).replace('.', ',')}</span>
                       </div>
                       <div className="bg-red-500 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-lg">{item.off}</div>
                    </div>
                  </div>
                  <div className="size-12 rounded-[22px] bg-yellow-400 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Icon name="add_shopping_cart" />
                  </div>
                </motion.div>
              ))}
           </div>
        </main>
      </div>
    );
  };

  const renderAllPharmacies = () => {
    const list = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "10-15 min",
      dist: estab.dist || "0.5 km",
      freeDelivery: estab.freeDelivery || true,
      fee: estab.freeDelivery ? undefined : "R$ 4,90",
      img: estab.img
    }));

    return (
      <div className="absolute inset-0 z-40 bg-black text-white text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-white/80 bg-zinc-900/80 backdrop-blur-3xl border-b border-slate-200/50 border-zinc-800 pb-6">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('pharmacy_list')} className="size-12 rounded-[22px] bg-white bg-zinc-900 shadow-2xl border border-zinc-800 border-zinc-800 flex items-center justify-center active:scale-90 transition-all group">
                <Icon name="arrow_back" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-white">Todas as Farmácias</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Unidades Próximas</p>
              </div>
            </div>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white bg-zinc-900/80 rounded-[28px] px-6 h-16 border border-zinc-800 border-zinc-800 focus-within:border-yellow-400/40 transition-all shadow-xl relative group overflow-hidden">
               <Icon name="search" />
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-zinc-500 font-bold text-white outline-none relative z-10" placeholder="Buscar farmácia..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6 pt-8">
          {list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((pharm, i) => (
            <motion.div
              key={pharm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleShopClick({ ...pharm, type: 'pharmacy' })}
              className="p-6 bg-white bg-zinc-900 rounded-[50px] shadow-2xl border border-slate-50 border-zinc-800 flex items-center gap-6 group relative active:scale-95 transition-all overflow-hidden"
            >
              <div className="size-24 rounded-[30px] overflow-hidden shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500">
                 <img src={pharm.img} className="size-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-white mb-2 leading-tight truncate group-hover:text-yellow-400 transition-colors">{pharm.name}</h3>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Icon name="star" />
                    <span className="text-white">{pharm.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{pharm.time}</span>
                  <span>•</span>
                  <span className={pharm.freeDelivery ? "text-emerald-500" : ""}>{pharm.freeDelivery ? "Grátis" : pharm.fee}</span>
                </div>
              </div>
              <div className="size-12 rounded-[22px] bg-slate-100 bg-zinc-900 flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                <Icon name="arrow_forward" />
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderGenericList = () => {
    const shop = activeService || { label: "Loja", type: "generic" };
    const title = shop.label || "Explorar";

    const categoryIcons: Record<string, string> = {
      "Petshop": "pets", "Flores": "local_florist", "Doces & Bolos": "cake",
      "Farmácia": "local_pharmacy", "Mercado": "local_mall",
    };
    const icon = categoryIcons[title] || "storefront";

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">

        {/* HEADER */}
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4"
          style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">{title}</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Disponível agora</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder={`Buscar em ${title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <main className="px-5 flex flex-col gap-8">

          {/* BANNER */}
          <section>
            <div className="relative h-40 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                <span className="material-symbols-outlined text-[120px] text-yellow-400/10">{icon}</span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center p-6">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Disponível</span>
                <h2 className="text-xl font-extrabold text-white leading-tight">{title}<br/>premium na sua porta</h2>
              </div>
            </div>
          </section>

          {/* ESTABELECIMENTOS */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white uppercase">Próximos de você</h3>
                <div className="w-8 h-1 bg-yellow-400 rounded-full mt-1" />
              </div>
            </div>

            <div className="flex flex-col gap-4 pb-10">
              {ESTABLISHMENTS.filter((shop: any) => {
                const sType = (shop.type || "").toLowerCase();
                const sTag = (shop.tag || "").toLowerCase();
                const filterMatch = sType === (activeService?.type || "").toLowerCase() || sType === (activeService?.label || "").toLowerCase() || sTag.includes((activeService?.type || "").toLowerCase()) || sTag.includes((activeService?.label || "").toLowerCase());
                return filterMatch && (shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || sTag.includes(searchQuery.toLowerCase()));
              }).map((shop: any, i: number) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleShopClick({ ...shop, type: "generic" })}
                  className="group cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                    <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                      <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-black text-white">{shop.rating}</span>
                    </div>
                    {shop.freeDelivery && (
                      <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                        Entrega Grátis
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">local_fire_department</span>{shop.tag}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                      </div>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                      <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {ESTABLISHMENTS.filter((shop: any) => {
                const sType = (shop.type || "").toLowerCase();
                const sTag = (shop.tag || "").toLowerCase();
                const filterMatch = sType === (activeService?.type || "").toLowerCase() || sType === (activeService?.label || "").toLowerCase() || sTag.includes((activeService?.type || "").toLowerCase()) || sTag.includes((activeService?.label || "").toLowerCase());
                return filterMatch && (shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || sTag.includes(searchQuery.toLowerCase()));
              }).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
                  <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          </section>

        </main>

        {cart.length > 0 && (
          <div className="fixed bottom-24 left-0 w-full px-5 z-50 pointer-events-none">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto bg-zinc-950/95 backdrop-blur-2xl border border-white/5 rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Sacola</span>
                <span className="text-white font-black text-sm">{cart.length} {cart.length === 1 ? "item" : "itens"}</span>
              </div>
              <button onClick={() => navigateSubView("cart")}
                className="flex items-center gap-3 bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,9,0.2)] active:scale-95 transition-all">
                <span>Ver Sacola</span>
                <span>R$ {cart.reduce((a: number, b: any) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}</span>
              </button>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const renderRestaurantList = () => {
    const foodCategories = [
      { id: "all",        name: "Todos",      icon: "restaurant",    action: () => navigateSubView("explore_restaurants") },
      { id: "burgers",    name: "Burgers",    icon: "lunch_dining",  action: () => navigateSubView("burger_list") },
      { id: "pizza",      name: "Pizza",      icon: "local_pizza",   action: () => navigateSubView("pizza_list") },
      { id: "japones",    name: "Japonesa",   icon: "set_meal",      action: () => navigateSubView("japonesa_list") },
      { id: "brasileira", name: "Brasileira", icon: "dinner_dining", action: () => navigateSubView("brasileira_list") },
      { id: "acai",       name: "Açaí",       icon: "grass",         action: () => navigateSubView("acai_list") },
      { id: "daily",      name: "Do Dia",     icon: "today",         action: () => navigateSubView("daily_menus") },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">

        {/* HEADER */}
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4"
          style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSubView("none")}
                className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Restaurantes</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Descubra novos sabores</p>
              </div>
            </div>
            <button
              onClick={() => cart.length > 0 && navigateSubView("cart")}
              className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/50 border-0 border-b border-zinc-900 rounded-2xl py-3.5 pl-12 pr-10 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400/20 text-sm font-medium transition-all"
              placeholder="Qual sua vontade hoje?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-4 flex items-center">
                <span className="material-symbols-outlined text-zinc-500 text-sm">close</span>
              </button>
            )}
          </div>
        </header>

        <main className="px-5 flex flex-col gap-10">

          {/* BANNER */}
          <section>
            <div className="relative h-40 rounded-2xl overflow-hidden group cursor-pointer">
              <img
                className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800"
                alt="Restaurantes"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent flex flex-col justify-center p-6">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Ofertas VIP</span>
                <h2 className="text-xl font-extrabold text-white leading-tight">Os melhores sabores<br/>na sua porta</h2>
              </div>
            </div>
          </section>

          {/* CATEGORIAS */}
          <section>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {foodCategories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={cat.action}
                  className="flex-shrink-0 flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 hover:border-yellow-400/40 hover:text-yellow-400 px-4 py-2.5 rounded-full text-zinc-400 transition-all active:scale-95 group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:text-yellow-400 transition-colors">{cat.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* CUPONS VIP */}
          {availableCoupons.filter(p => p.is_vip).length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Ofertas VIP</h3>
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">Exclusivo</span>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
                {availableCoupons.filter(p => p.is_vip).map((cpn, i) => (
                  <motion.div
                    key={cpn.id || i}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex-shrink-0 w-72 h-36 rounded-2xl relative overflow-hidden group border border-zinc-800 cursor-pointer active:scale-95 transition-all"
                  >
                    <img src={cpn.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800"} className="absolute inset-0 size-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent p-5 flex flex-col justify-between">
                      <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">{cpn.title || "Oferta Especial"}</span>
                      <div>
                        <p className="text-3xl font-black text-white leading-none">
                          {cpn.discount_type === "percent" ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`}
                          <span className="text-base text-zinc-400 ml-1">OFF</span>
                        </p>
                        {cpn.coupon_code && (
                          <button
                            onClick={() => { navigator.clipboard.writeText(cpn.coupon_code); setCopiedCoupon(cpn.coupon_code); setTimeout(() => setCopiedCoupon(null), 2000); }}
                            className="mt-2 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full active:scale-95 transition-all"
                          >
                            <span className="text-yellow-400 text-[10px] font-black tracking-widest">{cpn.coupon_code}</span>
                            <span className="material-symbols-outlined text-yellow-400 text-xs">{copiedCoupon === cpn.coupon_code ? "check_circle" : "content_copy"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* RESTAURANTES PRÓXIMOS */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white uppercase">Mais Próximos</h3>
                <div className="w-8 h-1 bg-yellow-400 rounded-full mt-1" />
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-yellow-400 flex items-center gap-1">
                Filtrar <span className="material-symbols-outlined text-sm">filter_list</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 pb-10">
              {ESTABLISHMENTS.filter(shop =>
                shop.type === 'restaurant' &&
                shop.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((shop, i) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleShopClick({ ...shop, type: "restaurant" })}
                  className="group cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-3">
                    <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                      <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-black text-white">{shop.rating}</span>
                    </div>
                    {shop.freeDelivery && (
                      <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                        Entrega Grátis
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                          {shop.tag}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {shop.time}
                        </span>
                      </div>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                      <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {ESTABLISHMENTS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
                  <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum restaurante encontrado</p>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>
    );
  };

  const renderMarketList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4"
          style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Mercados</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Compras do dia a dia</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <main className="px-5 flex flex-col gap-6">
          <section>
            <div className="relative h-36 rounded-2xl overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                <span className="material-symbols-outlined text-[100px] text-yellow-400/10">local_mall</span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center p-5">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Disponível agora</span>
                <h2 className="text-lg font-extrabold text-white leading-tight">Mercados premium<br/>na sua porta</h2>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 pb-10">
            {ESTABLISHMENTS.filter((shop: any) =>
              (shop.type === 'market' || shop.type === 'mercado') && shop.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((shop: any, i: number) => (
              <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleShopClick({ ...shop, type: "generic" })}
                className="group cursor-pointer active:scale-[0.98] transition-all">
                <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                  <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-black text-white">{shop.rating}</span>
                  </div>
                  {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
                </div>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">local_fire_department</span>{shop.tag}</span>
                    </div>
                  </div>
                  <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                    <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    );
  };

  const renderBeveragesList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4"
          style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Bebidas</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Distribuidoras e adegas</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <main className="px-5 flex flex-col gap-6">
          <section>
            <div className="relative h-36 rounded-2xl overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                <span className="material-symbols-outlined text-[100px] text-yellow-400/10">local_bar</span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center p-5">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Disponível agora</span>
                <h2 className="text-lg font-extrabold text-white leading-tight">Bebidas premium<br/>na sua porta</h2>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 pb-10">
            {ESTABLISHMENTS.filter((shop: any) =>
              shop.type === "beverages" &&
              shop.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((shop: any, i: number) => (
              <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleShopClick({ ...shop, type: "generic" })}
                className="group cursor-pointer active:scale-[0.98] transition-all">
                <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                  <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-black text-white">{shop.rating}</span>
                  </div>
                  {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
                </div>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">local_fire_department</span>{shop.tag}</span>
                    </div>
                  </div>
                  <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                    <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    );
  };

  const renderBeverageOffers = () => {
    const deals = beverageOffers;

    return (
      <div className="bg-black text-zinc-100 absolute inset-0 z-50 bg-slate-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-[60] bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 p-6 flex items-center gap-6">
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
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-zinc-900/5 border border-white/10 flex items-center justify-center group active:scale-95 transition-all">
            <Icon name="shopping_bag" />
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-yellow-400 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-slate-950 shadow-xl">{cart.length}</span>}
          </button>
        </header>

        <main className="p-6 space-y-8">
            <div className="relative h-64 rounded-[50px] overflow-hidden group border border-white/10">
              <img 
                src={beverageBanners.length > 0 ? beverageBanners[0].image_url : "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800"} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center px-10">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Aproveite</span>
                    <span className="bg-yellow-400 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Limitado</span>
                 </div>
                 <h2 className="text-4xl font-black tracking-tighter leading-tight max-w-[250px] italic text-yellow-400">
                    {beverageBanners.length > 0 ? beverageBanners[0].title : "Liquidação de Verão"}
                 </h2>
                 <p className="text-[11px] font-bold text-white/60 mt-4 uppercase tracking-[0.2em]">
                    {beverageBanners.length > 0 ? beverageBanners[0].description : "Até 40% OFF em Packs Selecionados"}
                 </p>
              </div>
            </div>

           <div className="grid grid-cols-1 gap-6 pt-4">
              {deals.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id}
                  className="bg-zinc-900/5 border border-white/10 rounded-[45px] p-5 flex items-center gap-6 group hover:bg-zinc-900/10 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-2xl relative z-10">
                     <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" title={item.name} />
                     <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-md">-{item.off}</div>
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                     <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1.5">{item.cat}</p>
                     <h3 className="text-lg font-black tracking-tight mb-4 leading-tight truncate">{item.name}</h3>
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-xl font-black text-yellow-400 leading-none mb-1">R$ {item.price.toFixed(2).replace(".", ",")}</span>
                           <span className="text-xs text-white/40 line-through font-bold">R$ {item.oldPrice.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                            className="size-11 rounded-2xl bg-yellow-400 text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all"
                          >
                            <span className="material-symbols-outlined font-black">
                              {getItemCount(item.id) > 0 ? 'add_shopping_cart' : 'add'}
                            </span>
                          </button>
                          {getItemCount(item.id) > 0 && (
                            <div className="bg-zinc-900 text-white size-9 rounded-[14px] flex items-center justify-center text-xs font-black shadow-xl">
                              {getItemCount(item.id)}
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </main>

        {/* MASTER CART CTA */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-8 pb-24 z-[70]">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-[500px] mx-auto"
            >
              <button
                onClick={() => navigateSubView("cart")}
                className="w-full bg-yellow-400 h-[80px] rounded-[35px] px-2 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(255,193,7,0.4)] transition-all active:scale-[0.98] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-zinc-900/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                
                <div className="flex items-center gap-4 ml-2">
                  <div className="bg-black/10 text-white size-14 rounded-[24px] flex items-center justify-center font-black text-xl backdrop-blur-md">
                    {cart.length}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-white text-sm tracking-[0.2em] uppercase leading-none mb-1">CARRINHO</span>
                    <span className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Finalizar Pedido</span>
                  </div>
                </div>

                <div className="bg-black text-white h-14 px-8 rounded-[24px] flex items-center justify-center mr-2 shadow-2xl">
                  <span className="font-black text-lg tracking-tight">
                    R$ {cart.reduce((a, b) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </button>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const renderPharmacyList = () => {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <header className="sticky top-0 z-50 px-5 pt-5 pb-4"
          style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
                <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">Farmácias</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Saúde e bem-estar</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <main className="px-5 flex flex-col gap-6">
          <section>
            <div className="relative h-36 rounded-2xl overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                <span className="material-symbols-outlined text-[100px] text-yellow-400/10">local_pharmacy</span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center p-5">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Disponível agora</span>
                <h2 className="text-lg font-extrabold text-white leading-tight">Farmácias premium<br/>na sua porta</h2>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 pb-10">
            {ESTABLISHMENTS.filter((shop: any) =>
              (shop.type === 'pharmacy' || shop.type === 'farmacia') && shop.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((shop: any, i: number) => (
              <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleShopClick({ ...shop, type: "generic" })}
                className="group cursor-pointer active:scale-[0.98] transition-all">
                <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                  <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-xs font-black text-white">{shop.rating}</span>
                  </div>
                  {shop.freeDelivery && <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Entrega Grátis</div>}
                </div>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">local_fire_department</span>{shop.tag}</span>
                    </div>
                  </div>
                  <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                    <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
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
    const shop = selectedShop || {
      name: "Gourmet Lab",
      rating: "4.9",
      tag: "Artesanal • Premium",
      time: "20-30 min",
      freeDelivery: true,
      img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
      banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200",
      categories: [
        {
          name: "Populares do Mestre",
          items: [
            { id: 101, name: "Filet Mignon Au Poivre", desc: "Filet grelhado com crosta de pimentas negras e molho demi-glace artesanal.", price: 89.00, img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600" },
            { id: 102, name: "Pasta de Trufas Negras", desc: "Massa fresca envolta em creme de parmesão envelhecido e trufas frescas.", price: 74.00, img: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=600" },
            { id: 103, name: "Bisque de Lagosta", desc: "Creme aveludado de lagosta com toque de conhaque e ervas finas.", price: 62.00, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=600" },
            { id: 104, name: "Fondant de Chocolate 70%", desc: "Bolo quente com centro cremoso servido com gelato de baunilha Bourbon.", price: 45.00, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600" },
          ]
        },
        { name: "Entradas", items: [
          { id: 201, name: "Carpaccio de Wagyu", desc: "Fatias finas de wagyu com alcaparras e parmesão.", price: 52.00, img: "https://images.unsplash.com/photo-1607189860920-34ef073e7a77?q=80&w=600" },
        ]},
        { name: "Sobremesas", items: [
          { id: 301, name: "Crème Brûlée", desc: "Clássico francês com crosta caramelizada na hora.", price: 38.00, img: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=600" },
        ]},
        { name: "Bebidas", items: [
          { id: 401, name: "Água com Gás", desc: "500ml gelada.", price: 9.00, img: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=600" },
        ]},
      ]
    };

    const allCategoryNames = ["Destaques", ...(shop.categories || []).map((c: any) => c.name)];

    const displayCategories = activeCategory === "Destaques"
      ? shop.categories || []
      : (shop.categories || []).filter((c: any) => c.name === activeCategory);

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">

        {/* FLOATING NAV */}
        <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-4 pointer-events-none">
          <button
            onClick={() => setSubView("restaurant_list")}
            className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex gap-3 pointer-events-auto">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
              <span className="material-symbols-outlined">favorite_border</span>
            </button>
          </div>
        </nav>

        {/* HERO */}
        <header className="relative w-full h-80 overflow-hidden shrink-0">
          <img src={shop.banner || shop.img} alt={shop.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
        </header>

        {/* METADATA */}
        <section className="px-5 -mt-10 relative z-10 mb-2">
          <h1
            className="font-extrabold text-3xl tracking-tighter text-white mb-2 uppercase leading-tight"
            style={{ textShadow: "0 0 10px rgba(255,215,9,0.5), 0 0 20px rgba(255,215,9,0.3)" }}
          >
            {shop.name}
          </h1>
          <div className="flex items-center gap-5 text-sm font-medium">
            <div className="flex items-center gap-1.5 text-yellow-400">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-black">{shop.rating}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{shop.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-zinc-400">delivery_dining</span>
              <span className={shop.freeDelivery ? "text-yellow-400 font-bold" : "text-zinc-400"}>
                {shop.freeDelivery ? "Grátis" : shop.fee}
              </span>
            </div>
          </div>
        </section>

        {/* CATEGORY TABS */}
        <nav className="sticky top-0 z-40 mt-8 px-5 py-3 bg-black/90 backdrop-blur-xl border-b border-zinc-900">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {allCategoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${
                  activeCategory === cat
                    ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,9,0.3)]"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>

        {/* MENU */}
        <main className="px-5 pt-8 space-y-12">
          {displayCategories.map((category: any) => (
            <section key={category.name}>
              <h2 className="font-black text-lg uppercase tracking-widest text-zinc-500 mb-8 border-l-4 border-yellow-400 pl-4">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {(category.items || []).map((item: any, idx: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative flex flex-col gap-4 ${idx % 2 === 1 ? "md:mt-12" : ""}`}
                  >
                    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.02]">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="absolute bottom-5 right-5 w-14 h-14 rounded-2xl bg-yellow-400 text-black shadow-[0_0_20px_rgba(255,215,9,0.4)] flex items-center justify-center active:scale-90 transition-all"
                      >
                        <span className="material-symbols-outlined font-bold">add</span>
                      </button>
                    </div>
                    <div className="px-2">
                      <div className="flex justify-between items-start mb-1 gap-3">
                        <h3 className="font-black text-base uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors leading-tight flex-1">
                          {item.name}
                        </h3>
                        <span className="text-yellow-400 font-black text-sm whitespace-nowrap" style={{ textShadow: "0 0 10px rgba(255,215,9,0.5)" }}>
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm leading-relaxed max-w-[85%]">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* FLOATING CART BAR */}
        {cart.length > 0 && (
          <div className="fixed bottom-24 left-0 w-full px-5 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto bg-zinc-950/95 backdrop-blur-2xl border border-white/5 rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Sua Sacola</span>
                <span className="text-white font-black text-sm">{cart.length} {cart.length === 1 ? "item" : "itens"}</span>
              </div>
              <button
                onClick={() => navigateSubView("cart")}
                className="flex items-center gap-3 bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,9,0.2)] active:scale-95 transition-all"
              >
                <span>Ver Sacola</span>
                <span style={{ textShadow: "0 0 10px rgba(255,215,9,0.5)" }}>
                  R$ {cart.reduce((a: number, b: any) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}
                </span>
              </button>
            </motion.div>
          </div>
        )}

      </div>
    );
  };

  const renderStoreCatalog = () => {
    const shop = selectedShop || { name: "Loja", rating: "5.0", time: "30 min", freeDelivery: true, img: "", banner: "", categories: [] };
    const allCategoryNames = ["Destaques", ...(shop.categories || []).map((c: any) => c.name)];
    const displayCategories = activeCategory === "Destaques"
      ? shop.categories || []
      : (shop.categories || []).filter((c: any) => c.name === activeCategory);

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
        <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-4 pointer-events-none">
          <button onClick={() => setSubView("none")} className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="pointer-events-auto relative flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
          </button>
        </nav>

        <header className="relative w-full h-72 overflow-hidden shrink-0">
          <img src={shop.banner || shop.img || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800"} alt={shop.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
        </header>

        <section className="px-5 -mt-8 relative z-10 mb-2">
          <h1 className="font-extrabold text-2xl tracking-tighter text-white mb-2 uppercase leading-tight">{shop.name}</h1>
          <div className="flex items-center gap-5 text-sm font-medium">
            <div className="flex items-center gap-1.5 text-yellow-400">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-black">{shop.rating}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{shop.time}</span>
            </div>
            <span className={shop.freeDelivery ? "text-yellow-400 font-bold text-sm" : "text-zinc-400 text-sm"}>
              {shop.freeDelivery ? "Entrega Grátis" : shop.fee}
            </span>
          </div>
        </section>

        <nav className="sticky top-0 z-40 mt-6 px-5 py-3 bg-black/90 backdrop-blur-xl border-b border-zinc-900">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {allCategoryNames.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${activeCategory === cat ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,9,0.3)]" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"}`}>
                {cat}
              </button>
            ))}
          </div>
        </nav>

        <main className="px-5 pt-8 space-y-12">
          {displayCategories.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3">
              <span className="material-symbols-outlined text-5xl text-zinc-800">storefront</span>
              <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Cardápio em breve</p>
            </div>
          )}
          {displayCategories.map((category: any) => (
            <section key={category.name}>
              <h2 className="font-black text-base uppercase tracking-widest text-zinc-500 mb-6 border-l-4 border-yellow-400 pl-4">{category.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(category.items || []).map((item: any, idx: number) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className={`group relative flex flex-col gap-3 ${idx % 2 === 1 ? "md:mt-10" : ""}`}>
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.02]">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <button onClick={() => handleAddToCart(item)}
                        className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-yellow-400 text-black shadow-[0_0_20px_rgba(255,215,9,0.4)] flex items-center justify-center active:scale-90 transition-all">
                        <span className="material-symbols-outlined font-bold">add</span>
                      </button>
                    </div>
                    <div className="px-1">
                      <div className="flex justify-between items-start mb-1 gap-3">
                        <h3 className="font-black text-base uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors leading-tight flex-1">{item.name}</h3>
                        <span className="text-yellow-400 font-black text-sm whitespace-nowrap">R$ {Number(item.price).toFixed(2).replace(".", ",")}</span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </main>

        {cart.length > 0 && (
          <div className="fixed bottom-24 left-0 w-full px-5 z-50 pointer-events-none">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto bg-zinc-950/95 backdrop-blur-2xl border border-white/5 rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Sacola</span>
                <span className="text-white font-black text-sm">{cart.length} {cart.length === 1 ? "item" : "itens"}</span>
              </div>
              <button onClick={() => navigateSubView("cart")}
                className="flex items-center gap-3 bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,9,0.2)] active:scale-95 transition-all">
                <span>Ver Sacola</span>
                <span>R$ {cart.reduce((a: number, b: any) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}</span>
              </button>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const renderLightningPayment = () => {
    const invoice = selectedItem?.lightningInvoice || "";
    const satoshis = selectedItem?.satoshis || 0;
    const btcPrice = selectedItem?.btcPrice || 0;

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
               <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Falha na Conexão Lightning</h3>
               <p className="text-zinc-500 text-sm px-4">Não foi possível gerar sua fatura agora. O pedido foi registrado mas o pagamento via Bitcoin está indisponível.</p>
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

  const renderCart = () => {
    const subtotal: number = cart.reduce((a: number, b: any) => a + (Number(b.price) || 0), 0);
    const taxa: number = 0;
    const total: number = subtotal + taxa;

    if (cart.length === 0) {
      return (
        <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col items-center justify-center gap-6">
          <span className="material-symbols-outlined text-6xl text-zinc-800">shopping_bag</span>
          <div className="text-center">
            <h2 className="text-xl font-black text-white mb-2">Sua sacola está vazia</h2>
            <p className="text-zinc-500 text-sm">Adicione itens para continuar</p>
          </div>
          <button onClick={() => setSubView("none")} className="bg-yellow-400 text-black font-black px-8 py-3 rounded-2xl uppercase tracking-wider active:scale-95 transition-all">
            Explorar
          </button>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView("none")} className="active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <h1 className="font-extrabold text-base tracking-tight text-white uppercase">Sua Sacola</h1>
          </div>
          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full">
            {cart.length} {cart.length === 1 ? "item" : "itens"}
          </span>
        </header>

        <main className="px-5 pt-6 flex flex-col gap-4">

          {/* ITENS */}
          {cart.map((item: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-sm text-white truncate">{item.name}</h4>
                <p className="text-yellow-400 font-black text-sm mt-0.5">R$ {Number(item.price || 0).toFixed(2).replace(".", ",")}</p>
              </div>
              <button onClick={() => setCart((prev: any[]) => { const c = [...prev]; c.splice(i, 1); return c; })}
                className="size-8 rounded-full bg-zinc-800 flex items-center justify-center active:scale-90 transition-all hover:bg-red-500/20">
                <span className="material-symbols-outlined text-zinc-500 hover:text-red-400 text-sm transition-colors">close</span>
              </button>
            </motion.div>
          ))}

          {/* TOTAIS */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mt-2 space-y-3">
            {[
              { label: "Subtotal", value: `R$ ${subtotal.toFixed(2).replace(".", ",")}` },
              { label: "Taxa de entrega", value: taxa === 0 ? "Grátis" : `R$ ${taxa.toFixed(2)}`, green: taxa === 0 },
            ].map((row: any) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">{row.label}</span>
                <span className={`text-sm font-bold ${row.green ? "text-emerald-400" : "text-white"}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              <span className="text-white font-black uppercase tracking-wider">Total</span>
              <span className="text-yellow-400 font-black text-xl" style={{ textShadow: "0 0 15px rgba(255,215,9,0.4)" }}>
                R$ {total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          {/* LIMPAR */}
          <button onClick={() => setCart([])} className="flex items-center justify-center gap-2 py-3 text-zinc-600 hover:text-red-400 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-sm">delete_outline</span>
            <span className="text-[11px] font-black uppercase tracking-widest">Limpar sacola</span>
          </button>

        </main>

        {/* FOOTER FIXO */}
        <div className="fixed bottom-0 left-0 w-full px-5 pb-8 pt-4 bg-black/95 backdrop-blur-xl border-t border-zinc-900 z-50">
          <button
            onClick={() => navigateSubView("checkout")}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,9,0.2)]"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}
          >
            Ir para Checkout — R$ {total.toFixed(2).replace(".", ",")}
          </button>
        </div>

      </div>
    );
  };

  const renderCheckout = () => {
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const discount = appliedCoupon
      ? appliedCoupon.discount_type === "fixed"
        ? appliedCoupon.discount_value
        : (subtotal * appliedCoupon.discount_value) / 100
      : 0;
    const total = Math.max(0, subtotal + 0 - discount);
    const walletBal = walletTransactions.reduce((acc: number, t: any) =>
      ["deposito","reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 0);

    const paymentOptions = [
      { id: "cartao",           icon: "credit_card", label: "Cartão via App", sub: savedCards.length > 0 ? `${savedCards[0].brand} •••• ${savedCards[0].last4}` : "Pagar agora pelo app" },
      { id: "pix",              icon: "pix",         label: "PIX", sub: "Mercado Pago • Aprovação imediata" },
      { id: "saldo",            icon: "account_balance_wallet", label: "Saldo IZI", sub: `R$ ${walletBal.toFixed(2).replace(".",",")} disponível`, disabled: walletBal < total },
      { id: "dinheiro",         icon: "payments",    label: "Dinheiro na Entrega", sub: "Pague ao receber" },
      { id: "cartao_entrega",   icon: "contactless", label: "Cartão na Entrega", sub: "Maquininha com o entregador" },
      { id: "bitcoin_lightning",icon: "bolt",        label: "Bitcoin Lightning", sub: "Pagamento instantâneo em BTC" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView("cart")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Checkout</h1>
          </div>
          <div className="size-10 rounded-full overflow-hidden border border-zinc-800">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" className="size-full" />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-5 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 space-y-10">

            {/* ENDEREÇO */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base tracking-tight text-white uppercase">Entregar em</h2>
                <button onClick={() => setSubView("addresses")} className="text-yellow-400 text-[10px] font-black tracking-widest uppercase hover:opacity-80">Alterar</button>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-yellow-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{userLocation.address || "Endereço não definido"}</p>
                  <p className="text-zinc-500 text-xs mt-1">Estimativa: 25-40 min</p>
                </div>
              </div>
            </section>

            {/* PAGAMENTO */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base tracking-tight text-white uppercase">Pagamento</h2>
              </div>

              {paymentOptions.map((m) => (
                <div key={m.id} className="space-y-3">
                  <button onClick={() => !m.disabled && setPaymentMethod(m.id as any)}
                    disabled={m.disabled}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-[0.98] ${
                      paymentMethod === m.id
                        ? "bg-yellow-400/5 shadow-[inset_0_0_0_1.5px_rgba(255,215,9,0.4)]"
                        : m.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-zinc-900/50"
                    }`}>
                    <span className={`material-symbols-outlined text-xl ${paymentMethod === m.id ? "text-yellow-400" : "text-zinc-500"}`}
                      style={{ fontVariationSettings: paymentMethod === m.id ? "'FILL' 1" : "'FILL' 0" }}>
                      {m.icon}
                    </span>
                    <div className="flex-1 text-left">
                      <p className={`font-black text-sm ${paymentMethod === m.id ? "text-white" : "text-zinc-400"}`}>{m.label}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{m.sub}</p>
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${paymentMethod === m.id ? "border-yellow-400" : "border-zinc-700"}`}>
                      {paymentMethod === m.id && <div className="size-2.5 rounded-full bg-yellow-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {paymentMethod === "dinheiro" && m.id === "dinheiro" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pl-14 pr-5 pb-2">
                        <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 focus-within:border-yellow-400/30 transition-all flex items-center gap-3">
                          <span className="text-[10px] font-black text-zinc-500 uppercase shrink-0">Troco para:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={changeFor}
                            onChange={(e) => setChangeFor(e.target.value.replace(/\D/g,""))}
                            placeholder="Ex: 50,00"
                            className="bg-transparent border-none outline-none text-white text-sm font-black w-full"
                          />
                        </div>
                        <p className="text-[9px] text-zinc-600 mt-2 italic px-1">Deixe em branco se não precisar de troco.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {/* Cartões salvos expandidos quando cartao selecionado */}
              {paymentMethod === "cartao" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden space-y-2 pl-14">
                  {savedCards.map((card: any) => (
                    <button key={card.id} onClick={() => setSelectedCard(card)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedCard?.id === card.id ? "bg-yellow-400/10 shadow-[inset_0_0_0_1px_rgba(255,215,9,0.3)]" : "bg-zinc-900/50"}`}>
                      <span className="material-symbols-outlined text-base text-zinc-400" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                      <span className="text-zinc-300 text-sm font-bold flex-1 text-left">{card.brand} •••• {card.last4}</span>
                      {selectedCard?.id === card.id && <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </section>

            {/* RESUMO DOS ITENS */}
            <section className="space-y-4">
              <h2 className="font-extrabold text-base tracking-tight text-white uppercase">Resumo do Pedido</h2>
              <div className="space-y-3">
                {cart.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-zinc-900">
                      {item.img
                        ? <img src={item.img} alt={item.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                        : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-zinc-700">fastfood</span></div>
                      }
                      <div className="absolute top-1 left-1 size-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-black text-black">1x</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-sm truncate">{item.name}</p>
                      {item.desc && <p className="text-zinc-600 text-[10px] mt-0.5 truncate">{item.desc}</p>}
                      {item.options && <p className="text-zinc-500 text-[10px] mt-0.5">{item.options}</p>}
                    </div>
                    <p className="text-yellow-400 font-black text-sm shrink-0">R$ {Number(item.price || 0).toFixed(2).replace(".",",")}</p>
                  </div>
                ))}
              </div>

              {/* Cupom */}
              <div className="pt-2">
                <div className="flex items-center gap-2 bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-yellow-400/30 transition-all">
                  <span className="material-symbols-outlined text-zinc-500 text-lg pl-4">confirmation_number</span>
                  <input
                    className="flex-1 bg-transparent py-3.5 px-2 text-white placeholder:text-zinc-600 focus:outline-none text-sm font-medium"
                    placeholder="Código de cupom"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button onClick={() => handleApplyCoupon(couponInput)}
                    className="bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider px-4 py-3.5 shrink-0 hover:bg-yellow-300 transition-colors">
                    Aplicar
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="material-symbols-outlined text-emerald-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <p className="text-emerald-400 text-xs font-black">
                      {appliedCoupon.coupon_code} — {appliedCoupon.discount_type === "fixed" ? `R$ ${appliedCoupon.discount_value.toFixed(2)} OFF` : `${appliedCoupon.discount_value}% OFF`}
                    </p>
                    <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-zinc-600 hover:text-red-400 transition-colors ml-auto">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — Resumo financeiro + botão */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-4">

              {/* Totais */}
              <div className="space-y-3">
                <div className="h-px bg-zinc-900" />
                {[
                  { label: "Subtotal", value: `R$ ${subtotal.toFixed(2).replace(".",",")}`, muted: true },
                  { label: "Entrega", value: "Grátis", green: true },
                  ...(discount > 0 ? [{ label: `Desconto (${appliedCoupon?.coupon_code})`, value: `-R$ ${discount.toFixed(2).replace(".",",")}`, green: true }] : []),
                ].map((row: any) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">{row.label}</span>
                    <span className={`text-sm font-bold ${row.green ? "text-emerald-400" : "text-zinc-300"}`}>{row.value}</span>
                  </div>
                ))}
                <div className="h-px bg-zinc-900" />
                <div className="flex justify-between items-center">
                  <span className="text-white font-black text-base uppercase tracking-wider">Total</span>
                  <span className="text-yellow-400 font-black text-2xl" style={{ textShadow: "0 0 20px rgba(255,215,9,0.4)" }}>
                    R$ {total.toFixed(2).replace(".",",")}
                  </span>
                </div>
              </div>

              {/* Botão confirmar */}
              <button onClick={() => handlePlaceOrder()} disabled={!paymentMethod}
                className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.2)" }}>
                {paymentMethod === "pix" ? "Gerar QR PIX" :
                 paymentMethod === "bitcoin_lightning" ? "Gerar Invoice Lightning" :
                 (paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega") ? "Confirmar — Pagar na Entrega" :
                 `Confirmar Pedido — R$ ${total.toFixed(2).replace(".",",")}`}
              </button>

              {/* Adicionar cartão — só aparece aqui quando cartao selecionado */}
              {paymentMethod === "cartao" && (
                <button onClick={() => { setPaymentsOrigin("checkout"); setSubView("payments"); }}
                  className="w-full py-3 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 hover:border-yellow-400/30 hover:text-yellow-400 transition-all text-xs font-black uppercase tracking-wider active:scale-95 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar novo cartão
                </button>
              )}

              <p className="text-zinc-700 text-[10px] text-center leading-relaxed">
                Ao confirmar você concorda com os <span className="text-yellow-400/40">Termos de Uso</span> e <span className="text-yellow-400/40">Política de Privacidade</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPixPayment = () => {
    const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
    const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
    const total = Math.max(0, subtotal - discount);

    const formatCpf = (v: string) => v.replace(/\D/g,"").slice(0,11)
      .replace(/(\d{3})(\d)/,"$1.$2")
      .replace(/(\d{3})(\d)/,"$1.$2")
      .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

    const handlePixConfirm = async () => {
      if (pixCpf.replace(/\D/g,"").length < 11) { alert("CPF inválido."); return; }
      setPixConfirmed(true);
      try {
        // 1. Criar pedido no Supabase
        if (!selectedShop?.id) { alert("Erro: Estabelecimento não selecionado."); setPixConfirmed(false); return; }

        const { data: order, error: orderErr } = await supabase
          .from("orders_delivery")
          .insert({
            user_id: userId,
            merchant_id: selectedShop.id,
            status: "pendente_pagamento",
            total_price: Number(total.toFixed(2)),
            pickup_address: selectedShop.name || "Endereço do Estabelecimento",
            delivery_address: `${userLocation.address || "Endereço não informado"} | ITENS: ${cart.map(i => `${i.name}`).join(', ')}`,
            payment_method: "pix",
            service_type: selectedShop.type || "restaurant",
          })
          .select()
          .single();

        if (orderErr || !order) {
          console.error("Erro ao criar pedido:", orderErr);
          alert("Não foi possível registrar o pedido no banco de dados. Verifique sua conexão. Detalhe: " + (orderErr?.message || "Erro desconhecido"));
          navigateSubView("payment_error");
          return;
        }

        // 2. Chamar Edge Function do Mercado Pago (Unificada)
        const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
          body: {
            amount: Number(total.toFixed(2)),
            orderId: order.id,
            payment_method_id: 'pix',
            email: userEmail || auth.currentUser?.email || email || "cliente@izidelivery.com",
            customer: {
              cpf: pixCpf.replace(/\D/g,""),
              name: userName || "Cliente IziDelivery",
            },
          },
        });

        if (fnErr || !(fnData?.qrCode || fnData?.qr_code)) {
          console.error("Erro MP PIX:", fnErr, fnData);
          const detail = fnData?.details || fnData?.error || fnErr?.message || "Erro desconhecido na API do Mercado Pago.";
          alert("Erro ao gerar PIX: " + detail + "\n\nVerifique as chaves MP_ACCESS_TOKEN no Supabase.");
          
          setSelectedItem({ ...order, pixError: true, pixErrorMessage: detail });
          setPixConfirmed(true);
          return;
        }

        // 3. Atualizar UI com QR real
        const qr = fnData.qrCode || fnData.qr_code;
        const qrBase64 = fnData.qrCodeBase64 || fnData.qr_code_base64;
        const copyPaste = fnData.copyPaste || fnData.copy_paste;

        setSelectedItem({ ...order, pixQrCode: qr, pixQrBase64: qrBase64, pixCopyPaste: copyPaste });
        setCart([]);
        setAppliedCoupon(null);
        setCouponInput("");
        setUserXP((prev: number) => prev + 50);

      } catch (e) {
        console.error("Erro PIX:", e);
        navigateSubView("payment_error");
      }
    };

    const pixReady = selectedItem?.pixQrCode && pixConfirmed;

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
                delivery_address: isSubscription ? "Serviço Digital" : (userLocation.address || "Endereço não informado"),
                payment_method: "cartao",
                service_type: isSubscription ? "subscription" : "restaurant",
            };

            const { data: order } = await supabase.from("orders_delivery").insert(orderBase).select().single();
            if (!order) { toastError("Erro ao criar pedido."); return; }

            const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
                body: {
                    amount: total,
                    orderId: order.id,
                    payment_method_id: brand.toLowerCase().includes('visa') ? 'visa' : 'master',
                    token: token,
                    email: auth.currentUser?.email || email || "cliente@izidelivery.com",
                    installments: 1
                },
            });

            if (fnErr || (fnData && fnData.status !== 'approved')) {
                const msg = fnData?.details || fnErr?.message || "O cartão foi recusado pela operadora.";
                toastError(`Pagamento não aprovado: ${msg}`);
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
                setCart([]);
                setAppliedCoupon(null);
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
              <MercadoPagoCardForm onConfirm={handleConfirmCard} />
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
    const activeOrders    = myOrders.filter(o => o && !["concluido", "cancelado"].includes(o.status));
    const scheduledOrders = myOrders.filter(o => o && o.scheduled_at && !["concluido", "cancelado"].includes(o.status));
    const pastOrders      = myOrders.filter(o => o && ["concluido", "cancelado"].includes(o.status));

    const statusLabel: Record<string, string> = {
      pending: "Aguardando", pendente: "Aguardando", novo: "Processando",
      waiting_driver: "Buscando Condutor",
      aceito: "Confirmado", confirmado: "Confirmado", preparando: "Em Preparação", pronto: "Pronto para Coleta",
      a_caminho: "Em Rota de Coleta", at_pickup: "No Local",
      picked_up: "Coletado / Em Viagem", 
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

            {/* HISTÓRICO */}
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
                      <p className="text-zinc-500 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString("pt-BR")} • R$ {Number(order.total_price || 0).toFixed(2).replace(".", ",")}</p>
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

  const renderProfile = () => {
    const menuItems = [
      { icon: "location_on",            label: "Endereços",        desc: "Seus endereços salvos",          action: () => setSubView("addresses") },
      { icon: "account_balance_wallet", label: "Carteira",         desc: "Saldo e extrato",                action: () => setTab("wallet") },
      { icon: "workspace_premium",      label: "IZI Black",        desc: "Benefícios do plano premium",    action: () => { setIziBlackStep("info"); setSubView("izi_black_purchase"); } },
      { icon: "military_tech",          label: "Quests & Ranking", desc: "Missões e conquistas",           action: () => setSubView("quest_center") },
      { icon: "support_agent",          label: "Suporte",          desc: "Central de ajuda",               action: () => setSubView("order_support") },
      { icon: "settings",               label: "Configurações",    desc: "Preferências da conta",          action: () => {} },
    ];

    return (
      <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">

        {/* HERO DO PERFIL */}
        <div className="px-5 pt-14 pb-8 border-b border-zinc-900">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="size-20 rounded-3xl overflow-hidden border border-zinc-800">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" className="size-full bg-zinc-900" />
              </div>
              {userLevel >= 10 && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  VIP
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white tracking-tight truncate">{userName || "Usuário"}</h1>
              <p className="text-zinc-600 text-xs mt-0.5">{userId ? `ID: ${userId.slice(0,8)}...` : "Visitante"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Nível {userLevel}</span>
                <span className="text-[10px] font-black text-zinc-600 uppercase">{userXP} XP</span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-6 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Progresso</span>
              <span className="text-[9px] font-black text-yellow-400">{userXP} / {nextLevelXP} XP</span>
            </div>
            <div className="h-px w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((userXP/nextLevelXP)*100,100)}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400" />
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="px-5 py-4 flex flex-col">
          {menuItems.map((item, i) => (
            <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              onClick={item.action}
              className="flex items-center gap-4 px-0 py-4 border-b border-zinc-900/60 active:opacity-60 transition-all text-left group last:border-0">
              <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400 transition-colors text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-white">{item.label}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{item.desc}</p>
              </div>
              <span className="material-symbols-outlined text-zinc-800 group-hover:text-yellow-400/50 transition-colors text-lg">chevron_right</span>
            </motion.button>
          ))}
        </div>

        {/* LOGOUT */}
        <div className="px-5 mt-2 pb-4">
          <button onClick={async () => { await signOut(auth); setView("login"); setTab("home"); setSubView("none"); }}
            className="w-full flex items-center justify-center gap-3 py-4 text-red-400/60 hover:text-red-400 transition-all active:scale-[0.98] group">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="font-black text-sm uppercase tracking-wider">Sair da Conta</span>
          </button>
        </div>

        <p className="text-center text-zinc-900 text-[10px] font-bold uppercase tracking-widest pb-6">IZI Delivery • Stealth Luxury</p>
      </div>
    );
  };

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
                    placeholder="Busque rua, número, bairro..."
                    initialValue={newAddrStreet}
                    onSelect={(place: any) => {
                      setNewAddrStreet(place.formatted_address || "");
                      // Tenta extrair cidade se disponível
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
                    {/* Ícone + Info */}
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
                    {/* Ações */}
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
    return (
      <div className="absolute inset-0 z-40 bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-32">
        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-6 border-b border-zinc-900">
          <button onClick={() => {
              if (paymentsOrigin === "checkout") setSubView("checkout");
              else if (paymentsOrigin === "izi_black") setSubView("izi_black_purchase");
              else setSubView("none");
            }} 
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Pagamentos</h1>
        </header>

        <main className="px-5 py-8 space-y-10">
          {/* MÉTODOS SMART */}
          <div className="grid grid-cols-2 gap-4">
             <button className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex flex-col items-center gap-2 opacity-50">
               <span className="material-symbols-outlined text-3xl">apple</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Apple Pay</span>
             </button>
             <button className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex flex-col items-center gap-2 opacity-50">
               <span className="material-symbols-outlined text-3xl">google</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Google Pay</span>
             </button>
          </div>

          {/* LISTA DE CARTÕES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Cartões Salvos</h3>
              <button 
                onClick={() => setIsAddingCard(true)}
                className="text-[10px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-4 py-2 rounded-full">
                + Adicionar
              </button>
            </div>

            {isLoadingCards ? (
              <div className="py-10 flex justify-center"><div className="size-6 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" /></div>
            ) : savedCards.length === 0 ? (
               <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-10 text-center">
                 <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Nenhum cartão salvo</p>
               </div>
            ) : (
              <div className="space-y-4">
                {savedCards.map((card: any) => (
                  <div 
                    key={card.id} 
                    onClick={() => handleSetPrimaryCard(card.id)}
                    className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer ${card.active ? "border-yellow-400 bg-zinc-900/80" : "border-zinc-900 bg-zinc-900/30"}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`size-12 rounded-2xl flex items-center justify-center ${card.active ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} className="size-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">{card.brand}</p>
                      <p className="font-extrabold text-lg tracking-[0.2em] text-white">•••• •••• •••• {card.last4}</p>
                    </div>
                    {card.active && (
                       <div className="absolute top-6 right-12 bg-yellow-400 text-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Padrão</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* OUTRAS OPÇÕES */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Outros Métodos</h3>
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-[32px] overflow-hidden">
               {[
                 { id: "pix", icon: "pix", label: "PIX Instantâneo", color: "text-emerald-400" },
                 { id: "bitcoin_lightning", icon: "bolt", label: "Bitcoin Lightning", color: "text-orange-400" },
                 { id: "dinheiro", icon: "payments", label: "Dinheiro na Entrega", color: "text-zinc-500" }
               ].map((m, i) => (
                 <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                   className={`w-full flex items-center gap-4 p-5 hover:bg-zinc-900/50 transition-all ${i > 0 ? "border-t border-zinc-900" : ""}`}>
                   <span className={`material-symbols-outlined text-xl ${m.color}`} style={{ fontVariationSettings: paymentMethod === m.id ? "'FILL' 1" : "'FILL' 0" }}>{m.icon}</span>
                   <p className="flex-1 text-left font-black text-sm text-zinc-100">{m.label}</p>
                   {paymentMethod === m.id && <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                 </button>
               ))}
            </div>
          </section>

          {/* BOTÃO CONFIRMAR (Se vier do checkout) */}
          {paymentsOrigin === "checkout" && (
            <button 
              onClick={() => setSubView("checkout")}
              className="w-full py-5 rounded-3xl bg-yellow-400 text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-yellow-400/20 active:scale-95 transition-all"
            >
              Confirmar Escolha
            </button>
          )}
        </main>

        {/* MODAL: ADD CARD */}
        <AnimatePresence>
          {isAddingCard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-white tracking-tight">Novo Cartão</h3>
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
                       last4: last4,
                       expiry: "12/29",
                       is_default: savedCards.length === 0,
                       stripe_payment_method_id: token
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
                          last4: inserted.last4,
                          stripe_payment_method_id: inserted.stripe_payment_method_id
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
      </div>
    );
  };


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
            <span className="text-yellow-400 font-extrabold italic tracking-widest text-xs">IZI BLACK VIP</span>
            <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
          </div>
          <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase mb-1">Saldo Disponível</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-extrabold text-2xl text-yellow-400 opacity-60">R$</span>
            <span className="font-extrabold text-5xl tracking-tighter text-white"
              style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}>
              {Math.abs(walletBalance).toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: "add",           label: "Adicionar" },
              { icon: "arrow_outward", label: "Transferir" },
              { icon: "history",       label: "Extrato" },
              { icon: "qr_code_2",     label: "Meu QR" },
            ].map((a) => (
              <button key={a.icon} className="flex flex-col items-center gap-2 py-4 active:scale-95 transition-all group">
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
              { label: "Pedidos/mês",  value: `${pedidosMes}`,                  icon: "receipt_long" },
            ].map((s, i) => (
              <div key={i} className={`flex flex-col items-center py-5 gap-1 ${i < 2 ? "border-r border-zinc-900" : ""}`}>
                <span className="material-symbols-outlined text-zinc-700 text-lg">{s.icon}</span>
                <p className="font-extrabold text-sm text-white">{s.value}</p>
                <p className="text-[9px] text-zinc-700 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>

          {/* CARTÕES */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Meus Cartões</h2>
              <button onClick={() => { setPaymentsOrigin("profile"); setSubView("payments"); }}
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
                  <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 mb-1">Cartão Digital</p>
                  <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">•••• •••• •••• 8820</p>
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
                    <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 mb-1">Cartão Físico</p>
                    <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">•••• •••• •••• {card.last4}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] text-zinc-700 uppercase">{card.brand}</p>
                      <p className="text-[9px] text-zinc-600">Val. {card.expiry}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setPaymentsOrigin("profile"); setSubView("payments"); }}
                className="min-w-[120px] h-40 border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-2 shrink-0 active:scale-95 transition-all hover:border-yellow-400/20 group">
                <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-colors text-2xl">add</span>
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wider group-hover:text-zinc-500 transition-colors">Novo Cartão</span>
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
              <p className="text-[9px] text-yellow-400/50">≈ R$ {(userXP * 0.1).toFixed(2).replace(".",",")} em descontos</p>
            </div>
            <div className="flex flex-col gap-1 p-5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Cashback</span>
              </div>
              <p className="text-2xl font-extrabold text-white">R$ 42,10</p>
              <p className="text-[9px] text-zinc-700">Disponível para usar</p>
            </div>
          </div>

          {/* MÉTODOS DE PAGAMENTO */}
          <section>
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight mb-2">Formas de Pagamento</h2>
            <div className="flex flex-col">
              {[
                { icon: "pix",                    label: "PIX",             desc: "Mercado Pago • Instantâneo",    id: "pix" },
                { icon: "bolt",                   label: "Bitcoin Lightning", desc: "LNbits • Satoshis",           id: "bitcoin_lightning" },
                { icon: "payments",               label: "Dinheiro",        desc: "Pague na entrega",              id: "dinheiro" },
                { icon: "account_balance_wallet", label: "Saldo IZI",       desc: `R$ ${Math.abs(walletBalance).toFixed(2).replace(".",",")} disponível`, id: "saldo" },
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

          {/* HISTÓRICO */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Histórico</h2>
              <button className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Ver Tudo</button>
            </div>
            <div className="flex flex-col">
              {walletTransactions.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-zinc-900">receipt_long</span>
                  <p className="text-zinc-700 text-sm">Nenhuma transação ainda</p>
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
                        {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} • {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
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
        showToast("Erro ao enviar avaliação.", "error");
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
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações adicionais</label>
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

  const renderOrderChat = () => {
    const [msg, setMsg] = (useState as any)<string>("");
    const [messages, setMessages] = (useState as any)<any[]>([
      { from: "driver", text: "Olá! Estou a caminho do seu endereço.", time: "agora" },
    ]);

    const sendMsg = () => {
      if (!msg.trim()) return;
      setMessages((prev: any[]) => [...prev, { from: "user", text: msg, time: "agora" }]);
      setMsg("");
    };

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col">
        <header className="bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <div>
            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Chat</h1>
            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest">Entregador Online</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 space-y-4">
          {messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium ${m.from === "user" ? "bg-yellow-400 text-black" : "bg-zinc-900 text-zinc-300"}`}>
                <p>{m.text}</p>
                <p className={`text-[9px] mt-1 ${m.from === "user" ? "text-black/50" : "text-zinc-600"} text-right`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-zinc-900 flex items-center gap-3">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
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

  const renderOrderSupport = () => {
    const topics = [
      { icon: "local_shipping", label: "Meu pedido está atrasado" },
      { icon: "cancel",         label: "Quero cancelar meu pedido" },
      { icon: "swap_horiz",     label: "Item errado ou faltando" },
      { icon: "payments",       label: "Problema com pagamento" },
      { icon: "help",           label: "Outro problema" },
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
            {topics.map((t, i) => (
              <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0 active:opacity-60 transition-all text-left group w-full">
                <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400 transition-colors text-xl">{t.icon}</span>
                <p className="font-black text-sm text-white flex-1">{t.label}</p>
                <span className="material-symbols-outlined text-zinc-800 group-hover:text-yellow-400/50 transition-colors text-lg">chevron_right</span>
              </motion.button>
            ))}
          </div>

          <div className="pt-4">
            <p className="text-zinc-700 text-xs text-center mb-4">Ou fale diretamente com nosso time</p>
            <button className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 border border-zinc-900 text-zinc-400 hover:border-yellow-400/20 hover:text-yellow-400 transition-all">
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
      { id: 1, title: "Explorador Urbano", desc: "Faça 3 pedidos em categorias diferentes", xp: 150, progress: 33, icon: "explore" },
      { id: 2, title: "Cliente Fiel",      desc: "Peça do mesmo restaurante 3 vezes",        xp: 100, progress: 66, icon: "favorite" },
      { id: 3, title: "Madrugador",        desc: "Faça um pedido antes das 9h",              xp: 80,  progress: 0,  icon: "wb_sunny" },
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
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">Nível {userLevel} • {userXP} XP</p>
            </div>
          </div>
        </header>

        <main className="px-5 py-8 space-y-10">

          {/* XP PROGRESS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Infinity Tier</p>
                <p className="font-black text-white text-lg">Nível {userLevel}</p>
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
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight mb-4">Missões Ativas</h2>
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
    const handleClose = () => {
      setSubView(iziBlackOrigin === 'checkout' ? 'checkout' : 'none');
    };

    const handleSubscribeReal = async () => {
      if (!userId) return;
      setIsLoading(true);
      
      const total = 29.90;
      
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
          setIsLoading(false);
          setPaymentsOrigin("izi_black");
          setSubView("card_payment");
          return;
        } else if (paymentMethod === "pix") {
          setSubView("payment_processing");
          const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
            body: {
              amount: total,
              orderId: orderData.id,
              payment_method_id: 'pix',
              email: auth.currentUser?.email || email || "cliente@izidelivery.com",
              customer: { name: userName, cpf: cpf }
            },
          });

          if (fnErr || !fnData?.qrCode) throw new Error("Erro ao gerar PIX Mercado Pago.");

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
        }
      } catch (err: any) {
        toastError(err.message || "Erro ao processar assinatura.");
      } finally {
        setIsLoading(false);
      }
    };

    // ── SUCESSO ────────────────────────────────────────────────────────────────
    if (iziBlackStep === 'success') {
      return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 gap-10">
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}>
            <div className="size-28 rounded-full flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(255,215,9,0.15) 0%, rgba(255,215,9,0.03) 100%)", boxShadow: "0 0 60px rgba(255,215,9,0.2), inset 0 0 40px rgba(255,215,9,0.05)" }}>
              <span className="material-symbols-outlined text-6xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
          </motion.div>
          <div className="text-center space-y-3">
            <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.5em]">Protocolo Ativado</p>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">IZI Black</h2>
            <p className="text-zinc-600 text-sm max-w-xs mx-auto">Bem-vindo ao clube de privilégios. Seus benefícios já estão ativos.</p>
          </div>
          <button onClick={() => { setSubView("none"); setIziBlackStep("info"); }}
            className="w-full max-w-xs py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 40px rgba(255,215,9,0.2)" }}>
            Começar a Usar
          </button>
        </div>
      );
    }

    // ── PAGAMENTO ───────────────────────────────────────────────────────────────
    if (iziBlackStep === 'payment') {
      return (
        <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
          <header className="bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
            <button onClick={() => setIziBlackStep("info")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Assinatura IZI Black</h1>
          </header>
          <main className="px-5 py-10 max-w-sm mx-auto w-full space-y-8">
            <div className="text-center space-y-1">
              <p className="text-zinc-600 text-xs uppercase tracking-widest">Investimento mensal</p>
              <p className="font-black text-white leading-none" style={{ fontSize: "64px", textShadow: "0 0 30px rgba(255,215,9,0.2)" }}>
                29<span className="text-3xl text-yellow-400/60">,90</span>
              </p>
              <p className="text-zinc-700 text-xs">Cancele quando quiser • Renovação automática</p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-3">Forma de pagamento</p>
              {[
                { id: "cartao", icon: "credit_card", label: "Cartão de Crédito" },
                { id: "pix",    icon: "pix",         label: "PIX" },
              ].map((m) => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}
                  className={`w-full flex items-center gap-4 px-0 py-4 border-b transition-all active:opacity-60 text-left ${paymentMethod === m.id ? "border-yellow-400/30" : "border-zinc-900"}`}>
                  <span className={`material-symbols-outlined text-xl ${paymentMethod === m.id ? "text-yellow-400" : "text-zinc-700"}`}>{m.icon}</span>
                  <span className={`font-black text-sm flex-1 ${paymentMethod === m.id ? "text-white" : "text-zinc-600"}`}>{m.label}</span>
                  <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === m.id ? "border-yellow-400" : "border-zinc-800"}`}>
                    {paymentMethod === m.id && <div className="size-2.5 rounded-full bg-yellow-400" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">CPF</p>
              <input type="text" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-transparent border-b border-zinc-900 py-3 text-white placeholder:text-zinc-800 focus:outline-none focus:border-yellow-400/30 text-sm font-medium tracking-widest transition-all" />
            </div>

            <button onClick={handleSubscribeReal} disabled={isLoading}
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
              {isLoading ? "Processando..." : "Confirmar — R$ 29,90/mês"}
            </button>
          </main>
        </div>
      );
    }

    // ── TELA PRINCIPAL ──────────────────────────────────────────────────────────
    const perks = [
      { icon: "delivery_dining",    title: "Taxa Zero",        desc: "Entrega grátis em toda a cidade, sem limite",    highlight: true },
      { icon: "bolt",               title: "Prioridade",       desc: "Seus pedidos sempre primeiro na fila",           highlight: false },
      { icon: "stars",              title: "Cashback 5%",      desc: "Pontos dobrados em todos os pedidos",            highlight: false },
      { icon: "support_agent",      title: "Suporte VIP",      desc: "Canal exclusivo 24 horas por dia",               highlight: false },
      { icon: "confirmation_number",title: "Cupons Black",     desc: "Ofertas exclusivas só para membros",             highlight: false },
      { icon: "qr_code_scanner",    title: "Early Access",     desc: "Novidades e lançamentos antes de todos",         highlight: false },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setSubView(iziBlackOrigin === "checkout" ? "checkout" : "none")}
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">close</span>
          </button>
          <h1 className="font-extrabold text-base text-white uppercase tracking-tight">IZI Black</h1>
          <div className="size-10" />
        </header>

        <main className="px-5 flex flex-col gap-10 pb-8">

          {/* BANNER VIP — para membros */}
          {isIziBlackMembership ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden mt-4 px-0 py-8 border-b border-zinc-900">

              <div className="relative z-10 flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-yellow-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    <span className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.4em]">Membro Ativo</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">IZI Black</h2>
                  <p className="text-zinc-600 text-xs mt-1">Protocolo de Privilégio Elite</p>
                </div>
                <div className="size-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,215,9,0.06)", border: "1px solid rgba(255,215,9,0.12)" }}>
                  <span className="material-symbols-outlined text-xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                </div>
              </div>
              <div className="relative z-10 grid grid-cols-3 border-t border-zinc-800/40 pt-4 gap-0">
                {[
                  { label: "Nível",    value: String(userLevel) },
                  { label: "XP",       value: String(userXP) },
                  { label: "Cashback", value: "5%" },
                ].map((s, i) => (
                  <div key={i} className={`flex flex-col items-center gap-0.5 ${i < 2 ? "border-r border-zinc-800/40" : ""}`}>
                    <p className="font-black text-base text-white">{s.value}</p>
                    <p className="text-[9px] text-zinc-700 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* HERO para não-membros */
            <div className="text-center pt-8 space-y-5">
              <div className="size-20 rounded-3xl flex items-center justify-center mx-auto"
                style={{ background: "rgba(255,215,9,0.06)", border: "1px solid rgba(255,215,9,0.1)" }}>
                <span className="material-symbols-outlined text-4xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <div>
                <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Privilégio Elite</p>
                <h2 className="text-4xl font-extrabold text-white leading-none tracking-tighter">O melhor do<br/>ecossistema IZI.</h2>
              </div>
              <div className="inline-flex items-baseline gap-1 px-6 py-3 rounded-2xl"
                style={{ background: "rgba(255,215,9,0.04)", border: "1px solid rgba(255,215,9,0.08)" }}>
                <span className="font-black text-4xl text-white">29</span>
                <span className="font-black text-xl text-yellow-400/40">,90</span>
                <span className="text-zinc-600 text-sm font-bold">/mês</span>
              </div>
            </div>
          )}

          {/* BENEFÍCIOS — sem cards, estilo lista premium */}
          <div>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-2">
              {isIziBlackMembership ? "Benefícios Ativos" : "Incluso no plano"}
            </p>
            <div className="flex flex-col">
              {perks.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-5 py-6 ${i < perks.length - 1 ? "border-b border-zinc-900" : ""} ${p.highlight ? "relative" : ""}`}>
                  {p.highlight && (
                    <div className="absolute inset-0 -mx-5 pointer-events-none"
                      style={{ background: "rgba(255,215,9,0.02)" }} />
                  )}
                  <div className="size-12 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
                    style={{ background: "rgba(255,215,9,0.06)", border: "1px solid rgba(255,215,9,0.08)" }}>
                    <span className="material-symbols-outlined text-2xl text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-base text-white tracking-tight">{p.title}</p>
                      {p.highlight && <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Top</span>}
                    </div>
                    <p className="text-zinc-500 text-sm mt-0.5">{p.desc}</p>
                  </div>
                  {isIziBlackMembership && (
                    <div className="size-1.5 rounded-full bg-emerald-400 shrink-0 relative z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!isIziBlackMembership ? (
            <button onClick={() => setIziBlackStep("payment")}
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
              Assinar por R$ 29,90/mês
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-emerald-400 font-black text-sm uppercase tracking-wider">Membro Ativo</span>
              </div>
              <button className="text-zinc-700 text-[10px] font-black uppercase tracking-widest hover:text-zinc-500 transition-colors">
                Gerenciar Assinatura
              </button>
            </div>
          )}

          <p className="text-zinc-900 text-[10px] text-center">Cancele quando quiser • Sem fidelidade</p>

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
                VOCÊ ESTÃ <span className="text-yellow-500">DENTRO</span>.
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
              <h2 className="text-7xl font-black text-white tabular-nums tracking-tighter leading-none mb-4 italic">{iziCoins.toLocaleString('pt-BR')}</h2>
              <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                Acumule +5 coins a cada R$ 1,00 gasto
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
                        <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">Como membro nível 3, você recebe mimos exclusivos todos os meses. Fique atento às suas notificações!</p>
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
            <p className="text-[8px] font-black text-white/[0.06] uppercase tracking-[0.5em] italic">Izi Black · Membro Fundador desde 2024</p>
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

          {/* BENEFÍCIOS */}
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

  const renderProductDetail = () => {
    if (!selectedItem) return null;

    // Determine where to go back
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

    const itemImage =
      selectedItem.img ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";

    return (
      <div className="absolute inset-0 z-[70] bg-[#f8f9fc] bg-zinc-900 flex flex-col hide-scrollbar overflow-y-auto">
        <div
          className="relative w-full h-[40vh] bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url('${itemImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fc] dark:from-slate-900 via-transparent to-black/20"></div>

          <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-12 h-12 bg-white/90 bg-zinc-900/90 backdrop-blur-md rounded-full shadow-lg active:scale-95 transition-transform text-white border border-white/20"
            >
              <span className="material-symbols-rounded text-xl">
                arrow_back
              </span>
            </button>
            <button className="w-12 h-12 bg-white/90 bg-zinc-900/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-white border border-white/20">
              <Icon name="favorite" />
            </button>
          </header>
        </div>

        <div className="flex-1 bg-[#f8f9fc] bg-zinc-900 -mt-10 rounded-t-[40px] px-8 pt-10 pb-40 relative z-20">
          <div className="w-12 h-1.5 bg-slate-200  rounded-full mx-auto mb-8 opacity-50"></div>

          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">
                {selectedItem.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-400 font-black text-2xl tracking-tighter">
                  R$ {selectedItem.price.toFixed(2).replace(".", ",")}
                </span>
                {selectedItem.oldPrice && (
                  <span className="text-zinc-500 text-sm line-through font-bold">
                    R$ {selectedItem.oldPrice.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
            </div>
            {selectedShop && (
              <div className="bg-white bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-800 border-zinc-700 flex flex-col items-center min-w-[64px]">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                  Loja
                </span>
                <div
                  className="size-8 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url('${selectedShop.img}')` }}
                ></div>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">
                Descrição
              </h3>
              <p className="text-zinc-500 text-zinc-400 font-medium text-base leading-relaxed">
                {selectedItem.desc ||
                  "Um produto premium selecionado especialmente para você. Qualidade garantida e entrega rápida diretamente na sua porta."}
              </p>
            </section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                Quantidade
              </h3>
              <div className="flex items-center gap-6 bg-slate-50 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                <button
                  onClick={() => setTempQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-white bg-zinc-900 text-zinc-500 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                >
                  <span className="material-symbols-rounded text-2xl">
                    remove
                  </span>
                </button>
                <span className="text-xl font-black text-white min-w-4 text-center">
                  {tempQuantity}
                </span>
                <button
                  onClick={() => setTempQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl bg-yellow-400 text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-rounded text-2xl font-black">
                    add
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-10 left-8 right-8 z-[80]">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              const itemsToAdd = Array(tempQuantity).fill(selectedItem);
              setCart([...cart, ...itemsToAdd]);
              handleBack();
            }}
            className="w-full bg-slate-900  text-white  p-5 rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/20 bg-black/10 flex items-center justify-center">
                <span className="material-symbols-rounded font-black text-xl">
                  shopping_bag
                </span>
              </div>
              <span className="font-bold text-lg">Adicionar</span>
            </div>
            <span className="font-black text-xl bg-white/20 bg-black/10 px-4 py-1.5 rounded-2xl tracking-tighter">
              R${" "}
              {(selectedItem.price * tempQuantity).toFixed(2).replace(".", ",")}
            </span>
          </motion.button>
        </div>
      </div>
    );
  };

  const renderExploreMobility = () => {
    const services = [
      { id: "mototaxi", name: "Mototáxi",  desc: "Rapidez para driblar o trânsito.", icon: "two_wheeler",    type: "mototaxi"  },
      { id: "carro",    name: "Motorista Particular", desc: "Viagens executivas exclusivas.", icon: "directions_car", type: "carro"     },
      { id: "frete",    name: "Fretes & Mudanças", desc: "Força e espaço para volumes.", icon: "local_shipping", type: "utilitario"  },
      { id: "van",      name: "Van / Grupos", desc: "Capacidade para até 20 pessoas.", icon: "airport_shuttle", type: "van"       },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        {/* MAPA NO FUNDO */}
        <div className="absolute inset-0 z-0">
           <IziTrackingMap 
             driverLoc={driverLocation} 
             userLoc={userLocation?.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null} 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* TOP BAR FLUTUANTE */}
        <header className="relative z-50 flex justify-between items-center px-6 pt-10 pb-4">
          <button onClick={() => { setSubView("none"); setMobilityStep(1); }} 
            className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400 active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-center">
             <h1 className="font-black tracking-tighter text-white text-xl uppercase italic">IZI GO</h1>
             <p className="text-[10px] font-black text-yellow-400/80 tracking-[0.3em] uppercase">Mobilidade Premium</p>
          </div>
          <div className="size-12 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-900">
             <img className="size-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" />
          </div>
        </header>

        {/* PAINEL INFERIOR (BOTTOM SHEET) */}
        <motion.main 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          className="relative z-40 mt-auto bg-zinc-900/90 backdrop-blur-2xl rounded-t-[40px] border-t border-white/10 p-6 pt-2 pb-12 flex flex-col gap-6"
        >
          {/* Alça do painel */}
          <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />

          <div className="px-2">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Para onde vamos?</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Escolha o serviço ideal para você</p>
          </div>

          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[50vh] no-scrollbar pb-6 px-1">
             {services.map((svc, i) => (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setTransitData({ ...transitData, type: svc.type as any, scheduled: false });
                    setMobilityStep(1);
                    if (svc.type === 'utilitario') navigateSubView("freight_wizard");
                    else if (svc.type === 'van') navigateSubView("van_wizard");
                    else navigateSubView("taxi_wizard");
                  }}
                  className="bg-white/5 border border-white/5 hover:border-yellow-400/30 p-5 rounded-3xl flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all group"
                >
                   <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                      <span className="material-symbols-outlined text-3xl text-yellow-400 group-hover:text-black">{svc.icon}</span>
                   </div>
                   <div className="flex-1">
                      <h3 className="font-black text-white group-hover:text-yellow-400 transition-colors">{svc.name}</h3>
                      <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{svc.desc}</p>
                   </div>
                   <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-colors">chevron_right</span>
                </motion.div>
             ))}
          </div>

          {/* RECENTES NO PAINEL */}
          {transitHistory.length > 0 && (
             <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6">
                {transitHistory.slice(0, 3).map((addr, i) => (
                   <div key={i} 
                    onClick={() => { setTransitData({ ...transitData, destination: addr, type: "mototaxi" }); navigateSubView("transit_selection"); }}
                    className="flex-shrink-0 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-zinc-600 text-lg">history</span>
                      <span className="text-[11px] font-bold text-zinc-400 truncate max-w-[120px]">{addr}</span>
                   </div>
                ))}
             </div>
          )}
        </motion.main>
      </div>
    );
  };

  const renderFreightWizard = () => {
    const categories = [
      { id: 'fiorino', name: 'Fiorino/Furgão', desc: 'Cargas pequenas (ex: móvel pequeno, caixas)', icon: 'local_shipping' },
      { id: 'caminhonete', name: 'Caminhonete', desc: 'Cargas médias / abertas (ex: geladeira, sofá)', icon: 'terminal' },
      { id: 'caminhao', name: 'Caminhão Baú', desc: 'Mudanças completas / grandes volumes', icon: 'truck_front' }
    ];

    return (
      <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        {/* MAPA NO FUNDO */}
        <div className="absolute inset-0 z-0 h-[35vh]">
           <IziTrackingMap driverLoc={driverLocation} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 pointer-events-none" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 pt-10">
          <button onClick={() => navigateSubView("explore_mobility")} className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400">
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Frete & Mudança</h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Logística Profissional</p>
          </div>
        </header>

        <main className="relative z-40 mt-auto bg-zinc-950 border-t border-white/5 flex flex-col h-[70vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
           <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {/* STEP 1: ENDEREÇOS E PARADAS */}
              {mobilityStep === 1 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Roteiro do Frete</h3>
                      <p className="text-zinc-500 text-xs font-medium">Defina origem, destino e até 2 paradas intermediárias.</p>
                   </div>
                   
                   <div className="space-y-4">
                      {/* ORIGEM */}
                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5 focus-within:border-yellow-400/30 transition-all">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Origem (Onde coletar?)</p>
                         <AddressSearchInput 
                           isLoaded={isLoaded}
                           initialValue={transitData.origin}
                           placeholder="Rua da Origem..."
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, origin: p.formatted_address || ""})}
                         />
                      </div>

                      {/* STOPS */}
                      {transitData.stops.map((stop, idx) => (
                         <div key={idx} className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5 flex items-center gap-3">
                             <div className="flex-1">
                                <p className="text-[9px] font-black uppercase text-yellow-400/60 tracking-widest mb-2 ml-1">Parada {idx + 1}</p>
                                <AddressSearchInput 
                                  isLoaded={isLoaded}
                                  initialValue={stop}
                                  placeholder="Rua da Parada..."
                                  className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                                  onSelect={(p) => {
                                    const newStops = [...transitData.stops];
                                    newStops[idx] = p.formatted_address || "";
                                    setTransitData({...transitData, stops: newStops});
                                  }}
                                />
                             </div>
                             <button onClick={() => setTransitData({...transitData, stops: transitData.stops.filter((_, i) => i !== idx)})} className="p-2 text-zinc-600 hover:text-red-400">
                                <span className="material-symbols-outlined">delete</span>
                             </button>
                         </div>
                      ))}

                      {transitData.stops.length < 2 && (
                        <button onClick={() => setTransitData({...transitData, stops: [...transitData.stops, ""]})} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-800 rounded-[30px] text-zinc-500 hover:border-yellow-400/30 hover:text-yellow-400 transition-all">
                           <span className="material-symbols-outlined text-lg">add_location_alt</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">+ Adicionar Parada</span>
                        </button>
                      )}

                      {/* DESTINO */}
                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5 focus-within:border-yellow-400/30 transition-all">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Destino Final</p>
                         <AddressSearchInput 
                           isLoaded={isLoaded}
                           initialValue={transitData.destination}
                           placeholder="Para onde levar?"
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, destination: p.formatted_address || ""})}
                         />
                      </div>
                   </div>
                </motion.section>
              )}

              {/* STEP 2: CATEGORIA DO VEÍCULO */}
              {mobilityStep === 2 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Tipo de Veículo</h3>
                      <p className="text-zinc-500 text-xs font-medium">Selecione o veículo ideal baseado na sua carga.</p>
                   </div>

                   <div className="space-y-4">
                      {categories.map((cat) => (
                        <div 
                          key={cat.id}
                          onClick={() => setTransitData({...transitData, vehicleCategory: cat.name})}
                          className={`p-6 rounded-[35px] border-2 transition-all flex items-center gap-6 cursor-pointer ${transitData.vehicleCategory === cat.name ? 'border-yellow-400 bg-yellow-400/5 shadow-xl shadow-yellow-400/10' : 'border-zinc-800 bg-zinc-900/40 opacity-60'}`}
                        >
                           <div className={`size-16 rounded-2xl flex items-center justify-center ${transitData.vehicleCategory === cat.name ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-white'}`}>
                              <span className="material-symbols-outlined text-4xl">{cat.icon}</span>
                           </div>
                           <div className="flex-1">
                              <h4 className="font-black text-lg text-white">{cat.name}</h4>
                              <p className="text-zinc-500 text-xs font-medium">{cat.desc}</p>
                           </div>
                           {transitData.vehicleCategory === cat.name && <span className="material-symbols-outlined text-yellow-400">check_circle</span>}
                        </div>
                      ))}
                   </div>
                </motion.section>
              )}

              {/* STEP 3: DETALHES DA CARGA E FOTOS */}
              {mobilityStep === 3 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">O que vamos transportar?</h3>
                      <p className="text-zinc-500 text-xs font-medium">Descreva os itens e envie fotos para facilitar o orçamento.</p>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-zinc-900/60 p-6 rounded-[35px] border border-white/5">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3 ml-1">Descrição Breve</p>
                         <textarea 
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0 resize-none"
                           rows={4}
                           placeholder="Ex: 1 Geladeira, 1 Sofá de 3 lugares, 5 caixas de roupas..."
                           value={transitData.packageDesc}
                           onChange={(e) => setTransitData({...transitData, packageDesc: e.target.value})}
                         />
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Fotos da Carga (Opcional - Máx 3)</p>
                        <div className="grid grid-cols-3 gap-4">
                           {[1,2,3].map((_, i) => (
                             <div key={i} className="aspect-square bg-zinc-900 rounded-[25px] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:border-yellow-400/30 hover:text-yellow-400 transition-all cursor-pointer">
                                <span className="material-symbols-outlined">add_a_photo</span>
                                <span className="text-[8px] font-black uppercase">Foto {i+1}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                </motion.section>
              )}

              {/* STEP 4: AJUDANTES E AGENDAMENTO */}
              {mobilityStep === 4 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Ajuda & Acessibilidade</h3>
                      <p className="text-zinc-500 text-xs font-medium">Defina se precisa de ajudantes e as condições do local.</p>
                   </div>

                   <div className="space-y-8">
                      {/* AJUDANTES */}
                      <div className="space-y-4">
                         <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Ajudantes Adicionais</p>
                         <div className="grid grid-cols-3 gap-3">
                            {[
                               { val: 0, label: "Apenas Motorista", desc: "Cliente carrega" },
                               { val: 1, label: "Motorista +1", desc: "1 Ajudante" },
                               { val: 2, label: "Motorista +2", desc: "2 Ajudantes" }
                            ].map((h) => (
                              <button key={h.val} onClick={() => setTransitData({...transitData, helpers: h.val})}
                                className={`p-4 rounded-[28px] border-2 flex flex-col items-center gap-1 transition-all ${transitData.helpers === h.val ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900/40 opacity-60'}`}>
                                <span className="text-xs font-black text-white">{h.label}</span>
                                <span className="text-[8px] text-zinc-500 font-bold uppercase">{h.desc}</span>
                              </button>
                            ))}
                         </div>
                      </div>

                      {/* ACESSIBILIDADE */}
                      <div className="space-y-4">
                         <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Condições do Local</p>
                         <div className="space-y-3">
                            {[
                               { key: 'stairsAtOrigin', label: "Possui escadas na origem?", icon: "stairs" },
                               { key: 'stairsAtDestination', label: "Possui escadas no destino?", icon: "apartment" },
                               { key: 'serviceElevator', label: "Tem elevador de serviço?", icon: "elevators" }
                            ].map((item) => (
                               <div key={item.key} onClick={() => setTransitData({...transitData, accessibility: {...transitData.accessibility, [item.key]: !((transitData.accessibility as any)[item.key]) } as any})}
                                 className={`flex items-center justify-between p-5 rounded-[28px] border-2 transition-all cursor-pointer ${(transitData.accessibility as any)[item.key] ? 'border-yellow-400 bg-yellow-400/5' : 'border-zinc-800 bg-zinc-900/40 opacity-60'}`}>
                                  <div className="flex items-center gap-4">
                                     <span className="material-symbols-outlined text-zinc-500">{item.icon}</span>
                                     <span className="text-sm font-bold text-white">{item.label}</span>
                                  </div>
                                  <div className={`size-6 rounded-full border-2 flex items-center justify-center ${(transitData.accessibility as any)[item.key] ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-zinc-700'}`}>
                                     {(transitData.accessibility as any)[item.key] && <span className="material-symbols-outlined text-base">check</span>}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.section>
              )}
            </div>

            {/* PREVIEW & PRICE */}
            <div className="px-8 mt-2">
              <div className="bg-zinc-900/60 p-6 rounded-[35px] border border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Estimativa Izi</p>
                    <span className="text-xl font-black text-white">
                      R$ {(() => {
                        const res = calculateFreightPrice({
                          baseFare: 45,
                          distanceInKm: 10,
                          distanceRate: 2.8,
                          helperCount: transitData.helpers,
                          helperRate: 35,
                          hasStairs: transitData.accessibility.stairsAtOrigin || transitData.accessibility.stairsAtDestination
                        });
                        return res.totalPrice.toFixed(2).replace(".", ",");
                      })()}
                    </span>
                 </div>
                 <div className="h-px bg-white/5" />
                 <p className="text-[9px] font-medium text-zinc-500 italic">* Valor sujeito a alterações por distância real ou tempo de carga excedente.</p>
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
                   onClick={() => mobilityStep < 4 ? setMobilityStep(prev => prev + 1) : navigateSubView("mobility_payment")}
                   className="flex-1 bg-yellow-400 text-black font-black text-lg py-5 rounded-[28px] shadow-2xl shadow-yellow-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                 >
                    <span className="uppercase tracking-widest">{mobilityStep < 4 ? "Próximo Passo" : "Ver Preço & Pedir"}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{mobilityStep < 4 ? 'arrow_forward' : 'bolt'}</span>
                 </button>
              </div>
           </div>
        </main>
      </div>
    );
  };

  const renderVanWizard = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        {/* MAPA NO FUNDO */}
        <div className="absolute inset-0 z-0 h-[35vh]">
           <IziTrackingMap driverLoc={driverLocation} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 pointer-events-none" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 pt-10">
          <button onClick={() => navigateSubView("explore_mobility")} className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400">
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Van & Grupos</h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Capacidade & Conforto</p>
          </div>
        </header>

        <main className="relative z-40 mt-auto bg-zinc-950 border-t border-white/5 flex flex-col h-[70vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
           <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {/* STEP 1: ROTEIRO E PARADAS */}
              {mobilityStep === 1 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Roteiro da Viagem</h3>
                      <p className="text-zinc-500 text-xs font-medium">Vans podem fazer várias paradas para pegar passageiros.</p>
                   </div>
                   
                   <div className="space-y-4">
                      {/* ORIGEM */}
                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Início da Rota</p>
                         <AddressSearchInput 
                           isLoaded={isLoaded}
                           initialValue={transitData.origin}
                           placeholder="Partida..."
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, origin: p.formatted_address || ""})}
                         />
                      </div>

                      {/* STOPS */}
                      {transitData.stops.map((stop, idx) => (
                         <div key={idx} className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5 flex items-center gap-3">
                             <div className="flex-1">
                                <p className="text-[9px] font-black uppercase text-yellow-400/60 tracking-widest mb-2 ml-1">Parada Adicional</p>
                                <AddressSearchInput 
                                  isLoaded={isLoaded}
                                  initialValue={stop}
                                  placeholder="Recolher passageiro em..."
                                  className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                                  onSelect={(p) => {
                                    const newStops = [...transitData.stops];
                                    newStops[idx] = p.formatted_address || "";
                                    setTransitData({...transitData, stops: newStops});
                                  }}
                                />
                             </div>
                             <button onClick={() => setTransitData({...transitData, stops: transitData.stops.filter((_, i) => i !== idx)})} className="p-2 text-zinc-600 hover:text-red-400">
                                <span className="material-symbols-outlined">close</span>
                             </button>
                         </div>
                      ))}

                      <button onClick={() => setTransitData({...transitData, stops: [...transitData.stops, ""]})} className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-800 rounded-[30px] text-zinc-500 hover:text-yellow-400 transition-all">
                         <span className="material-symbols-outlined text-lg">add</span>
                         <span className="text-[10px] font-black uppercase tracking-widest">+ Adicionar Parada</span>
                      </button>

                      {/* DESTINO */}
                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Destino Final</p>
                         <AddressSearchInput 
                           isLoaded={isLoaded}
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
                            { id: 'hourly', label: 'Diária', icon: 'schedule' }
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
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Nº de Passageiros</p>
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
                            <span className="text-[9px] font-bold text-zinc-600">Até 20 Pessoas</span>
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
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3 ml-1">Finalidade / Observações</p>
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
                          distanceInKm: 15, // Por ser wizard demo usamos fixo
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
                    <span className="uppercase tracking-widest">{mobilityStep < 3 ? "Próximo Passo" : "Ver Preço & Pedir"}</span>
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
      { id: "express", name: "Entrega Express", desc: "Documentos e pequenos volumes", icon: "bolt", action: () => { setTransitData({ ...transitData, type: "utilitario" }); navigateSubView("shipping_details"); } },
      { id: "frete",   name: "Fretes & Mudanças", desc: "Transporte de grandes volumes", icon: "local_shipping", action: () => { setTransitData({ ...transitData, type: "utilitario" }); navigateSubView("shipping_details"); } },
      { id: "coleta",  name: "Coleta Agenciada", desc: "Logística para empresas", icon: "inventory_2", action: () => { setTransitData({ ...transitData, type: "utilitario" }); navigateSubView("shipping_details"); } },
    ];
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Logística & Envios</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Entregamos qualquer coisa</p>
            </div>
          </div>
        </header>
        <main className="px-5 pt-8 flex flex-col gap-5 pb-10">
          {services.map((svc, i) => (
            <motion.div key={svc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={svc.action} className="relative group bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 cursor-pointer active:scale-[0.98] transition-all hover:border-yellow-400/20">
              <div className="flex items-center gap-5">
                <div className="size-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-400/20 transition-colors">
                  <span className="material-symbols-outlined text-2xl text-yellow-400">{svc.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-base text-white group-hover:text-yellow-400 transition-colors">{svc.name}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{svc.desc}</p>
                </div>
                <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-colors">chevron_right</span>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderShippingDetails = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-slate-50 bg-zinc-900 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500 pb-40">
        <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-slate-50/80 bg-zinc-900/80 backdrop-blur-xl z-50">
          <button
            onClick={() => setSubView("transit_selection")}
            className="size-12 rounded-2xl bg-white bg-zinc-900 shadow-xl flex items-center justify-center text-white active:scale-90 transition-all border border-zinc-800 border-zinc-700"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
              Detalhes do Objeto
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Informações de Entrega</p>
          </div>
        </header>

        <main className="px-6 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="location_on" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Local da Entrega</h3>
            </div>
            <div className="bg-white bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 border-zinc-800 shadow-xl">
               <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Endereço Selecionado</p>
               <AddressSearchInput 
                 isLoaded={isLoaded}
                 initialValue={transitData.destination}
                 placeholder="Digite o endereço..."
                 className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-white"
                 onSelect={(place: google.maps.places.PlaceResult) => {
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
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="person" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Quem recebe?</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 border-zinc-800 shadow-xl">
                 <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Nome Completo</p>
                 <input 
                   type="text" 
                   value={transitData.receiverName}
                   onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                   placeholder="Ex: João Silva"
                   className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-white"
                 />
              </div>

              <div className="bg-white bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 border-zinc-800 shadow-xl">
                 <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Telefone de Contato</p>
                 <input 
                   type="tel" 
                   value={transitData.receiverPhone}
                   onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                   placeholder="(11) 99999-9999"
                   className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 text-white"
                 />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <Icon name="inventory_2" />
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">O que está enviando?</h3>
            </div>

            <div className="space-y-4">
               <div className="bg-white bg-zinc-900 p-6 rounded-[35px] border border-zinc-800 border-zinc-800 shadow-xl">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2 ml-1">Descrição do Item</p>
                  <textarea 
                    value={transitData.packageDesc}
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
                      className={`py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest border-2 transition-all ${transitData.weightClass === weight ? 'bg-yellow-400 border-primary text-white shadow-lg' : 'bg-white bg-zinc-900 border-transparent text-zinc-500 opacity-60'}`}
                    >
                      {weight}
                    </button>
                  ))}
               </div>
            </div>
          </section>

          <div className="bg-amber-50  p-6 rounded-[35px] border border-amber-100  flex items-start gap-4">
             <Icon name="warning" />
             <p className="text-[10px] font-bold text-amber-700  leading-relaxed uppercase tracking-wider">
                Certifique-se de que o objeto esteja bem embalado. Não transportamos itens proibidos por lei ou inflamáveis.
             </p>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 z-50">
          <button
            disabled={!transitData.receiverName || !transitData.receiverPhone || isLoading}
            onClick={handleRequestTransit}
            className="w-full bg-slate-900  text-white  font-black text-xl py-6 rounded-[32px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 flex justify-center items-center gap-4 group"
          >
            {isLoading ? (
              <div className="size-7 border-4 border-white/30 border-t-white   rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="tracking-tighter uppercase tracking-[0.1em]">Agendar Coleta & Enviar</span>
                <Icon name="bolt" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderTaxiWizard = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
        {/* MAPA NO FUNDO */}
        <div className="absolute inset-0 z-0 h-[45vh]">
           <IziTrackingMap driverLoc={driverLocation} />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 pointer-events-none" />
        </div>

        <header className="relative z-50 flex items-center justify-between px-6 pt-10">
          <button onClick={() => navigateSubView("explore_mobility")} className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400">
            <Icon name="arrow_back" />
          </button>
          <div className="text-right">
             <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
                {transitData.type === 'mototaxi' ? "MotoTáxi" : "Motorista Particular"}
             </h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Viagem Rápida & Segura</p>
          </div>
        </header>

        <main className="relative z-40 mt-auto bg-zinc-950 border-t border-white/5 flex flex-col h-[60vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
           <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">
              {mobilityStep === 1 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Qual o seu destino?</h3>
                      <p className="text-zinc-500 text-xs font-medium">Confirme os pontos de partida e chegada.</p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Origem</p>
                            <button onClick={() => {
                               if (!navigator.geolocation) return;
                               navigator.geolocation.getCurrentPosition((pos) => {
                                  // Geocode...
                                  showToast("Localização atualizada!", "success");
                               });
                            }} className="text-[8px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/5 px-2 py-1 rounded-lg">Meu Local</button>
                         </div>
                         <AddressSearchInput 
                           isLoaded={isLoaded}
                           initialValue={transitData.origin}
                           placeholder="De onde você está saindo?"
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, origin: p.formatted_address || ""})}
                         />
                      </div>

                      <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
                         <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Destino</p>
                         <AddressSearchInput 
                           isLoaded={isLoaded}
                           initialValue={transitData.destination}
                           placeholder="Para onde vamos?"
                           className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
                           onSelect={(p) => setTransitData({...transitData, destination: p.formatted_address || ""})}
                         />
                      </div>
                   </div>
                </motion.section>
              )}

              {mobilityStep === 2 && (
                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-tight">Resumo da Viagem</h3>
                      <p className="text-zinc-500 text-xs font-medium">Confirme os detalhes e o preço antes de pedir.</p>
                   </div>

                   <div className="bg-white/5 border border-white/5 p-6 rounded-[35px] space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="size-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-yellow-400 italic">local_atm</span>
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Preço Estimado</p>
                            <p className="text-2xl font-black text-yellow-400">R$ 15,90</p>
                         </div>
                      </div>
                      <div className="h-px bg-white/5 w-full" />
                      <div className="space-y-4">
                         <div className="flex gap-4 items-start">
                            <span className="material-symbols-outlined text-zinc-600 text-sm">home</span>
                            <p className="text-xs font-medium text-zinc-300 truncate">{transitData.origin}</p>
                         </div>
                         <div className="flex gap-4 items-start">
                            <span className="material-symbols-outlined text-yellow-400 text-sm">location_on</span>
                            <p className="text-xs font-medium text-white truncate">{transitData.destination}</p>
                         </div>
                      </div>
                   </div>
                </motion.section>
              )}
           </div>

           <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
              <button 
                onClick={() => mobilityStep < 2 ? setMobilityStep(2) : navigateSubView("mobility_payment")}
                className="w-full bg-yellow-400 text-black font-black text-lg py-5 rounded-[28px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
              >
                 <span className="uppercase tracking-widest">{mobilityStep === 1 ? "Próximo Passo" : "Solicitar Agora"}</span>
                 <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{mobilityStep === 1 ? 'arrow_forward' : 'bolt'}</span>
              </button>
           </div>
        </main>
      </div>
    );
  };


  // â”€â”€â”€ Tela de Pagamento da Mobilidade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderMobilityPayment = () => {
    const bv = marketConditions.settings.baseValues;
    const basePrices: Record<string, number> = { mototaxi: bv.mototaxi_min, carro: bv.carro_min, van: bv.van_min, utilitario: bv.utilitario_min };
    const price = (transitData.estPrice > 0 ? transitData.estPrice : calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min)) ?? 0;

    const serviceLabels: Record<string, { label: string; icon: string }> = {
      mototaxi: { label: "MotoTáxi", icon: "motorcycle" },
      carro: { label: "Carro Executivo", icon: "directions_car" },
      van: { label: "Van de Carga", icon: "airport_shuttle" },
      utilitario: { label: "Entrega Express", icon: "bolt" },
    };
    const service = serviceLabels[transitData.type] || { label: "Serviço", icon: "local_shipping" };
    const activeCard = savedCards.find((c: any) => c.active);

    return (
      <div className="absolute inset-0 z-[115] bg-black bg-black flex flex-col hide-scrollbar overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 bg-black/80 backdrop-blur-2xl border-b border-zinc-900 border-zinc-800 px-6 py-5 flex items-center gap-4">
          <button onClick={() => setSubView("transit_selection")} className="size-11 rounded-2xl bg-slate-50  border border-zinc-800  flex items-center justify-center active:scale-90 transition-all">
            <Icon name="arrow_back" />
          </button>
          <div>
            <h2 className="text-lg font-black text-white tracking-tighter">Confirmar Serviço</h2>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Escolha como pagar</p>
          </div>
        </header>

        <div className="flex-1 px-6 py-6 space-y-6 pb-40">
          {/* Resumo do serviço */}
          <div className="bg-white  border border-zinc-800  rounded-[40px] p-6 space-y-5">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Resumo da Solicitação</h3>
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-[22px] bg-yellow-400/10 flex items-center justify-center">
                <Icon name={service.icon} />
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-base">{service.label}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {transitData.origin.split(",")[0]} â†’ {transitData.destination.split(",")[0]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white tracking-tight">
                  R$ {price.toFixed(2).replace(".", ",")}
                </p>
                {transitData.scheduled && (
                  <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">Agendado</p>
                )}
              </div>
            </div>

            {/* Info de agendamento */}
            {transitData.scheduled && transitData.scheduledDate && (
              <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-[20px] p-4 flex items-center gap-3">
                <Icon name="event" />
                <div>
                  <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Agendado para</p>
                  <p className="text-sm font-black text-white">
                    {new Date(`${transitData.scheduledDate}T${transitData.scheduledTime}`).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}

            {/* Rota detalhada */}
            <div className="bg-slate-50 bg-black/20 rounded-[24px] p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 size-2 rounded-full bg-yellow-400 shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Origem</p>
                  <p className="text-xs font-bold text-slate-700 text-zinc-300">{transitData.origin}</p>
                </div>
              </div>
              <div className="ml-[3px] h-4 w-[1px] bg-slate-200 " />
              <div className="flex items-start gap-3">
                <div className="mt-1.5 size-2 rounded-full bg-orange-500 shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Destino</p>
                  <p className="text-xs font-bold text-white">{transitData.destination}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de pagamento */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Forma de Pagamento</h3>

            {/* Cartão salvo */}
            {activeCard && activeCard.stripe_payment_method_id && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConfirmMobility("cartao")}
                disabled={isLoading}
                className="w-full bg-slate-900  border-2 border-yellow-400/20 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
              >
                <div className="size-12 rounded-[18px] bg-yellow-400/10 flex items-center justify-center">
                  <Icon name="credit_card" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-black text-white text-sm">{activeCard.brand} ••••{activeCard.last4}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Débito instantâneo</p>
                </div>
                <Icon name="arrow_forward" />
              </motion.button>
            )}

            {/* PIX */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("pix")}
              disabled={isLoading}
              className="w-full bg-white  border border-emerald-200  rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="size-12 rounded-[18px] bg-emerald-500/10 flex items-center justify-center">
                <Icon name="qr_code_2" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-white text-sm">PIX</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Aprovação imediata</p>
              </div>
              <Icon name="arrow_forward" />
            </motion.button>

            {/* Saldo */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("saldo")}
              disabled={isLoading || walletBalance < price}
              className="w-full bg-white  border border-zinc-800  rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              <div className="size-12 rounded-[18px] bg-blue-500/10 flex items-center justify-center">
                <Icon name="account_balance_wallet" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-white text-sm">Saldo em Carteira</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">R$ {walletBalance.toFixed(2).replace(".", ",")} disponível</p>
              </div>
              {walletBalance < price ? (
                <span className="text-[9px] font-black text-red-400 uppercase">Insuficiente</span>
              ) : (
                <Icon name="arrow_forward" />
              )}
            </motion.button>

            {/* Dinheiro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("dinheiro")}
              disabled={isLoading}
              className="w-full bg-white  border border-zinc-800  rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="size-12 rounded-[18px] bg-slate-100  flex items-center justify-center">
                <Icon name="payments" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-white text-sm">Dinheiro</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Pague ao prestador</p>
              </div>
              <Icon name="arrow_forward" />
            </motion.button>
          </div>

          {/* Badge segurança */}
          <div className="flex items-center gap-3 bg-yellow-400/5 border border-yellow-400/20 border-dashed p-4 rounded-[24px]">
            <Icon name="shield_with_heart" />
            <p className="text-[10px] font-black text-zinc-500 text-zinc-300 uppercase tracking-widest">Pagamento 100% seguro e criptografado</p>
          </div>
        </div>
      </div>
    );
  };

  // â”€â”€â”€ Tela de Aguardando Motorista â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderWaitingDriver = () => {
    if (!selectedItem) return null;

    const serviceLabels: Record<string, { label: string; icon: string; color: string }> = {
      mototaxi: { label: "MotoTáxi", icon: "motorcycle", color: "text-yellow-400" },
      carro: { label: "Carro Executivo", icon: "directions_car", color: "text-zinc-500" },
      van: { label: "Van de Carga", icon: "airport_shuttle", color: "text-blue-500" },
      utilitario: { label: "Entrega Express", icon: "bolt", color: "text-purple-500" },
    };
    const service = serviceLabels[selectedItem.service_type] || { label: "Serviço", icon: "local_shipping", color: "text-yellow-400" };

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
        <p className="text-white/40 text-sm text-center mb-8 max-w-xs">Estamos encontrando o melhor prestador disponível para você</p>

        {/* Info do pedido */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Serviço</span>
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
            if (!await showConfirm({ message: "Cancelar a solicitação?" })) return;
            await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", selectedItem.id);
            setSubView("none");
            fetchMyOrders(userId!);
            toastSuccess("Solicitação cancelada.");
          }}
          className="text-white/30 font-black text-[10px] uppercase tracking-widest border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all active:scale-95"
        >
          Cancelar Solicitação
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
    const svcLabels: Record<string,string> = { mototaxi:'MotoTáxi', carro:'Carro Executivo', van:'Van de Carga', utilitario:'Entrega Express' };
    const icon = svcIcons[selectedItem.service_type] || 'event';
    const label = svcLabels[selectedItem.service_type] || 'Serviço';
    const scheduledAt = selectedItem.scheduled_date && selectedItem.scheduled_time
      ? new Date(`${selectedItem.scheduled_date}T${selectedItem.scheduled_time}`).toLocaleString('pt-BR', { weekday:'long', day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })
      : null;
    const hasDriver = !!selectedItem.driver_id;

    const saveObservation = async () => {
      if (!schedObsState.trim()) return;
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
      <div className="absolute inset-0 z-[120] bg-[#f8fafc] bg-black flex flex-col overflow-hidden">
        <header className="px-6 py-5 bg-white bg-zinc-900 border-b border-zinc-900 flex items-center gap-4 shrink-0">
          <button onClick={() => { setSubView('none'); setFilterTab('agendados' as any); }} className="size-11 rounded-2xl bg-slate-50  border border-zinc-800  flex items-center justify-center active:scale-90 transition-all">
            <Icon name="arrow_back" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-black text-white tracking-tight">Agendamento</h2>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
          </div>
          <button onClick={async () => {
            if (!await showConfirm({ message: 'Cancelar este agendamento?' })) return;
            await supabase.from('orders_delivery').update({ status: 'cancelado' }).eq('id', selectedItem.id);
            setSubView('none'); fetchMyOrders(userId!); toastSuccess('Agendamento cancelado.');
          }} className="px-4 py-2 border border-red-200  text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Cancelar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">
          {/* Status */}
          <div className={`rounded-[28px] p-5 flex items-center gap-4 ${hasDriver ? 'bg-emerald-50  border border-emerald-200 ' : 'bg-blue-50  border border-blue-200 '}`}>
            <div className={`size-12 rounded-[18px] flex items-center justify-center ${hasDriver ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
              <span className={`material-symbols-outlined text-2xl ${hasDriver ? 'text-emerald-500' : 'text-blue-500'}`}>{hasDriver ? 'verified' : 'pending'}</span>
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${hasDriver ? 'text-emerald-500' : 'text-blue-400'}`}>{hasDriver ? 'Motorista Confirmado' : 'Aguardando Confirmação'}</p>
              <h3 className="text-base font-black text-white">{hasDriver ? 'Seu motorista está confirmado!' : 'Buscando motorista disponível...'}</h3>
            </div>
          </div>

          {/* Detalhes */}
          <div className="bg-white bg-zinc-900 rounded-[28px] border border-zinc-800 border-zinc-700 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Icon name={icon} />
              <div><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Serviço</p><p className="text-sm font-black text-white">{label}</p></div>
            </div>
            {scheduledAt && <div className="flex items-center gap-3">
              <Icon name="event" />
              <div><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Agendado para</p><p className="text-sm font-black text-white capitalize">{scheduledAt}</p></div>
            </div>}
            <div className="flex items-start gap-3">
              <Icon name="trip_origin" />
              <div><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Origem</p><p className="text-sm font-bold text-slate-700 text-zinc-300">{selectedItem.pickup_address}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="location_on" />
              <div><p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Destino</p><p className="text-sm font-bold text-white">{selectedItem.delivery_address}</p></div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 border-zinc-700">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Valor Total</span>
              <span className="text-lg font-black text-white">R$ {(selectedItem.total_price||0).toFixed(2).replace('.',',')}</span>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white bg-zinc-900 rounded-[28px] border border-zinc-800 border-zinc-700 p-5 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Observações para o Motorista</p>
            <textarea value={schedObsState} onChange={e => setSchedObsState(e.target.value)}
              placeholder="Ex: Tenho bagagens, endereço tem portão azul, preciso de nota fiscal..."
              rows={3} className="w-full bg-slate-50 bg-zinc-900/50 border border-slate-200 border-zinc-700 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 resize-none"
            />
            <button onClick={saveObservation} disabled={isSavingObsState}
              className="w-full py-3 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
              {isSavingObsState ? 'Salvando...' : 'Salvar Observação'}
            </button>
          </div>

          {/* Chat */}
          <div className="bg-white bg-zinc-900 rounded-[28px] border border-zinc-800 border-zinc-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-zinc-900 border-zinc-700 flex items-center gap-3">
              <Icon name="chat" />
              <p className="text-sm font-black text-white">Chat com o Motorista</p>
            </div>
            <div className="p-4 min-h-[100px] space-y-3">
              {schedMessagesState.length === 0 && (
                <p className="text-center text-[10px] font-black text-slate-300  uppercase tracking-widest py-4">
                  {hasDriver ? 'Inicie a conversa com seu motorista' : 'Disponível após confirmação do motorista'}
                </p>
              )}
              {schedMessagesState.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-[18px] ${msg.from === 'user' ? 'bg-blue-500 text-white rounded-tr-[6px]' : 'bg-slate-100  text-white rounded-tl-[6px]'}`}>
                    <p className="text-sm font-medium">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 flex gap-3">
              <input type="text" value={schedChatInputState} onChange={e => setSchedChatInputState(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendScheduledMessage()}
                placeholder={hasDriver ? 'Escreva uma mensagem...' : 'Aguardando motorista...'}
                disabled={!hasDriver}
                className="flex-1 bg-slate-50 bg-zinc-900/50 border border-slate-200 border-zinc-700 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 disabled:opacity-40"
              />
              <button onClick={sendScheduledMessage} disabled={!hasDriver || !schedChatInputState.trim()}
                className="size-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-90 transition-all disabled:opacity-30">
                <Icon name="send" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

    const renderPaymentProcessing = () => {
    return (
      <div className="absolute inset-0 z-[150] bg-black flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
        {/* Radar/Scan effect */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,217,0,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,217,0,0.05)_2px,transparent_2px)] bg-[size:30px_30px]"></div>
        
        <div className="relative mb-12">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="w-48 h-48 border-2 border-yellow-400/20 rounded-full border-t-primary shadow-[0_0_30px_rgba(255,217,0,0.1)]"
           />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-yellow-400/10 rounded-full border border-yellow-400/20 flex items-center justify-center relative overflow-hidden group">
                 <motion.div 
                   animate={{ y: [-40, 40, -40] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-x-0 h-[2px] bg-yellow-400 shadow-[0_0_15px_#ffd900] z-20"
                 />
                 <Icon name="fingerprint" />
              </div>
           </div>
        </div>

        <div className="space-y-4 relative z-10">
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em] mb-2 animate-pulse">Izi Security Protocol</p>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Autenticando Transação...
          </h1>
          <p className="text-white/40 text-[11px] leading-relaxed max-w-[250px] mx-auto font-bold uppercase tracking-widest">
            Aguarde um instante. Estamos verificando os dados via API segura Izi.
          </p>
        </div>

        <div className="mt-16 bg-white/5 backdrop-blur-md px-6 py-4 rounded-[25px] border border-white/10 flex items-center gap-4">
           <div className="size-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
              <Icon name="verified_user" />
           </div>
           <div className="text-left">
              <p className="text-[9px] font-black text-white uppercase tracking-widest">Gateway Ativo</p>
              <p className="text-[11px] font-bold text-white/40 uppercase">Criptografia RSA 4096-bit</p>
           </div>
        </div>
      </div>
    );
  };

  const renderPaymentError = () => {
    return (
      <div className="absolute inset-0 z-50 bg-black text-zinc-100 flex flex-col items-center justify-center px-6 gap-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="size-24 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", boxShadow: "0 0 40px rgba(239,68,68,0.2)" }}>
            <span className="material-symbols-outlined text-5xl text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
          </div>
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pagamento Recusado</h2>
          <p className="text-zinc-600 text-sm">Houve um problema ao processar seu pagamento</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button onClick={() => setSubView("checkout")}
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Tentar Novamente
          </button>
          <button onClick={() => { setPaymentsOrigin("checkout"); setSubView("payments"); }}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-900 text-zinc-500 hover:border-yellow-400/20 hover:text-yellow-400 transition-all active:scale-95">
            Trocar Forma de Pagamento
          </button>
          <button onClick={() => setSubView("none")} className="w-full text-zinc-700 text-sm font-black uppercase tracking-widest hover:text-zinc-500 transition-colors py-2">
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const renderActiveOrder = () => {
    if (!selectedItem) return null;

    const isMobility = ['mototaxi', 'carro', 'van', 'utilitario'].includes(selectedItem.service_type);

    const steps = isMobility ? [
      { id: 'procurando', label: 'Buscando Motorista', icon: 'search',           status: ['waiting_driver', 'novo'] },
      { id: 'confirmed',  label: 'Motorista Confirmado', icon: 'check_circle',   status: ['aceito', 'confirmado'] },
      { id: 'a_caminho',  label: 'Motorista em Rota',  icon: 'directions_bike',  status: ['a_caminho', 'at_pickup'] },
      { id: 'em_curso',   label: 'Viagem Iniciada',    icon: 'location_on',     status: ['picked_up', 'em_rota', 'saiu_para_entrega'] },
      { id: 'chegando',   label: 'Chegando ao Destino', icon: 'potted_plant',    status: ['no_local'] },
      { id: 'concluido',  label: 'Viagem Concluída',   icon: 'verified',        status: ['concluido'] },
    ] : [
      { id: 'confirmado', label: 'Pedido Confirmado', icon: 'check_circle', status: ['aceito', 'confirmado', 'preparando', 'pronto', 'a_caminho', 'picked_up', 'saiu_para_entrega', 'em_rota', 'no_local', 'concluido'] },
      { id: 'preparando', label: 'Em Preparação',    icon: 'restaurant',     status: ['preparando', 'pronto', 'a_caminho', 'picked_up', 'saiu_para_entrega', 'em_rota', 'no_local', 'concluido'] },
      { id: 'aceito_ent', label: 'Indo Coletar',     icon: 'moped',          status: ['a_caminho', 'picked_up', 'saiu_para_entrega', 'em_rota', 'no_local', 'concluido'] },
      { id: 'coletado',   label: 'Pedido Coletado',  icon: 'package_2',      status: ['picked_up', 'saiu_para_entrega', 'em_rota', 'no_local', 'concluido'] },
      { id: 'em_rota',    label: 'A Caminho',        icon: 'delivery_dining', status: ['saiu_para_entrega', 'em_rota', 'no_local', 'concluido'] },
      { id: 'entregue',   label: 'Entregue',         icon: 'verified',       status: ['concluido'] },
    ];

    const revIdx = steps.slice().reverse().findIndex(s => s.status.includes(selectedItem.status));
    const currentIdx = revIdx === -1 ? 0 : steps.length - 1 - revIdx;
    
    return (
      <div className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-hidden pb-32">
        {/* MAPA PLACEHOLDER OU REAL-TIME */}
        <div className="relative w-full h-[35vh] bg-zinc-900 overflow-hidden shrink-0">
           {/* MAPA REAL-TIME IZI FLASH */}
           <IziTrackingMap 
             driverLoc={driverLocation} 
             userLoc={userLocation?.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null} 
           />
           
           <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black z-10 pointer-events-none" />
           
           {/* Botão flutuante voltar */}
           <div className="absolute top-8 left-6 z-20">
              <button 
                onClick={() => setSubView("none")}
                className="size-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <Icon name="arrow_back" />
              </button>
           </div>

           {/* Badge flutuante de status */}
           <div className="absolute bottom-8 left-6 right-6 z-20">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-[32px] flex items-center gap-5 shadow-2xl">
                 <div className="size-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-black text-2xl animate-bounce">
                      {steps[currentIdx]?.icon || 'sync'}
                    </span>
                 </div>
                 <div className="flex-1">
                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-1">Logística Ativa</p>
                    <h3 className="text-lg font-black text-white tracking-tighter leading-none">
                      {steps[currentIdx]?.label || 'Sintonizando...'}
                    </h3>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Previsão</p>
                    <p className="text-lg font-black text-white italic">{(selectedItem.delivery_time || "15-25")}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* DETALHES COMPLEMENTARES */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-10 space-y-12">
           
           {/* TRACKING TIMELINE */}
           <section className="space-y-10">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Fluxo Operacional</h2>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Real-time</span>
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                 </div>
              </div>

              <div className="relative space-y-12 pl-4">
                 {/* Linha vertical tracejada */}
                 <div className="absolute left-[38px] top-6 bottom-6 w-[2px] bg-zinc-900 border-l border-dashed border-zinc-800" />
                 
                 {steps.map((s, i) => {
                    const isActive = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                       <div key={s.id} className={`flex items-start gap-8 relative z-10 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-20 scale-95'}`}>
                          <div className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-yellow-400 text-black shadow-lg shadow-primary/30 border border-yellow-300/20' : 'bg-zinc-900 text-zinc-700'}`}>
                             <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
                          </div>
                          <div className="flex-1 pt-1">
                             <h4 className={`text-base font-black tracking-tight ${isActive ? 'text-white' : 'text-zinc-600'}`}>{s.label}</h4>
                             {isCurrent && (
                               <motion.p 
                                 initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                                 className="text-yellow-400/60 text-[10px] uppercase font-black tracking-widest mt-1"
                               >
                                 Sendo processado agora
                               </motion.p>
                             )}
                          </div>
                          {isActive && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2.5">
                               <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                            </motion.div>
                          )}
                       </div>
                    );
                 })}
              </div>
           </section>

           {/* ESTABELECIMENTO / MOTORISTA */}
           <section className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 space-y-8 shadow-inner">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="size-16 rounded-[24px] bg-cover bg-center border border-white/10 shadow-float"
                      style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.driver_id || selectedItem.merchant_name || 'izi'}')` }} />
                    <div className="space-y-1">
                       <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                         {selectedItem.driver_id ? (selectedItem.driver_name || 'Entregador Izi') : (selectedItem.merchant_name || 'Estabelecimento')}
                       </h4>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                            {selectedItem.driver_id ? 'Entregador Parceiro' : 'Protocolo Izi'} #{String(selectedItem.id).slice(-6)}
                          </span>
                       </div>
                    </div>
                 </div>
                 <button className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
                    <Icon name="support_agent" size={20} className="text-zinc-500" />
                 </button>
              </div>

              {selectedItem.driver_id && (
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="size-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                      <Icon name="two_wheeler" className="text-yellow-400" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Veículo Selecionado</p>
                      <p className="text-xs font-bold text-white">Moto / Placa {String(selectedItem.id).slice(-4).toUpperCase()}</p>
                   </div>
                   <div className="text-right">
                      <div className="flex items-center gap-1">
                         <span className="material-symbols-outlined text-yellow-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                         <span className="text-xs font-black text-white">4.9</span>
                      </div>
                   </div>
                </div>
              )}

              <div className="h-px bg-white/5 mx-2" />

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  onClick={() => setSubView("order_chat")}
                  className="bg-zinc-900/80 border border-zinc-800 py-5 rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 active:scale-[0.98] transition-all hover:bg-zinc-800 hover:text-white"
                 >
                    <Icon name="chat" size={18} className="text-yellow-400" />
                    Abrir Canal Chat
                 </button>
                 <button className="bg-zinc-900/80 border border-zinc-800 py-5 rounded-[24px] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 active:scale-[0.98] transition-all hover:bg-zinc-800 hover:text-white">
                    <span className="material-symbols-outlined text-yellow-400 text-xl">call</span>
                    Ligar Agora
                 </button>
              </div>
           </section>

           {/* DADOS DE ENTREGA */}
           <section className="px-2 space-y-4">
              <h2 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em]">Destino Final</h2>
              <div className="flex items-start gap-4 bg-zinc-900/40 p-6 rounded-[32px] border border-white/5">
                 <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Icon name="location_on" className="text-orange-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Receber em</p>
                    <p className="text-sm font-bold text-zinc-300 leading-tight">{selectedItem.delivery_address}</p>
                 </div>
              </div>
           </section>

           {/* AJUDA */}
           <button 
            onClick={() => setSubView("order_support")}
            className="w-full py-6 rounded-[32px] border-2 border-dashed border-zinc-900/60 text-zinc-800 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3 group hover:border-white/10 hover:text-white mt-10"
           >
              <Icon name="help" className="group-hover:text-yellow-400 transition-colors" />
              Central de Protocolos e Ajuda
           </button>
        </main>
      </div>
    );
  };

  const renderWaitingMerchant = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-black text-zinc-100 flex flex-col items-center justify-center px-6 gap-8 overflow-hidden">
        {/* Fundo animado suave */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-black to-black animate-pulse" />
        
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative size-32"
        >
          <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl" />
          <div className="absolute inset-0 border border-yellow-400/30 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-2 border-2 border-dashed border-yellow-400/40 rounded-full animate-[spin_4s_linear_infinite]" />
          
          <div className="relative size-full rounded-full flex items-center justify-center bg-zinc-900 border border-yellow-400/50 shadow-[0_0_30px_rgba(255,215,9,0.4)]">
            <span className="material-symbols-outlined text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,9,1)]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
        </motion.div>

        <div className="text-center space-y-3 z-10 max-w-xs">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md">IZI FAST</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="size-2 bg-yellow-400 rounded-full animate-[bounce_1s_infinite]" />
            <p className="text-yellow-400 text-sm font-black tracking-widest uppercase">Aguardando Loja</p>
            <div className="size-2 bg-yellow-400 rounded-full animate-[bounce_1s_infinite_0.2s]" />
          </div>
          <p className="text-zinc-500 text-xs font-medium">
            {paymentMethod === 'dinheiro' 
              ? "O estabelecimento está analisando seu pedido para pagamento na entrega." 
              : "Seu pagamento foi confirmado! Aguardando a loja aceitar o pedido..."}
            Confirmação em poucos segundos...
          </p>
        </div>
      </div>
    );
  };

  const renderPaymentSuccess = () => {
    return (
      <div className="absolute inset-0 z-50 bg-black text-zinc-100 flex flex-col items-center justify-center px-6 gap-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="size-24 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", boxShadow: "0 0 40px rgba(16,185,129,0.2)" }}>
            <span className="material-symbols-outlined text-5xl text-emerald-400" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pedido Confirmado!</h2>
          <p className="text-zinc-600 text-sm">Seu pedido está sendo preparado</p>
        </div>

        <div className="w-full max-w-sm space-y-0">
          {[
            { label: "Status",          value: "Confirmado",                   color: "text-emerald-400" },
            { label: "Estabelecimento", value: selectedItem?.merchant_name || "Pedido", color: "text-white" },
            { label: "Tempo estimado",  value: "25-40 min",                    color: "text-yellow-400" },
            { label: "Entrega em",      value: userLocation.address || "Seu endereço", color: "text-zinc-300" },
          ].map((row: any) => (
            <div key={row.label} className="flex justify-between items-center py-3 border-b border-zinc-900/60 last:border-0">
              <span className="text-zinc-600 text-sm">{row.label}</span>
              <span className={`text-sm font-black ${row.color} text-right max-w-[55%] truncate`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button onClick={() => { setTab("orders"); setSubView("none"); }}
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Acompanhar Pedido
          </button>
          <button onClick={() => setSubView("none")} className="w-full text-zinc-700 text-sm font-black uppercase tracking-widest hover:text-zinc-500 transition-colors py-2">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  };

  const BottomNav = () => {
    const navItems = [
      { id: "home",    icon: "explore",                label: "Início"   },
      { id: "wallet",  icon: "account_balance_wallet",  label: "Wallet"   },
      { id: "orders",  icon: "receipt_long",            label: "Pedidos"  },
      { id: "profile", icon: "person",                  label: "Perfil"   },
    ];

    return (
      <nav
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-4 bg-black/80 backdrop-blur-2xl rounded-t-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)", height: "80px" }}
      >
        {navItems.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setTab(item.id as any); setSubView("none"); window.history.replaceState({ view: "app", tab: item.id, subView: "none" }, ""); }}
              className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ease-out ${isActive ? "text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isActive ? "text-yellow-400" : "text-zinc-500"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        {/* Cart Quick Access */}
        <button
          onClick={() => navigateSubView("cart")}
          className="flex flex-col items-center justify-center transition-all active:scale-90 ease-out text-zinc-500 hover:text-zinc-300 relative"
        >
          <div className="relative flex items-center justify-center size-9 rounded-2xl bg-yellow-400 shadow-[0_0_15px_rgba(255,215,9,0.3)]">
            <span className="material-symbols-outlined text-black text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-black">
                {cart.length > 99 ? "99+" : cart.length}
              </span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-yellow-400">
            {cart.length > 0 ? `R$${cart.reduce((s: number, i: any) => s + (i.price || 0), 0).toFixed(0)}` : "Cart"}
          </span>
        </button>
      </nav>
    );
  };


  return (
    <div className="w-full h-[100dvh] bg-background font-sans overflow-hidden relative">
      <AnimatePresence mode="wait">
        {view === "loading" && (
          <div className="h-full flex items-center justify-center bg-white bg-black">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-bold text-zinc-500">Carregando...</p>
            </div>
          </div>
        )}
        {view === "login" && (
          <motion.div
            key="log"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
          >
            <div className="h-full">{renderLogin()}</div>
          </motion.div>
        )}
        {view === "app" && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full relative"
          >
            {tab === "home" && renderHome()}
            {tab === "orders" && renderOrders()}
            {tab === "wallet" && renderWallet()}
            {tab === "profile" && renderProfile()}

            {/* Sub Views */}
            {/* Sub Views - Unified Layering */}
            <AnimatePresence>
              {subView === "generic_list" && (
                <motion.div
                  key="glist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderGenericList()}
                </motion.div>
              )}
              {subView === "restaurant_list" && (
                <motion.div
                  key="rlist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderRestaurantList()}
                </motion.div>
              )}
              {subView === "market_list" && (
                <motion.div
                  key="mlist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderMarketList()}
                </motion.div>
              )}
              {subView === "pharmacy_list" && (
                <motion.div
                  key="phlist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderPharmacyList()}
                </motion.div>
              )}
              {subView === "all_pharmacies" && (
                <motion.div
                  key="allpharm"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-50"
                >
                  {renderAllPharmacies()}
                </motion.div>
              )}
              {subView === "burger_list" && (
                <motion.div
                  key="blist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderBurgerList()}
                </motion.div>
              )}
              {subView === "pizza_list" && (
                <motion.div
                  key="plist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderPizzaList()}
                </motion.div>
              )}
              {subView === "acai_list" && (
                <motion.div
                  key="alist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderAcaiList()}
                </motion.div>
              )}
              {subView === "japonesa_list" && (
                <motion.div
                  key="jlist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderJaponesaList()}
                </motion.div>
              )}
              {subView === "brasileira_list" && (
                <motion.div
                  key="brlist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderBrasileiraList()}
                </motion.div>
              )}
              {subView === "explore_restaurants" && (
                <motion.div
                  key="explorerest"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderExploreRestaurants()}
                </motion.div>
              )}
              {subView === "daily_menus" && (
                <motion.div
                  key="dailymenus"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderDailyMenus()}
                </motion.div>
              )}
              {subView === "health_plantao" && (
                <motion.div
                  key="healthplantao"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderHealthPlantao()}
                </motion.div>
              )}
              {subView === "beverages_list" && (
                <motion.div
                  key="bevlist"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderBeveragesList()}
                </motion.div>
              )}
              {subView === "beverage_offers" && (
                <motion.div
                  key="bevoffers"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-[60]"
                >
                  {renderBeverageOffers()}
                </motion.div>
              )}
              {subView === "exclusive_offer" && (
                <motion.div
                  key="excl_offer"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderExclusiveOffer()}
                </motion.div>
              )}
              {subView === "store_catalog" && (
                <motion.div
                  key="scatalog"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-50"
                >
                  {renderStoreCatalog()}
                </motion.div>
              )}
              {subView === "restaurant_menu" && (
                <motion.div
                  key="rmenu"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-50"
                >
                  {renderRestaurantMenu()}
                </motion.div>
              )}
              {subView === "product_detail" && (
                <motion.div
                  key="pdetail"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[70]"
                >
                  {renderProductDetail()}
                </motion.div>
              )}
              {subView === "addresses" && (
                <motion.div
                  key="address"
                  initial={{ y: "-100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderAddresses()}
                </motion.div>
              )}
              {subView === "payments" && (
                <motion.div
                  key="pay"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderPayments()}
                </motion.div>
              )}
              {subView === "wallet" && (
                <motion.div
                  key="wall"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderWallet()}
                </motion.div>
              )}
              {subView === "cart" && (
                <motion.div
                  key="cartv"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[75]"
                >
                  {renderCart()}
                </motion.div>
              )}
              {subView === "checkout" && (
                <motion.div
                  key="check"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[60]"
                >
                  {renderCheckout()}
                </motion.div>
              )}
               {subView === "explore_mobility" && (
                <motion.div
                  key="expmob"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderExploreMobility()}
                </motion.div>
              )}
              {subView === "explore_category" && (
                <motion.div
                  key="expcat"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderExploreCategory()}
                </motion.div>
              )}
              {subView === "explore_envios" && (
                <motion.div
                  key="expenv"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-40"
                >
                  {renderExploreEnvios()}
                </motion.div>
              )}
               {subView === "taxi_wizard" && (
                <motion.div
                  key="taxi_wiz"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[110]"
                >
                  {renderTaxiWizard()}
                </motion.div>
              )}
              {subView === "freight_wizard" && (
                <motion.div
                  key="freight"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[120]"
                >
                  {renderFreightWizard()}
                </motion.div>
              )}
              {subView === "van_wizard" && (
                <motion.div
                  key="vanv"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[120]"
                >
                  {renderVanWizard()}
                </motion.div>
              )}
              {subView === "mobility_payment" && (
                <motion.div
                  key="mob_pay"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[115]"
                >
                  {renderMobilityPayment()}
                </motion.div>
              )}
              {subView === "waiting_driver" && (
                <motion.div
                  key="wait_drv"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-[115]"
                >
                  {renderWaitingDriver()}
                </motion.div>
              )}
              {subView === "scheduled_order" && (
                <motion.div
                  key="sched_ord"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[120]"
                >
                  {renderScheduledOrder()}
                </motion.div>
              )}
              {subView === "shipping_details" && (
                <motion.div
                  key="ship_det"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[120]"
                >
                  {renderShippingDetails()}
                </motion.div>
              )}
              {subView === "active_order" && (
                <motion.div
                  key="aorder"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[100]"
                >
                  {renderActiveOrder()}
                </motion.div>
              )}
              {subView === "payment_processing" && (
                <motion.div
                  key="pproc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderPaymentProcessing()}
                </motion.div>
              )}
              {subView === "payment_error" && (
                <motion.div
                  key="perr"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderPaymentError()}
                </motion.div>
              )}
              {subView === "payment_success" && (
                <motion.div
                  key="psuccess"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderPaymentSuccess()}
                </motion.div>
              )}
              {subView === "waiting_merchant" && (
                <motion.div
                  key="wmerchant"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderWaitingMerchant()}
                </motion.div>
              )}
              {subView === "izi_black_purchase" && (
                <motion.div
                  key="iziblackp"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="absolute inset-0 z-[180]"
                >
                  {renderIziBlackPurchase()}
                </motion.div>
              )}
              {subView === "order_support" && (
                <motion.div
                  key="osupport"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[110]"
                >
                  {renderOrderSupport()}
                </motion.div>
              )}
              {subView === "order_feedback" && (
                <motion.div
                  key="ofeedback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[160]"
                >
                  {renderOrderFeedback()}
                </motion.div>
              )}
              {subView === "order_chat" && (
                <motion.div
                  key="ochat"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[120]"
                >
                  {renderOrderChat()}
                </motion.div>
              )}
              {subView === "quest_center" && (
                <motion.div
                  key="quests"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[190]"
                >
                  {renderQuestCenter()}
                </motion.div>
              )}
              {subView === "pix_payment" && (
                <motion.div
                  key="pixpay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderPixPayment()}
                </motion.div>
              )}
              {subView === "lightning_payment" && (
                <motion.div
                  key="lnpay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderLightningPayment()}
                </motion.div>
              )}
              {subView === "card_payment" && (
                <motion.div
                  key="cardpay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[150]"
                >
                  {renderCardPayment()}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showPixPayment && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-lg flex items-center justify-center p-8"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center relative"
                  >
                    <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-rounded text-4xl">
                        qr_code_2
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">
                      Pagamento PIX
                    </h3>
                    <p className="text-zinc-500 font-medium mb-8">
                      Copie a chave abaixo para pagar no app do seu banco.
                    </p>

                    <div className="bg-slate-100 p-5 rounded-[24px] mb-8 relative group text-left">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                        Chave Copia e Cola
                      </p>
                      <p className="font-mono text-[11px] break-all text-zinc-500 leading-tight">
                        00020126360014BR.GOV.BCB.PIX011478029382000190520400005303986540510.005802BR5915RouteDelivery6009SAO
                        PAULO62070503***6304E2B1
                      </p>
                      <button
                        onClick={() => showToast("Chave copiada!")}
                        className="mt-4 w-full bg-white text-brand-600 font-black py-3 rounded-xl shadow-sm active:scale-95 transition-all text-sm uppercase"
                      >
                        Copiar Código
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setShowPixPayment(false);
                        setSubView("active_order");
                      }}
                      className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-float active:scale-[0.98] transition-all"
                    >
                      Já realizei o pagamento
                    </button>

                    <p className="mt-6 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                      O pedido será confirmado em instantes
                    </p>
                  </motion.div>
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
            'bg-slate-900/90 border-slate-700 text-white'
          }`}>
            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-white/20' : 'bg-black/20'
            }`}>
              <span className="material-symbols-outlined font-black">
                {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'notifications_active'}
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

