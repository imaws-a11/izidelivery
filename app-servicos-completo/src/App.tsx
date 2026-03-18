import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
import { toast, toastSuccess, toastError, toastWarning, showConfirm } from "./lib/useToast";
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Chave pública do Stripe (Placeholder - Usuário deve substituir pela sua real)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string ?? '');

const StripePaymentForm = ({ onConfirm, total, userId, onCardSaved }: {
  onConfirm: (paymentMethodId: string) => void;
  total: number;
  userId?: string | null;
  onCardSaved?: (card: { id: string; brand: string; last4: string; expiry: string; stripe_payment_method_id: string }) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(true);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setProcessing(false); return; }

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (pmError) {
      setError(pmError.message || "Erro ao processar cartão");
      setProcessing(false);
      return;
    }

    // Salvar cartão no Supabase se usuário marcou a opção
    if (saveCard && userId && onCardSaved) {
      const card = paymentMethod.card;
      const expiry = card ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` : '';
      const brand = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Cartão';

      const { data: inserted } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          stripe_payment_method_id: paymentMethod.id,
          brand,
          last4: card?.last4 || '????',
          expiry,
          is_default: true,
        })
        .select()
        .single();

      // Remove padrão dos outros cartões
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', inserted?.id || '');

      if (inserted) {
        onCardSaved({
          id: inserted.id,
          brand,
          last4: card?.last4 || '????',
          expiry,
          stripe_payment_method_id: paymentMethod.id,
        });
      }
    }

    onConfirm(paymentMethod.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#1e293b',
              '::placeholder': { color: '#94a3b8' },
              fontFamily: 'Inter, sans-serif',
            },
            invalid: { color: '#ef4444' },
          }
        }} />
      </div>
      {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}
      {userId && (
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setSaveCard(!saveCard)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${saveCard ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600'}`}
          >
            {saveCard && <span className="material-symbols-rounded text-slate-900 text-sm font-black">check</span>}
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Salvar cartão para próximas compras</span>
        </label>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary text-slate-900 font-black py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing
          ? <><div className="size-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />Processando...</>
          : `Pagar R$ ${total.toFixed(2).replace('.', ',')}`
        }
      </button>
    </form>
  );
};

interface SavedAddress {
  id: number;
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
      const apiKey = "AIzaSyAhmPK3-Wpa8iEpusCluHKUBP-NmlkR0hw";
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
          <span style={{ fontSize: "18px", marginTop: "2px", flexShrink: 0 }}>📍</span>
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

// ─── AI Concierge Component ──────────────────────────────────────────────────
const AIConciergePanel = ({ isOpen, onClose, userName, walletBalance, userLocation, myOrders, ESTABLISHMENTS }: any) => {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalGasto = myOrders.filter((o: any) => o.status === 'concluido').reduce((s: number, o: any) => s + (o.total_price || 0), 0).toFixed(2);

  const systemPrompt = `Você é o Izi Concierge, assistente do app IziDelivery. Seja direto e útil.
Contexto: Nome: ${userName || 'Cliente'}, Saldo: R$${walletBalance?.toFixed(2)}, Total gasto: R$${totalGasto}
Últimos pedidos: ${JSON.stringify(myOrders.slice(0,5).map((o: any) => ({ status: o.status, total: o.total_price, tipo: o.service_type })))}
Estabelecimentos: ${JSON.stringify(ESTABLISHMENTS?.slice(0,8).map((e: any) => ({ nome: e.name, tipo: e.type })))}
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
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: systemPrompt, messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
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
    'Tem cupom disponível?',
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[160] bg-[#020617] flex flex-col overflow-hidden">
      <header className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-[18px] bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Izi Concierge</h2>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">IA Ativa</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all">
          <span className="material-symbols-outlined font-black text-xl">close</span>
        </button>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-[12px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
              </div>
              <div className="bg-white/5 border border-white/8 rounded-[20px] rounded-tl-[6px] px-4 py-3 max-w-[85%]">
                <p className="text-sm text-white/80 leading-relaxed">Olá{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋 Sou o Izi Concierge. Posso te ajudar a encontrar restaurantes, verificar seu saldo, sugerir pedidos e muito mais!</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/5 rounded-[20px] p-4">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Saldo</p>
                <p className="text-lg font-black text-primary mt-0.5">R$ {walletBalance?.toFixed(2).replace(".", ",")}</p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-[20px] p-4">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total Gasto</p>
                <p className="text-lg font-black text-white mt-0.5">R$ {totalGasto.replace(".", ",")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Sugestões rápidas</p>
              {quickSuggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} className="w-full text-left bg-white/[0.03] border border-white/8 rounded-[16px] px-4 py-3 text-sm text-white/60 font-bold hover:bg-white/[0.06] hover:text-white transition-all active:scale-[0.98] flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-base">arrow_forward</span>{s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="size-8 rounded-[12px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
              </div>
            )}
            <div className={`px-4 py-3 max-w-[82%] ${msg.role === "user" ? "bg-primary text-slate-900 rounded-[20px] rounded-tr-[6px]" : "bg-white/5 border border-white/8 text-white/85 rounded-[20px] rounded-tl-[6px]"}`}>
              <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-[12px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-[20px] rounded-tl-[6px] px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="size-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                <div className="size-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay:'200ms'}} />
                <div className="size-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay:'400ms'}} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-5 pb-8 pt-3 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-[22px] px-4 py-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Pergunte algo..." className="flex-1 bg-transparent border-none outline-none text-white text-sm font-medium placeholder:text-white/20 py-2" />
          <button onClick={sendMessage} disabled={!input.trim() || isThinking} className="size-10 rounded-[14px] bg-primary text-slate-900 flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-30 shrink-0">
            <span className="material-symbols-outlined font-black text-lg">send</span>
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
    | "waiting_driver"
    | "scheduled_order"
  >("none");

  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string; expirationDate: string } | null>(null);
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
  const [showInfinityCard, setShowInfinityCard] = useState(false);
  const [showMasterPerks, setShowMasterPerks] = useState(false);
  const [flashOffers, setFlashOffers] = useState<any[]>([]);

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
    id: 'flowers' | 'sweets' | 'pets';
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
          setSubView("none");
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
  const [activeMenuCategory, setActiveMenuCategory] = useState("Destaques");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [filterTab, setFilterTab] = useState<"ativos" | "historico">("ativos");
  const [transitData, setTransitData] = useState({
    origin: "Rua Augusta, 45",
    destination: "",
    type: "mototaxi" as "mototaxi" | "carro" | "van" | "utilitario",
    estPrice: 0,
    scheduled: false,
    scheduledDate: "",
    scheduledTime: "",
    receiverName: "",
    receiverPhone: "",
    packageDesc: "",
    weightClass: "Pequeno (até 5kg)",
  });
  const [distancePrices, setDistancePrices] = useState<Record<string, number>>({});
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [nearbyDriversCount, setNearbyDriversCount] = useState(0);

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
        return {
          id: m.id,
          name: m.store_name || "Loja Parceira",
          tag: isOpen ? "Aberto Agora" : "Fechado",
          isOpen,
          rating: "4.9",
          dist: "1.5 km",
          time: "30-40 min",
          img: m.store_logo || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200",
          banner: m.store_banner || "https://images.unsplash.com/photo-1514933651103-005eec06ccc0?q=80&w=800",
          freeDelivery: true,
          type: m.store_type || "restaurant",
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
      "Hoje é sexta! Temos cupons especiais de 20% em bebidas para membros Izi Infinity.",
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
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro" | "saldo" | "bitcoin_lightning">(() => (localStorage.getItem("preferredPaymentMethod") as any) || "cartao");
  useEffect(() => {
    localStorage.setItem("preferredPaymentMethod", paymentMethod);
  }, [paymentMethod]);
  const [deliveryType] = useState<"delivery" | "pickup">("delivery");
  const [changeFor] = useState<string>("");
  const [cpf] = useState<string>("");
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
      const apiKey = "AIzaSyAhmPK3-Wpa8iEpusCluHKUBP-NmlkR0hw";
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
  const [paymentsOrigin, setPaymentsOrigin] = useState<"checkout" | "profile">("profile");

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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    {
      id: 1,
      label: "Casa",
      street: "Rua Augusta, 45",
      details: "Apto 12",
      city: "São Paulo",
      active: true,
    },
    {
      id: 2,
      label: "Trabalho",
      street: "Av. Paulista, 1000",
      details: "Andar 15",
      city: "São Paulo",
      active: false,
    },
  ]);
  const addressAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(
    null,
  );
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  useEffect(() => {
    fetchMarketData();
    fetchFlashOffers();
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
      .select("wallet_balance")
      .eq("id", uid)
      .single();
    if (data) setWalletBalance(data.wallet_balance || 0);

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
          setUserLocation({ address: "Rua Augusta, 45", loading: false });
        },
        { enableHighAccuracy: true },
      );
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("users_delivery").select("id").eq("id", session.user.id).maybeSingle().then(({ data }) => {
          if (!data) supabase.from("users_delivery").insert({ id: session.user.id, name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário" }).then();
        });
        setUserId(session.user.id);
        setView("app");
        setAuthInitLoading(false);
        window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
        fetchMyOrders(session.user.id);
        fetchWalletBalance(session.user.id);
        fetchSavedCards(session.user.id);
        fetchCoupons();
        fetchBeveragePromo();
      } else {
        // Sem sessão: para o loading e mostra a tela de login
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
          
          if (newOrder.user_id !== userId) return;

          // Se o status mudou, mostrar notificação personalizada
          if (newOrder.status !== oldOrder.status) {
            const statusMessages: Record<string, string> = {
              'novo': 'Seu pedido foi recebido! 🙌',
              'pendente_pagamento': 'Aguardando confirmação do pagamento... 💳',
              'aceito': 'O estabelecimento aceitou seu pedido! 📝',
              'confirmado': 'Pedido confirmado e pronto para começar! ✅',
              'preparando': 'O restaurante começou a preparar seu pedido! 🍳',
              'pronto': 'Seu pedido está pronto e aguardando coleta! 🛍️',
              'saiu_para_entrega': 'Fique atento! Seu pedido saiu para entrega! 🛵',
              'em_rota': 'O motorista está a caminho do destino! 🚗',
              'no_local': 'O motorista chegou ao local! 📍',
              'concluido': 'Pedido entregue! Bom apetite! 😋',
              'concluido': 'Pedido finalizado com sucesso! Obrigado por usar Izi. ✨',
              'cancelado': 'Ah não, seu pedido foi cancelado. 🛑'
            };

            const msg = statusMessages[newOrder.status] || `Status do pedido atualizado: ${newOrder.status}`;
            showToast(msg, newOrder.status === 'cancelado' ? 'warning' : 'success');

            // Abrir tela de avaliação ao concluir
            if (newOrder.status === 'concluido' || newOrder.status === 'concluido') {
              setTimeout(() => {
                setSubView("order_feedback");
              }, 2000);
            }

            // Se o usuário estiver vendo os detalhes deste pedido, atualizar o item selecionado
            if (selectedItem?.id === newOrder.id) {
              setSelectedItem(newOrder);
              // Se estava na tela de aguardando e motorista aceitou, ir para acompanhamento
              if (subViewRef.current === "waiting_driver" && 
                  ["a_caminho", "aceito", "confirmado", "em_rota", "no_local"].includes(newOrder.status)) {
                setTimeout(() => setSubView("active_order"), 1500);
              }
              // Se pedido foi cancelado e estava aguardando, voltar para home
              if (subViewRef.current === "waiting_driver" && newOrder.status === "cancelado") {
                setSubView("none");
                fetchMyOrders(userId!);
              }
            }
          }

          // Atualizar lista completa de pedidos
          if (userId) fetchMyOrders(userId);
        },
      )
      .subscribe();

    return () => {
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

  const fetchBeveragePromo = async () => {
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
        // Mapeia para o formato esperado pelo componente, adicionando preço antigo simulado se não existir
        const formatted = pDeals.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          oldPrice: p.price * 1.25,
          off: "25%",
          img: p.image_url || "https://images.unsplash.com/photo-1596753738914-7bc33e08f58b?q=80&w=400",
          cat: p.category || "Bebidas"
        }));
        setBeverageOffers(formatted);
      }
    } catch (err) {
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login')) {
            setErrorMsg('Email ou senha incorretos.');
          } else {
            setErrorMsg(error.message);
          }
          return;
        }
        await supabase.from("users_delivery").upsert({ id: data.user!.id, name: data.user!.user_metadata?.name || "Usuário" });
        setUserId(data.user!.id);
      } else {
        // Register
        if (!userName.trim()) { setErrorMsg('Informe seu nome completo.'); return; }
        if (!phone.trim()) { setErrorMsg('Informe seu telefone.'); return; }
        if (password.length < 6) { setErrorMsg('A senha deve ter no mínimo 6 caracteres.'); return; }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: userName.trim(), phone: phone.trim() } },
        });
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setErrorMsg('Este email já está cadastrado. Faça login.');
          } else {
            setErrorMsg(signUpError.message);
          }
          return;
        }
        await supabase.from("users_delivery").upsert({ id: signUpData.user!.id, name: userName.trim(), phone: phone.trim() });
        setUserId(signUpData.user!.id);
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
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemCount = (id: number) =>
    cart.filter((item) => item.id === id).length;

  const handleAddToCart = (item: any, e?: React.MouseEvent, overrideImg?: string) => {
    setCart([...cart, item]);
    if (e && e.clientX) triggerCartAnimation(e, overrideImg || item.img);
  };

  const handleRemoveFromCart = (id: number, all = false) => {
    const idx = cart.findIndex((item) => item.id === id);
    if (idx !== -1) {
      if (all) {
        setCart(cart.filter((item) => item.id !== id));
      } else {
        const newCart = [...cart];
        newCart.splice(idx, 1);
        setCart(newCart);
      }
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const handlePlaceOrder = async (stripePaymentMethodId?: string) => {
    if (!userId) return;
    setIsLoading(true);
    const subtotal = cart.reduce((acc, item) => acc + (item.price || 0), 0);
    const taxaBase = 5.0; 
    const taxaDinamica = calculateDynamicPrice(taxaBase);
    
    let desconto = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percent') {
        desconto = (subtotal * appliedCoupon.discount_value) / 100;
      } else {
        desconto = appliedCoupon.discount_value;
      }
    }

    const total = Math.max(0, subtotal + taxaDinamica - desconto);

    if (paymentMethod === "saldo" && walletBalance < total) {
      toast("Saldo insuficiente na carteira! Adicione fundos para continuar.");
      setIsLoading(false);
      return;
    }

    const activeAddr = savedAddresses.find((a) => a.active);

    // Se for cartão ou bitcoin, o status inicial é pendente_pagamento
    const initialStatus = (paymentMethod === "cartao" || paymentMethod === "bitcoin_lightning") ? "pendente_pagamento" : "novo";

    const { data: orderData, error } = await supabase
      .from("orders_delivery")
      .insert({
        user_id: userId,
        status: initialStatus,
        merchant_id: selectedShop?.id, 
        total_price: parseFloat(total.toFixed(2)),
        pickup_address: selectedShop?.name || "Local de Coleta Real",
        delivery_address: activeAddr?.street || userLocation.address,
        service_type: activeService?.type || "delivery",
        payment_method: paymentMethod,
        delivery_type: deliveryType,
        change_required:
          paymentMethod === "dinheiro" && changeFor
            ? parseFloat(changeFor)
            : null,
        cpf_invoice: cpf,
        order_notes: orderNotes,
        coupon_applied: appliedCoupon?.coupon_code || null,
        discount_amount: parseFloat(desconto.toFixed(2))
      })
      .select()
      .single();

    if (error) {
      toastError("Erro ao criar pedido: " + error.message);
      setIsLoading(false);
      return;
    }

    // Fluxo de Processamento de Pagamento Real com Stripe
    // Aceita pmId passado diretamente (formulário Stripe) ou do cartão salvo
    const activeCard = savedCards.find((c: any) => c.active);
    const effectivePaymentMethodId = stripePaymentMethodId || activeCard?.stripe_payment_method_id;

    if (paymentMethod === "cartao" && effectivePaymentMethodId) {
      setSubView("payment_processing");
      try {
        // 1. Buscar sessão atual para obter o token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada. Faça login novamente.");

        // 2. Chamar Edge Function via fetch direto com token
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const intentResponse = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_KEY as string,
          },
          body: JSON.stringify({ amount: total, orderId: orderData.id }),
        });

        if (!intentResponse.ok) {
          const errText = await intentResponse.text();
          throw new Error(`Erro ao criar pagamento: ${errText}`);
        }

        const intentData = await intentResponse.json();

        // 2. Confirmar o pagamento no Frontend
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe não carregado");

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
          payment_method: effectivePaymentMethodId
        });

        if (confirmError) throw confirmError;

        if (paymentIntent.status === "succeeded") {
          // 3. Atualizar pedido para 'novo' (sucesso)
          await supabase.from("orders_delivery").update({ status: "novo" }).eq("id", orderData.id);
          
          setCart([]);
          localStorage.removeItem("izi_cart");
          setAppliedCoupon(null);
          setSelectedItem(orderData);
          setSubView("payment_success");
          fetchMyOrders(userId);
        } else {
          setSubView("payment_error");
        }
      } catch (err: any) {
        setSubView("payment_error");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Fluxo Legado (Dinheiro / Saldo)
    if (paymentMethod === "dinheiro") {
      setCart([]);
      setAppliedCoupon(null);
      setSelectedItem(orderData);
      setSubView("payment_success");
      fetchMyOrders(userId);
      setIsLoading(false);
    } else if (paymentMethod === "pix") {
      setSubView("payment_processing");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada.");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const pixResponse = await fetch(`${supabaseUrl}/functions/v1/create-pagbank-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_KEY as string,
          },
          body: JSON.stringify({
            amount: total,
            orderId: orderData.id,
            email: email,
            customer: { name: userName, cpf: cpf }
          }),
        });

        if (!pixResponse.ok) {
          const errText = await pixResponse.text();
          throw new Error(`Erro ao gerar PIX: ${errText}`);
        }

        const pixResult = await pixResponse.json();
        setPixData(pixResult);
        setSubView("pix_payment");
      } catch (err: any) {
        setSubView("payment_error");
      } finally {
        setIsLoading(false);
      }
    } else if (paymentMethod === "saldo") {
      setSubView("payment_processing");
      // Simulação de processamento saldo
      setTimeout(() => {
        const isSuccess = Math.random() > 0.05;
        if (isSuccess) {
          setCart([]);
          localStorage.removeItem("izi_cart");
          setAppliedCoupon(null);
          setSelectedItem(orderData);
          setSubView("payment_success");
          const newBalance = walletBalance - total;
          supabase
            .from("users_delivery")
            .update({ wallet_balance: newBalance })
            .eq("id", userId)
            .then(() => setWalletBalance(newBalance));
          fetchMyOrders(userId);
        } else {
          setSubView("payment_error");
        }
        setIsLoading(false);
      }, 2000);
    }
  };

  const handleRequestTransit = async () => {
    if (!transitData.destination) return;
    // Validar agendamento
    if (transitData.scheduled) {
      if (!transitData.scheduledDate) {
        toastError("Selecione a data do agendamento.");
        return;
      }
      if (!transitData.scheduledTime) {
        toastError("Selecione o horário do agendamento.");
        return;
      }
      const scheduled = new Date(`${transitData.scheduledDate}T${transitData.scheduledTime}`);
      if (scheduled <= new Date(Date.now() + 25*60*1000)) {
        toastError("O agendamento deve ser com pelo menos 30 minutos de antecedência.");
        return;
      }
    }
    setSubView("mobility_payment");
  };

  const handleConfirmMobility = async (selectedPaymentMethod: string) => {
    if (!transitData.destination) return;
    setIsLoading(true);

    const bv = marketConditions.settings.baseValues;
    const basePrices: Record<string, number> = { mototaxi: bv.mototaxi_min, carro: bv.carro_min, van: bv.van_min, utilitario: bv.utilitario_min };
    const price = (transitData.estPrice > 0 ? transitData.estPrice : calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min)) ?? 0;

    if (!userId) {
      setIsLoading(false);
      toastError("Faça login para solicitar o serviço.");
      return;
    }

    // Se pagamento for cartão, processar via Stripe
    if (selectedPaymentMethod === "cartao") {
      const activeCard = savedCards.find((c: any) => c.active);
      if (!activeCard?.stripe_payment_method_id) {
        setIsLoading(false);
        toastError("Adicione um cartão válido para continuar.");
        setSubView("payments");
        setPaymentsOrigin("checkout");
        return;
      }
    }

    // Criar pedido
    const { data, error } = await supabase
      .from("orders_delivery")
      .insert({
        user_id: userId,
        status: transitData.scheduled ? "agendado" : (selectedPaymentMethod === "cartao" ? "pendente_pagamento" : "pendente"),
        total_price: parseFloat(price.toFixed(2)),
        pickup_address: transitData.origin,
        delivery_address: transitData.destination,
        service_type: transitData.type,
        payment_method: selectedPaymentMethod,
        scheduled_date: transitData.scheduled ? transitData.scheduledDate : null,
        scheduled_time: transitData.scheduled ? transitData.scheduledTime : null,
        receiver_name: transitData.receiverName || null,
        receiver_phone: transitData.receiverPhone || null,
        package_details: transitData.packageDesc || null,
        weight_class: transitData.weightClass || null,
      })
      .select()
      .single();

    if (error) {
      setIsLoading(false);
      toastError("Erro ao solicitar transporte.");
      return;
    }

    // Processar pagamento
    if (selectedPaymentMethod === "cartao") {
      setSubView("payment_processing");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada.");
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const intentResponse = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_KEY as string,
          },
          body: JSON.stringify({ amount: price, orderId: data.id }),
        });
        if (!intentResponse.ok) throw new Error(await intentResponse.text());
        const intentData = await intentResponse.json();
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe não carregado.");
        const activeCard = savedCards.find((c: any) => c.active);
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
          payment_method: activeCard.stripe_payment_method_id
        });
        if (confirmError) throw confirmError;
        if (paymentIntent.status === "succeeded") {
          await supabase.from("orders_delivery").update({ status: "pendente" }).eq("id", data.id);
          setSelectedItem({ ...data, status: "pendente" });
          setSubView("waiting_driver");
          fetchMyOrders(userId);
        } else {
          setSubView("payment_error");
        }
      } catch {
        setSubView("payment_error");
      }
    } else if (selectedPaymentMethod === "pix") {
      setSubView("payment_processing");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada.");
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const pixResponse = await fetch(`${supabaseUrl}/functions/v1/create-mp-pix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_KEY as string,
          },
          body: JSON.stringify({ amount: price, orderId: data.id, email, customer: { name: userName, cpf } }),
        });
        if (!pixResponse.ok) throw new Error(await pixResponse.text());
        const pixResult = await pixResponse.json();
        setPixData(pixResult);
        setSubView("pix_payment");
      } catch {
        setSubView("payment_error");
      }
    } else if (selectedPaymentMethod === "saldo") {
      if (walletBalance < price) {
        setIsLoading(false);
        toastError("Saldo insuficiente na carteira.");
        return;
      }
      setSubView("payment_processing");
      setTimeout(async () => {
        await supabase.from("users_delivery").update({ wallet_balance: walletBalance - price }).eq("id", userId);
        setWalletBalance(walletBalance - price);
        setSelectedItem(data);
        setSubView("waiting_driver");
        fetchMyOrders(userId);
      }, 1500);
    } else {
      // Dinheiro — vai direto para aguardando motorista (ou confirmação de agendamento)
      setSelectedItem(data);
      setSubView(transitData.scheduled ? "active_order" : "waiting_driver");
      fetchMyOrders(userId);
    }

    const newHistory = [transitData.destination, ...transitHistory.filter(h => h !== transitData.destination)].slice(0, 5);
    setTransitHistory(newHistory);
    localStorage.setItem("transitHistory", JSON.stringify(newHistory));
    setTransitData({ ...transitData, destination: "", estPrice: 0, scheduled: false, receiverName: "", receiverPhone: "", packageDesc: "", weightClass: "Pequeno (até 5kg)" });
    setIsLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) return;
    
    if (!await showConfirm({ message: "Tem certeza que deseja cancelar seu pedido?" })) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("orders_delivery")
      .update({ status: "cancelado" })
      .eq("id", orderId)
      .in("status", ["novo", "pendente", "pendente_pagamento"]); // Só cancela se ainda não foi aceito

    setIsLoading(false);
    
    if (error) {
      toastError("Não foi possível cancelar o pedido. Ele pode já ter sido confirmado.");
    } else {
      toastSuccess("Pedido cancelado com sucesso.");
      setSubView("none");
      if (userId) fetchMyOrders(userId);
    }
  };

  const renderLogin = () => (
    <div className="h-[100dvh] w-full flex flex-col p-8 bg-background-dark relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
      <div className="absolute top-[-5%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>



      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
          {authMode === 'login' ? (
            <>BEM-<span className="text-primary not-italic">VINDO.</span></>
          ) : (
            <>CRIAR <span className="text-primary not-italic">CONTA.</span></>
          )}
        </h2>
        <p className="text-slate-400 font-bold mb-8 text-xs uppercase tracking-[0.2em] opacity-60">
          {authMode === 'login' ? 'Acesse sua conta premium' : 'Registre-se em segundos'}
        </p>
      </motion.div>

      <div className="space-y-5 flex-1 overflow-y-auto">
        {authMode === 'register' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
                Seu Nome Completo
              </label>
              <div className="relative group">
                <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  badge
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
                  placeholder="Ex: Maria Silva"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
                Telefone / WhatsApp
              </label>
              <div className="relative group">
                <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  call
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
                  placeholder="(11) 90000-0000"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
            E-mail
          </label>
          <div className="relative group">
            <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
              alternate_email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
              placeholder="seu@email.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
            Senha {authMode === 'register' && '(mín. 6 caracteres)'}
          </label>
          <div className="relative group">
            <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
              lock_open
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-14 pr-12 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <span className="material-symbols-rounded">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center ml-6 mt-1 mb-2">
          <button
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center gap-2 group"
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${rememberMe ? 'bg-primary border-primary' : 'border-white/20 bg-white/5'}`}>
              {rememberMe && <span className="material-symbols-rounded text-slate-900 text-[14px] font-black">check</span>}
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">
              Lembrar meus dados
            </span>
          </button>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-red-400 text-[11px] font-black uppercase tracking-widest text-center bg-red-500/10 border border-red-500/20 p-4 rounded-3xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </div>

      <div className="pb-4 pt-6 space-y-4">
        <button
          onClick={handleAuth}
          disabled={isLoading}
          className="w-full bg-primary text-slate-900 font-black text-xl py-5 rounded-[32px] shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-3"
        >
          {isLoading ? (
            <span className="material-symbols-rounded animate-spin">sync</span>
          ) : authMode === 'login' ? (
            <>
              CONECTAR
              <span className="material-symbols-rounded font-black">arrow_forward</span>
            </>
          ) : (
            <>
              CRIAR CONTA
              <span className="material-symbols-rounded font-black">person_add</span>
            </>
          )}
        </button>

        <button
          onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
          className="w-full py-4 text-slate-400 text-xs font-black uppercase tracking-[0.15em] hover:text-white transition-colors"
        >
          {authMode === 'login' ? 'Não tem conta? Cadastre-se grátis' : 'Já tem conta? Faça login'}
        </button>
      </div>
    </div>
  );

  const handleShopClick = async (shop: any) => {
    // Navigate to a temporary loading view or just the menu immediately and show loading
    const serviceType = activeService?.type || "restaurant";
    
    // Choose view based on service type
    if (serviceType === "restaurant" || shop.type === 'restaurant') {
      setSubView("restaurant_menu");
    } else {
      setSubView("store_catalog");
    }

    // Fetch products for this shop (merchant)
    const { data: productsData, error } = await supabase
      .from('products_delivery')
      .select('*')
      .eq('merchant_id', shop.id)
      .eq('is_available', true);

    if (error) {
    }

    const productsList = productsData || [];
    
    // Group products by category
    const categoriesMap: Record<string, any[]> = {};
    productsList.forEach((p: any) => {
      const cat = p.category || "Destaques";
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push({
        id: p.id,
        name: p.name,
        desc: p.description,
        price: Number(p.price),
        img: p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300",
        original: p 
      });
    });

    const categoriesArray = Object.keys(categoriesMap).map(catName => ({
      name: catName,
      items: categoriesMap[catName]
    }));

    if (categoriesArray.length === 0) {
      categoriesArray.push({
        name: "Sem produtos",
        items: []
      });
    }

    let categorizedShop = { ...shop, categories: categoriesArray };

    setSelectedShop(categorizedShop);
    setActiveMenuCategory(categoriesArray[0]?.name || "Destaques");
  };

  const renderHome = () => {
    // ── Serviços Principais (Entregas) ──
    const deliveryServices = [
      { emoji: "🍽️", label: "Food", desc: "Peça o melhor da cidade", type: "restaurant", gradient: "linear-gradient(135deg, #f97316, #ef4444)", bgColor: "#fff7ed", tagColor: "#ea580c", tag: "Populares" },
      { emoji: "🍺", label: "Bebidas", desc: "Distribuidoras e adegas", type: "beverages", gradient: "linear-gradient(135deg, #f59e0b, #eab308)", bgColor: "#fffbeb", tagColor: "#d97706", tag: "Geladas" },
      {
        emoji: "📦", label: "Envios", desc: "Entregas e encomendas", gradient: "linear-gradient(135deg, #8b5cf6, #9333ea)", bgColor: "#f5f3ff", tagColor: "#7c3aed", tag: "Express",
        action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("transit_selection"); },
      },
      { emoji: "🛒", label: "Mercado", desc: "Compras do dia a dia", type: "market", gradient: "linear-gradient(135deg, #10b981, #0d9488)", bgColor: "#ecfdf5", tagColor: "#059669", tag: "Rápido" },
      { emoji: "💊", label: "Farmácia", desc: "Medicamentos e saúde", type: "pharmacy", gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)", bgColor: "#eff6ff", tagColor: "#2563eb", tag: "24h" },
      { emoji: "🐾", label: "Petshop", desc: "Cuidados para seu pet", type: "generic", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)", bgColor: "#fdf2f8", tagColor: "#db2777", tag: "Novo", action: () => { setExploreCategoryState({ id: 'pets', title: 'Pet Shop Premium', tagline: 'Mimo para seu melhor amigo', primaryColor: 'rose-500', icon: 'pets', banner: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200' }); navigateSubView('explore_category'); } },
      { emoji: "🎂", label: "Doces & Bolos", desc: "Confeitarias e padarias", type: "generic", gradient: "linear-gradient(135deg, #d946ef, #ec4899)", bgColor: "#fdf4ff", tagColor: "#c026d3", action: () => { setExploreCategoryState({ id: 'sweets', title: 'Doces & Bolos', tagline: 'Momentos mais doces', primaryColor: 'fuchsia-500', icon: 'cake', banner: 'https://images.unsplash.com/photo-1578985542846-399fe5c5f47d?q=80&w=1200' }); navigateSubView('explore_category'); } },
      { emoji: "💐", label: "Flores", desc: "Buquês e arranjos", type: "generic", gradient: "linear-gradient(135deg, #fb7185, #f43f5e)", bgColor: "#fff1f2", tagColor: "#e11d48", action: () => { setExploreCategoryState({ id: 'flowers', title: 'Floricultura', tagline: 'Flores que encantam', primaryColor: 'rose-400', icon: 'local_florist', banner: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200' }); navigateSubView('explore_category'); } },
    ];

    // ── Serviços de Mobilidade ──
    const mobilityServices = [
      {
        emoji: "🏍️", label: "Mototáxi", desc: "Rápido e econômico", gradient: "linear-gradient(135deg, #facc15, #f97316)", bgColor: "#fefce8", tagColor: "#ca8a04", tag: "Promo",
        action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false }); navigateSubView("transit_selection"); },
      },
      {
        emoji: "🚗", label: "Motorista Particular", desc: "Conforto para sua viagem", gradient: "linear-gradient(135deg, #334155, #0f172a)", bgColor: "#f1f5f9", tagColor: "#334155", tag: "Premium",
        action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false }); navigateSubView("transit_selection"); },
      },
      {
        emoji: "🚐", label: "Van / Utilitário", desc: "Mudanças e cargas", gradient: "linear-gradient(135deg, #6366f1, #2563eb)", bgColor: "#eef2ff", tagColor: "#4f46e5",
        action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("transit_selection"); },
      },
      {
        emoji: "🚚", label: "Frete", desc: "Transporte de volumes", gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)", bgColor: "#ecfeff", tagColor: "#0891b2",
        action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("transit_selection"); },
      },
    ];

    // Compatibilidade com handleServiceSelection


    // Compatibilidade com handleServiceSelection

    const handleServiceSelection = (cat: any) => {
      if (cat.action) return cat.action();
      setActiveService(cat);
      if (cat.type === "restaurant") {
        navigateSubView("restaurant_list");
      } else if (cat.type === "market") {
        navigateSubView("market_list");
      } else if (cat.type === "pharmacy") {
        navigateSubView("pharmacy_list");
      } else if (cat.type === "beverages") {
        navigateSubView("beverages_list");
      } else {
        navigateSubView("generic_list");
      }
    };

    return (
      <div className="flex flex-col animate-in fade-in duration-700 bg-background-light dark:bg-background-dark pb-32 overflow-y-auto no-scrollbar h-full">
        {/* HEADER: LUXURY STYLE */}
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
          <div className="flex items-center p-5 pb-2 justify-between">
            <div
              className="flex items-center gap-4 flex-1 cursor-pointer group"
              onClick={() => setSubView(subView === "addresses" ? "none" : "addresses")}
            >
              <div className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-700 group-active:scale-95 transition-all relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse" />
                <span className="material-symbols-outlined text-primary text-2xl fill-1 relative z-10">location_on</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 mb-0.5">Entregar em</span>
                <div className="flex items-center gap-1.5 group-hover:text-primary transition-colors">
                  <h2 className="text-sm font-black leading-tight dark:text-white max-w-[150px] truncate tracking-tight">
                    {userLocation.loading ? "Buscando satélite..." : userLocation.address}
                  </h2>
                  <span className={`material-symbols-outlined text-base font-black text-primary transition-all duration-300 ${userLocation.loading ? "animate-spin" : subView === "addresses" ? "rotate-180" : "group-hover:translate-y-0.5"}`}>
                    {userLocation.loading ? "sync" : "expand_more"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => cart.length > 0 && navigateSubView("cart")}
                className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center group"
              >
                <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">shopping_bag</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 animate-bounce-slow shadow-lg">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSubView("quest_center")}
                className="size-12 rounded-2xl bg-slate-900 text-primary shadow-lg shadow-primary/10 border border-slate-700 active:scale-90 transition-all flex items-center justify-center group"
              >
                <motion.span 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="material-symbols-outlined text-2xl fill-1"
                >
                  military_tech
                </motion.span>
              </button>

              <div
                onClick={() => setTab("profile")}
                className="size-12 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 border-2 border-white dark:border-slate-800 active:scale-90 transition-all cursor-pointer group relative"
              >
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'default'}`} alt="User" className="size-full bg-slate-100 group-hover:scale-110 transition-transform" />
                {userLevel >= 10 && (
                  <div className="absolute top-0 right-0 size-4 bg-primary border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center -translate-y-1 translate-x-1 shadow-lg shadow-primary/40">
                    <span className="material-symbols-rounded text-[8px] font-black text-slate-900 fill-1">diamond</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 mt-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner relative overflow-hidden group">
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
              <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none"
                placeholder="O que você deseja pedir hoje?"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center animate-in fade-in zoom-in">
                  <span className="material-symbols-outlined text-sm font-black text-slate-500">close</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* IZI FLASH — Grid Vitrine */}
        {flashOffers.length > 0 && (
          <div className="mt-8 px-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="size-2 bg-rose-500 rounded-full animate-ping" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Izi Flash</h3>
                <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-rose-500/20">Ao Vivo</span>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{flashOffers.length} ofertas</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {flashOffers.map((offer: any) => {
                const expiresAt = new Date(offer.expires_at);
                const diffMs = expiresAt.getTime() - Date.now();
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const timeLabel = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}min`;
                const isUrgent = diffHrs < 2;
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-white dark:bg-slate-800 rounded-[28px] overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-xl cursor-pointer group"
                    onClick={() => {
                      const shop = ESTABLISHMENTS.find((e: any) => e.id === offer.merchant_id);
                      if (shop) handleShopClick(shop);
                      else toast("Loja não disponível no momento.");
                    }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                      <img
                        src={offer.product_image || offer.admin_users?.store_logo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={offer.product_name}
                      />
                      <div className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg">
                        -{offer.discount_percent}%
                      </div>
                      <div className={`absolute top-2.5 right-2.5 backdrop-blur-md px-2 py-1 rounded-xl border text-[9px] font-black flex items-center gap-1 ${isUrgent ? "bg-rose-500/90 border-rose-400/30 text-white" : "bg-black/60 border-white/10 text-white"}`}>
                        <span className="material-symbols-outlined text-[10px]">timer</span>
                        {timeLabel}
                      </div>
                    </div>
                    <div className="p-3.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5">{offer.admin_users?.store_name || "Loja Parceira"}</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">{offer.product_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400 line-through">R$ {Number(offer.original_price).toFixed(2).replace(".", ",")}</span>
                        <span className="text-sm font-black text-rose-500">R$ {Number(offer.discounted_price).toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        <main className="flex flex-col gap-12 pt-6">
          {/* Active Order Widget: Premium Design */}
          {(() => {
            const activeOrder = myOrders.find(o => !["concluido", "cancelado", "agendado"].includes(o.status));
            if (!activeOrder) return null;

            const isCarService = ['carro', 'van', 'utilitario'].includes(activeOrder.service_type);
            const activeOrderIcon = isCarService ? "directions_car" : "moped";

            return (
              <div className="px-4">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setSelectedItem(activeOrder);
                    setSubView("active_order");
                  }}
                  className="bg-primary text-slate-900 p-6 rounded-[35px] flex items-center gap-5 shadow-2xl shadow-primary/30 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 size-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                  <div className="size-16 rounded-[22px] bg-white/20 flex items-center justify-center backdrop-blur-md relative overflow-hidden shrink-0 border border-white/20 shadow-xl">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/40 animate-progress-fast" />
                    <span className="material-symbols-outlined text-3xl animate-bounce-slow">
                      {activeOrderIcon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/60 leading-none">
                        {isCarService ? "Acompanhar Viagem" : "Acompanhar Entrega"}
                      </span>
                      <div className="size-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                    <h4 className="font-black text-lg leading-tight tracking-tight">
                      {isCarService ? "Motorista a caminho" : "Pedido em andamento"}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-900/70 mt-0.5">Clique para ver o mapa em tempo real</p>
                  </div>
                  <div className="size-10 rounded-full bg-slate-900/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <span className="material-symbols-outlined font-black">map</span>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {/* ═══ SEÇÃO: CUPONS DISPONÍVEIS ═══ */}
          {availableCoupons.length > 0 && (
            <section className="px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">confirmation_number</span>
                  <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Cupons Disponíveis</h3>
                </div>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  {availableCoupons.length} {availableCoupons.length === 1 ? 'cupom' : 'cupons'}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                {availableCoupons.map((coupon, i) => {
                  const isCopied = copiedCoupon === coupon.coupon_code;
                  const isExpiringSoon = coupon.expires_at && (() => {
                    const diff = new Date(coupon.expires_at).getTime() - Date.now();
                    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // < 3 days
                  })();
                  return (
                    <motion.div
                      key={coupon.id || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="relative min-w-[200px] max-w-[220px] shrink-0"
                    >
                      {/* Coupon card */}
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-md">
                        {/* Top color strip */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-yellow-400 to-primary" />
                        <div className="p-4">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {isExpiringSoon && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                                Expira em breve
                              </span>
                            )}
                            {coupon.min_order_value > 0 && (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                Mín. R$ {coupon.min_order_value?.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Discount value — big and prominent */}
                          <p className="text-2xl font-black text-primary leading-none mb-0.5">
                            {coupon.discount_type === 'fixed'
                              ? `R$ ${coupon.discount_value?.toFixed(2)}`
                              : `${coupon.discount_value}% OFF`}
                          </p>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight mb-3">
                            {coupon.title}
                          </p>

                          {/* Coupon code + copy button */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.coupon_code).catch(() => {});
                              setCopiedCoupon(coupon.coupon_code);
                              setTimeout(() => setCopiedCoupon(null), 2000);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border-2 border-dashed transition-all active:scale-95 ${
                              isCopied
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                            }`}
                          >
                            <span className={`font-mono font-black text-[12px] tracking-widest ${isCopied ? 'text-emerald-600' : 'text-primary'}`}>
                              {coupon.coupon_code}
                            </span>
                            <span className={`material-symbols-outlined text-sm ${isCopied ? 'text-emerald-500' : 'text-primary'}`}>
                              {isCopied ? 'check_circle' : 'content_copy'}
                            </span>
                          </button>

                          {/* Expiry */}
                          {coupon.expires_at && (
                            <p className="text-[9px] font-bold text-slate-400 mt-2 text-center">
                              Válido até {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Notch cutouts for coupon effect */}
                      <div className="absolute top-[47px] -left-2 size-4 bg-background-light dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700" />
                      <div className="absolute top-[47px] -right-2 size-4 bg-background-light dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700" />
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ SEÇÃO: PEÇA & RECEBA ═══ */}
          <section className="px-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Peça & Receba</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Entregas na sua porta em minutos</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {deliveryServices.filter(cat => 
                cat.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (cat.desc && cat.desc.toLowerCase().includes(searchQuery.toLowerCase()))
              ).map((cat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                  key={`delivery-${i}`}
                  onClick={() => handleServiceSelection(cat)}
                  className="flex flex-col items-center group cursor-pointer active:scale-90 transition-all duration-200"
                >
                  <div className="relative w-full aspect-square rounded-[24px] flex items-center justify-center shadow-lg mb-2 overflow-hidden" style={{ background: cat.gradient }}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="text-3xl relative z-10 drop-shadow-sm">{cat.emoji}</span>
                    {cat.tag && (
                      <span className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-slate-700 shadow-sm">
                        {cat.tag}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 text-center leading-tight tracking-tight">{cat.label}</span>
                  <span className="text-[8px] font-semibold text-slate-400 text-center leading-tight mt-0.5 hidden sm:block">{cat.desc}</span>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="px-4 flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Mobilidade & Transporte</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Vá para qualquer lugar</p>
              </div>
              <button 
                onClick={() => setIsMobilityExpanded(!isMobilityExpanded)}
                className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-all"
              >
                {isMobilityExpanded ? "Ver menos" : "Ver todos"}
              </button>
            </div>
            
            <div className={isMobilityExpanded ? "grid grid-cols-4 gap-3 px-4" : "flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3"}>
              {(isMobilityExpanded ? mobilityServices : mobilityServices).filter(svc => 
                svc.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                svc.desc.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((svc, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={`mobility-${i}`}
                  onClick={() => handleServiceSelection(svc)}
                  className={`${isMobilityExpanded ? "flex flex-col items-center" : "min-w-[160px] p-4"} bg-white dark:bg-slate-800 rounded-[28px] shadow-md border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all duration-200 group hover:shadow-xl`}
                >
                  <div className={`${isMobilityExpanded ? "w-full aspect-square mb-2" : "size-14 mb-3"} rounded-[18px] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`} style={{ background: svc.gradient }}>
                    <span className={isMobilityExpanded ? "text-3xl" : "text-xl"}>{svc.emoji}</span>
                  </div>
                  <h4 className={`${isMobilityExpanded ? "text-[11px] text-center" : "text-[13px]"} font-black text-slate-900 dark:text-white leading-tight mb-1`}>{svc.label}</h4>
                  {!isMobilityExpanded && <p className="text-[10px] text-slate-400 font-semibold leading-snug">{svc.desc}</p>}
                  {svc.tag && !isMobilityExpanded && (
                    <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: svc.tagColor, backgroundColor: svc.bgColor }}>
                      {svc.tag}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {isMobilityExpanded && transitHistory.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 px-4 space-y-3"
              >
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Para onde você costuma ir?</p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                  {transitHistory.map((addr, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        setTransitData({...transitData, destination: addr, type: 'mototaxi'});
                        navigateSubView('transit_selection');
                      }}
                      className="whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-sm active:scale-95 transition-all text-[11px] font-bold dark:text-white"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                      {addr}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </section>

          {/* ═══ ESPAÇO PUBLICITÁRIO PREMIUM ═══ */}
          {(() => {
            const ads = [
              { id: 1, brand: "iFood Business", title: "Anuncie aqui e alcance", highlight: "+50 mil usuários", cta: "Saiba mais", tag: "Tecnologia", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800", accentColor: "#6366f1", badgeColor: "from-indigo-600 to-purple-600" },
              { id: 2, brand: "Outback Steakhouse", title: "Promoção exclusiva no app", highlight: "Bloomin' Onion GRÁTIS", cta: "Ver oferta", tag: "Gastronomia", img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800", accentColor: "#f97316", badgeColor: "from-orange-500 to-red-600" },
              { id: 3, brand: "Nike Store", title: "Novos lançamentos 2026", highlight: "Até 40% OFF", cta: "Comprar agora", tag: "Moda & Lifestyle", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800", accentColor: "#10b981", badgeColor: "from-emerald-500 to-teal-600" },
              { id: 4, brand: "Samsung Brasil", title: "Galaxy AI chegou", highlight: "S25 Ultra é aqui", cta: "Explorar", tag: "Tecnologia", img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800", accentColor: "#3b82f6", badgeColor: "from-blue-600 to-cyan-500" },
            ];
            const ad = ads[adIndex % ads.length];
            return (
              <div className="px-4">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Publicidade</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ads.map((_, i) => (
                      <button key={i} onClick={() => setAdIndex(i)} className={`rounded-full transition-all duration-500 ${i === adIndex % ads.length ? "w-5 h-2 bg-primary" : "size-2 bg-slate-200 dark:bg-slate-700"}`} />
                    ))}
                  </div>
                </div>
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative h-[200px] rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer active:scale-[0.98] transition-all border border-white/5"
                >
                  <img src={ad.img} alt={ad.brand} className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-[2500ms]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-5 right-5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl">
                    <div className="size-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Patrocinado</span>
                  </div>
                  <div className={`absolute top-5 left-5 bg-gradient-to-r ${ad.badgeColor} px-4 py-1.5 rounded-xl shadow-2xl`}>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{ad.tag}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-7 flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{ad.brand}</p>
                      <h3 className="text-white text-base font-black tracking-tight leading-tight mb-0.5">{ad.title}</h3>
                      <p className="font-black text-2xl tracking-tighter leading-none" style={{ color: ad.accentColor }}>{ad.highlight}</p>
                    </div>
                    <div className="ml-4 shrink-0 px-5 py-3 rounded-[18px] font-black text-[11px] uppercase tracking-[0.15em] text-slate-900 shadow-2xl group-hover:scale-105 transition-transform" style={{ backgroundColor: ad.accentColor }}>
                      {ad.cta}
                    </div>
                  </div>
                </motion.div>
                <button className="w-full mt-3 py-3 px-5 flex items-center justify-center gap-2.5 rounded-[18px] border border-dashed border-slate-200 dark:border-slate-700 group hover:border-primary/40 transition-all active:scale-[0.98]">
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors text-[18px]">campaign</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">Anuncie seu negócio aqui · a partir de R$ 49/dia</span>
                </button>
              </div>
            );
          })()}

          {/* Banner Promo: Luxury Style */}
          <div className="px-4">
            <div 
              onClick={() => navigateSubView('exclusive_offer')}
              className="relative h-60 rounded-[50px] overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-2xl group cursor-pointer border border-white/5"
            >
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800" alt="Promo" className="size-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-10 gap-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="bg-primary text-slate-900 font-black text-[10px] uppercase tracking-[0.25em] px-4 py-2 rounded-full shadow-2xl">Oferta Exclusiva</span>
                  <div className="size-2 bg-red-500 rounded-full animate-ping" />
                </div>
                <h3 className="text-white text-4xl font-black leading-none max-w-[280px] tracking-tighter mb-1">Burgers Gourmet <br /><span className="text-primary text-5xl">50% OFF</span></h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">Válido apenas para membros do clube de fidelidade hoje!</p>
              </div>
              <div className="absolute top-8 right-8 size-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:rotate-45 transition-transform duration-700">
                <span className="material-symbols-outlined text-white text-2xl">bolt</span>
              </div>
            </div>
          </div>

          {/* Establishments Scroller: Premium Cards */}
          <section className="space-y-8 pb-10">
            <div className="px-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Favoritos da Região</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-80">Os melhores de São Paulo</p>
              </div>
              <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center group active:scale-90 transition-all">
                <span className="material-symbols-outlined text-2xl text-primary font-black group-hover:rotate-[20deg] transition-transform">explore</span>
              </button>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-4 px-4 pb-10">
              {ESTABLISHMENTS.filter((shop: any) => 
                shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                shop.tag.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((shop) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  key={shop.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleShopClick(shop)}
                  className="min-w-[300px] bg-white dark:bg-slate-800 p-5 rounded-[50px] shadow-2xl shadow-slate-200/40 dark:shadow-black/40 border border-slate-50 dark:border-slate-800 group cursor-pointer hover:-translate-y-3 transition-all duration-700"
                >
                  <div className="relative h-52 rounded-[40px] overflow-hidden mb-6 shadow-2xl">
                    <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]" />
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-5 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10">
                      <span className="material-symbols-outlined text-sm text-primary fill-1">star</span>
                      <span className="text-xs font-black">{shop.rating}</span>
                    </div>
                    <div className="absolute bottom-5 left-5 flex gap-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-lg">{shop.tag}</span>
                    </div>
                  </div>
                  <div className="px-3 pb-2">
                    <h4 className="font-black text-slate-900 dark:text-white text-lg mb-4 leading-tight tracking-tighter group-hover:text-primary transition-colors">{shop.name}</h4>
                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-5">
                      <div className="flex items-center gap-5 text-[12px] font-black uppercase tracking-tighter text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base font-black opacity-60">schedule</span>{shop.time}</span>
                        <span className={shop.freeDelivery ? 'text-emerald-500 flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
                          <span className="material-symbols-outlined text-base font-black opacity-60">{shop.freeDelivery ? 'delivery_dining' : 'payments'}</span>
                          {shop.freeDelivery ? 'Grátis' : shop.fee}
                        </span>
                      </div>
                      <div className="size-11 rounded-[18px] bg-slate-50 dark:bg-slate-900 group-hover:bg-primary flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-all duration-700 shadow-inner group-hover:shadow-lg group-hover:shadow-primary/20">
                        <span className="material-symbols-outlined text-lg font-black group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {searchQuery && ESTABLISHMENTS.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="min-w-[300px] flex flex-col items-center justify-center p-10 bg-slate-100 dark:bg-slate-800/50 rounded-[50px] border border-dashed border-slate-300 dark:border-slate-700">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                  <p className="text-[10px] font-black uppercase text-slate-400">Nenhum favorito encontrado</p>
                </div>
              )}
            </div>
          </section>
        </main >
      </div >
    );
  };

  const renderBurgerList = () => {
    const burgerShops = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-40 min",
      freeDelivery: estab.freeDelivery || true,
      banner: estab.banner,
      logo: estab.img,
      products: [] as any[]
    }));

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Burgers</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Artesanais & Smash</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">{cart.length}</span>}
            </button>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar burger ou combo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-12 pt-8">
          {burgerShops.filter(shop => 
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map((shop, i) => (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={shop.id} className="bg-white dark:bg-slate-900 rounded-[60px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group">
              <div className="relative h-64">
                <img src={shop.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-5">
                  <div className="size-20 rounded-[28px] bg-white p-2 shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                    <img src={shop.logo} className="size-full rounded-[20px] object-cover" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">{shop.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-white/80">
                      <span className="text-primary flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="material-symbols-outlined text-[16px] fill-1">star</span>{shop.rating}
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                         <span className="material-symbols-outlined text-[16px]">schedule</span>{shop.time}
                      </span>
                      {shop.freeDelivery && <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] shadow-lg">FRETE GRÁTIS</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <p className="text-[13px] font-black uppercase text-slate-400 tracking-[0.2em]">Destaques do Chef</p>
                  </div>
                  <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 mx-6 opacity-50" />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                   {shop.products.length > 0 ? (
                    shop.products.slice(0, 3).map((p, idx) => (
                      <div key={p.id} onClick={() => { handleAddToCart(p); }} className="flex gap-6 p-5 rounded-[45px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 shadow-none hover:shadow-2xl hover:border-primary/20 active:scale-[0.98] transition-all group cursor-pointer relative overflow-hidden">
                        <div className="relative overflow-hidden size-32 rounded-[35px] shrink-0 shadow-xl group-hover:shadow-primary/10 transition-shadow">
                          <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-3 left-3 size-8 bg-primary rounded-2xl flex items-center justify-center font-black text-[12px] text-slate-900 border border-white/20 shadow-lg">#{idx + 1}</div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{p.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                            <div className="size-12 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-all duration-300">
                              <span className="material-symbols-outlined text-xl font-black">add</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                   ) : (
                    <div className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50 italic">Nenhum destaque no momento</div>
                   )}
                </div>
                
                <button 
                  onClick={() => handleShopClick({ ...shop, type: 'restaurant' })} 
                  className="w-full mt-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[35px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 group-hover:text-slate-900 transition-colors">Ver Cardápio Completo</span>
                  <span className="material-symbols-outlined text-xl font-black group-hover:translate-x-2 transition-transform relative z-10 group-hover:text-slate-900 transition-colors">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderPizzaList = () => {
    const pizzaShops = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-40 min",
      freeDelivery: estab.freeDelivery || true,
      banner: estab.banner,
      logo: estab.img,
      products: [] as any[]
    }));

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Pizzarias</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Artesanais & Forno a Lenha</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">{cart.length}</span>}
            </button>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar sabor ou pizzaria..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-12 pt-8">
          {pizzaShops.filter(shop => 
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map((shop, i) => (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={shop.id} className="bg-white dark:bg-slate-900 rounded-[60px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group">
              <div className="relative h-64">
                <img src={shop.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-5">
                  <div className="size-20 rounded-[28px] bg-white p-2 shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                    <img src={shop.logo} className="size-full rounded-[20px] object-cover" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">{shop.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-white/80">
                      <span className="text-primary flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="material-symbols-outlined text-[16px] fill-1">star</span>{shop.rating}
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                         <span className="material-symbols-outlined text-[16px]">schedule</span>{shop.time}
                      </span>
                      {shop.freeDelivery && <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] shadow-lg">FRETE GRÁTIS</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <p className="text-[13px] font-black uppercase text-slate-400 tracking-[0.2em]">Pizzas mais pedidas</p>
                  </div>
                  <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 mx-6 opacity-50" />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {shop.products.slice(0, 3).map((p, idx) => (
                    <div key={p.id} onClick={() => { setSelectedItem(p); setTempQuantity(1); navigateSubView('product_detail'); }} className="flex gap-6 p-5 rounded-[45px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 shadow-none hover:shadow-2xl hover:border-primary/20 active:scale-[0.98] transition-all group cursor-pointer relative overflow-hidden">
                      <div className="relative overflow-hidden size-32 rounded-[35px] shrink-0 shadow-xl group-hover:shadow-primary/10 transition-shadow">
                        <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-3 left-3 size-8 bg-primary rounded-2xl flex items-center justify-center font-black text-[12px] text-slate-900 border border-white/20 shadow-lg">#{idx + 1}</div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                          <div className="size-12 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-all duration-300">
                            <span className="material-symbols-outlined text-xl font-black">add</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleShopClick({ ...shop, type: 'restaurant' })} 
                  className="w-full mt-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[35px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 group-hover:text-slate-900 transition-colors">Ver Cardápio Completo</span>
                  <span className="material-symbols-outlined text-xl font-black group-hover:translate-x-2 transition-transform relative z-10 group-hover:text-slate-900 transition-colors">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderAcaiList = () => {
    const acaiShops = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-40 min",
      freeDelivery: estab.freeDelivery || true,
      banner: estab.banner,
      logo: estab.img,
      products: [] as any[]
    }));

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Açaí & Refrescos</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Energia & Sabor</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">{cart.length}</span>}
            </button>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar açaí ou adicional..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-12 pt-8">
          {acaiShops.filter(shop => 
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map((shop, i) => (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={shop.id} className="bg-white dark:bg-slate-900 rounded-[60px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group">
              <div className="relative h-64">
                <img src={shop.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-5">
                  <div className="size-20 rounded-[28px] bg-white p-2 shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                    <img src={shop.logo} className="size-full rounded-[20px] object-cover" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">{shop.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-white/80">
                      <span className="text-primary flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="material-symbols-outlined text-[16px] fill-1">star</span>{shop.rating}
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                         <span className="material-symbols-outlined text-[16px]">schedule</span>{shop.time}
                      </span>
                      {shop.freeDelivery && <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] shadow-lg">FRETE GRÁTIS</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <p className="text-[13px] font-black uppercase text-slate-400 tracking-[0.2em]">O melhor do Açaí</p>
                  </div>
                  <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 mx-6 opacity-50" />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {shop.products.slice(0, 3).map((p, idx) => (
                    <div key={p.id} onClick={() => { setSelectedItem(p); setTempQuantity(1); navigateSubView('product_detail'); }} className="flex gap-6 p-5 rounded-[45px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 shadow-none hover:shadow-2xl hover:border-primary/20 active:scale-[0.98] transition-all group cursor-pointer relative overflow-hidden">
                      <div className="relative overflow-hidden size-32 rounded-[35px] shrink-0 shadow-xl group-hover:shadow-primary/10 transition-shadow">
                        <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-3 left-3 size-8 bg-primary rounded-2xl flex items-center justify-center font-black text-[12px] text-slate-900 border border-white/20 shadow-lg">#{idx + 1}</div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                          <div className="size-12 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-all duration-300">
                            <span className="material-symbols-outlined text-xl font-black">add</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleShopClick({ ...shop, type: 'restaurant' })} 
                  className="w-full mt-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[35px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 group-hover:text-slate-900 transition-colors">Ver opções do Açaí</span>
                  <span className="material-symbols-outlined text-xl font-black group-hover:translate-x-2 transition-transform relative z-10 group-hover:text-slate-900 transition-colors">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };


  const renderJaponesaList = () => {
    const japaneseShops = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-40 min",
      freeDelivery: estab.freeDelivery || true,
      banner: estab.banner,
      logo: estab.img,
      products: [] as any[]
    }));

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Culinária Japonesa</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sushi, Temaki & Hot</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">{cart.length}</span>}
            </button>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar sushi, temaki..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-12 pt-8">
          {japaneseShops.filter(shop => 
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map((shop, i) => (
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={shop.id} className="bg-white dark:bg-slate-900 rounded-[60px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group">
              <div className="relative h-64">
                <img src={shop.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-5">
                  <div className="size-20 rounded-[28px] bg-white p-2 shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                    <img src={shop.logo} className="size-full rounded-[20px] object-cover" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">{shop.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-white/80">
                      <span className="text-primary flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="material-symbols-outlined text-[16px] fill-1">star</span>{shop.rating}
                      </span>
                      <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                         <span className="material-symbols-outlined text-[16px]">schedule</span>{shop.time}
                      </span>
                      {shop.freeDelivery && <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] shadow-lg">FRETE GRÁTIS</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    <p className="text-[13px] font-black uppercase text-slate-400 tracking-[0.2em]">Kits & Combinados</p>
                  </div>
                  <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 mx-6 opacity-50" />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {shop.products.slice(0, 3).map((p, idx) => (
                    <div key={p.id} onClick={() => { setSelectedItem(p); setTempQuantity(1); navigateSubView('product_detail'); }} className="flex gap-6 p-5 rounded-[45px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 shadow-none hover:shadow-2xl hover:border-primary/20 active:scale-[0.98] transition-all group cursor-pointer relative overflow-hidden">
                      <div className="relative overflow-hidden size-32 rounded-[35px] shrink-0 shadow-xl group-hover:shadow-primary/10 transition-shadow">
                        <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute top-3 left-3 size-8 bg-primary rounded-2xl flex items-center justify-center font-black text-[12px] text-slate-900 border border-white/20 shadow-lg">#{idx + 1}</div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                          <div className="size-12 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-all duration-300">
                            <span className="material-symbols-outlined text-xl font-black">add</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleShopClick({ ...shop, type: 'restaurant' })} 
                  className="w-full mt-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[35px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 group-hover:text-slate-900 transition-colors">Ver Combinados Completos</span>
                  <span className="material-symbols-outlined text-xl font-black group-hover:translate-x-2 transition-transform relative z-10 group-hover:text-slate-900 transition-colors">arrow_forward</span>
                </button>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderExploreCategory = () => {
    if (!exploreCategoryState) return null;

    const mockData: Record<string, any[]> = {
      flowers: [
        { id: 8001, name: "Floricultura Magnólia", rating: "4.9", time: "30-50 min", tag: "Premium", banner: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800", logo: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=200", freeDelivery: true },
        { id: 8002, name: "Bouquet & Co", rating: "4.8", time: "40-60 min", tag: "Artesanal", banner: "https://images.unsplash.com/photo-1596003906949-67221c37965c?q=80&w=800", logo: "https://images.unsplash.com/photo-1596003906949-67221c37965c?q=80&w=200", freeDelivery: false, fee: "R$ 12,00" },
        { id: 8003, name: "Jardim Secreto", rating: "5.0", time: "20-40 min", tag: "Luxo", banner: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800", logo: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=200", freeDelivery: true },
      ],
      sweets: [
        { id: 8101, name: "Confeitaria D'Or", rating: "4.9", time: "25-40 min", tag: "Francesa", banner: "https://images.unsplash.com/photo-1578985542846-399fe5c5f47d?q=80&w=800", logo: "https://images.unsplash.com/photo-1578985542846-399fe5c5f47d?q=80&w=200", freeDelivery: true },
        { id: 8102, name: "Bolos da Júlia", rating: "4.7", time: "60-90 min", tag: "Caseiro", banner: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800", logo: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=200", freeDelivery: false, fee: "R$ 8,00" },
        { id: 8103, name: "The Chocolate Factory", rating: "4.8", time: "20-30 min", tag: "Chocolates", banner: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=800", logo: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=200", freeDelivery: true },
      ],
      pets: [
        { id: 8201, name: "Puppy Luxury Store", rating: "4.9", time: "30-45 min", tag: "Pet Boutique", banner: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800", logo: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=200", freeDelivery: true },
        { id: 8202, name: "Petz Exclusive", rating: "4.8", time: "20-35 min", tag: "Geral", banner: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=800", logo: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=200", freeDelivery: true },
        { id: 8203, name: "Miau & Cia", rating: "4.7", time: "30-50 min", tag: "Gatos", banner: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800", logo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200", freeDelivery: false, fee: "R$ 5,00" },
      ]
    };

    const shops = mockData[exploreCategoryState.id] || [];
    const accentColor = exploreCategoryState.primaryColor;

    return (
      <div className="absolute inset-0 z-40 bg-white dark:bg-[#0F172A] flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <div className="relative h-72 shrink-0">
          <img src={exploreCategoryState.banner} className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0F172A] via-black/20 to-transparent" />
          
          <div className="absolute top-8 left-6 right-6 flex items-center justify-between">
            <button 
              onClick={() => setSubView('none')} 
              className="size-12 rounded-[22px] bg-white/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all font-black"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <button className="size-12 rounded-[22px] bg-white/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all font-black">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>

          <div className="absolute bottom-10 left-8">
             <div className={`px-4 py-1.5 rounded-full bg-${accentColor} text-white text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-3 shadow-lg shadow-${accentColor}/30`}>
                {exploreCategoryState.tagline}
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
                {exploreCategoryState.title}
             </h1>
          </div>
        </div>

        <main className="px-6 space-y-8 -mt-6 relative z-10">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {['Em Destaque', 'Mais Próximos', 'Novidades', 'Melhor Avaliados'].map((filter, i) => (
              <button 
                key={i} 
                className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all ${i === 0 ? `bg-slate-900 dark:bg-primary text-white dark:text-slate-900 shadow-xl shadow-primary/20` : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400'}`}
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
                className="bg-white dark:bg-slate-900 rounded-[45px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 group relative"
              >
                <div className="h-44 relative overflow-hidden">
                  <img src={shop.banner} className="size-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
                     <span className="material-symbols-outlined text-amber-500 text-[16px] fill-1">star</span>
                     <span className="text-[11px] font-black text-slate-900">{shop.rating}</span>
                  </div>
                </div>
                <div className="p-6 flex items-center gap-5">
                  <div className="size-14 rounded-[20px] bg-white p-1 shadow-xl shrink-0 border border-slate-50">
                    <img src={shop.logo} className="size-full rounded-[15px] object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">{shop.name}</h3>
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
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
      fee: estab.freeDelivery ? undefined : "R$ 4,90",
      tag: estab.tag || "Restaurante",
      banner: estab.banner,
      logo: estab.img,
    }));

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group font-black">
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Explorar Restaurantes</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tudo o que você ama</p>
              </div>
            </div>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar por gênero ou nome..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8 pt-8">
          {allShops.filter(shop => shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || shop.tag.toLowerCase().includes(searchQuery.toLowerCase())).map((shop, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={shop.id}
              onClick={() => handleShopClick({ ...shop, type: 'restaurant' })}
              className="bg-white dark:bg-slate-900 rounded-[45px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 group relative"
            >
              <div className="h-48 relative overflow-hidden">
                <img src={shop.banner} className="size-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
                   <span className="material-symbols-outlined text-primary text-[16px] fill-1">star</span>
                   <span className="text-[11px] font-black text-slate-900">{shop.rating}</span>
                </div>
              </div>
              <div className="p-6 flex items-center gap-5">
                <div className="size-16 rounded-[22px] bg-white p-1.5 shadow-2xl shrink-0 group-hover:-rotate-3 transition-transform border border-slate-100">
                  <img src={shop.logo} className="size-full rounded-[16px] object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{shop.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="text-primary">{shop.tag}</span>
                    <span>•</span>
                    <span>{shop.time}</span>
                    <span>•</span>
                    <span className={shop.freeDelivery ? "text-emerald-500" : ""}>{shop.freeDelivery ? "Grátis" : shop.fee}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderDailyMenus = () => {
    const specials: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Cardápios do Dia</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Sugestões Especiais</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-10 pt-8">
           <div className="bg-pink-500/5 p-8 rounded-[45px] border border-pink-500/10 mb-2">
             <h2 className="text-lg font-black text-pink-600 dark:text-pink-400 mb-2 leading-none uppercase tracking-tighter">Ofertas de Hoje</h2>
             <p className="text-xs font-medium text-slate-500">Seus pratos favoritos com preços exclusivos para hoje.</p>
           </div>

           <div className="grid grid-cols-1 gap-6">
                {specials.map((p, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={p.id}
                  onClick={() => { handleAddToCart(p); }}
                  className="bg-white dark:bg-slate-900 rounded-[50px] p-6 shadow-2xl border border-slate-100 dark:border-white/5 group relative active:scale-95 transition-all overflow-hidden"
                >
                  <div className="flex gap-6">
                    <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-2xl relative">
                       <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       <div className="absolute top-3 left-3 bg-pink-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg">HOJE</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                       <p className="text-[9px] font-black uppercase tracking-widest text-pink-500 mb-1">{p.store}</p>
                       <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 truncate group-hover:text-pink-500 transition-colors">{p.name}</h3>
                       <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                       <div className="flex items-center justify-between">
                         <span className="text-xl font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                         <div className="size-11 rounded-[18px] bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all shadow-lg">
                           <span className="material-symbols-outlined text-xl font-black">add</span>
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
    const exclusiveDeals: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-slate-900 text-white flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-3xl border-b border-primary/20 pb-8 px-8 pt-10">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setSubView("none")} 
              className="size-16 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all group"
            >
              <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tighter leading-none mb-1 text-primary">Ofertas Flash</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Exclusivo: Membros VIP</p>
            </div>
            <div className="size-16 rounded-[28px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
              <span className="material-symbols-outlined text-primary font-black animate-pulse">bolt</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary to-orange-500 rounded-[35px] p-6 flex items-center justify-between shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined font-black">timer</span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-900/60 leading-none mb-1">Termina em</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">02:45:12</p>
              </div>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-900 bg-white/30 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">Aproveite agora!</span>
          </div>
        </header>

        <main className="p-8 space-y-8">
          {exclusiveDeals.map((deal, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
              key={deal.id}
              onClick={() => { handleAddToCart(deal); }}
              className="relative bg-white/5 rounded-[50px] overflow-hidden border border-white/10 group cursor-pointer active:scale-[0.98] transition-all hover:bg-white/[0.08]"
            >
              <div className="h-72 relative overflow-hidden">
                <img src={deal.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-[4000ms]" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <div className="absolute top-6 left-6 bg-red-600 px-5 py-2.5 rounded-[20px] shadow-2xl animate-bounce-slow">
                  <span className="text-xs font-black uppercase tracking-widest">{deal.off}</span>
                </div>
                <div className="absolute bottom-6 left-8 right-8">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{deal.store}</p>
                   <h3 className="text-2xl font-black tracking-tighter leading-tight drop-shadow-md">{deal.name}</h3>
                </div>
              </div>
              
              <div className="p-8">
                <p className="text-sm text-white/50 font-medium mb-8 leading-relaxed line-clamp-2">{deal.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white/30 line-through tracking-tighter leading-none">R$ {deal.oldPrice.toFixed(2).replace('.', ',')}</span>
                      <span className="text-3xl font-black text-white tracking-tighter leading-none">R$ {deal.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <div className="size-16 rounded-[28px] bg-primary text-slate-900 flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    <span className="material-symbols-outlined text-3xl font-black">add</span>
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
    const brazilianShops = ESTABLISHMENTS.map((estab: any) => ({
      id: estab.id,
      name: estab.name,
      rating: estab.rating || "5.0",
      time: estab.time || "30-40 min",
      freeDelivery: estab.freeDelivery || true,
      banner: estab.banner,
      logo: estab.img,
      products: [] as any[]
    }));

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-xl">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Culinária Brasileira</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pratos Típicos & Caseiros</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-12 pt-8">
          {brazilianShops.map((shop, i) => (
             <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={shop.id} className="bg-white dark:bg-slate-900 rounded-[60px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 group">
                <div className="h-60 relative overflow-hidden">
                  <img src={shop.banner} className="size-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="size-16 rounded-[20px] bg-white p-1 shadow-2xl">
                      <img src={shop.logo} className="size-full rounded-[16px] object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-white mb-1">{shop.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/80">
                         <span className="text-primary flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] fill-1">star</span>{shop.rating}</span>
                         <span>•</span>
                         <span>{shop.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                   {shop.products.map((p) => (
                     <div key={p.id} onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }} className="flex items-center gap-6 p-4 rounded-[40px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group/item">
                        <div className="size-24 rounded-[30px] overflow-hidden shrink-0 shadow-lg group-hover/item:scale-105 transition-transform">
                          <img src={p.img} className="size-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-black text-slate-900 dark:text-white group-hover/item:text-primary transition-colors mb-1">{p.name}</h4>
                           <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mb-2">{p.desc}</p>
                           <span className="text-lg font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="size-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all">
                           <span className="material-symbols-outlined font-black">add</span>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderHealthPlantao = () => {
    const healthOffers: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-primary/20 pb-6 shadow-xl">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => navigateSubView('pharmacy_list')} 
                className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Plantão de Saúde</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ofertas Relâmpago de Hoje</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-8 pt-8">
           <div className="bg-slate-900 text-white p-10 rounded-[60px] relative overflow-hidden shadow-2xl mb-4">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-primary text-5xl mb-4 animate-pulse">medical_services</span>
                <h2 className="text-4xl font-black tracking-tighter mb-4 leading-none">Cuidado Premium <br />Pela Metade do Preço</h2>
                <p className="opacity-60 text-sm font-medium max-w-[200px]">Somente nas próximas 12 horas ou enquanto durarem os estoques.</p>
              </div>
              <div className="absolute -right-10 -bottom-10 size-64 bg-primary/20 rounded-full blur-[100px]" />
           </div>

           <div className="grid grid-cols-1 gap-6">
              {healthOffers.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={item.id}
                  onClick={() => { handleAddToCart(item); }}
                  className="p-6 bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl border border-slate-50 dark:border-white/5 flex items-center gap-6 group relative active:scale-95 transition-all overflow-hidden"
                >
                  <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-500">
                     <img src={item.img} className="size-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">{item.store} • {item.cat}</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 leading-tight truncate group-hover:text-primary transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                          <span className="text-sm font-bold text-slate-400 line-through opacity-60">R$ {item.oldPrice.toFixed(2).replace('.', ',')}</span>
                       </div>
                       <div className="bg-red-500 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-lg">{item.off}</div>
                    </div>
                  </div>
                  <div className="size-12 rounded-[22px] bg-primary text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined font-black">add_shopping_cart</span>
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
      <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-white/5 pb-6">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => setSubView('pharmacy_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Todas as Farmácias</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Unidades Próximas</p>
              </div>
            </div>
          </div>
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-xl relative group overflow-hidden">
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar farmácia..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
              className="p-6 bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl border border-slate-50 dark:border-white/5 flex items-center gap-6 group relative active:scale-95 transition-all overflow-hidden"
            >
              <div className="size-24 rounded-[30px] overflow-hidden shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500">
                 <img src={pharm.img} className="size-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight truncate group-hover:text-primary transition-colors">{pharm.name}</h3>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px] fill-1">star</span>
                    <span className="text-slate-900 dark:text-white">{pharm.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{pharm.time}</span>
                  <span>•</span>
                  <span className={pharm.freeDelivery ? "text-emerald-500" : ""}>{pharm.freeDelivery ? "Grátis" : pharm.fee}</span>
                </div>
              </div>
              <div className="size-12 rounded-[22px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary transition-colors">
                <span className="material-symbols-outlined font-black group-hover:text-slate-900 transition-colors">arrow_forward</span>
              </div>
            </motion.div>
          ))}
        </main>
      </div>
    );
  };

  const renderGenericList = () => {
    if (!activeService) return null;

    const data: any = {
      pet: {
        title: "Pet Shops",
        tagline: "Cuidado & Carinho",
        shops: [
          { name: "Petz Store VIP", tag: "Premium", rating: "4.9", time: "25-45 min", img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=300", freeDelivery: true },
          { name: "Amigo Bicho", tag: "Acessórios", rating: "4.7", time: "40-50 min", img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=300", freeDelivery: false, fee: "R$ 7,90" },
        ],
        products: [
          { id: 401, name: "Ração Golden 3kg", price: 54.9, desc: "Sabor carne para cães adultos.", img: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=300" },
          { id: 402, name: "Brinquedo Mordedor", price: 15.0, desc: "Borracha atóxica durável.", img: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=300" },
          { id: 403, name: "Cama Soft Dream", price: 89.90, desc: "Conforto máximo para o seu pet.", img: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?q=80&w=300" },
        ],
      },
      beverages: {
        title: "Bebidas",
        tagline: "Geladas no Ponto",
        shops: [
          { name: "Adega Top Prime", tag: "Geladas", rating: "4.8", time: "10-20 min", img: "https://images.unsplash.com/photo-1528913135592-4abd73f8a0aa?q=80&w=300", freeDelivery: true },
          { name: "Empório da Cerva", tag: "Artesanais", rating: "4.9", time: "15-25 min", img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=300", freeDelivery: true },
        ],
        products: [
          { id: 501, name: "Vinho Tinto Reserva", price: 45.0, desc: "Cabernet Sauvignon 750ml.", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300" },
          { id: 502, name: "Heineken 6-pack", price: 34.90, desc: "Long Neck 330ml.", img: "https://images.unsplash.com/photo-1503920306624-94636ad82bfb?q=80&w=300" },
        ],
      },
      rest: {
        title: "Serviços",
        tagline: "Tudo que você precisa",
        shops: [],
        products: []
      },
      medicamentos: {
        title: "Remédios",
        tagline: "Sua saúde em primeiro lugar",
        shops: [
          { name: "Droga Raia Premium", rating: "4.9", time: "10 min", img: "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=300", freeDelivery: true },
          { name: "Pague Menos Express", rating: "4.8", time: "15 min", img: "https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=300", fee: "R$ 4,90" },
        ],
        products: [
          { id: 901, name: "Ibuprofeno 600mg", price: 14.90, desc: "Alívio de dor e febre.", img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=300" },
          { id: 902, name: "Antigripal Multi", price: 19.90, desc: "Combate sintomas da gripe.", img: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=300" },
        ]
      },
      higiene: {
        title: "Higiene & Cuidados",
        tagline: "Frescor para o seu dia",
        shops: [
          { name: "Drugstore Luxury", rating: "5.0", time: "10 min", img: "https://images.unsplash.com/photo-1631549448223-1f629c9bb6ad?q=80&w=300", freeDelivery: true },
        ],
        products: [
          { id: 910, name: "Shampoo Anticaspa", price: 32.50, desc: "Ação profunda e duradoura.", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300" },
          { id: 911, name: "Creme Dental Pro", price: 15.90, desc: "Branqueamento avançado.", img: "https://images.unsplash.com/photo-1559591937-e6b7d27e279b?q=80&w=300" },
        ]
      },
      dermocosmeticos: {
        title: "Beleza & Dermos",
        tagline: "Cuidado com sua pele",
        shops: [
          { name: "Droga Raia Premium", rating: "4.9", time: "10 min", img: "https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=300", freeDelivery: true },
        ],
        products: [
          { id: 920, name: "Sérum Hidratante", price: 89.00, desc: "Ácido hialurônico puro.", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=300" },
          { id: 921, name: "Protetor FPS 50", price: 54.90, desc: "Toque seco e invisível.", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=300" },
        ]
      },
      vitaminas: {
        title: "Saúde & Vitaminas",
        tagline: "Energia e Imunidade",
        shops: [
          { name: "Pague Menos Express", rating: "4.8", time: "15 min", img: "https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=300", fee: "R$ 4,90" },
        ],
        products: [
          { id: 930, name: "Multivitamínico A-Z", price: 45.00, desc: "Todas as vitaminas essenciais.", img: "https://images.unsplash.com/photo-1614859324967-bdf739e9cc21?q=80&w=300" },
          { id: 931, name: "Vitamina C 1g", price: 18.20, desc: "Tabletes efervescentes.", img: "https://images.unsplash.com/photo-1614859324967-bdf739e9cc21?q=80&w=300" },
        ]
      }
    };

    const serviceData = data[activeService.subType] || data[activeService.type] || data.rest;

    return (
      <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/5 pb-4">
          <div className="flex items-center p-5 pb-2 justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSubView('none')} 
                className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-none mb-1">{serviceData.title}</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{serviceData.tagline}</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center group">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg">{cart.length}</span>}
            </button>
          </div>
          <div className="px-5 mt-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group">
              <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
                placeholder={`Buscar em ${serviceData.title}...`} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-12 py-8">
          {/* Section Establishments */}
          {serviceData.shops.length > 0 && (
            <section>
              <div className="px-5 flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Destaques</h2>
                  <p className="text-lg font-black tracking-tighter">Melhores Avaliados</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-primary">Ver Todos</button>
              </div>
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 px-5">
                {serviceData.shops.filter((s: any) => 
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.tag?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((shop: any, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    onClick={() => handleShopClick(shop)}
                    className="min-w-[280px] bg-white dark:bg-slate-800 p-5 rounded-[45px] border border-white/5 active:scale-95 transition-all shadow-2xl shadow-slate-200/50 dark:shadow-black/20 group cursor-pointer"
                  >
                    <div className="h-40 rounded-[35px] overflow-hidden mb-5 relative shadow-inner">
                      <img src={shop.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl">
                        <span className="material-symbols-outlined text-primary text-sm fill-1">star</span>
                        <span className="text-[10px] font-black text-slate-900">{shop.rating}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{shop.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>{shop.time}</span>
                        <span>•</span>
                        <span className={shop.freeDelivery ? "text-emerald-500" : ""}>{shop.freeDelivery ? "Entrega Grátis" : shop.fee}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Section Products */}
          {serviceData.products.length > 0 && (
            <section className="px-5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Para Você</h2>
                  <p className="text-lg font-black tracking-tighter">Ofertas do Dia</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {serviceData.products.filter((p: any) => 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.desc.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((p: any, i: number) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    onClick={() => { handleAddToCart(p); }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-[40px] border border-white/5 flex items-center gap-6 active:scale-[0.98] transition-all group cursor-pointer shadow-xl shadow-slate-100/50 dark:shadow-black/10"
                  >
                    <div className="size-24 rounded-[30px] overflow-hidden shrink-0 shadow-lg">
                      <img src={p.img} className="size-full object-cover group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-[15px] text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">{p.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mb-3">{p.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                        <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-slate-900 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined font-black">add</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  };




  const renderRestaurantList = () => {
    const foodCategories = [
      { id: "all", name: "Restaurantes", icon: "restaurant", gradient: "linear-gradient(135deg, #f59e0b, #eab308)" },
      { id: "daily", name: "Cardápio do Dia", icon: "today", gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
      { id: "burgers", name: "Burgers", icon: "lunch_dining", gradient: "linear-gradient(135deg, #f97316, #ef4444)" },
      { id: "pizza", name: "Pizza", icon: "local_pizza", gradient: "linear-gradient(135deg, #10b981, #0d9488)" },
      { id: "acai", name: "Açaí", icon: "grass", gradient: "linear-gradient(135deg, #8b5cf6, #d946ef)" },
      { id: "japones", name: "Japonesa", icon: "set_meal", gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
      { id: "brasileira", name: "Brasileira", icon: "dinner_dining", gradient: "linear-gradient(135deg, #22c55e, #15803d)" },
    ];



    const mostOrderedItems: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setSubView("none")} 
                className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
              >
                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Restaurantes</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Descubra novos sabores</p>
              </div>
            </div>
            <button 
              onClick={() => cart.length > 0 && navigateSubView("cart")} 
              className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="px-6 mt-4">
            <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
               <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
               <input 
                className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" 
                placeholder="Qual sua vontade hoje?" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
               />
               {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-all relative z-10"
                >
                  <span className="material-symbols-outlined text-lg font-black">close</span>
                </button>
               )}
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-12 pt-10 px-6">
          {/* VIP OFFERS SECTION */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
               <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Ofertas VIP</h3>
                <div className="w-10 h-1.5 bg-primary rounded-full mt-1.5" />
               </div>
               <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver todas</button>
            </div>
            
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {availableCoupons.filter(p => p.is_vip).length > 0 ? (
                availableCoupons.filter(p => p.is_vip).map((cpn, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 50 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }} 
                    key={cpn.id || i} 
                    className="min-w-[320px] h-[180px] rounded-[48px] p-8 flex flex-col justify-between relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl"
                  >
                    {/* Glassmorphism Background with Image */}
                    <div className="absolute inset-0 z-0">
                      <img src={cpn.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800"} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${['#f97316', '#10b981', '#8b5cf6', '#ec4899'][i % 4]}, ${['#f97316', '#10b981', '#8b5cf6', '#ec4899'][i % 4]}CC)` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>

                    <div className="relative z-10">
                      <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4 inline-block">
                        {cpn.title || "Oferta Especial"}
                      </span>
                      <h4 className="text-4xl font-black tracking-tighter text-white leading-none">
                        {cpn.discount_type === 'percent' ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`} <span className="text-xl opacity-80 uppercase tracking-widest">OFF</span>
                      </h4>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      {cpn.coupon_code ? (
                        <div 
                          onClick={() => {
                            navigator.clipboard.writeText(cpn.coupon_code);
                            setCopiedCoupon(cpn.coupon_code);
                            setTimeout(() => setCopiedCoupon(null), 2000);
                          }}
                          className="bg-white text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all"
                        >
                           <span className="text-sm font-black tracking-widest uppercase">{cpn.coupon_code}</span>
                           <span className="material-symbols-outlined text-lg">{copiedCoupon === cpn.coupon_code ? 'check' : 'content_copy'}</span>
                        </div>
                      ) : (
                        <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest bg-black/20 backdrop-blur px-4 py-2 rounded-xl">
                          Desconto Automático
                        </div>
                      )}
                      <div className="size-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-white group-hover:text-slate-900 transition-all">
                         <span className="material-symbols-outlined text-xl font-black">arrow_forward</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                /* FALLBACK MARKETING AREA */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full min-h-[180px] rounded-[48px] p-8 flex items-center justify-between relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                >
                  <div className="absolute inset-0 opacity-40">
                    <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
                  </div>
                  
                  <div className="relative z-10 max-w-[60%]">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Membro Premium</span>
                    <h4 className="text-3xl font-black text-white tracking-tighter leading-tight mb-4">
                      Torne-se <span className="text-primary">VIP</span> e economize em cada pedido!
                    </h4>
                    <button className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                      Saber Mais
                    </button>
                  </div>
                  
                  <div className="relative z-10 hidden sm:block">
                    <div className="size-24 rounded-full bg-primary/20 backdrop-blur-3xl flex items-center justify-center border border-primary/30">
                      <span className="material-symbols-outlined text-primary text-5xl font-black animate-pulse">workspace_premium</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* QUICK CATEGORIES */}
          <section>
            <div className="grid grid-cols-3 gap-6">
              {foodCategories.map((cat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }} 
                  key={cat.id} 
                  onClick={() => { 
                    if (cat.id === "all") navigateSubView("explore_restaurants");
                    else if (cat.id === "daily") navigateSubView("daily_menus");
                    else if (cat.id === "burgers") navigateSubView("burger_list"); 
                    else if (cat.id === "pizza") navigateSubView("pizza_list"); 
                    else if (cat.id === "acai") navigateSubView("acai_list"); 
                    else if (cat.id === "japones") navigateSubView("japonesa_list"); 
                    else if (cat.id === "brasileira") navigateSubView("brasileira_list"); 
                  }} 
                  className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-all"
                >
                  <div 
                    className="w-full aspect-square rounded-[35px] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all group-hover:rotate-3" 
                    style={{ background: cat.gradient }}
                  >
                    {/* Glass Decoration */}
                    <div className="absolute -top-1/2 -right-1/2 size-full bg-white/20 rounded-full blur-[40px]" />
                    <span className="material-symbols-outlined text-white text-[42px] font-black drop-shadow-2xl relative z-10 transform group-hover:scale-110 transition-transform">{cat.icon}</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* MOST ORDERED SECTION */}
          <section>
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Mais Pedidos</h3>
                <div className="w-10 h-1.5 bg-primary rounded-full mt-1.5" />
              </div>
              <div className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-primary animate-pulse-gentle">
                <span className="material-symbols-outlined text-xl font-black">trending_up</span>
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-6 mt-2">
              {mostOrderedItems.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  whileInView={{ opacity: 1, scale: 1 }} 
                  key={item.id} 
                  className="min-w-[300px] bg-white dark:bg-slate-900 rounded-[50px] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-primary text-[40px] opacity-20">verified</span>
                  </div>

                  <div className="relative h-44 rounded-[38px] overflow-hidden mb-6 shadow-2xl">
                    <img src={item.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-4 left-4 size-10 bg-primary rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-2xl border border-white/20">
                      {i + 1}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 truncate group-hover:text-primary transition-colors">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary/70">{item.store}</span>
                        </div>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-[14px] text-primary fill-1">star</span>
                        <span className="text-xs font-black text-primary">{item.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                      <span className="text-xl font-black text-slate-900 dark:text-white">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                      <div className="size-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-2xl group-hover:bg-primary group-hover:text-slate-900 transition-all">
                        <span className="material-symbols-outlined font-black">add</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ALL RESTAURANTS SECTION */}
          <section className="space-y-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Mais Proximos</h3>
                <div className="w-10 h-1.5 bg-primary rounded-full mt-1.5" />
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                Filtrar <span className="material-symbols-outlined text-sm">filter_list</span>
              </button>
            </div>

            <div className="space-y-8 pb-10">
              {ESTABLISHMENTS.filter(shop => 
                shop.type === 'restaurant' &&
                shop.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((shop) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  key={shop.id} 
                  onClick={() => handleShopClick({ ...shop, type: "restaurant" })} 
                  className="bg-white dark:bg-slate-900 p-5 rounded-[50px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] border border-white dark:border-white/5 group active:scale-[0.98] transition-all flex flex-col gap-6"
                >
                  <div className="relative h-60 rounded-[42px] overflow-hidden shadow-2xl">
                    <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-5 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/20 scale-100 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[16px] text-primary fill-1">star</span>
                      <span className="text-[13px] font-black">{shop.rating}</span>
                    </div>

                    {shop.freeDelivery && (
                       <div className="absolute bottom-5 left-5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 translate-y-0 group-hover:-translate-y-2 transition-transform">
                         <span className="material-symbols-outlined text-[16px] animate-pulse">check_circle</span>
                         Entrega Grátis
                       </div>
                    )}
                  </div>

                  <div className="px-4 pb-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tighter mb-2 group-hover:text-primary transition-colors leading-none">
                        {shop.name}
                      </h4>
                      <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl">
                          <span className="material-symbols-outlined text-sm text-primary opacity-60">local_fire_department</span>
                          {shop.tag}
                        </span>
                        <span className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl">
                          <span className="material-symbols-outlined text-sm text-primary opacity-60">schedule</span>
                          {shop.time}
                        </span>
                      </div>
                    </div>
                    <div className="size-14 rounded-[22px] bg-slate-50 dark:bg-slate-800/80 group-hover:bg-primary flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all duration-500 shadow-inner group-hover:shadow-[0_10px_20px_-5px_rgba(255,193,7,0.5)]">
                      <span className="material-symbols-outlined text-2xl font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };


  const renderMarketList = () => {
    const marketCategories = [
      { id: 'hortifruti', name: 'Hortifruti', icon: 'eco', color: 'bg-emerald-500', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
      { id: 'carnes', name: 'Carnes', icon: 'restaurant', color: 'bg-red-500', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
      { id: 'bebidas', name: 'Bebidas', icon: 'local_bar', color: 'bg-indigo-500', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
      { id: 'higiene', name: 'Higiene', icon: 'clean_hands', color: 'bg-purple-500', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' },
      { id: 'padaria', name: 'Padaria', icon: 'bakery_dining', color: 'bg-orange-500', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
    ];

    const dailyDeals: any[] = [];

    return (
      <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/5 pb-4">
          <div className="flex items-center p-5 pb-2 justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button 
                onClick={() => setSubView('none')} 
                className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight leading-none mb-1 truncate">Supermercados</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                  <span className="truncate">{userLocation.address.split(',')[0]}</span>
                </p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg shrink-0">{cart.length}</span>}
            </button>
          </div>
          <div className="px-5 mt-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group relative">
              <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
                placeholder="Buscar no mercado..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-12 py-8">
          {/* Categories Horizontal */}
          <section>
            <div className="flex gap-6 px-5 overflow-x-auto no-scrollbar">
              {marketCategories.map((cat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={cat.id}
                  onClick={() => {
                    setActiveService({ ...activeService, subType: cat.id });
                    navigateSubView('generic_list');
                  }}
                  className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer active:scale-95 transition-all"
                >
                  <div className="size-20 rounded-[30px] flex items-center justify-center shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform" style={{ background: cat.gradient }}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <span className="material-symbols-outlined text-white text-4xl leading-none drop-shadow-lg">{cat.icon}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Flash Deals */}
          <section className="px-5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Imperdíveis</h2>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-black tracking-tighter">Ofertas Relâmpago</p>
                  <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse uppercase tracking-widest">Flash Sale</div>
                </div>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary">Ver Tudo</button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {dailyDeals.filter(deal => 
                deal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                deal.cat.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((deal, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={deal.id}
                  onClick={() => {
                    setSelectedItem({ ...deal, desc: "Oferta especial de mercado disponível por tempo limitado." });
                    setTempQuantity(1);
                    navigateSubView('product_detail');
                  }}
                  className="p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-6 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="size-32 rounded-[35px] overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 bg-slate-100 dark:bg-slate-900 shadow-inner">
                    <img src={deal.img} className="w-full h-full object-cover" alt={deal.name} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{deal.cat}</p>
                    <h3 className="font-black text-slate-900 dark:text-white mb-3 text-[15px] leading-tight group-hover:text-primary transition-colors">{deal.name}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 dark:text-white leading-none">R$ {deal.price.toFixed(2).replace('.', ',')}</span>
                        <span className="text-xs text-slate-400 line-through opacity-70">R$ {deal.oldPrice.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black">-{deal.off}</div>
                    </div>
                  </div>
                  <div className="size-11 rounded-[18px] bg-primary flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform self-center">
                    <span className="material-symbols-outlined text-slate-900 font-black">add</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Near Markets Scroller */}
          <section>
            <div className="px-5 flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Próximos</h2>
                <p className="text-xl font-black tracking-tighter">Mercados da Região</p>
              </div>
            </div>
            <div className="flex gap-6 px-5 overflow-x-auto no-scrollbar pb-6">
              {ESTABLISHMENTS.filter(shop => shop.type === 'market').map((market, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={market.id}
                  onClick={() => handleShopClick({ ...market, type: 'market' })}
                  className="min-w-[280px] p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 group active:scale-95 transition-all cursor-pointer"
                >
                  <div className="h-40 rounded-[35px] overflow-hidden mb-5 relative shadow-inner">
                    <img src={market.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={market.name} />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl">
                      <span className="material-symbols-outlined text-primary text-[13px] fill-1">star</span>
                      <span className="text-[11px] font-black text-slate-900">{market.rating}</span>
                    </div>
                    {market.freeDelivery && (
                       <div className="absolute bottom-4 left-4 bg-emerald-500/90 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">Grátis</div>
                    )}
                  </div>
                  <h3 className="font-black text-[16px] mb-2 group-hover:text-primary transition-colors">{market.name}</h3>
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{market.time} • {market.dist}</span>
                    <span className={market.freeDelivery ? 'text-emerald-500' : ''}>
                      {market.freeDelivery ? 'Entrega Grátis' : market.fee}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const renderBeveragesList = () => {
    const beverageCategories = [
      { id: 'cervejas', name: 'Cervejas', icon: 'sports_bar', color: 'bg-amber-500', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
      { id: 'vinhos', name: 'Vinhos', icon: 'wine_bar', color: 'bg-purple-700', gradient: 'linear-gradient(135deg, #7e22ce, #581c87)' },
      { id: 'destilados', name: 'Destilados', icon: 'liquor', color: 'bg-slate-700', gradient: 'linear-gradient(135deg, #334155, #0f172a)' },
      { id: 'nao_alcoolicos', name: 'Sem Álcool', icon: 'water_drop', color: 'bg-blue-500', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    ];

    const popularShops = ESTABLISHMENTS.filter(e => e.type === 'beverages');

    return (
      <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/5 pb-4">
          <div className="flex items-center p-5 pb-2 justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button 
                onClick={() => setSubView('none')} 
                className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight leading-none mb-1 truncate">Bebidas</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adegas & Distribuidoras</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center shrink-0 group">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg shrink-0">{cart.length}</span>}
            </button>
          </div>
          <div className="px-5 mt-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group relative">
              <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
                placeholder="Qual sua sede hoje? Geladas, vinhos..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-10 py-8">
          {/* Categories Grid */}
          <section className="px-5">
            <div className="grid grid-cols-2 gap-5">
              {beverageCategories.map((cat, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={cat.id}
                  onClick={() => {
                    setActiveService({ ...activeService, subType: cat.id });
                    navigateSubView('generic_list');
                  }}
                  className="p-5 rounded-[40px] flex flex-col items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-xl shadow-slate-200/50 dark:shadow-black/20 group relative overflow-hidden"
                  style={{ background: cat.gradient }}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <span className="material-symbols-outlined text-white text-5xl leading-none drop-shadow-xl">{cat.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 text-center">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Luxury Promotional Card (Dynamic) */}
          <section className="px-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              onClick={() => navigateSubView('beverage_offers')}
              className="bg-gradient-to-br from-slate-900 to-indigo-900 min-h-[220px] rounded-[50px] text-white relative overflow-hidden shadow-2xl group cursor-pointer"
            >
              {beverageBanners.length > 0 ? (
                <>
                  <img 
                    src={beverageBanners[0].image_url} 
                    className="absolute inset-0 size-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[3000ms]" 
                    alt="Promo" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                  <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 bg-primary text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none mb-4 w-fit">
                      Destaque em Bebidas
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none italic text-primary">
                      {beverageBanners[0].title}
                    </h2>
                    {beverageBanners[0].description && (
                      <p className="opacity-70 text-[11px] font-bold mb-4 leading-relaxed max-w-[250px] line-clamp-2">
                        {beverageBanners[0].description}
                      </p>
                    )}
                    <button className="bg-white text-slate-900 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-transform w-fit mt-2">Ver Ofertas</button>
                  </div>
                </>
              ) : (
                <div className="p-8 relative z-10">
                  <div className="inline-flex items-center gap-2 bg-primary text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none mb-4">Especial Fim de Semana</div>
                  <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none italic text-primary">Happy Hour em Casa</h2>
                  <p className="opacity-70 text-[11px] font-bold mb-6 leading-relaxed max-w-[200px]">Cervejas artesanais com entrega em até 15 minutos. Geladas garantidas!</p>
                  <button className="bg-white text-slate-900 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-transform">Ver Ofertas</button>
                </div>
              )}
              <span className="absolute -right-4 -bottom-4 material-symbols-outlined text-[150px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">celebration</span>
            </motion.div>
          </section>

          {/* Near Adagas */}
          <section>
            <div className="flex items-center justify-between px-5 mb-8">
              <div>
                <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Destaques</h2>
                <p className="text-xl font-black tracking-tighter">Próximo a Você</p>
              </div>
            </div>
            <div className="flex flex-col gap-6 px-5 pb-8">
              {popularShops.map((shop, i) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleShopClick({ ...shop, type: 'beverages' })}
                  className="p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-6 active:scale-[0.98] transition-all group cursor-pointer"
                >
                  <div className="size-20 rounded-[28px] overflow-hidden shrink-0 shadow-inner bg-slate-100 dark:bg-slate-900">
                    <img src={shop.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={shop.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white leading-tight text-base truncate mb-1.5 group-hover:text-primary transition-colors">{shop.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[15px] fill-1">star</span>
                        <span className="text-slate-900 dark:text-white">{shop.rating}</span>
                      </div>
                      <span className="opacity-50">•</span>
                      <span>{shop.time}</span>
                    </div>
                  </div>
                  <div className="size-11 rounded-[18px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-slate-900 transition-all shadow-inner">
                    <span className="material-symbols-outlined text-lg font-black">arrow_forward</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const renderBeverageOffers = () => {
    const deals = beverageOffers;

    return (
      <div className="absolute inset-0 z-50 bg-slate-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-[60] bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 p-6 flex items-center gap-6">
           <button 
            onClick={() => setSubView("beverages_list")}
            className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Ofertas Geladas</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Seleção Premium de Ofertas</p>
          </div>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-slate-950 shadow-xl">{cart.length}</span>}
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
                    <span className="bg-primary text-slate-900 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Limitado</span>
                 </div>
                 <h2 className="text-4xl font-black tracking-tighter leading-tight max-w-[250px] italic text-primary">
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
                  className="bg-white/5 border border-white/10 rounded-[45px] p-5 flex items-center gap-6 group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="size-32 rounded-[35px] overflow-hidden shrink-0 shadow-2xl relative z-10">
                     <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" title={item.name} />
                     <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-md">-{item.off}</div>
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5">{item.cat}</p>
                     <h3 className="text-lg font-black tracking-tight mb-4 leading-tight truncate">{item.name}</h3>
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-xl font-black text-primary leading-none mb-1">R$ {item.price.toFixed(2).replace(".", ",")}</span>
                           <span className="text-xs text-white/40 line-through font-bold">R$ {item.oldPrice.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                            className="size-11 rounded-2xl bg-primary text-slate-900 flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all"
                          >
                            <span className="material-symbols-outlined font-black">
                              {getItemCount(item.id) > 0 ? 'add_shopping_cart' : 'add'}
                            </span>
                          </button>
                          {getItemCount(item.id) > 0 && (
                            <div className="bg-white text-slate-900 size-9 rounded-[14px] flex items-center justify-center text-xs font-black shadow-xl">
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
                className="w-full bg-primary h-[80px] rounded-[35px] px-2 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(255,193,7,0.4)] transition-all active:scale-[0.98] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                
                <div className="flex items-center gap-4 ml-2">
                  <div className="bg-black/10 text-slate-900 size-14 rounded-[24px] flex items-center justify-center font-black text-xl backdrop-blur-md">
                    {cart.length}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-slate-900 text-sm tracking-[0.2em] uppercase leading-none mb-1">CARRINHO</span>
                    <span className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Finalizar Pedido</span>
                  </div>
                </div>

                <div className="bg-slate-900 text-white h-14 px-8 rounded-[24px] flex items-center justify-center mr-2 shadow-2xl">
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
    const pharmacyCategories = [
      { id: 'medicamentos', name: 'Remédios', icon: 'medical_services', color: 'bg-red-500', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
      { id: 'higiene', name: 'Higiene', icon: 'clean_hands', color: 'bg-blue-500', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
      { id: 'dermocosmeticos', name: 'Beleza', icon: 'face', color: 'bg-pink-500', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
      { id: 'vitaminas', name: 'Saúde', icon: 'pill', color: 'bg-amber-500', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    ];

    const nearbyPharmacies = ESTABLISHMENTS.filter(e => e.type === 'pharmacy');

    return (
      <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/5 pb-4">
          <div className="flex items-center p-5 pb-2 justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button 
                onClick={() => setSubView('none')} 
                className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-black tracking-tight leading-none mb-1 truncate">Farmácias</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saúde & Bem-estar</p>
              </div>
            </div>
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center shrink-0 group">
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg shrink-0">{cart.length}</span>}
            </button>
          </div>
          <div className="px-5 mt-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group relative">
              <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
                placeholder="Buscar produtos ou remédios..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-10 py-8">
          {/* Categories Grid */}
          <section className="px-5">
            <div className="grid grid-cols-2 gap-5">
              {pharmacyCategories.map((cat, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={cat.id}
                  onClick={() => {
                    setActiveService({ ...activeService, subType: cat.id });
                    navigateSubView('generic_list');
                  }}
                  className="p-5 rounded-[40px] flex flex-col items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-xl shadow-slate-200/50 dark:shadow-black/20 group relative overflow-hidden"
                  style={{ background: cat.gradient }}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <span className="material-symbols-outlined text-white text-5xl leading-none drop-shadow-xl">{cat.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 text-center">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Promotional Banner */}
          <section className="px-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              onClick={() => navigateSubView('health_plantao')}
              className="bg-slate-900 dark:bg-white p-8 rounded-[50px] text-white dark:text-slate-900 relative overflow-hidden shadow-2xl group cursor-pointer"
            >
              <div className="relative z-10 pr-20">
                <div className="flex items-center gap-2 mb-3">
                   <span className="bg-primary text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">Flash Sale</span>
                </div>
                <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none">Plantão de Saúde</h2>
                <p className="opacity-70 text-[11px] font-bold mb-6 leading-relaxed">Economize até 50% em medicamentos genéricos e vitaminas premium hoje.</p>
                <button className="bg-primary text-slate-900 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-transform">Explorar agora</button>
              </div>
              <span className="absolute -right-8 -bottom-8 material-symbols-outlined text-[180px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">local_pharmacy</span>
            </motion.div>
          </section>

          {/* Near Pharmacies */}
          <section>
            <div className="flex items-center justify-between px-5 mb-8">
              <div>
                <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Destaques</h2>
                <p className="text-xl font-black tracking-tighter">Farmácias Premium</p>
              </div>
              <button 
                onClick={() => navigateSubView('all_pharmacies')}
                className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
              >
                Ver Todas
              </button>
            </div>
            <div className="flex flex-col gap-6 px-5 pb-8">
              {nearbyPharmacies.map((pharm, i) => (
                <motion.div
                  key={pharm.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleShopClick({ ...pharm, type: 'pharmacy' })}
                  className="p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-6 active:scale-[0.98] transition-all group cursor-pointer"
                >
                  <div className="size-20 rounded-[28px] overflow-hidden shrink-0 shadow-inner bg-slate-100 dark:bg-slate-900">
                    <img src={pharm.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={pharm.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white leading-tight text-base truncate mb-1.5 group-hover:text-primary transition-colors">{pharm.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-primary text-[15px] fill-1">star</span>
                        <span className="text-slate-900 dark:text-white">{pharm.rating}</span>
                      </div>
                      <span className="opacity-50">•</span>
                      <span>{pharm.time}</span>
                    </div>
                  </div>
                  <div className="size-11 rounded-[18px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-slate-900 transition-all shadow-inner">
                    <span className="material-symbols-outlined text-lg font-black">arrow_forward</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const renderRestaurantMenu = () => {
    const shop = selectedShop || {
      name: "Gourmet Lab",
      rating: "4.9",
      tag: "Artesanal • Premium",
      priceRange: "$$$",
      time: "20-30 min",
      fee: "Grátis",
      minOrder: "R$ 30,00",
      img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
      categories: [
        {
          name: "Populares",
          items: [
            { id: 101, name: "Truffle Burger Gold", desc: "Pão brioche, blend 180g, queijo brie, trufas negras e mel trufado.", price: 68.90, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600" },
            { id: 102, name: "Wagyu Classic", desc: "Carne Wagyu A5 legítima, cebola caramelizada e aioli de alho negro.", price: 89.90, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600" }
          ]
        },
        {
          name: "Pratos do Dia",
          items: [
            { id: 701, name: "Filé de Frango Grelhado", desc: "Com arroz integral, feijão branco e mix de folhas.", price: 32.00, img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=600" },
            { id: 702, name: "Nhoque Rústico", desc: "Massa artesanal ao molho pomodoro e manjericão fresco.", price: 38.00, img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600" }
          ]
        },
        {
          name: "Burgers Especiais",
          items: [
            { id: 103, name: "Smoky BBQ Deluxe", desc: "Bacon crocante, molho BBQ artesanal e cebola crispy.", price: 45.90, img: "https://images.unsplash.com/photo-1594212699903-ec8a2eca50f5?q=80&w=600" },
            { id: 104, name: "Cheese Master", desc: "Quatro queijos importados derretidos na brasa.", price: 39.90, img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=600" }
          ]
        }
      ],
    };

    return (
      <div className="absolute inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto">
        {/* LUXURY HERO SECTION */}
        <div className="relative w-full h-[320px] shrink-0 overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url('${shop.img}')` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0F172A] via-black/20 to-black/40" />
          
          {/* Top Navigation */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 pt-8">
            <button 
              onClick={() => navigateSubView("none")} 
              className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group"
            >
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back_ios_new</span>
            </button>
            <div className="flex gap-3">
              <button className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">search</span>
              </button>
              <button className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform text-red-400">favorite</span>
              </button>
            </div>
          </div>
        </div>

        {/* SHOP MASTER CARD */}
        <div className="relative z-10 -mt-24 px-5 pb-8 shrink-0">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[48px] p-8 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] border border-white dark:border-slate-800 relative overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className="absolute -right-10 -top-10 size-40 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="max-w-[70%]">
                  <h1 className="text-3xl font-black tracking-tighter leading-none mb-3 text-slate-900 dark:text-white">
                    {shop.name}
                  </h1>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <span>{shop.tag}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary">{shop.priceRange}</span>
                  </p>
                </div>
                <div className="bg-[#FFF9E6] dark:bg-primary/10 border border-primary/20 rounded-[24px] px-4 py-3 flex flex-col items-center shadow-lg shadow-primary/5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-primary text-[18px] fill-1">star</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{shop.rating}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-primary tracking-widest leading-none">Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl group hover:bg-slate-100 transition-colors">
                  <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Tempo</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{shop.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl group hover:bg-slate-100 transition-colors">
                  <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">delivery_dining</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Entrega</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{shop.fee === "Grátis" ? "FREE" : shop.fee}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* STICKY CATEGORIES BAR */}
        <div className="sticky top-0 z-30 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 py-5 mb-8 shrink-0">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5">
            {shop.categories?.map((cat: any) => (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveMenuCategory(cat.name);
                  const el = document.getElementById(`cat-${cat.name.replace(/\s+/g, "-")}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
                }}
                className={`whitespace-nowrap px-8 py-3 rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all border-2 ${
                  activeMenuCategory === cat.name
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-primary dark:text-slate-900 dark:border-primary"
                    : "bg-white text-slate-400 border-white hover:border-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-800"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* MENU CONTENT */}
        <div className="px-5 pb-48 flex-1 space-y-12">
          {shop.categories?.map((category: any, idx: number) => (
            <div key={category.name} id={`cat-${category.name.replace(/\s+/g, "-")}`} className="scroll-mt-32">
              <div className="flex items-center justify-between mb-8 px-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
                    {category.name}
                    {idx === 0 && <span className="material-symbols-outlined text-primary fill-1">verified</span>}
                  </h2>
                  <div className="w-12 h-1.5 bg-primary rounded-full mt-1.5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category.items.length} ITENS</span>
              </div>

              <div className="space-y-6">
                {category.items.map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { /* Removido para não abrir detalhes conforme solicitado */ }}
                    className="group bg-white dark:bg-slate-900 rounded-[45px] p-5 flex items-center gap-6 border border-white dark:border-slate-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden"
                  >
                    {/* Glass Decoration */}
                    <div className="absolute right-0 top-0 size-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="size-28 rounded-[32px] overflow-hidden shrink-0 shadow-2xl relative group-hover:rotate-2 transition-transform duration-500 bg-slate-100 dark:bg-slate-800">
                      <img src={item.img || shop.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-slate-400 text-xs font-bold line-clamp-2 leading-relaxed mb-4">
                        {item.desc || "A combinação perfeita de sabores selecionados."}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item, e, item.img || shop.img); }}
                            className="size-11 rounded-2xl bg-[#FFF9E6] dark:bg-primary/10 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 active:scale-90"
                          >
                            <span className="material-symbols-outlined text-2xl font-black">
                              {getItemCount(item.id) > 0 ? 'add_shopping_cart' : 'add'}
                            </span>
                          </button>
                          {getItemCount(item.id) > 0 && (
                            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 size-11 rounded-2xl flex items-center justify-center text-sm font-black shadow-xl">
                              {getItemCount(item.id)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* MASTER CART CTA */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-8 z-50">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-[500px] mx-auto"
            >
              <button
                onClick={() => navigateSubView("cart")}
                className="w-full bg-slate-900 dark:bg-primary h-[80px] rounded-[35px] px-2 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(255,193,7,0.4)] transition-all active:scale-[0.98] group overflow-hidden relative"
              >
                {/* Shine animation */}
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                
                <div className="flex items-center gap-4 ml-2">
                  <div className="bg-white/10 dark:bg-black/10 text-white dark:text-slate-900 size-14 rounded-[24px] flex items-center justify-center font-black text-xl backdrop-blur-md">
                    {cart.length}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-white dark:text-slate-900 text-sm tracking-[0.2em] uppercase leading-none mb-1">CARRINHO</span>
                    <span className="text-[10px] font-bold text-white/50 dark:text-black/50 uppercase tracking-widest">Finalizar Pedido</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-14 px-8 rounded-[24px] flex items-center justify-center mr-2 shadow-2xl">
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

  const renderStoreCatalog = () => {
    const shop = selectedShop || {
      name: "Lux Floricultura",
      rating: "4.9",
      tag: "Floricultura Premium",
      priceRange: "$$$",
      time: "40-60 min",
      fee: "Grátis",
      img: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1000",
      categories: [
        {
          name: "💐 Buquês Premium",
          items: [
            { id: 201, name: "Amor Infinito", desc: "12 rosas vermelhas importadas com folhagens nobres.", price: 189.90, img: "https://images.unsplash.com/photo-1548842215-64903328e353?q=80&w=600" },
            { id: 202, name: "Jardim Encantado", desc: "Mix de flores da estação em tons pastéis.", price: 145.90, img: "https://images.unsplash.com/photo-1567606117518-ff3526c9f691?q=80&w=600" }
          ]
        },
        {
          name: "🎁 Presentes & Mimos",
          items: [
            { id: 203, name: "Vinho & Flores", desc: "Kit com espumante premium e mini buquê.", price: 299.00, img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=600" },
            { id: 204, name: "Orquídea Phalaenopsis", desc: "Vaso decorativo com orquídea de duas hastes.", price: 85.00, img: "https://images.unsplash.com/photo-1598282348505-89b14188546b?q=80&w=600" }
          ]
        }
      ],
    };

    return (
      <div className="absolute inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto">
        {/* LUXURY HERO HEADER */}
        <div className="relative w-full h-[320px] shrink-0 overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url('${shop.img}')` }} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0F172A] via-black/20 to-black/40" />
          
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 pt-8">
            <button 
              onClick={() => setSubView("none")} 
              className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group"
            >
              <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back_ios_new</span>
            </button>
            <div className="flex gap-3">
              <button className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">search</span>
              </button>
              <button className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group">
                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform text-red-400">favorite</span>
              </button>
            </div>
          </div>
        </div>

        {/* STORE MASTER CARD */}
        <div className="relative z-10 -mt-24 px-5 pb-8 shrink-0">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[48px] p-8 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] border border-white dark:border-slate-800 relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 size-40 bg-pink-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="max-w-[70%]">
                  <h1 className="text-3xl font-black tracking-tighter leading-none mb-3 text-slate-900 dark:text-white">
                    {shop.name}
                  </h1>
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <span>{shop.tag}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-pink-500">{shop.priceRange}</span>
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 rounded-[24px] px-4 py-3 flex flex-col items-center shadow-lg shadow-pink-500/5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-pink-500 text-[18px] fill-1">star</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{shop.rating}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-pink-500 tracking-widest leading-none">Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl group hover:bg-slate-100 transition-colors">
                  <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Tempo</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{shop.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl group hover:bg-slate-100 transition-colors">
                  <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">delivery_dining</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Entrega</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">FREE</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* STICKY CATEGORIES BAR */}
        <div className="sticky top-0 z-30 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 py-5 mb-8 shrink-0">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5">
            {shop.categories?.map((cat: any) => (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveMenuCategory(cat.name);
                  const el = document.getElementById(`cat-${cat.name.replace(/\s+/g, "-")}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
                }}
                className={`whitespace-nowrap px-8 py-3 rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all border-2 ${
                  activeMenuCategory === cat.name
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-primary dark:text-slate-900 dark:border-primary"
                    : "bg-white text-slate-400 border-white hover:border-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-800"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* CATALOG CONTENT GRID */}
        <div className="px-5 pb-48 flex-1 space-y-12">
          {shop.categories?.map((category: any) => (
            <div key={category.name} id={`cat-${category.name.replace(/\s+/g, "-")}`} className="scroll-mt-32">
              <div className="flex items-center justify-between mb-8 px-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter decoration-primary decoration-4 underline-offset-8">
                    {category.name}
                  </h2>
                  <div className="w-12 h-1.5 bg-primary rounded-full mt-1.5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category.items.length} ITENS</span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {category.items.map((item: any) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => { handleAddToCart(item, e, item.img || shop.img); }}
                    className="group bg-white dark:bg-slate-900 rounded-[45px] overflow-hidden border border-white dark:border-slate-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] relative cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={item.img || shop.img} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="absolute top-4 right-4 z-10">
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item, e, item.img || shop.img); }}
                            className="size-11 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl flex items-center justify-center text-slate-900 dark:text-white hover:bg-primary hover:text-white transition-all active:scale-90"
                         >
                           <span className="material-symbols-outlined text-2xl font-black">
                             {getItemCount(item.id) > 0 ? 'add_shopping_cart' : 'add'}
                           </span>
                         </button>
                      </div>
                      
                      {getItemCount(item.id) > 0 && (
                        <div className="absolute top-4 left-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md">
                          {getItemCount(item.id)} NO CARRINHO
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors truncate">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 line-clamp-1">
                        {item.desc || "Produto Premium"}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="material-symbols-outlined text-primary text-xl font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* MASTER CART CTA */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-8 z-50">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-[500px] mx-auto"
            >
              <button
                onClick={() => navigateSubView("cart")}
                className="w-full bg-slate-900 dark:bg-primary h-[80px] rounded-[35px] px-2 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(255,193,7,0.4)] transition-all active:scale-[0.98] group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                
                <div className="flex items-center gap-4 ml-2">
                  <div className="bg-white/10 dark:bg-black/10 text-white dark:text-slate-900 size-14 rounded-[24px] flex items-center justify-center font-black text-xl backdrop-blur-md">
                    {cart.length}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-black text-white dark:text-slate-900 text-sm tracking-[0.2em] uppercase leading-none mb-1">CARRINHO</span>
                    <span className="text-[10px] font-bold text-white/50 dark:text-black/50 uppercase tracking-widest">Finalizar Pedido</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-14 px-8 rounded-[24px] flex items-center justify-center mr-2 shadow-2xl">
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

  const renderCart = () => {
    const subtotal = cart.reduce((a, b) => a + (b.price || 0), 0);
    const taxa = 0;
    const total = subtotal + taxa;

    if (cart.length === 0) {
      return (
        <div className="absolute inset-0 z-[70] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="size-64 bg-slate-50 dark:bg-white/5 rounded-[60px] flex items-center justify-center mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
            <span className="material-symbols-outlined text-8xl text-slate-300 dark:text-white/10 relative z-10">shopping_bag</span>
          </motion.div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Seu carrinho está vazio</h2>
          <p className="text-slate-400 font-bold text-sm max-w-[250px] leading-relaxed mb-10">Que tal explorar as delícias próximas a você e encher sua sacola?</p>
          <button 
            onClick={() => setSubView("none")}
            className="bg-primary text-slate-900 px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Começar a Comprar
          </button>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-[70] bg-[#F8FAFC] dark:bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto">
        {/* Header Luxury */}
        <header className="sticky top-0 z-[80] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-100 dark:border-white/5 p-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (selectedShop?.type === 'restaurant') setSubView("restaurant_menu");
              else if (subView === "cart") setSubView("none"); // Default fallback
              else setSubView("store_catalog");
            }}
            className="size-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-xl font-black tracking-tighter dark:text-white">Sua Sacola</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{cart.length} ITENS SELECIONADOS</p>
          </div>
          <button 
            className="size-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 flex items-center justify-center active:scale-90 transition-all"
            onClick={async () => { if(await showConfirm({ message: "Esvaziar carrinho?" })) setCart([]); }}
          >
            <span className="material-symbols-outlined font-black">delete_sweep</span>
          </button>
        </header>

        <div className="flex-1 px-6 pt-8 pb-48 space-y-10">
          {/* Shop Context */}
          <section className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[40px] p-6 flex items-center gap-5 shadow-sm">
            <div className="size-16 rounded-[22px] bg-primary flex items-center justify-center text-slate-900 shadow-xl shadow-primary/10">
              <span className="material-symbols-outlined text-3xl font-black">
                {selectedShop?.type === 'restaurant' ? 'restaurant' : 'shopping_basket'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Pedido em</p>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                {selectedShop?.name || "Market Express"}
              </h2>
              <p className="text-xs font-bold text-slate-400 truncate">{selectedShop?.tag || "Especialista em Entregas Fast"}</p>
            </div>
          </section>

          {/* Items List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Itens no Carrinho</h3>
              <button onClick={() => setSubView("none")} className="text-[10px] font-black text-primary uppercase tracking-widest">+ Adicionar Itens</button>
            </div>
            
            <AnimatePresence>
              {Array.from(new Set(cart.map((i) => i.id))).map((id) => {
                const item = cart.find((i) => i.id === id);
                if (!item) return null;
                const count = getItemCount(item.id);
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 rounded-[35px] flex items-center gap-5 group shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="size-20 rounded-[24px] overflow-hidden shrink-0 shadow-lg relative bg-slate-100 dark:bg-slate-800">
                      <img src={item.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200"} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                      <div className="absolute inset-0 bg-black/5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight mb-0.5 leading-tight truncate">{item.name}</h4>
                      <p className="text-primary font-black text-sm mb-3">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-2xl gap-3 border border-slate-100 dark:border-white/5">
                           <button 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="size-8 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white shadow-sm flex items-center justify-center active:scale-90 transition-all"
                           >
                             <span className="material-symbols-outlined text-sm font-black">remove</span>
                           </button>
                           <span className="font-black text-slate-900 dark:text-white text-sm w-4 text-center">{count}</span>
                           <button 
                            onClick={() => handleAddToCart(item)}
                            className="size-8 rounded-xl bg-primary text-slate-900 shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-all font-black text-sm"
                           >
                             <span className="material-symbols-outlined text-sm font-black">add</span>
                           </button>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id, true)}
                      className="size-10 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Payment Summary */}
          <section className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[45px] p-8 space-y-4 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 block text-center">Resumo da Compra</h3>
            <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
               <span>Subtotal</span>
               <span className="text-slate-900 dark:text-white font-black">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
               <span>Taxa de Entrega</span>
               <span className="text-green-500 font-black tracking-widest text-[10px] uppercase bg-green-500/10 px-3 py-1 rounded-full">Grátis</span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />
            <div className="flex justify-between items-center pt-2">
               <span className="text-lg font-black tracking-tighter dark:text-white">Total</span>
               <div className="text-right">
                  <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">R$ {total.toFixed(2).replace(".", ",")}</span>
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">Economia de R$ 10,00</p>
               </div>
            </div>
          </section>
        </div>

        {/* Global Checkout CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-8 pt-4 pb-12 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent dark:from-slate-950 dark:via-slate-950 z-[90]">
          <button
            onClick={() => setSubView("checkout")}
            className="group w-full bg-slate-900 dark:bg-primary h-20 rounded-[30px] flex items-center justify-between px-2 shadow-2xl active:scale-[0.98] transition-all overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
            
            <div className="flex items-center gap-4 ml-4">
               <div className="size-12 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white dark:text-slate-900 font-black">lock</span>
               </div>
               <span className="font-black text-white dark:text-slate-900 uppercase tracking-[0.2em] text-sm">Fechar Pedido</span>
            </div>

            <div className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center mr-2 shadow-xl">
               <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </button>
        </div>
      </div>
    );
  };
  const renderCheckout = () => {
    const subtotal = cart.reduce((a, b) => a + b.price, 0);

    const handleBack = () => {
      setSubView("cart");
    };

    const activeAddr = savedAddresses.find((a) => a.active) || {
      label: "Minha Casa",
      street: userLocation.address,
    };

    const finalTotal = Math.max(0, subtotal + calculateDynamicPrice(5.0) - (appliedCoupon ? (appliedCoupon.discount_type === 'percent' ? (subtotal * appliedCoupon.discount_value) / 100 : appliedCoupon.discount_value) : 0));

    return (
      <Elements stripe={stripePromise}>
        <div className="absolute inset-0 z-[80] bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto antialiased">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center p-4">
              <button
                onClick={handleBack}
                className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">
                  arrow_back
                </span>
              </button>
              <h1 className="flex-1 text-center mr-10 text-lg font-black tracking-tight uppercase tracking-widest text-sm">
                Finalizar Pedido
              </h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-40">
            {/* Delivery Address Section */}
            <section className="p-6 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                Endereço de Entrega
              </h2>
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary fill-1">
                    location_on
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 dark:text-white text-base leading-tight">
                    {activeAddr.label}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {activeAddr.street}
                  </p>
                </div>
                <button
                  onClick={() => setSubView("addresses")}
                  className="text-primary font-black text-xs uppercase tracking-widest"
                >
                  Alterar
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3 p-4 bg-slate-50 dark:bg-background-dark rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary text-sm">
                  schedule
                </span>
                <p className="text-xs font-bold">
                  Tempo estimado:{" "}
                  <span className="text-slate-900 dark:text-white font-black">
                    {selectedShop?.time || "25-35 min"}
                  </span>
                </p>
              </div>
            </section>

            {/* Payment Method Section */}
            <section className="p-6 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                Forma de Pagamento
              </h2>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-slate-900 dark:text-white">
                    {paymentMethod === "pix"
                      ? "qr_code"
                      : paymentMethod === "dinheiro"
                        ? "payments"
                        : paymentMethod === "saldo"
                          ? "account_balance_wallet"
                          : "credit_card"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight">
                    {paymentMethod === "pix"
                      ? "PIX"
                      : paymentMethod === "dinheiro"
                        ? "Dinheiro"
                        : paymentMethod === "saldo"
                          ? "Saldo App"
                          : (() => {
                              const activeCard = savedCards.find((c: any) => c.active);
                              return activeCard ? `${activeCard.brand} ••••${activeCard.last4}` : "Cartão de Crédito";
                            })()}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {paymentMethod === "saldo"
                      ? `Saldo disponível: R$ ${walletBalance.toFixed(2).replace(".", ",")}`
                      : "Pague pelo App com segurança"}
                  </p>
                </div>
                <button
                  onClick={() => { setPaymentsOrigin("checkout"); setSubView("payments"); }}
                  className="text-primary font-black text-xs uppercase tracking-widest"
                >
                  Alterar
                </button>
              </div>

              {/* Stripe Payment Form — só aparece se não tiver cartão salvo com stripe_payment_method_id */}
              {paymentMethod === "cartao" && (() => {
                const activeCard = savedCards.find((c: any) => c.active);
                if (activeCard?.stripe_payment_method_id) return null;
                return (
                  <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Dados do Cartão</h3>
                    <StripePaymentForm
                      total={finalTotal}
                      userId={userId}
                      onConfirm={(pmId) => handlePlaceOrder(pmId)}
                      onCardSaved={(card) => {
                        const newCard = {
                          ...card,
                          active: true,
                          color: card.brand === 'Visa'
                            ? 'linear-gradient(135deg, #2563eb, #1e40af)'
                            : card.brand === 'Amex'
                              ? 'linear-gradient(135deg, #047857, #065f46)'
                              : 'linear-gradient(135deg, #1e293b, #0f172a)',
                        };
                        setSavedCards((prev: any[]) => [
                          ...prev.map((c: any) => ({ ...c, active: false })),
                          newCard,
                        ]);
                      }}
                    />
                  </div>
                );
              })()}
            </section>

            {/* Order Items Section */}
            <section className="p-6 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                Resumo dos Itens
              </h2>
              <div className="space-y-6">
                {Array.from(new Set(cart.map((i) => i.id))).map((id, idx) => {
                  const item = cart.find((i) => i.id === id);
                  if (!item) return null;
                  const count = getItemCount(item.id);
                  return (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
                        <img
                          className="w-full h-full object-cover"
                          src={
                            item.img ||
                            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300"
                          }
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 dark:text-white text-sm">
                          {count}x {item.name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                      <p className="font-black text-slate-900 dark:text-white tracking-tighter">
                        R$ {(item.price * count).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Coupon Section */}
            <section className="p-6">
              {!appliedCoupon ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Código do Cupom"
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 px-5 font-black uppercase text-xs tracking-widest dark:text-white focus:ring-2 focus:ring-primary shadow-inner"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">sell</span>
                    </div>
                    <button
                      onClick={() => validateCoupon(couponInput)}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="bg-slate-900 dark:bg-primary text-white dark:text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30 transition-all active:scale-95"
                    >
                      {isValidatingCoupon ? "..." : "Aplicar"}
                    </button>
                  </div>
                  
                  {/* Sugestões de Cupons Disponíveis */}
                  {availableCoupons.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                      {availableCoupons.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => validateCoupon(c.coupon_code)}
                          className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-all"
                        >
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest">{c.coupon_code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5 border-2 border-dashed border-primary/30 rounded-[24px] bg-primary/5 shadow-sm animate-in zoom-in duration-300">
                  <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined font-black">sell</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      Cupom Ativo
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter mt-1">
                      {appliedCoupon.coupon_code} (-{appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}%` : `R$ ${appliedCoupon.discount_value.toFixed(2).replace(".", ",")}`})
                    </p>
                  </div>
                  <button 
                    onClick={() => setAppliedCoupon(null)}
                    className="size-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform group"
                  >
                    <span className="material-symbols-outlined text-sm font-black text-slate-500 group-hover:text-red-500">close</span>
                  </button>
                </div>
              )}
            </section>

            {/* Price Breakdown Section */}
            <section className="p-6 space-y-4">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                <span>Subtotal</span>
                <span className="font-black text-slate-900 dark:text-white tracking-tighter">
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                <span>Taxa de Entrega</span>
                <span className="font-black text-slate-900 dark:text-white tracking-tighter">
                  R$ {calculateDynamicPrice(5.0).toFixed(2).replace(".", ",")}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-500 font-bold text-sm">
                  <span>Desconto</span>
                  <span className="font-black tracking-tighter">
                    -R$ {(appliedCoupon.discount_type === 'percent' ? (subtotal * appliedCoupon.discount_value) / 100 : appliedCoupon.discount_value).toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xl font-black uppercase tracking-tighter">Total</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                  R$ {finalTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </section>
          </main>

          {(() => {
            const activeCard = savedCards.find((c: any) => c.active);
            const hasSavedStripeCard = paymentMethod === "cartao" && activeCard?.stripe_payment_method_id;
            const showButton = paymentMethod !== "cartao" || hasSavedStripeCard;
            if (!showButton) return null;
            return (
              <footer className="fixed bottom-0 left-0 right-0 p-6 pb-24 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-[90]">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlaceOrder()}
                  disabled={isLoading || cart.length === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-5 rounded-[24px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="size-6 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirmar e Fazer Pedido
                      {hasSavedStripeCard && activeCard && (
                        <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                          ••••{activeCard.last4}
                        </span>
                      )}
                      <span className="material-symbols-outlined font-black">chevron_right</span>
                    </>
                  )}
                </motion.button>
              </footer>
            );
          })()}
        </div>
      </Elements>
    );
  };

  const renderPixPayment = () => {
    if (!pixData) return null;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(pixData.copyPaste);
      toastSuccess("Código PIX copiado!");
    };

    return (
      <div className="absolute inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in zoom-in duration-500">
        <header className="p-6 flex items-center justify-between">
          <button 
            onClick={() => setSubView("checkout")}
            className="size-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="text-center">
            <h2 className="text-sm font-black uppercase tracking-widest">Pagamento PIX</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Aguardando confirmação</p>
          </div>
          <div className="size-12" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-4 flex flex-col items-center">
          <div className="w-full aspect-square max-w-[280px] bg-white rounded-[40px] p-6 shadow-2xl shadow-primary/10 border-4 border-primary/20 relative mb-10">
            <img 
              src={`data:image/png;base64,${(pixData as any).qrCodeBase64}`} 
              alt="QR Code PIX" 
              className="w-full h-full object-contain"
            />
            <div className="absolute -top-3 -right-3 size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <span className="material-symbols-outlined text-slate-900 font-black">qr_code_2</span>
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Código Copia e Cola</p>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="flex-1 text-[11px] font-mono break-all line-clamp-2 text-slate-500 text-left">
                  {pixData.copyPaste}
                </p>
                <button 
                  onClick={copyToClipboard}
                  className="size-10 bg-primary text-slate-900 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-sm font-black">content_copy</span>
                </button>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-[32px] flex items-center gap-5">
              <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined animate-pulse">timer</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Pagamento Instantâneo</p>
                <p className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/50 uppercase mt-1">O pedido será confirmado assim que o PIX for detectado.</p>
              </div>
            </div>
          </div>

          <p className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">
            Abra o app do seu banco e escolha a opção pagar com <span className="text-primary">QR Code</span>
          </p>
        </main>

        <footer className="p-8 pb-12">
          <button 
            onClick={() => setTab("orders")}
            className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[24px] uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all"
          >
            Ver Meus Pedidos
          </button>
        </footer>
      </div>
    );
  };

  const renderOrders = () => {
    const scheduledOrders = myOrders.filter(o => o && o.status === 'agendado');
    const activeOrders = myOrders.filter(o => o && !['concluido', 'cancelado', 'agendado'].includes(o.status));
    const pastOrders = myOrders.filter(o => o && ['concluido', 'cancelado'].includes(o.status));

    return (
      <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-slate-900 pb-32 animate-in fade-in duration-700 overflow-hidden">
        {/* Header Premium */}
        <header className="px-8 pt-12 pb-8 bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-3xl bg-opacity-80 dark:bg-opacity-80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                Atividade
              </h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.3em] mt-1.5 opacity-70">Sua jornada de pedidos</p>
            </div>
            <div className="flex gap-3">
              <button className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-2xl">search</span>
              </button>
              <button className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700 active:scale-95 transition-all relative">
                <span className="material-symbols-outlined text-2xl">notifications</span>
                <span className="absolute top-3 right-3 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
              </button>
            </div>
          </div>

          {/* Segmented Control: Luxury Style */}
          <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[22px] flex gap-1 shadow-inner">
            <button
              onClick={() => setFilterTab('ativos')}
              className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${filterTab === 'ativos' ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20" : "text-slate-400"}`}
            >
              Ativos agora
              {activeOrders.length > 0 && (
                <span className="size-5 bg-primary text-slate-900 rounded-full flex items-center justify-center text-[9px] font-black animate-pulse">
                  {activeOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('agendados' as any)}
              className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${filterTab === 'agendados' ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20" : "text-slate-400"}`}
            >
              Agendados
              {scheduledOrders.length > 0 && <span className="size-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">{scheduledOrders.length}</span>}
            </button>
            <button
              onClick={() => setFilterTab('historico')}
              className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${filterTab === 'historico' ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20" : "text-slate-400"}`}
            >
              Histórico
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
          <AnimatePresence mode="wait">
            {filterTab === 'ativos' ? (
              <motion.div
                key="actives"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {activeOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                    <div className="size-32 rounded-[50px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-8 relative">
                      <div className="absolute inset-0 bg-primary/5 rounded-[50px] animate-pulse" />
                      <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700">moped</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Tudo pronto por aqui!</h3>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest opacity-80">Você não tem pedidos ativos no momento.</p>
                    <button
                      onClick={() => setTab("home")}
                      className="mt-10 px-10 py-4 bg-primary text-slate-900 font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                    >
                      Pedir algo agora
                    </button>
                  </div>
                ) : (
                  activeOrders.map((order, i) => {
                    const shop = ESTABLISHMENTS.find((s: any) => s.id === order.shop_id) || { img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200", name: "Loja Parceira" };
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={order.id}
                        onClick={() => { setSelectedItem(order); setSubView("active_order"); }}
                        className="bg-white dark:bg-slate-800 rounded-[45px] p-7 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 border border-slate-50 dark:border-slate-700/50 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                      >
                         {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-900">
                          <div className="h-full bg-primary animate-shimmer bg-[length:200%_100%]" style={{ width: '65%' }} />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-5">
                              <div className="size-16 rounded-[22px] bg-slate-50 dark:bg-slate-900 p-1 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-xl group-hover:rotate-3 transition-transform">
                                <img src={order.type === 'transit' ? "https://cdn-icons-png.flaticon.com/512/3202/3202926.png" : shop.img} className="size-full object-cover rounded-[18px]" />
                              </div>
                              <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none mb-1.5">{order.type === 'transit' ? 'Viagem Ativa' : shop.name}</h3>
                                <div className="flex items-center gap-2">
                                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{(order.status || "Pendente").replace("_", " ")}</span>
                                </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">R$ {(order.total_price || 0).toFixed(2).replace(".", ",")}</span>
                           </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800/80 mb-6">
                          <div className="flex items-center gap-4 mb-4">
                            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate flex-1 uppercase tracking-wider">{order.delivery_address || order.destination_address || "Endereço não informado"}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chega em <span className="text-slate-900 dark:text-white font-black">12-18 min</span></p>
                          </div>
                        </div>

                        <button className="w-full py-4 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-extrabold text-[11px] uppercase tracking-[0.2em] rounded-[22px] shadow-xl shadow-primary/20 active:scale-95 transition-all">
                          Acompanhar Pedido
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            ) : filterTab === 'agendados' ? (
              <motion.div key="scheduled" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                {scheduledOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                    <div className="size-32 rounded-[50px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-8">
                      <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700">event</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Sem agendamentos</h3>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest">Agende um serviço de mobilidade.</p>
                  </div>
                ) : scheduledOrders.map((order: any, i: number) => {
                  const icons: Record<string,string> = { mototaxi:'motorcycle', carro:'directions_car', van:'airport_shuttle', utilitario:'bolt' };
                  const labels: Record<string,string> = { mototaxi:'MotoTáxi', carro:'Carro Executivo', van:'Van', utilitario:'Entrega Express' };
                  const scheduledAt = order.scheduled_date && order.scheduled_time
                    ? new Date(`${order.scheduled_date}T${order.scheduled_time}`).toLocaleString('pt-BR', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
                    : 'Data não informada';
                  return (
                    <motion.div key={order.id} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.08 }}
                      onClick={() => { setSelectedItem(order); setSubView('scheduled_order'); setSchedObsState(order.order_notes || ''); setSchedMessagesState([]); }}
                      className="bg-white dark:bg-slate-800 rounded-[40px] p-6 shadow-xl border border-slate-50 dark:border-slate-700/50 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                        <div className={`h-full bg-blue-500 ${order.driver_id ? 'w-full' : 'w-1/3'}`} />
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-[20px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500 text-2xl">{icons[order.service_type] || 'event'}</span>
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base">{labels[order.service_type] || 'Serviço'}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={`size-1.5 rounded-full ${order.driver_id ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`} />
                              <span className={`text-[9px] font-black uppercase tracking-widest ${order.driver_id ? 'text-emerald-500' : 'text-blue-400'}`}>
                                {order.driver_id ? 'Motorista Confirmado' : 'Aguardando Motorista'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-base font-black text-slate-900 dark:text-white">R$ {(order.total_price||0).toFixed(2).replace('.',',')}</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-500/10 rounded-[20px] p-4 space-y-2 mb-4 border border-blue-100 dark:border-blue-500/20">
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-blue-500 text-lg">event</span><p className="text-sm font-black text-slate-900 dark:text-white capitalize">{scheduledAt}</p></div>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-lg">location_on</span><p className="text-xs font-bold text-slate-500 truncate">{order.delivery_address}</p></div>
                      </div>
                      <button className="w-full py-4 bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[20px] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">manage_search</span>Acompanhar Agendamento
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {pastOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-800 mb-6">history</span>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum histórico encontrado</p>
                  </div>
                ) : (
                  pastOrders.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map((order) => {
                     const shop = ESTABLISHMENTS.find((s: any) => s.id === order.shop_id) || { img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200", name: "Loja Parceira" };
                     const isCancelled = order.status === 'cancelado';
                     return (
                        <div key={order.id} className="bg-white dark:bg-slate-800 rounded-[40px] p-6 shadow-xl shadow-slate-200/20 dark:shadow-black/20 border border-slate-50 dark:border-slate-700/50 group">
                           <div className="flex gap-5 mb-5">
                              <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-900 p-1 shrink-0 opacity-80 border border-slate-100 dark:border-slate-700">
                                <img src={order.type === 'transit' ? "https://cdn-icons-png.flaticon.com/512/3202/3202926.png" : shop.img} className="size-full object-cover rounded-xl grayscale-[0.3]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start">
                                    <h4 className="font-black text-slate-800 dark:text-white leading-tight truncate mr-2">{order.type === 'transit' ? 'Viagem' : shop.name}</h4>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isCancelled ? 'bg-red-50 text-red-400 dark:bg-red-900/10' : 'bg-slate-50 text-slate-400 dark:bg-slate-900'}`}>
                                       {order.status}
                                    </span>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">
                                    {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Data indisponível"}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-700/50">
                              <div className="flex items-baseline gap-1">
                                 <span className="text-[10px] font-black text-slate-400">R$</span>
                                 <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{(order.total_price || 0).toFixed(2).replace(".", ",")}</span>
                              </div>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => { setSelectedItem(order); setSubView('order_support'); }}
                                   className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                                 >
                                   Ajuda
                                 </button>
                                 <button className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all">Refazer</button>
                              </div>
                           </div>
                        </div>
                     );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  };


  const renderProfile = () => (
    <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-slate-900 overflow-y-auto pb-32 animate-in fade-in duration-500">
      <header className="px-6 py-8 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            Meu Perfil
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações e Conta</p>
        </div>
        <button className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <span className="material-symbols-outlined font-black">settings</span>
        </button>
      </header>

      <div className="px-6 py-8">
        {/* User Card: Premium Design */}
        <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[48px] shadow-2xl text-white relative overflow-hidden group mb-10">
          <div className="absolute -right-16 -top-16 size-48 bg-primary/20 rounded-full blur-[60px]" />
          <div className="absolute -left-16 -bottom-16 size-48 bg-blue-500/10 rounded-full blur-[60px]" />

          <div className="relative z-10 flex items-center gap-6">
            <div className="size-20 rounded-[30px] border-4 border-white/10 p-1 bg-white/5 backdrop-blur-md">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'default'}`}
                alt="Profile"
                className="size-full rounded-[22px] bg-slate-100 object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">Estevan</h2>
                <span className="material-symbols-outlined text-primary text-xl fill-1">verified</span>
              </div>
              <p className="text-xs font-bold text-white/50 tracking-wide mt-1 uppercase tracking-widest">{email}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/20 rounded-full">
                <div className="size-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Nível Diamante</span>
              </div>
            </div>
          </div>
        </div>

        {/* Izi Infinity Card */}
        <motion.div 
          onClick={() => setShowInfinityCard(true)}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-primary via-orange-400 to-rose-500 p-[1px] rounded-[48px] shadow-2xl shadow-primary/20 mb-10 cursor-pointer group"
        >
          <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[47px] relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
             <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                      <span className="material-symbols-outlined text-3xl fill-1">diamond</span>
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Izi Infinity</h4>
                      <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">Explore seus Benefícios</p>
                   </div>
                </div>
                <span className="material-symbols-outlined text-white/20 group-hover:text-white transition-colors">chevron_right</span>
             </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Explorar Conta</h3>

          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: "account_balance_wallet", label: "Minha Carteira", desc: "Saldo e Extrato", action: () => setSubView("wallet"), color: "primary" },
              { icon: "location_on", label: "Endereços", desc: "Suas localizações salvas", action: () => setSubView("addresses"), color: "blue" },
              { icon: "credit_card", label: "Pagamentos", desc: "Cartões e Métodos", action: () => { setPaymentsOrigin("profile"); setSubView("payments"); }, color: "purple" },
              { icon: "notifications", label: "Notificações", desc: "Alertas e Novidades", action: () => toast("Configurações de alerta"), color: "amber" },
              { icon: "help", label: "Ajuda & Suporte", desc: "Falar com o atendimento", action: () => toast("Suporte 24h em breve"), color: "emerald" },
            ].map((item, i) => (
              <motion.div
                whileTap={{ scale: 0.98 }}
                key={i}
                onClick={item.action}
                className="flex items-center gap-5 bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-xl shadow-slate-200/30 dark:shadow-black/20 border border-slate-50 dark:border-slate-700/50 cursor-pointer group hover:border-primary/30 transition-all"
              >
                <div className={`size-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors`}>
                  <span className="material-symbols-outlined text-2xl group-hover:fill-1">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <span className="font-black text-slate-900 dark:text-white block">{item.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.desc}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              await supabase.auth.signOut();
              setView("login");
            }}
            className="w-full mt-10 py-5 bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-100 dark:border-red-900/20 font-black rounded-[28px] shadow-lg shadow-red-500/5 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Encerrar Sessão
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderAddresses = () => {
    const handleSaveAddress = () => {
      if (!editingAddress) return;
      
      const exists = savedAddresses.find(a => a.id === editingAddress.id);
      if (exists) {
        setSavedAddresses(prev => prev.map(a => a.id === editingAddress.id ? editingAddress : a));
      } else {
        setSavedAddresses(prev => [...prev, editingAddress]);
      }
      setEditingAddress(null);
      setIsAddingAddress(false);
    };

    return (
      <div className="absolute inset-0 z-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl flex flex-col hide-scrollbar overflow-y-auto pb-40">
        <header
          className="px-6 py-6 sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="size-14 bg-white dark:bg-slate-800 rounded-[22px] flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/10 animate-pulse" />
              <span className="material-symbols-outlined text-primary text-3xl fill-1 relative z-10">location_on</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mb-1 opacity-80">Meus Endereços</span>
              <h2 className="text-md font-black leading-tight text-slate-900 dark:text-white tracking-tight">
                Gerenciar Locais
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              setSubView("none");
              setIsAddingAddress(false);
              setEditingAddress(null);
            }}
            className="size-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-all text-slate-900 dark:text-white shadow-xl border border-white/5"
          >
            <span className="material-symbols-rounded font-black text-2xl">close</span>
          </button>
        </header>

        <main className="p-6">
          <AnimatePresence mode="wait">
            {isAddingAddress ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-[45px] shadow-2xl border border-white/10 mb-10 overflow-hidden"
              >
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">Buscar novo endereço</h3>
                <div className="relative">
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={(autocomplete) => (addressAutocompleteRef.current = autocomplete)}
                      onPlaceChanged={() => {
                        const place = addressAutocompleteRef.current?.getPlace();
                        if (place && place.formatted_address) {
                          setEditingAddress({
                            id: Date.now(),
                            label: "Casa",
                            street: place.formatted_address.split(",")[0],
                            details: "",
                            city: place.formatted_address.split(",").slice(1).join(",").trim(),
                            active: false,
                          });
                          setIsAddingAddress(false);
                        }
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Nome da rua, número..."
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-5 px-6 text-[15px] font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                        autoFocus
                      />
                    </Autocomplete>
                  ) : (
                    <input
                      type="text"
                      placeholder="Carregando mapas..."
                      disabled
                      className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-5 px-6 text-[15px] font-bold opacity-50"
                    />
                  )}
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-rounded text-primary text-2xl">search</span>
                </div>
                <button
                  onClick={() => setIsAddingAddress(false)}
                  className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] mt-4 opacity-60 hover:opacity-100 transition-opacity"
                >
                  Cancelar
                </button>
              </motion.div>
            ) : editingAddress ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 p-8 rounded-[45px] shadow-2xl border border-white/10 mb-10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl" />
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">
                  {savedAddresses.some(a => a.id === editingAddress.id) ? "Editar Local" : "Finalizar Cadastro"}
                </h3>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Rótulo (ex: Casa, Trabalho)</label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {['Casa', 'Trabalho', 'Outro'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setEditingAddress({ ...editingAddress, label: tag })}
                          className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${editingAddress.label === tag ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {editingAddress.label === 'Outro' && (
                      <input
                        type="text"
                        placeholder="Nome personalizado..."
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                        value={editingAddress.label === 'Outro' ? "" : editingAddress.label}
                        onChange={(e) => setEditingAddress({ ...editingAddress, label: e.target.value })}
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Endereço</label>
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{editingAddress.street}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase">{editingAddress.city}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Complemento / Referência</label>
                    <input
                      type="text"
                      placeholder="Apto 12, Próximo ao mercado..."
                      className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-5 px-6 text-[15px] font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white transition-all"
                      value={editingAddress.details}
                      onChange={(e) => setEditingAddress({ ...editingAddress, details: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSaveAddress}
                      className="flex-[2] bg-primary text-slate-900 font-black py-5 rounded-3xl shadow-2xl shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                    >
                      Confirmar Endereço
                    </button>
                    <button
                      onClick={() => setEditingAddress(null)}
                      className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-500 font-black py-5 rounded-3xl active:scale-95 transition-all text-sm"
                    >
                      <span className="material-symbols-rounded">close</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddingAddress(true)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-[35px] flex items-center justify-center gap-4 mb-12 shadow-2xl transition-all border-none group"
              >
                <div className="size-10 rounded-2xl bg-white/20 dark:bg-slate-900/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
                  <span className="material-symbols-rounded font-black text-2xl">add</span>
                </div>
                <span className="uppercase tracking-[0.2em] text-xs">Adicionar Novo Endereço</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2 mb-6">Locais Salvos</h3>
            {savedAddresses.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <span className="material-symbols-rounded text-6xl block mb-4">location_off</span>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum endereço salvo</p>
              </div>
            ) : (
              savedAddresses.map((addr, i) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative bg-white dark:bg-slate-800 p-8 rounded-[50px] shadow-2xl transition-all border-2 group active:scale-[0.99] ${addr.active ? "border-primary shadow-primary/20" : "border-transparent"}`}
                >
                  {addr.active && (
                    <div className="absolute -top-4 left-10 bg-primary text-slate-900 px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Selecionado</div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-5">
                      <div className={`size-16 rounded-[22px] flex items-center justify-center shadow-xl ${addr.active ? "bg-primary text-slate-900" : "bg-slate-100 dark:bg-slate-900 text-slate-400"}`}>
                        <span className="material-symbols-rounded text-3xl fill-1">
                          {addr.label.toLowerCase().includes("casa") ? "home" : addr.label.toLowerCase().includes("trabalho") ? "work" : "location_on"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-xl leading-tight tracking-tight group-hover:text-primary transition-colors">{addr.label}</h4>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 leading-none">{addr.city}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={async (e) => { e.stopPropagation(); setEditingAddress(addr); }}
                        className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all active:scale-90 border border-transparent"
                      >
                        <span className="material-symbols-rounded text-2xl">edit_square</span>
                      </button>
                      <button
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          if(await showConfirm({ message: "Deseja excluir este endereço?" })) {
                            setSavedAddresses(prev => prev.filter(a => a.id !== addr.id)); 
                          }
                        }}
                        className="size-12 rounded-2xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                      >
                        <span className="material-symbols-rounded text-2xl">delete</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setSavedAddresses(prev => prev.map(a => ({ ...a, active: a.id === addr.id })));
                      setUserLocation({ ...userLocation, address: addr.street });
                      setSubView("none");
                    }}
                  >
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-inner group-hover:border-primary/20 transition-all">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base leading-snug">
                        {addr.street}
                      </p>
                      {addr.details && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="size-1.5 rounded-full bg-primary" />
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{addr.details}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {!addr.active && (
                    <button
                      onClick={() => {
                        setSavedAddresses(prev => prev.map(a => ({ ...a, active: a.id === addr.id })));
                        setUserLocation({ ...userLocation, address: addr.street });
                        setSubView("none");
                      }}
                      className="mt-6 w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-slate-900 transition-all shadow-inner border border-transparent"
                    >
                      Selecionar este Endereço
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  };

  const renderPayments = () => {
    const handleSetPrimary = async (cardId: string) => {
      if (!userId) return;
      // Remove padrão de todos, define o novo
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
        // Se era o cartão ativo e ainda tem outros, define o primeiro como padrão
        const wasActive = savedCards.find((c: any) => c.id === cardId)?.active;
        if (wasActive && updated.length > 0) {
          await handleSetPrimary(updated[0].id);
        } else if (updated.length === 0) {
          setPaymentMethod("pix");
        }
      }
    };

    const handleSaveCard = async () => {
      if (!userId) return;
      const rawNumber = newCardData.number.replace(/\s/g, "");
      if (rawNumber.length < 15) return toast("Insira um número de cartão válido");
      if (!newCardData.expiry || newCardData.expiry.length < 5) return toast("Insira a validade do cartão");
      if (!newCardData.cvv || newCardData.cvv.length < 3) return toast("Insira o CVV");

      setIsLoadingCards(true);
      try {
        const brand = rawNumber.startsWith("4") ? "Visa"
          : rawNumber.startsWith("34") || rawNumber.startsWith("37") ? "Amex"
          : "Mastercard";

        const isFirst = savedCards.length === 0;
        const { data: inserted, error } = await supabase
          .from("payment_methods")
          .insert({
            user_id: userId,
            brand,
            last4: rawNumber.slice(-4),
            expiry: newCardData.expiry,
            is_default: isFirst,
            stripe_payment_method_id: null,
          })
          .select()
          .single();

        if (error) throw error;

        const newCard = {
          id: inserted.id,
          brand,
          last4: rawNumber.slice(-4),
          expiry: newCardData.expiry,
          active: isFirst,
          stripe_payment_method_id: null,
          color: brand === "Visa"
            ? "linear-gradient(135deg, #2563eb, #1e40af)"
            : brand === "Amex"
              ? "linear-gradient(135deg, #047857, #065f46)"
              : "linear-gradient(135deg, #1e293b, #0f172a)",
        };

        setSavedCards((prev: any[]) => [...prev, newCard]);
        setPaymentMethod("cartao");
        setIsAddingCard(false);
        setNewCardData({ number: "", expiry: "", cvv: "", brand: "Visa" });
        toast("Cartão adicionado com sucesso!");
      } catch (err: any) {
        toastError("Erro ao salvar cartão: " + err.message);
      } finally {
        setIsLoadingCards(false);
      }
    };

    // Cartão atualmente selecionado (active)
    const activeCard = savedCards.find((c: any) => c.active);

    const handleConfirmAndReturn = () => {
      // Só define cartão se nenhum outro método foi selecionado explicitamente
      if (activeCard && paymentMethod !== "pix" && paymentMethod !== "dinheiro" && paymentMethod !== "saldo") {
        setPaymentMethod("cartao");
      }
      setSubView("checkout");
    };

    return (
      <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-background-dark flex flex-col hide-scrollbar overflow-y-auto pb-40">
        {/* HEADER */}
        <header className="px-6 py-8 sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => paymentsOrigin === "checkout" ? setSubView("checkout") : setSubView("none")}
              className="size-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg border border-slate-50 dark:border-slate-700 active:scale-90 transition-all"
            >
              <span className="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Pagamentos</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                {paymentsOrigin === "checkout" ? "Escolha a forma de pagamento" : "Métodos de segurança ativa"}
              </p>
            </div>
          </div>
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary font-black">verified_user</span>
          </div>
        </header>

        <main className="p-6 space-y-10">

          {/* QUICK ACTIONS / SMART PAY */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Smart Pay</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="bg-black text-white p-5 rounded-[28px] flex flex-col items-center gap-2 shadow-xl shadow-black/10"
                onClick={() => toast("Apple Pay não disponível neste dispositivo")}
              >
                <div className="size-10 flex items-center justify-center">
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.11 15.18c-.8.88-1.57 1.83-2.67 1.84-1.07.01-1.39-.63-2.65-.63-1.25 0-1.63.63-2.63.64-1.08.02-1.85-.97-2.7-1.92-1.69-1.9-2.99-5.36-1.24-8.38 1.45-2.52 4.1-3.26 5.6-3.26 1.42 0 2.38.74 3.01.74.62 0 1.96-.86 3.49-.71 1.05.04 1.9.43 2.51.98-2.31 1.54-1.91 5.38.68 6.47-.56 1.63-1.6 3.32-2.7 4.23zM10.84 2.82c-.67.87-1.74 1.48-2.77 1.41-.14-1.09.43-2.19 1.02-2.88.75-.86 1.94-1.42 2.83-1.35.15 1.1-.38 1.95-1.08 2.82z"/></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Apple Pay</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-5 rounded-[28px] border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 shadow-xl"
                onClick={() => toast("Google Pay não disponível neste dispositivo")}
              >
                <div className="size-10 flex items-center justify-center">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#f2f2f2"/><path d="M18.125 10.688c0-.46-.03-.92-.116-1.38H12v2.76h3.6c-.144.736-.583 1.344-1.206 1.764v1.543h1.954c1.144-1.042 1.777-2.583 1.777-4.687z" fill="#4285f4"/><path d="M12 16.5c-1.216 0-2.26-.814-2.656-1.94l-1.95.006-.008 1.51c.907 1.76 2.72 2.924 4.614 2.924 1.575 0 2.955-.536 3.968-1.458l-1.954-1.543c-.563.376-1.238.6-2.014.6z" fill="#34a853"/><path d="M9.344 14.56c-.2-.593-.314-1.232-.314-1.942s.114-1.349.314-1.942L7.382 9.09l-.01.013c-.66 1.347-1.04 2.868-1.04 4.515 0 1.64.38 3.141 1.04 4.475l2.008-1.533z" fill="#fbbc05"/><path d="M12 7.74c.9 0 1.63.31 2.277.85l1.644-1.644C14.885 6.012 13.565 5.4 12 5.4c-1.9 0-3.666 1.096-4.613 2.768L9.344 9.4c.396-1.127 1.44-1.66 2.656-1.66z" fill="#ea4335"/></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Google Pay</span>
              </motion.button>
            </div>
          </section>

          {/* WALLET */}
          <section className="px-1">
            <div
              onClick={() => { setPaymentMethod("saldo"); if (paymentsOrigin !== "checkout") setSubView("wallet"); }}
              className={`p-6 rounded-[35px] flex items-center justify-between shadow-2xl transition-all group cursor-pointer active:scale-[0.98] border-2 ${paymentMethod === "saldo" ? "bg-slate-900 border-primary shadow-primary/20" : "bg-slate-900 dark:bg-slate-800 border-transparent shadow-slate-900/20"}`}
            >
              <div className="flex items-center gap-5">
                <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${paymentMethod === "saldo" ? "bg-primary text-slate-900" : "bg-primary/20 text-primary"}`}>
                  <span className="material-symbols-rounded text-3xl font-black">account_balance_wallet</span>
                </div>
                <div>
                  <h4 className="text-white font-black tracking-tight leading-none mb-1">Saldo em Carteira</h4>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                    R$ {walletBalance.toFixed(2).replace(".", ",")} {paymentMethod === "saldo" && "• Selecionado"}
                  </p>
                </div>
              </div>
              <span className={`material-symbols-rounded transition-colors ${paymentMethod === "saldo" ? "text-primary" : "text-white/30 group-hover:text-primary"}`}>
                {paymentMethod === "saldo" ? "check_circle" : "chevron_right"}
              </span>
            </div>
          </section>

          {/* SAVED CARDS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Cartões Salvos</h3>
              <button
                onClick={() => setIsAddingCard(true)}
                className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full active:scale-90 transition-all"
              >
                + Adicionar
              </button>
            </div>

            {isLoadingCards ? (
              <div className="flex justify-center py-10">
                <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : savedCards.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-[35px] p-8 text-center border border-dashed border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">credit_card_off</span>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum cartão salvo</p>
                <p className="text-xs text-slate-400 mt-2">Adicione um cartão para pagar com facilidade</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {savedCards.map((card: any, i: number) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.08 }}
                    className={`relative p-7 rounded-[40px] shadow-2xl text-white overflow-hidden group mb-6 cursor-pointer border-2 transition-all ${card.active ? "border-primary shadow-primary/20" : "border-transparent"}`}
                    style={{ background: card.color || "linear-gradient(135deg, #1e293b, #0f172a)" }}
                    onClick={() => handleSetPrimary(card.id)}
                  >
                    <div className="absolute -right-16 -top-16 size-48 bg-white/10 rounded-full blur-[40px] group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute -left-16 -bottom-16 size-48 bg-black/20 rounded-full blur-[40px]" />

                    {/* Top Bar */}
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className="size-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <span className="material-symbols-rounded text-3xl opacity-80">credit_card</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 block mb-1">Bandeira</span>
                        <h4 className="font-black italic text-lg tracking-widest">{card.brand}</h4>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="mb-10 relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Número do Cartão</p>
                      <p className="text-2xl font-black tracking-[0.25em] flex items-center gap-1">
                        <span className="opacity-30">••••</span>
                        <span className="opacity-30">••••</span>
                        <span className="opacity-30">••••</span>
                        <span className="text-white drop-shadow-md">{card.last4}</span>
                      </p>
                    </div>

                    {/* Bottom */}
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Expira</p>
                          <p className="font-bold text-sm">{card.expiry}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!card.active && (
                          <div className="px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest rounded-xl">
                            Toque para usar
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                          className="size-10 bg-red-500/20 backdrop-blur-md border border-red-500/20 text-red-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                        >
                          <span className="material-symbols-rounded text-xl">delete</span>
                        </button>
                      </div>
                    </div>

                    {card.active && (
                      <div className="absolute top-6 right-20 bg-primary/95 text-slate-900 text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-1">
                        <span className="material-symbols-rounded text-[12px]">check</span>
                        Selecionado
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </section>

          {/* PIX / DINHEIRO */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Outras Formas</h3>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] shadow-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-5">
              <div
                className={`flex items-center gap-5 cursor-pointer p-2 rounded-2xl transition-all ${paymentMethod === "pix" ? "bg-emerald-500/10 border border-emerald-500/20" : ""}`}
                onClick={() => setPaymentMethod("pix")}
              >
                <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === "pix" ? "bg-emerald-500 text-white" : "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500"}`}>
                  <span className="material-symbols-rounded text-3xl font-black">qr_code_2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 dark:text-white leading-tight">PIX Instantâneo</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                    {paymentMethod === "pix" ? "Selecionado" : "Aprovação imediata"}
                  </p>
                </div>
                {paymentMethod === "pix"
                  ? <span className="material-symbols-rounded text-emerald-500">check_circle</span>
                  : <span className="text-[10px] font-black text-primary uppercase tracking-widest">Selecionar</span>
                }
              </div>

              <div className="h-[1px] bg-slate-100 dark:bg-slate-700 w-full" />

              <div
                className={`flex items-center gap-5 cursor-pointer p-2 rounded-2xl transition-all ${paymentMethod === "dinheiro" ? "bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" : ""}`}
                onClick={() => setPaymentMethod("dinheiro")}
              >
                <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === "dinheiro" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
                  <span className="material-symbols-rounded text-3xl font-black">payments</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 dark:text-white leading-tight">Pagamento em Dinheiro</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {paymentMethod === "dinheiro" ? "Selecionado" : "Pague na entrega"}
                  </p>
                </div>
                {paymentMethod === "dinheiro" && <span className="material-symbols-rounded text-slate-900 dark:text-white">check_circle</span>}
              </div>
            </div>
          </section>

          {/* SECURITY */}
          <div className="bg-primary/5 border border-primary/20 border-dashed p-6 rounded-[35px] flex flex-col items-center text-center gap-2">
            <span className="material-symbols-rounded text-3xl text-primary animate-pulse">shield_with_heart</span>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Dados Criptografados</p>
            <p className="text-[9px] text-slate-400 font-bold leading-relaxed px-4 opacity-70">Sua segurança é nossa prioridade. Nunca armazenamos o CVV.</p>
          </div>
        </main>

        {/* BOTÃO CONFIRMAR — aparece apenas quando vem do checkout */}
        {paymentsOrigin === "checkout" && (
          <div className="fixed bottom-0 left-0 right-0 p-6 pb-24 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-background-dark dark:via-background-dark z-[90]">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirmAndReturn}
              className="w-full bg-primary text-slate-900 font-black py-5 rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              <span className="material-symbols-rounded font-black">check_circle</span>
              Confirmar Pagamento
              {paymentMethod === "cartao" && activeCard && (
                <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  ••••{activeCard.last4}
                </span>
              )}
              {paymentMethod === "pix" && (
                <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  PIX
                </span>
              )}
              {paymentMethod === "dinheiro" && (
                <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Dinheiro
                </span>
              )}
              {paymentMethod === "saldo" && (
                <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Saldo
                </span>
              )}
            </motion.button>
          </div>
        )}

        {/* MODAL: ADD CARD via Stripe */}
        <AnimatePresence>
          {isAddingCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[45px] p-8 shadow-2xl relative"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Novo Cartão</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tokenizado com segurança via Stripe</p>
                  </div>
                  <button onClick={() => setIsAddingCard(false)} className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="material-symbols-rounded text-slate-500">close</span>
                  </button>
                </div>
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    total={0}
                    userId={userId}
                    onConfirm={() => {
                      setIsAddingCard(false);
                      toast("Cartão salvo com sucesso!");
                    }}
                    onCardSaved={(card) => {
                      const newCard = {
                        ...card,
                        active: true,
                        color: card.brand === 'Visa'
                          ? 'linear-gradient(135deg, #2563eb, #1e40af)'
                          : card.brand === 'Amex'
                            ? 'linear-gradient(135deg, #047857, #065f46)'
                            : 'linear-gradient(135deg, #1e293b, #0f172a)',
                      };
                      setSavedCards((prev: any[]) => [
                        ...prev.map((c: any) => ({ ...c, active: false })),
                        newCard,
                      ]);
                      setPaymentMethod("cartao");
                    }}
                  />
                </Elements>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderWallet = () => (
    <div className="absolute inset-0 z-40 bg-[#f8f9fc] dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto">
      <header className="px-6 py-8 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-4 rounded-b-[40px] shadow-sm">
        <button onClick={() => setSubView("none")} className="flex items-center justify-center size-10 bg-white dark:bg-slate-800 rounded-full shadow-sm active:scale-95 transition-all text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700">
          <span className="material-symbols-rounded text-xl">arrow_back</span>
        </button>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex-1 pr-10 text-center">Carteira Digital</h2>
      </header>

      <div className="px-6 pb-40">
        {/* Card Saldo */}
        <div className="mt-8 bg-slate-900 dark:bg-slate-800 p-8 rounded-[48px] shadow-2xl text-white relative overflow-hidden">
          <div className="absolute -right-20 -top-20 size-64 bg-primary/20 rounded-full blur-[80px]"></div>
          <div className="absolute -left-20 -bottom-20 size-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Saldo em Conta</p>
                <h3 className="text-5xl font-black tracking-tighter">R$ {walletBalance.toFixed(2).replace(".", ",")}</h3>
              </div>
              <div className="size-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                <span className="material-symbols-rounded text-primary text-3xl font-black">token</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowDepositModal(true)}
                className="bg-primary text-slate-900 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                <span className="material-symbols-rounded font-black">add_circle</span> Adicionar
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => toastWarning("Transferência entre contas estará disponível em breve!")}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
                <span className="material-symbols-rounded">move_up</span> Transferir
              </motion.button>
            </div>
          </div>
        </div>

        {/* Modal Deposito PIX */}
        {showDepositModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowDepositModal(false)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] p-8 pb-12" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Adicionar Saldo</h3>
              <p className="text-sm text-slate-500 mb-6">Deposite via PIX. O saldo é creditado em até 5 minutos.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor</label>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 border border-slate-100 dark:border-slate-700">
                    <span className="font-black text-slate-400">R$</span>
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                      placeholder="0,00" min="5" step="0.01"
                      className="flex-1 bg-transparent font-black text-xl text-slate-900 dark:text-white focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {["20", "50", "100", "200"].map(v => (
                    <button key={v} onClick={() => setDepositAmount(v)}
                      className="py-3 rounded-2xl bg-primary/10 text-primary font-black text-sm active:scale-95 transition-all">
                      R${v}
                    </button>
                  ))}
                </div>
                <button onClick={async () => {
                  const amount = parseFloat(depositAmount);
                  if (!amount || amount < 5) { toastError("Valor mínimo de R$ 5,00"); return; }
                  if (!userId) return;
                  try {
                    const pixKey = "suporte@izidelivery.com.br";
                    const code = `00020126360014br.gov.bcb.pix0114${pixKey}5204000053039865406${amount.toFixed(2)}5802BR5925IziDelivery6009SAO PAULO62070503***6304`;
                    setDepositPixCode(code);
                    await supabase.from("wallet_transactions").insert({ user_id: userId, type: "deposito", amount, description: "Depósito via PIX" });
                    await supabase.from("users_delivery").update({ wallet_balance: walletBalance + amount }).eq("id", userId);
                    setWalletBalance(prev => prev + amount);
                    setWalletTransactions(prev => [{ id: Date.now(), type: "deposito", amount, description: "Depósito via PIX", created_at: new Date().toISOString() }, ...prev]);
                    toastSuccess(`Depósito de R$ ${amount.toFixed(2)} adicionado!`);
                    setShowDepositModal(false);
                    setDepositAmount("");
                  } catch { toastError("Erro ao processar depósito."); }
                }}
                  className="w-full bg-primary text-slate-900 font-black py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  Confirmar Depósito
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historico de Transacoes */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-rounded text-primary">history</span>
              Movimentações
            </h3>
          </div>

          {walletTransactions.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-rounded text-5xl text-slate-300 mb-4 block">receipt_long</span>
              <p className="text-sm font-black text-slate-400">Nenhuma movimentação ainda</p>
              <p className="text-xs text-slate-400 mt-1">Adicione saldo para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletTransactions.map((t, i) => {
                const isCredit = t.type === "deposito" || t.type === "reembolso";
                const icon = t.type === "deposito" ? "account_balance" : t.type === "reembolso" ? "autorenew" : "shopping_bag";
                return (
                  <motion.div key={t.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800/50 flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center ${isCredit ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
                      <span className="material-symbols-rounded text-xl">{icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 dark:text-white text-sm">{t.description || (t.type === "deposito" ? "Depósito" : t.type === "reembolso" ? "Reembolso" : "Pagamento")}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`font-black text-base ${isCredit ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                      {isCredit ? "+" : "-"}R$ {Math.abs(t.amount).toFixed(2).replace(".", ",")}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  
  const renderActiveOrder = () => {
    if (!selectedItem) return null;

    // Componente interno que sincroniza o pedido em tempo real via Supabase
    const OrderSync = ({ orderId, onUpdate }: { orderId: string; onUpdate: (order: any) => void }) => {
      useEffect(() => {
        // Busca estado inicial
        supabase.from("orders_delivery").select("*").eq("id", orderId).single()
          .then(({ data }) => { if (data) onUpdate(data); });

        // Subscreve a mudanças em tempo real
        const channel = supabase
          .channel(`order_sync_${orderId}`)
          .on("postgres_changes", {
            event: "UPDATE",
            schema: "public",
            table: "orders_delivery",
            filter: `id=eq.${orderId}`,
          }, (payload) => {
            if (payload.new) onUpdate(payload.new);
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }, [orderId]);

      return null;
    };

    const statusMap: { [key: string]: number } = {
      novo: 0,
      pendente: 0,
      pendente_pagamento: 0,
      aceito: 1,
      confirmado: 1,
      preparando: 1,
      pronto: 2,
      no_local: 2,
      a_caminho: 3,
      saiu_para_entrega: 3,
      em_rota: 3,
      concluido: 4,
      entregue: 4,
    };

    const currentStep = statusMap[selectedItem.status] ?? 0;
    const isTransit = selectedItem.service_type === 'mototaxi' || selectedItem.service_type === 'carro' || selectedItem.service_type === 'van' || selectedItem.service_type === 'utilitario';

    const getStatusText = () => {
      if (currentStep === 4) return "CONCLUÍDO!";
      if (currentStep === 3) return "A CAMINHO!";
      if (isTransit) {
        if (currentStep === 0) return "SOLICITADO...";
        return "AGUARDANDO...";
      }
      return "PREPARANDO...";
    };

    const deliveryLabels = [
      { label: "Confirmado", time: "Recebido pela loja", icon: "check", step: 0 },
      { label: "Em Preparo", time: "Preparando pedido", icon: "cooking", step: 1 },
      { label: "Pronto", time: "Aguardando coleta", icon: "package_2", step: 2 },
      { label: "Na Rota", time: "A caminho de você", icon: "moped", step: 3 },
    ];

    const mobilityLabels = [
      { label: "Solicitado", time: "Buscando motorista", icon: "hail", step: 0 },
      { label: "Confirmado", time: "Piloto a caminho", icon: "verified_user", step: 1 },
      { label: "No Local", time: "Aguardando embarque", icon: "location_on", step: 2 },
      { label: "Em Viagem", time: "A caminho do destino", icon: (selectedItem.service_type === 'carro' || selectedItem.service_type === 'van' || selectedItem.service_type === 'utilitario') ? "directions_car" : "moped", step: 3 },
    ];

    const labels = isTransit ? mobilityLabels : deliveryLabels;

    return (
      <div className="absolute inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col hide-scrollbar overflow-hidden antialiased">
        {/* Black Box Telemetria Overlay */}
        <div className="absolute top-24 left-6 z-20 space-y-3">
           <motion.div 
             initial={{ x: -50, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4"
           >
              <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
                 <span className="material-symbols-outlined text-primary text-xl">speed</span>
              </div>
              <div>
                 <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Velocidade Atual</p>
                 <p className="text-sm font-black text-white italic">42 KM/H</p>
              </div>
           </motion.div>
           <motion.div 
             initial={{ x: -50, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.1 }}
             className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4"
           >
              <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
                 <span className="material-symbols-outlined text-primary text-xl">timer</span>
              </div>
              <div>
                 <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tempo Estimado</p>
                 <p className="text-sm font-black text-white italic">08 MIN</p>
              </div>
           </motion.div>
        </div>

        {/* Floating Chat Bubble */}
        <div className="absolute top-1/2 right-6 translate-y-12 z-20">
           <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             whileTap={{ scale: 0.9 }}
             className="size-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center border-4 border-slate-950/20 cursor-pointer"
             onClick={() => setSubView("order_chat")}
           >
              <span className="material-symbols-outlined font-black text-2xl">chat</span>
           </motion.div>
        </div>

        <div className="absolute top-1/2 right-6 -translate-y-6 z-20">
           <motion.div 
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 3, repeat: Infinity }}
             className="size-14 rounded-2xl bg-primary text-slate-900 shadow-2xl shadow-primary/30 flex items-center justify-center border-4 border-slate-950/20 active:scale-90 transition-all cursor-pointer"
             onClick={() => setIsAIOpen(true)}
           >
              <span className="material-symbols-outlined font-black text-2xl fill-1">smart_toy</span>
           </motion.div>
        </div>

        <OrderSync
          orderId={selectedItem.id}
          onUpdate={(newOrder) => setSelectedItem(newOrder)}
        />

        {/* Real-time Map Background */}
        <div className="absolute inset-0 z-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={driverPos}
              zoom={16}
              options={{
                disableDefaultUI: true,
                styles: [
                  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
                  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
                  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] }
                ]
              }}
            >
              {/* Driver/Courier Marker */}
              <Marker
                position={driverPos}
                icon={{
                  url: "https://cdn-icons-png.flaticon.com/64/1042/1042261.png",
                  scaledSize: new google.maps.Size(50, 50),
                  anchor: new google.maps.Point(25, 25)
                }}
              />
              {/* Destination Marker */}
              <Marker
                position={{ lat: driverPos.lat - 0.002, lng: driverPos.lng + 0.002 }}
                icon={{
                  url: "https://cdn-icons-png.flaticon.com/64/1673/1673188.png",
                  scaledSize: new google.maps.Size(40, 40)
                }}
              />
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400 text-5xl">location_searching</span>
            </div>
          )}
          {/* Top Gradient Overlay */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/80 dark:from-slate-950/80 to-transparent z-10" />
        </div>

        {/* Floating Top Header */}
        <header className="relative z-50 p-6 flex items-center justify-between">
          <button
            onClick={() => setSubView("none")}
            className="size-14 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl flex items-center justify-center text-slate-900 dark:text-white border border-white/20 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
          </button>

          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
             <div className="size-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Acompanhamento Ativo</span>
          </div>

          <button 
            onClick={() => setSubView('order_support')}
            className="size-14 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl flex items-center justify-center text-slate-900 dark:text-white border border-white/20 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined font-black text-2xl">support_agent</span>
          </button>
        </header>

        {/* Premium Draggable Bottom Sheet */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 500 }}
          dragElastic={0.15}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          className="mt-auto relative z-[60]"
        >
          <div className="bg-white dark:bg-slate-900 rounded-t-[60px] p-8 shadow-[0_-30px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_-30px_100px_rgba(0,0,0,0.4)] border-t border-white/5 pb-24 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Drag Handle */}
            <div className="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-10 opacity-50 shrink-0" />

            {/* Status Section */}
            <div className="flex items-center justify-between mb-10">
              <div className="max-w-[70%]">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Status do Pedido</span>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic mb-2">
                  {getStatusText()}
                </h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
                   Previsão de <span className="text-primary font-black">10-15 Min</span>
                </p>
              </div>
              <div className="size-24 rounded-[35px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 animate-ping opacity-20" />
                <span className="material-symbols-outlined text-5xl text-slate-900 font-black relative z-10 transform group-hover:scale-110 transition-transform">
                  {['carro', 'van', 'utilitario'].includes(selectedItem.service_type) ? "directions_car" : "moped"}
                </span>
              </div>
            </div>

            {/* Entity/Driver Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[45px] border border-slate-100 dark:border-slate-800 flex items-center gap-6 mb-10 group shadow-inner">
              <div className="size-20 rounded-[28px] bg-white dark:bg-slate-800 p-1.5 shadow-xl border border-slate-100 dark:border-slate-700 shrink-0">
                <img
                  src={isTransit ? `https://api.dicebear.com/7.x/avataaars/svg?seed=driver-${selectedItem.id}` : (selectedShop?.img || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200")}
                  className="w-full h-full object-cover rounded-[20px] bg-slate-100 dark:bg-slate-900"
                  alt="Avatar"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight mb-2 truncate group-hover:text-primary transition-colors">
                  {isTransit ? "Fernando Henrique" : selectedShop?.name || "Premium Store"}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/5">
                    <span className="material-symbols-outlined text-xs fill-1">star</span>
                    <span className="text-[10px] font-black ml-1">4.9</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">
                    {isTransit ? "Honda CB 500 • ABC-1234" : "Entrega Prioritária"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.href = `https://wa.me/${phone.replace(/\D/g, '')}`}
                  className="size-14 rounded-2xl bg-primary text-slate-900 flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined font-black text-2xl">chat</span>
                </button>
                <button
                  onClick={() => window.location.href = `tel:${phone.replace(/\D/g, '')}`}
                  className="size-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined font-black text-2xl">call</span>
                </button>
              </div>
            </div>

            {/* Tracking Dynamic Status List */}
            <div className="space-y-6 mb-12 px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8">Fluxo de Entrega</h3>
              {labels.map((item, i) => (
                <div key={i} className="flex gap-6 relative">
                  {i !== labels.length - 1 && (
                    <div className={`absolute left-5 top-10 bottom-[-24px] w-1 rounded-full ${currentStep > item.step ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'} transition-colors duration-700`} />
                  )}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`size-11 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-700 shadow-2xl ${currentStep >= item.step ? 'bg-primary text-slate-900 border-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent'}`}
                  >
                    <span className="material-symbols-outlined text-lg font-black">{currentStep > item.step ? 'check' : item.icon}</span>
                  </motion.div>
                  <div className="flex-1 pt-1.5">
                    <p className={`text-sm font-black tracking-tight transition-colors duration-700 ${currentStep >= item.step ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 ${currentStep === item.step ? 'text-primary' : 'text-slate-400'}`}>
                      {currentStep === item.step ? "Processando..." : item.time}
                    </p>
                  </div>
                  {currentStep === item.step && (
                     <div className="size-3 bg-primary rounded-full animate-ping mt-4" />
                  )}
                </div>
              ))}
            </div>

            {/* Items Summary - Luxury List */}
            {!isTransit && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Resumo do Pedido</h3>
                  <button onClick={() => toast("Recibo Digital em breve")} className="text-primary font-black uppercase text-[9px] border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">Ver Recibo</button>
                </div>
                <div className="space-y-3">
                   {/* Fallback to mock items if detailed data isn't in selectedItem */}
                   {(selectedItem.items || [
                     { name: "Premium Artisan Burger", qty: 1, price: 34.90 },
                     { name: "French Fries Special", qty: 1, price: 15.00 },
                     { name: "Natural Orange Juice", qty: 2, price: 18.00 }
                   ]).map((item: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">{item.qty}x</div>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</span>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Complemento Padrão</p>
                           </div>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">R$ {(item?.price || 0).toFixed(2).replace(".", ",")}</span>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* Address & Payment Summary - Luxury Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
              <div className="p-7 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Endereço de Entrega</p>
                </div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                  {selectedItem.delivery_address || selectedItem.dropoff_address || "Endereço Cadastrado"}
                </p>
              </div>
              <div className="p-7 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">payments</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Forma de Pagamento</p>
                </div>
                <div className="flex items-center justify-between">
                   <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {selectedItem.payment_method || "Crédito"}
                  </p>
                  <span className="text-xs font-black text-primary">R$ {selectedItem.total_price?.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>

            {/* Cancel Button - Only for Pending Orders */}
            {['novo', 'pendente', 'pendente_pagamento'].includes(selectedItem.status) && (
              <div className="mt-8 px-2">
                <button
                  onClick={() => handleCancelOrder(selectedItem.id)}
                  className="w-full py-6 rounded-[35px] border-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-black uppercase text-[11px] tracking-[0.25em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">cancel</span>
                  Cancelar Pedido
                </button>
                <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-4 tracking-widest opacity-60">
                  O cancelamento só é permitido antes da confirmação do estabelecimento.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderOrderFeedback = () => {
    const stars = [1, 2, 3, 4, 5];
    const shop = (typeof selectedItem === 'object' && selectedItem !== null) ? (ESTABLISHMENTS.find((s: any) => s.id === (selectedItem as any).shop_id) || { name: "Estabelecimento", img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200" }) : { name: "Estabelecimento", img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200" };

    return (
      <div className="absolute inset-0 z-[110] bg-slate-900/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[60px] p-10 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Background Decorative */}
          <div className="absolute -top-24 -right-24 size-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 size-48 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="size-24 rounded-[30px] bg-slate-50 dark:bg-slate-900 p-1.5 mx-auto mb-8 border border-slate-100 dark:border-slate-700 shadow-xl relative z-10">
             <img src={(shop as any).img} className="size-full object-cover rounded-[22px]" />
          </div>

          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 italic relative z-10">O que achou?</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-10 leading-relaxed px-4 relative z-10 italic">
            Sua avaliação ajuda o <span className="text-slate-900 dark:text-white">{(shop as any).name}</span> a melhorar e você ganha <span className="text-primary font-black tracking-widest">+50 XP Izi</span>!
          </p>

          <div className="flex justify-center gap-3 mb-12 relative z-10">
            {stars.map((star) => (
              <motion.button
                key={star}
                whileTap={{ scale: 0.8 }}
                onClick={() => setRating(star)}
                className={`size-14 rounded-[22px] flex items-center justify-center transition-all duration-300 ${rating >= star ? 'bg-primary text-slate-900 shadow-xl shadow-primary/30 scale-110' : 'bg-slate-100 dark:bg-slate-900 text-slate-300'}`}
              >
                <span className={`material-symbols-outlined text-3xl ${rating >= star ? 'fill-1' : ''}`}>{rating >= star ? 'star' : 'star_border'}</span>
              </motion.button>
            ))}
          </div>

          <div className="space-y-4 text-left relative z-10">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Comentário adicional</label>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Opcional</span>
            </div>
            <textarea 
              placeholder="Conte-nos como foi sua experiência..."
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[35px] p-6 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white resize-none h-32 transition-all"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-4 mt-10 relative z-10">
            <button 
              onClick={() => {
                showToast("Obrigado pela sua avaliação! 🌟", "success");
                setUserXP(prev => prev + 50);
                setSubView("none");
                setRating(0);
                setFeedbackText("");
              }}
              disabled={rating === 0}
              className={`w-full py-6 rounded-[30px] font-black uppercase tracking-[.25em] text-[11px] shadow-2xl transition-all active:scale-95 ${rating > 0 ? 'bg-slate-900 dark:bg-primary text-white dark:text-slate-900 shadow-primary/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
              Enviar Avaliação
            </button>
            <button 
              onClick={() => { setSubView("none"); setRating(0); setFeedbackText(""); }}
              className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            >
              Agora não, talvez depois
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderOrderChat = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chatMessages]);

    const sendMessage = async () => {
      if (!chatInput.trim() || !selectedItem) return;
      const text = chatInput;
      setChatInput("");

      const { error } = await supabase
        .from("order_messages")
        .insert({
          order_id: selectedItem.id,
          sender_id: userId,
          text: text
        });

      if (error) showToast("Erro ao enviar mensagem", "warning");
    };

    return (
      <div className="absolute inset-0 z-[120] bg-white dark:bg-slate-900 flex flex-col hide-scrollbar overflow-hidden">
        <header className="px-8 pt-12 pb-6 bg-white/80 dark:bg-slate-900/80 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-3xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSubView("active_order")}
                className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                 <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Chat Izi</h2>
                 <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online agora
                 </p>
              </div>
           </div>
           <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=driver-123" className="size-full object-cover" />
           </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fc] dark:bg-slate-950/20">
           {chatMessages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full opacity-20 text-center px-10">
                <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
                <p className="text-xs font-black uppercase tracking-[0.3em]">Nenhuma mensagem ainda.<br/>Inicie a conversa!</p>
             </div>
           )}
           {chatMessages.map((msg) => {
              const isMine = msg.sender === userId;
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: isMine ? 20 : -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  key={msg.id} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                   <div className={`max-w-[80%] p-5 rounded-[30px] shadow-sm ${
                     isMine 
                      ? 'bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-tr-lg' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-lg'
                   }`}>
                      <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-2 opacity-40 ${isMine ? 'text-white dark:text-slate-900' : 'text-slate-400 text-right'}`}>
                        {msg.time}
                      </p>
                   </div>
                </motion.div>
              );
           })}
        </div>

        <footer className="p-6 pb-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
           <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Digite sua mensagem..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[30px] py-5 px-8 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                <span className="material-symbols-outlined">mood</span>
              </button>
           </div>
           <button 
             onClick={sendMessage}
             disabled={!chatInput.trim()}
             className="size-14 rounded-2xl bg-primary text-slate-900 flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
           >
             <span className="material-symbols-outlined font-black">send</span>
           </button>
        </footer>
      </div>
    );
  };

  const renderOrderSupport = () => {
    return (
      <div className="absolute inset-0 z-[110] bg-white dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto pb-20">
        <header className="px-8 pt-12 pb-8 bg-white/80 dark:bg-slate-900/80 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-3xl flex items-center gap-6">
          <button 
            onClick={() => setSubView("none")}
            className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Central de Ajuda</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Pedido #{selectedItem?.id?.slice(0, 6) || "---"}</p>
          </div>
        </header>

        <main className="p-8 space-y-8">
           <div className="bg-primary/5 rounded-[40px] p-8 border border-primary/20 text-center relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 size-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="size-20 rounded-[30px] bg-primary flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
                 <span className="material-symbols-outlined text-4xl text-slate-900 font-black">support_agent</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Estamos aqui para ajudar!</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] mx-auto opacity-80 uppercase tracking-widest leading-loose">Atendimento 24/7 disponível para sua melhor experiência.</p>
           </div>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-6 text-center lg:text-left">Como podemos ajudar hoje?</h3>
              {[
                { icon: "schedule", label: "Onde está meu pedido?", desc: "Acompanhamento em tempo real", color: "blue" },
                { icon: "assignment_return", label: "Problema com os itens", desc: "Faltou algo ou veio errado", color: "orange" },
                { icon: "credit_card_off", label: "Questões de Pagamento", desc: "Cobranças, estornos e taxas", color: "purple" },
                { icon: "chat", label: "Falar com Atendente", desc: "Chat ao vivo com suporte", color: "emerald", premium: true },
              ].map((item, i) => (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  key={i}
                  className={`p-6 rounded-[32px] border transition-all cursor-pointer group flex items-center gap-5 ${item.premium ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 hover:border-primary/30 shadow-xl shadow-slate-200/20 dark:shadow-black/20'}`}
                >
                  <div className={`size-14 rounded-2xl flex items-center justify-center ${item.premium ? 'bg-primary text-slate-900' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-primary transition-colors'}`}>
                    <span className="material-symbols-outlined text-2xl font-black">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-[15px] tracking-tight ${item.premium ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">{item.desc}</p>
                  </div>
                  <span className={`material-symbols-outlined ${item.premium ? 'text-primary' : 'text-slate-300'}`}>chevron_right</span>
                </motion.div>
              ))}
           </div>

           <div className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Protocolo de Segurança Ativo</p>
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
    const ranking = [
      { name: "Estevan", level: 12, xp: 1250, avatar: "Aneka", rank: 1 },
      { name: "Mariana", level: 11, xp: 980, avatar: "Zoe", rank: 2 },
      { name: "Ricardo", level: 10, xp: 2200, avatar: "Jasper", rank: 3 },
      { name: "Juliana", level: 9, xp: 1500, avatar: "Sasha", rank: 4 },
      { name: "Lucas", level: 8, xp: 800, avatar: "Felix", rank: 5 },
    ];

    return (
      <div className="absolute inset-0 z-[190] bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="p-8 pt-12 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-2xl z-30">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSubView("none")}
                className="size-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-all border border-white/10"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                 <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Quests & Social</h2>
                 <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">Status de Batalha</p>
              </div>
           </div>
        </header>

        <main className="px-8 space-y-12 pb-10">
           {/* Level Progress Hero */}
           <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[45px] border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <span className="material-symbols-outlined text-8xl text-primary animate-pulse">military_tech</span>
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Temporada 1: Izi Origins</p>
                 <h3 className="text-3xl font-black text-white italic tracking-tighter mb-6">BATTLE PASS</h3>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-white/40 uppercase">Progresso do Passe</span>
                       <span className="text-xs font-black text-white italic">LVL {userLevel} <span className="text-primary opacity-50">/ 50</span></span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(userLevel / 50) * 100}%` }}
                         className="h-full bg-primary shadow-[0_0_15px_rgba(255,217,0,0.4)]"
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Tabs: Quests / Ranking */}
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic">Quests Diárias</h3>
                 <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">Reseta em 14h</span>
              </div>
              
              <div className="space-y-4">
                 {quests.map((q, i) => (
                    <motion.div 
                      key={q.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 bg-white/5 rounded-[35px] border border-white/5 flex items-center gap-6 group hover:bg-white/[0.08] transition-all"
                    >
                       <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform relative overflow-hidden shadow-xl" style={{ color: q.color }}>
                          <div className="absolute inset-0 opacity-10" style={{ backgroundColor: q.color }} />
                          <span className="material-symbols-outlined text-3xl font-black relative z-10">{q.icon}</span>
                       </div>
                       <div className="flex-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">{q.title}</h4>
                          <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mt-1 mb-3">{q.desc}</p>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-1000" 
                                  style={{ width: `${(q.progress / q.total) * 100}%`, backgroundColor: q.color }} 
                                />
                             </div>
                             <span className="text-[10px] font-black text-white/40 tabular-nums">{q.progress}/{q.total}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-primary italic">+{q.xp} XP</p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

           {/* Global Ranking */}
           <div className="space-y-8">
              <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic">Lendários da Cidade</h3>
              <div className="bg-white/5 rounded-[45px] border border-white/5 overflow-hidden">
                 {ranking.map((item, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-5 p-6 border-b border-white/[0.03] last:border-none ${item.name === "Estevan" ? "bg-primary/5" : ""}`}
                    >
                       <div className="w-8 text-center">
                          <span className={`text-xs font-black italic ${i < 3 ? 'text-primary' : 'text-white/20'}`}>#{item.rank}</span>
                       </div>
                       <div className={`size-12 rounded-xl border-2 ${item.name === "Estevan" ? "border-primary" : "border-white/10"} p-1`}>
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatar}`} className="size-full object-cover rounded-lg" />
                       </div>
                       <div className="flex-1">
                          <p className={`text-sm font-black ${item.name === "Estevan" ? "text-primary" : "text-white"}`}>{item.name}</p>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nível {item.level} • {item.xp} XP</p>
                       </div>
                       {i === 0 && <span className="material-symbols-outlined text-primary fill-1">military_tech</span>}
                    </div>
                 ))}
              </div>
           </div>
        </main>
      </div>
    );
  };

  const renderInfinityCard = () => {
    const perks = [
      { icon: 'speed', label: 'Entrega Grátis Infinito', desc: 'Em todos os pedidos acima de R$50' },
      { icon: 'potted_plant', label: 'Eco-Points em Dobro', desc: 'Ajude o planeta e ganhe mais XP' },
      { icon: 'headset_mic', label: 'Suporte VIP Priority', desc: 'Atendimento humano em < 2 min' },
      { icon: 'shield_check', label: 'Seguro Izi Elite', desc: 'Proteção total em todas as viagens' },
    ];

    return (
      <div className="absolute inset-0 z-[170] bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="p-8 pt-12 flex items-center justify-between sticky top-0 bg-slate-900/80 backdrop-blur-2xl z-20">
           <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Izi Infinity</h2>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">Sua Patente de Elite</p>
           </div>
           <button 
             onClick={() => setShowInfinityCard(false)}
             className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-all border border-white/10"
           >
             <span className="material-symbols-outlined font-black">close</span>
           </button>
        </header>

        <main className="px-8 space-y-10">
           {/* Level Hero */}
           <div className="relative aspect-square w-full max-w-[300px] mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
              <div className="relative size-full rounded-full border-4 border-dashed border-primary/20 flex flex-col items-center justify-center p-8 text-center bg-slate-800/40 backdrop-blur-xl shadow-2xl">
                 <span className="material-symbols-outlined text-7xl text-primary animate-bounce fill-1 mb-4">diamond</span>
                 <p className="text-5xl font-black text-white italic leading-none mb-2">LVL {userLevel}</p>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Membro Fundador</p>
              </div>
           </div>

            {/* XP Stats */}
            <div className="bg-white/5 rounded-[40px] p-8 border border-white/10 space-y-6">
               <div className="flex justify-between items-end">
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">XP Atual</p>
                     <p className="text-2xl font-black text-white tabular-nums italic">{userXP} <span className="text-xs text-white/20 not-italic">/ {nextLevelXP}</span></p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Tier Next</p>
                     <p className="text-sm font-black text-white italic">MASTER</p>
                  </div>
               </div>
               <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(userXP / nextLevelXP) * 100}%` }}
                   className="h-full bg-gradient-to-r from-primary via-orange-400 to-rose-500 shadow-[0_0_20px_rgba(255,217,0,0.3)]"
                 />
               </div>
            </div>

            {/* Battle Pass Access */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowInfinityCard(false); setSubView("quest_center"); }}
              className="bg-primary/10 border border-primary/20 p-6 rounded-[35px] flex items-center justify-between group cursor-pointer"
            >
               <div className="flex items-center gap-5">
                  <div className="size-12 rounded-2xl bg-primary text-slate-900 flex items-center justify-center">
                     <span className="material-symbols-outlined font-black">military_tech</span>
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-white uppercase tracking-tight">Izi Battle Pass</h4>
                     <p className="text-[9px] text-primary font-black uppercase tracking-widest">Ver Quests e Ranking</p>
                  </div>
               </div>
               <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">chevron_right</span>
            </motion.div>

           {/* Perks Grid */}
           <div className="space-y-6">
              <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] ml-2 italic">Benefícios Ativos</h3>
              <div className="grid grid-cols-1 gap-4">
                 {perks.map((perk, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-6 p-6 bg-white/5 rounded-[35px] border border-white/5 group"
                    >
                       <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl fill-1">{perk.icon}</span>
                       </div>
                       <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{perk.label}</p>
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1 leading-relaxed">{perk.desc}</p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>

           {/* Call to Action */}
           <div className="py-10 text-center space-y-4">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Deseja acelerar sua subida para o Tier MASTER?</p>
              <button 
                onClick={() => setShowMasterPerks(true)}
                className="w-full h-16 bg-primary text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-[25px] active:scale-95 transition-all shadow-2xl shadow-primary/20"
              >
                Explorar Benefícios MASTER
              </button>
              <button className="w-full h-16 bg-white/5 text-white/60 font-black text-xs uppercase tracking-[0.2em] rounded-[25px] active:scale-95 transition-all border border-white/10">Compartilhar Código</button>
           </div>
        </main>
      </div>
    );
  };

  const renderMasterPerks = () => {
    const tierPerks = [
      { icon: 'genetics', label: 'Cashback Izi Elite', desc: '5% de volta em todos os pedidos via Carteira Digital', premium: true },
      { icon: 'rocket_launch', label: 'Priority Match Instantâneo', desc: 'Fure a fila em horários de pico sem taxa extra', premium: true },
      { icon: 'support_agent', label: 'Concierge Humano 24/7', desc: 'Atendimento exclusivo via WhatsApp direto', premium: true },
      { icon: 'card_giftcard', label: 'Izi Surprise Box', desc: 'Um presente físico mensal na sua porta', premium: true },
    ];

    return (
      <div className="absolute inset-0 z-[180] bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,217,0,0.15),transparent_70%)]" />
        
        <header className="p-8 pt-12 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-2xl z-20">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group animate-pulse">
                 <span className="material-symbols-outlined text-xl fill-1">workspace_premium</span>
              </div>
              <div>
                 <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Status Master</h2>
                 <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">A Elite Izi</p>
              </div>
           </div>
           <button 
             onClick={() => setShowMasterPerks(false)}
             className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-all border border-white/10"
           >
             <span className="material-symbols-outlined font-black">close</span>
           </button>
        </header>

        <main className="px-8 space-y-12 relative z-10">
           {/* Tier Hero */}
           <div className="text-center space-y-4 pt-4">
              <div className="relative inline-block">
                 <div className="absolute inset-0 bg-primary blur-3xl opacity-20 scale-150" />
                 <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none relative">MASTER</h1>
              </div>
              <p className="text-xs font-medium text-white/40 max-w-[250px] mx-auto uppercase tracking-widest leading-relaxed">Onde a tecnologia encontra o luxo absoluto em serviços.</p>
           </div>

           {/* Rewards Showcase */}
           <div className="space-y-6">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] ml-2 italic">Exclusividades Desbloqueáveis</h3>
              <div className="grid grid-cols-1 gap-4">
                 {tierPerks.map((perk, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-8 bg-gradient-to-br from-white/10 to-transparent rounded-[45px] border border-white/5 relative overflow-hidden group shadow-2xl"
                    >
                       <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                          <span className="material-symbols-outlined text-6xl text-white fill-1">{perk.icon}</span>
                       </div>
                       <div className="size-16 rounded-2xl bg-primary text-slate-900 flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                          <span className="material-symbols-outlined text-3xl font-black">{perk.icon}</span>
                       </div>
                       <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2">{perk.label}</h4>
                       <p className="text-xs font-medium text-white/40 uppercase tracking-widest leading-relaxed">{perk.desc}</p>
                    </motion.div>
                 ))}
              </div>
           </div>

           {/* Master Boost Feature */}
           <div className="bg-primary/5 rounded-[40px] p-8 border border-primary/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <div className="relative z-10 text-center">
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Combo Master Speed</p>
                 <h3 className="text-2xl font-black text-white italic tracking-tighter mb-4">GANHE +200% XP</h3>
                 <p className="text-[11px] text-white/40 font-medium uppercase tracking-widest leading-relaxed mb-8">Ative o boost por 24h e chegue ao Tier Master hoje mesmo.</p>
                 <button className="w-full h-16 bg-white text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-[22px] active:scale-95 transition-all">Ativar Boost XP</button>
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
      <div className="absolute inset-0 z-[70] bg-[#f8f9fc] dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto">
        <div
          className="relative w-full h-[40vh] bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url('${itemImage}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fc] dark:from-slate-900 via-transparent to-black/20"></div>

          <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg active:scale-95 transition-transform text-slate-900 dark:text-white border border-white/20"
            >
              <span className="material-symbols-rounded text-xl">
                arrow_back
              </span>
            </button>
            <button className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-white border border-white/20">
              <span className="material-symbols-rounded text-xl">favorite</span>
            </button>
          </header>
        </div>

        <div className="flex-1 bg-[#f8f9fc] dark:bg-slate-900 -mt-10 rounded-t-[40px] px-8 pt-10 pb-40 relative z-20">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 opacity-50"></div>

          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                {selectedItem.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-primary font-black text-2xl tracking-tighter">
                  R$ {selectedItem.price.toFixed(2).replace(".", ",")}
                </span>
                {selectedItem.oldPrice && (
                  <span className="text-slate-400 text-sm line-through font-bold">
                    R$ {selectedItem.oldPrice.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
            </div>
            {selectedShop && (
              <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center min-w-[64px]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
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
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Descrição
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-relaxed">
                {selectedItem.desc ||
                  "Um produto premium selecionado especialmente para você. Qualidade garantida e entrega rápida diretamente na sua porta."}
              </p>
            </section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                Quantidade
              </h3>
              <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setTempQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                >
                  <span className="material-symbols-rounded text-2xl">
                    remove
                  </span>
                </button>
                <span className="text-xl font-black text-slate-900 dark:text-white min-w-4 text-center">
                  {tempQuantity}
                </span>
                <button
                  onClick={() => setTempQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl bg-primary text-slate-900 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/20"
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
            className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 p-5 rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/20 dark:bg-black/10 flex items-center justify-center">
                <span className="material-symbols-rounded font-black text-xl">
                  shopping_bag
                </span>
              </div>
              <span className="font-bold text-lg">Adicionar</span>
            </div>
            <span className="font-black text-xl bg-white/20 dark:bg-black/10 px-4 py-1.5 rounded-2xl tracking-tighter">
              R${" "}
              {(selectedItem.price * tempQuantity).toFixed(2).replace(".", ",")}
            </span>
          </motion.button>
        </div>
      </div>
    );
  };

  const renderExploreMobility = () => {
    const categories = [
      { id: 'mototaxi', name: 'MotoTáxi', icon: 'motorcycle', priceRange: 'R$ 8-15', eta: '3 min', desc: 'Agilidade total', gradient: 'linear-gradient(135deg, #facc15, #f97316)' },
      { id: 'carro', name: 'Premium Car', icon: 'directions_car', priceRange: 'R$ 15-30', eta: '6 min', desc: 'Conforto executivo', gradient: 'linear-gradient(135deg, #334155, #0f172a)' },
      { id: 'van', name: 'Luxury Van', icon: 'airport_shuttle', priceRange: 'R$ 40-80', eta: '12 min', desc: 'Espaço para grupos', gradient: 'linear-gradient(135deg, #6366f1, #2563eb)' },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100/50 dark:border-slate-800/50 pb-6">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setSubView('none')} 
                className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Explorar Mobilidade</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vá com Segurança e Estilo</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-10 pt-8">
          {/* Main Banner / Visual */}
          <section className="relative h-60 rounded-[50px] overflow-hidden group shadow-2xl">
            <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800" className="size-full object-cover group-hover:scale-105 transition-transform duration-[5000ms]" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent flex flex-col justify-end p-10">
              <h2 className="text-3xl font-black text-white tracking-tighter leading-none mb-2">Para onde vamos <br/><span className="text-primary">hoje?</span></h2>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Motoristas de elite ao seu dispor</p>
            </div>
          </section>

          {/* Quick Schedule Option */}
          <section>
            <div 
              onClick={() => {
                setTransitData({...transitData, scheduled: true, scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '12:00'});
                navigateSubView('transit_selection');
              }}
              className="bg-primary/10 border-2 border-primary/20 p-8 rounded-[45px] flex items-center justify-between group cursor-pointer active:scale-95 transition-all relative overflow-hidden shadow-2xl shadow-primary/5"
            >
              <div className="absolute top-0 right-0 size-40 bg-primary/20 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-colors" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="size-18 rounded-[25px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                  <span className="material-symbols-outlined text-slate-900 text-3xl font-black italic">schedule</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Agendar Corrida</h3>
                  <p className="text-[10px] uppercase font-black tracking-[0.15em] text-primary opacity-80">Pontualidade & Exclusividade</p>
                </div>
              </div>
              <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:translate-x-2 transition-transform shadow-inner">
                <span className="material-symbols-outlined text-primary font-black">arrow_forward</span>
              </div>
            </div>
          </section>

          {/* Categories Horizontal Selector */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Serviços Disponíveis</h3>
              <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 mx-6 opacity-40" />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    setTransitData({...transitData, type: cat.id as any, scheduled: false});
                    navigateSubView('transit_selection');
                  }}
                  className="bg-white dark:bg-slate-800 p-6 rounded-[45px] border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  <div className="size-20 rounded-[28px] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500" style={{ background: cat.gradient }}>
                    <span className="material-symbols-outlined text-white text-4xl font-black">{cat.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">{cat.name}</h4>
                    <p className="text-[11px] font-bold text-slate-400 leading-tight mb-2 opacity-80">{cat.desc}</p>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">{cat.eta} para chegar</span>
                       <span className="text-[10px] font-black uppercase text-slate-400">A partir de {cat.priceRange}</span>
                    </div>
                  </div>
                  <div className="size-12 rounded-[22px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined font-black group-hover:text-slate-900 transition-colors">arrow_forward</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const renderExploreEnvios = () => {
    const categories = [
      { id: 'utilitario', name: 'Entrega Express', icon: 'bolt', priceRange: 'R$ 10-25', eta: '5 min', desc: 'Documentos e pequenos volumes', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
      { id: 'utilitario', name: 'Fretes & Mudanças', icon: 'local_shipping', priceRange: 'R$ 45-150', eta: '15 min', desc: 'Transporte de grandes volumes', gradient: 'linear-gradient(135deg, #6366f1, #2563eb)' },
      { id: 'van', name: 'Coleta Agenciada', icon: 'inventory_2', priceRange: 'R$ 30-60', eta: '10 min', desc: 'Logística para empresas', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border-b border-slate-100/50 dark:border-slate-800/50 pb-6 transition-all">
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setSubView('none')} 
                className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
              >
                <span className="material-symbols-outlined font-black">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Explorar Envios</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Logística Completa ao seu toque</p>
              </div>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="bg-white dark:bg-slate-800/80 rounded-[28px] p-6 shadow-2xl border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all relative overflow-hidden group">
               <div className="flex items-center gap-4 relative z-10">
                  <span className="material-symbols-outlined text-primary text-2xl group-focus-within:scale-110 transition-transform">location_on</span>
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Para onde deseja enviar?</p>
                    <AddressSearchInput 
                      isLoaded={isLoaded}
                      initialValue={transitData.destination}
                      placeholder="Digite o endereço de entrega..."
                      className="bg-transparent border-none p-0 text-base font-bold w-full focus:ring-0 placeholder:text-slate-400 dark:text-white"
                      onSelect={(place: google.maps.places.PlaceResult) => {
                        setTransitData({
                          ...transitData,
                          destination: place.formatted_address || "",
                          type: 'utilitario'
                        });
                        setSubView('transit_selection');
                      }}
                    />
                  </div>
               </div>
               <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
            </div>
          </div>
        </header>

        <main className="p-6 space-y-10 pt-8">
          <section className="relative h-56 rounded-[50px] overflow-hidden shadow-2xl group">
             <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800" className="size-full object-cover group-hover:scale-105 transition-transform duration-[4000ms]" />
             <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-center p-10">
                <span className="bg-primary/90 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mb-4">Novo Serviço</span>
                <h2 className="text-3xl font-black text-white tracking-tighter leading-tight mb-2">Entregas que <br/>chegam <span className="text-primary italic">voando.</span></h2>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Atendimento 24h em toda a cidade</p>
             </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Categorias de Envio</h3>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-6 opacity-40" />
            </div>

            <div className="grid grid-cols-1 gap-6">
               {categories.map((cat, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   onClick={() => {
                     setTransitData({...transitData, type: cat.id as any});
                     navigateSubView('transit_selection');
                   }}
                   className="bg-white dark:bg-slate-800 p-6 rounded-[45px] border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden"
                 >
                    <div className="size-20 rounded-[28px] flex items-center justify-center shadow-xl group-hover:-rotate-3 transition-transform duration-500" style={{ background: cat.gradient }}>
                       <span className="material-symbols-outlined text-white text-4xl font-black italic">{cat.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">{cat.name}</h4>
                      <p className="text-[11px] font-bold text-slate-400 leading-tight mb-2 opacity-80">{cat.desc}</p>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full tracking-wider">{cat.eta}</span>
                         <span className="text-[10px] font-black tracking-tighter text-slate-400">{cat.priceRange}</span>
                      </div>
                    </div>
                    <div className="size-12 rounded-[22px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary transition-colors">
                       <span className="material-symbols-outlined font-black group-hover:text-slate-900 transition-colors">add_location_alt</span>
                    </div>
                 </motion.div>
               ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  const renderShippingDetails = () => {
    return (
      <div className="absolute inset-0 z-[120] bg-slate-50 dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500 pb-40">
        <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl z-50">
          <button
            onClick={() => setSubView("transit_selection")}
            className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
              Detalhes do Objeto
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Informações de Entrega</p>
          </div>
        </header>

        <main className="px-6 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <span className="material-symbols-outlined text-primary font-black">location_on</span>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Local da Entrega</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Endereço Selecionado</p>
               <AddressSearchInput 
                 isLoaded={isLoaded}
                 initialValue={transitData.destination}
                 placeholder="Digite o endereço..."
                 className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 dark:text-white"
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
              <span className="material-symbols-outlined text-primary font-black">person</span>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Quem recebe?</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Nome Completo</p>
                 <input 
                   type="text" 
                   value={transitData.receiverName}
                   onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                   placeholder="Ex: João Silva"
                   className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 dark:text-white"
                 />
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Telefone de Contato</p>
                 <input 
                   type="tel" 
                   value={transitData.receiverPhone}
                   onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                   placeholder="(11) 99999-9999"
                   className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 dark:text-white"
                 />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <span className="material-symbols-outlined text-primary font-black">inventory_2</span>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">O que está enviando?</h3>
            </div>

            <div className="space-y-4">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Descrição do Item</p>
                  <textarea 
                    value={transitData.packageDesc}
                    onChange={(e) => setTransitData({...transitData, packageDesc: e.target.value})}
                    placeholder="Ex: 2 Camisetas, 1 Par de Tênis..."
                    rows={3}
                    className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 dark:text-white resize-none"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {['Pequeno (até 5kg)', 'Médio (até 15kg)', 'Grande (até 30kg)', 'Pesado (+30kg)'].map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setTransitData({...transitData, weightClass: weight})}
                      className={`py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest border-2 transition-all ${transitData.weightClass === weight ? 'bg-primary border-primary text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 border-transparent text-slate-400 opacity-60'}`}
                    >
                      {weight}
                    </button>
                  ))}
               </div>
            </div>
          </section>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[35px] border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
             <span className="material-symbols-outlined text-amber-500">warning</span>
             <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed uppercase tracking-wider">
                Certifique-se de que o objeto esteja bem embalado. Não transportamos itens proibidos por lei ou inflamáveis.
             </p>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 z-50">
          <button
            disabled={!transitData.receiverName || !transitData.receiverPhone || isLoading}
            onClick={handleRequestTransit}
            className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-xl py-6 rounded-[32px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 flex justify-center items-center gap-4 group"
          >
            {isLoading ? (
              <div className="size-7 border-4 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="tracking-tighter uppercase tracking-[0.1em]">Agendar Coleta & Enviar</span>
                <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform">bolt</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderTransitSelection = () => {
    const isShippingView = transitData.type === 'utilitario' || transitData.type === 'van';

    return (
      <div className="absolute inset-0 z-[110] bg-slate-50 dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500">
        <header className="px-6 py-8 flex items-center justify-between gap-4">
          <button
            onClick={() => setSubView("none")}
            className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
              {isShippingView ? "Detalhes do Envio" : "Escolha sua Viagem"}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {isShippingView ? "Logística Digital" : "Transporte Executivo"}
            </p>
          </div>
        </header>

      <div className="px-6 space-y-8 flex-1 pb-40">
        {/* Schedule Option: Segmented Control */}
        <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-xl">
          <button 
            onClick={() => setTransitData({...transitData, scheduled: false})}
            className={`flex-1 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${!transitData.scheduled ? 'bg-primary text-slate-900 shadow-lg' : 'text-slate-400'}`}
          >
            Agora
          </button>
          <button 
            onClick={() => setTransitData({...transitData, scheduled: true})}
            className={`flex-1 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${transitData.scheduled ? 'bg-primary text-slate-900 shadow-lg' : 'text-slate-400'}`}
          >
            Agendar
          </button>
        </div>

        {transitData.scheduled && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-8 rounded-[45px] border border-slate-100 dark:border-slate-700 shadow-2xl space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 size-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20" />
            
            <div className="flex items-center justify-between mb-2">
               <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.25em]">Detalhes do Agendamento</h4>
               <span className="size-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
            </div>

            <div className="flex items-center gap-6 relative z-10 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[30px] border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-colors">
              <div className="size-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl font-black italic">event</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Data Desejada</p>
                <input 
                  type="date" 
                  value={transitData.scheduledDate}
                  min={new Date(Date.now() + 30*60*1000).toISOString().split('T')[0]}
                  onChange={(e) => setTransitData({...transitData, scheduledDate: e.target.value})}
                  className="bg-transparent border-none p-0 text-lg font-black w-full focus:ring-0 dark:text-white tracking-tighter"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 relative z-10 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[30px] border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-colors">
              <div className="size-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl font-black italic">alarm</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Horário Previsto</p>
                <input 
                  type="time" 
                  value={transitData.scheduledTime}
                  onChange={(e) => setTransitData({...transitData, scheduledTime: e.target.value})}
                  className="bg-transparent border-none p-0 text-lg font-black w-full focus:ring-0 dark:text-white tracking-tighter"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Destination Input Section: Luxury Card */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[45px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-6 border border-slate-50 dark:border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

          <div className="flex items-center gap-5 relative">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-slate-900 font-black">my_location</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em]">Origem Atual</p>
                <button
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      const { latitude, longitude } = pos.coords;
                      if (!(window as any).google?.maps) return;
                      const geocoder = new (window as any).google.maps.Geocoder();
                      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: any) => {
                        if (status === "OK" && results[0]) {
                          const addr = results[0].formatted_address;
                          setTransitData(prev => ({ ...prev, origin: addr }));
                          if (addr && transitData.destination) {
                            setDistancePrices({});
                            setRouteDistance("");
                            calculateDistancePrices(addr, transitData.destination);
                          }
                        }
                      });
                    }, () => toastError("Não foi possível obter sua localização."));
                  }}
                  className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1.5 rounded-xl active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">my_location</span>
                  Usar minha localização
                </button>
              </div>
              <AddressSearchInput 
                isLoaded={isLoaded}
                initialValue={transitData.origin}
                placeholder="De onde você está saindo?"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none px-4 py-3.5 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                onSelect={(place: google.maps.places.PlaceResult) => {
                  if (place.formatted_address) {
                    const newOrigin = place.formatted_address;
                    setTransitData(prev => ({ ...prev, origin: newOrigin }));
                    if (newOrigin && transitData.destination) {
                      setDistancePrices({});
                      setRouteDistance("");
                      calculateDistancePrices(newOrigin, transitData.destination);
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 py-1">
            <div className="w-[2px] h-8 bg-gradient-to-b from-primary to-orange-500 ml-6 rounded-full opacity-30" />
            <div className="h-px bg-slate-100 dark:bg-slate-700 flex-1 ml-4" />
          </div>

          <div className="flex items-center gap-5 relative">
            <div className="size-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <span className="material-symbols-outlined text-white font-black">location_on</span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em] mb-1.5 ml-1">Destino Final</p>
              <AddressSearchInput 
                initialValue={transitData.destination}
                placeholder="Para onde deseja ir?"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none px-4 py-3.5 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all placeholder:text-slate-400"
                onSelect={(place: any) => {
                  const addr = place.formatted_address || "";
                  if (addr) {
                    setTransitData(prev => ({ ...prev, destination: addr, estPrice: 0 }));
                    setRouteDistance("");
                    setDistancePrices({});
                    calculateDistancePrices(transitData.origin, addr);
                  } else {
                    setTransitData(prev => ({ ...prev, destination: "", estPrice: 0 }));
                    setRouteDistance("");
                    setDistancePrices({});
                  }
                }}
                onClear={() => {
                  setTransitData(prev => ({ ...prev, destination: "", estPrice: 0 }));
                  setRouteDistance("");
                  setDistancePrices({});
                }}
              />
            </div>
          </div>
        </div>

        {/* Route info badge */}
        {routeDistance && (
          <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-700">
            <span className="material-symbols-outlined text-emerald-500 text-xl">route</span>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Rota calculada</p>
              <p className="text-[13px] font-bold text-emerald-700">{routeDistance}</p>
            </div>
          </div>
        )}
        {isCalculatingPrice && (
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-bold text-slate-400">Calculando preços pela distância...</p>
          </div>
        )}

        {/* Resumo da Corrida Selecionada */}
        {(() => {
          const vehicles: Record<string, { label: string; icon: string; color: string; desc: string }> = {
            mototaxi: { label: "MotoTáxi", icon: "motorcycle", color: "from-yellow-400 to-orange-500", desc: "Rápido e econômico" },
            carro: { label: "Carro Executivo", icon: "directions_car", color: "from-slate-700 to-slate-900", desc: "Conforto e segurança" },
            van: { label: "Van de Carga", icon: "airport_shuttle", color: "from-blue-600 to-indigo-700", desc: "Para volumes maiores" },
            utilitario: { label: "Entrega Express", icon: "bolt", color: "from-violet-500 to-purple-700", desc: "Entrega urgente" },
          };
          const v = vehicles[transitData.type] || vehicles.mototaxi;
          const hasDistance = Object.keys(distancePrices).length > 0;
          const basePrice = parseFloat(String(marketConditions.settings?.baseValues?.[transitData.type + "_min"] ?? 6.0)) || 6.0;
          const rawPrice = hasDistance ? (distancePrices[transitData.type] ?? basePrice) : calculateDynamicPrice(basePrice);
          const displayPrice = isNaN(rawPrice) || !rawPrice ? basePrice : rawPrice;
          const hasSurge = marketConditions.settings?.baseValues?.isDynamicActive && marketConditions.surgeMultiplier > 1.05;
          const etaFromRoute = routeDistance ? routeDistance.split("•")[1]?.trim() : null;
          const etaFallback = transitData.type === "mototaxi" ? "3–5 min" : transitData.type === "carro" ? "6–10 min" : transitData.type === "van" ? "10–15 min" : "5–8 min";
          const eta = etaFromRoute || etaFallback;

          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumo da Corrida</h3>
                {hasSurge && (
                  <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                    Alta demanda ×{marketConditions.surgeMultiplier.toFixed(1)}
                  </span>
                )}
                {!hasSurge && (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Preço normal
                  </span>
                )}
              </div>

              {/* Card do veiculo selecionado */}
              <div className="bg-white dark:bg-slate-800 rounded-[35px] border-2 border-primary shadow-2xl shadow-primary/10 p-6 flex items-center gap-5">
                <div className={`size-16 rounded-[22px] flex items-center justify-center shadow-xl bg-gradient-to-br ${v.color}`}>
                  <span className="material-symbols-outlined text-white text-3xl font-black">{v.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">{v.label}</h4>
                    <span className="text-[8px] font-black uppercase tracking-widest bg-primary text-slate-900 px-2 py-0.5 rounded-full">Selecionado</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400">{v.desc}</p>
                </div>
                <button
                  onClick={() => navigateSubView("none")}
                  className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-2 rounded-xl active:scale-95 transition-all"
                >
                  Trocar
                </button>
              </div>

              {/* Detalhes da corrida — só aparecem após calcular rota */}
              {routeDistance && <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 text-center border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-primary text-xl block mb-1">schedule</span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Chegada</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{eta}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 text-center border border-slate-100 dark:border-slate-700">
                  <span className="material-symbols-outlined text-primary text-xl block mb-1">route</span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Distância</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{routeDistance ? routeDistance.split("•")[0].trim() : "—"}</p>
                </div>
                <div className={`rounded-[24px] p-4 text-center border ${hasSurge ? "bg-orange-50 border-orange-100" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"}`}>
                  <span className={`material-symbols-outlined text-xl block mb-1 ${hasSurge ? "text-orange-500" : "text-primary"}`}>payments</span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor</p>
                  {isCalculatingPrice ? (
                    <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    <p className={`text-sm font-black ${hasSurge ? "text-orange-500" : "text-slate-900 dark:text-white"}`}>
                      R$ {(displayPrice ?? 0).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </div>
              </div>}

              {/* Motoristas proximos reais — só aparecem após calcular rota */}
              {routeDistance && <>
              {nearbyDriversCount > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {nearbyDrivers.slice(0, 3).map((d, i) => (
                      <div key={i} className="size-9 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-slate-900 text-[10px] font-black border-2 border-white dark:border-slate-800">
                        {d.name?.charAt(0).toUpperCase() || "M"}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{nearbyDriversCount} motorista{nearbyDriversCount > 1 ? "s" : ""} disponível{nearbyDriversCount > 1 ? "s" : ""}</p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {nearbyDrivers.filter(d => d.vehicle_type === transitData.type).length > 0
                        ? `${nearbyDrivers.filter(d => d.vehicle_type === transitData.type).length} com ${transitData.type}`
                        : "Todos os tipos disponíveis"}
                    </p>
                  </div>
                  <div className="ml-auto size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              ) : isCalculatingPrice ? (
                <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-slate-400">Buscando motoristas...</p>
                </div>
              ) : null}
              </>}
            </div>
          );
        })()}

                {/* Dynamic History & Favorites */}
        <div className="space-y-6">
          {transitHistory.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Endereços Recentes
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
                {transitHistory.slice(0, 5).map((address, i) => (
                  <div
                    key={i}
                    className="min-w-[200px] bg-white dark:bg-slate-800 p-5 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all group flex items-center gap-4"
                    onClick={() => setTransitData({ ...transitData, destination: address })}
                  >
                    <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-900 text-xl">history</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mb-1">Anterior</p>
                      <p className="text-[10px] font-bold text-slate-900 dark:text-slate-200 truncate w-full">{address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
              Sugestões Rápidas
            </h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
              {savedAddresses.length > 0 ? savedAddresses.map((addr, i) => {
                const icons: Record<string, string> = { Casa: "home", Trabalho: "work" };
                const icon = icons[addr.label] || "location_on";
                return (
                  <div
                    key={i}
                    className="min-w-[160px] bg-white dark:bg-slate-800 p-5 rounded-[30px] shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all group flex flex-col items-center text-center"
                    onClick={() => {
                      const dest = `${addr.street}${addr.details ? ', ' + addr.details : ''}`;
                      setTransitData({ ...transitData, destination: dest });
                      calculateDistancePrices(transitData.origin, dest);
                    }}
                  >
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined text-primary group-hover:text-slate-900 text-xl">{icon}</span>
                    </div>
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 tracking-widest leading-none mb-1 uppercase">{addr.label}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate w-full">{addr.street}</p>
                  </div>
                );
              }) : (
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[30px] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center text-center min-w-[220px]">
                  <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">location_on</span>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nenhum endereço salvo</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Adicione endereços no perfil</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pt-4 pb-safe-bottom bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-30">
        {/* Preço do serviço selecionado */}
        {transitData.destination && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Serviço selecionado</span>
              {isCalculatingPrice ? (
                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-[15px] font-black text-slate-900 dark:text-white">
                  R$ {(() => {
                    const bv = marketConditions.settings.baseValues;
                    const basePrices: Record<string, number> = { mototaxi: bv.mototaxi_min, carro: bv.carro_min, van: bv.van_min, utilitario: bv.utilitario_min };
                    const rawP = distancePrices[transitData.type] || calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min);
                    const p = isNaN(rawP) || !rawP ? (basePrices[transitData.type] || bv.mototaxi_min || 6) : rawP;
                    return (p ?? 0).toFixed(2).replace('.', ',');
                  })()}
                </span>
              )}
            </div>
          </div>
        )}
        <button
          disabled={!transitData.destination || isLoading}
          onClick={isShippingView ? () => setSubView('shipping_details') : handleRequestTransit}
          className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-lg py-6 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex justify-center items-center gap-4 group"
        >
          {isLoading ? (
            <div className="size-7 border-4 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="tracking-tighter">
                {transitData.destination
                  ? (isShippingView ? `Confirmar Envio` : `Buscar Prestador`)
                  : "Defina o Destino"}
              </span>
              <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
    );
  };

  // ─── Tela de Pagamento da Mobilidade ─────────────────────────────────────
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
      <div className="absolute inset-0 z-[115] bg-[#F8FAFC] dark:bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-100 dark:border-white/5 px-6 py-5 flex items-center gap-4">
          <button onClick={() => setSubView("transit_selection")} className="size-11 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Confirmar Serviço</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Escolha como pagar</p>
          </div>
        </header>

        <div className="flex-1 px-6 py-6 space-y-6 pb-40">
          {/* Resumo do serviço */}
          <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[40px] p-6 space-y-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumo da Solicitação</h3>
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-[22px] bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl font-black">{service.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900 dark:text-white text-base">{service.label}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {transitData.origin.split(",")[0]} → {transitData.destination.split(",")[0]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  R$ {price.toFixed(2).replace(".", ",")}
                </p>
                {transitData.scheduled && (
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">Agendado</p>
                )}
              </div>
            </div>

            {/* Info de agendamento */}
            {transitData.scheduled && transitData.scheduledDate && (
              <div className="bg-primary/5 border border-primary/20 rounded-[20px] p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">event</span>
                <div>
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest">Agendado para</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {new Date(`${transitData.scheduledDate}T${transitData.scheduledTime}`).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}

            {/* Rota detalhada */}
            <div className="bg-slate-50 dark:bg-black/20 rounded-[24px] p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Origem</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{transitData.origin}</p>
                </div>
              </div>
              <div className="ml-[3px] h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
              <div className="flex items-start gap-3">
                <div className="mt-1.5 size-2 rounded-full bg-orange-500 shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{transitData.destination}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de pagamento */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Forma de Pagamento</h3>

            {/* Cartão salvo */}
            {activeCard && activeCard.stripe_payment_method_id && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConfirmMobility("cartao")}
                disabled={isLoading}
                className="w-full bg-slate-900 dark:bg-white/5 border-2 border-primary/20 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
              >
                <div className="size-12 rounded-[18px] bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">credit_card</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-black text-white text-sm">{activeCard.brand} ••••{activeCard.last4}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Débito instantâneo</p>
                </div>
                <span className="material-symbols-outlined text-primary font-black">arrow_forward</span>
              </motion.button>
            )}

            {/* PIX */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("pix")}
              disabled={isLoading}
              className="w-full bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/20 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="size-12 rounded-[18px] bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-xl">qr_code_2</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-slate-900 dark:text-white text-sm">PIX</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Aprovação imediata</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 font-black">arrow_forward</span>
            </motion.button>

            {/* Saldo */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("saldo")}
              disabled={isLoading || walletBalance < price}
              className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              <div className="size-12 rounded-[18px] bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 text-xl">account_balance_wallet</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-slate-900 dark:text-white text-sm">Saldo em Carteira</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">R$ {walletBalance.toFixed(2).replace(".", ",")} disponível</p>
              </div>
              {walletBalance < price ? (
                <span className="text-[9px] font-black text-red-400 uppercase">Insuficiente</span>
              ) : (
                <span className="material-symbols-outlined text-slate-400 font-black">arrow_forward</span>
              )}
            </motion.button>

            {/* Dinheiro */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("dinheiro")}
              disabled={isLoading}
              className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="size-12 rounded-[18px] bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">payments</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-slate-900 dark:text-white text-sm">Dinheiro</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Pague ao prestador</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 font-black">arrow_forward</span>
            </motion.button>
          </div>

          {/* Badge segurança */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 border-dashed p-4 rounded-[24px]">
            <span className="material-symbols-outlined text-primary text-xl">shield_with_heart</span>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Pagamento 100% seguro e criptografado</p>
          </div>
        </div>
      </div>
    );
  };

  // ─── Tela de Aguardando Motorista ────────────────────────────────────────
  const renderWaitingDriver = () => {
    if (!selectedItem) return null;

    const serviceLabels: Record<string, { label: string; icon: string; color: string }> = {
      mototaxi: { label: "MotoTáxi", icon: "motorcycle", color: "text-primary" },
      carro: { label: "Carro Executivo", icon: "directions_car", color: "text-slate-600" },
      van: { label: "Van de Carga", icon: "airport_shuttle", color: "text-blue-500" },
      utilitario: { label: "Entrega Express", icon: "bolt", color: "text-purple-500" },
    };
    const service = serviceLabels[selectedItem.service_type] || { label: "Serviço", icon: "local_shipping", color: "text-primary" };

    return (
      <div className="absolute inset-0 z-[115] bg-[#020617] flex flex-col items-center justify-center p-8 text-white overflow-hidden">
        {/* Fundo animado */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,217,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,217,0,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Radar */}
        <div className="relative mb-10">
          <motion.div animate={{ scale: [1, 2.5], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 bg-primary/20 rounded-full" />
          <motion.div animate={{ scale: [1, 2], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }} className="absolute inset-0 bg-primary/20 rounded-full" />
          <div className="relative size-24 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center">
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
              <div className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
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
            <span className="text-xl font-black text-primary">R$ {Number(selectedItem.total_price).toFixed(2).replace(".", ",")}</span>
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
              className="w-full bg-primary text-slate-900 font-black py-5 rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              <span className="material-symbols-outlined font-black">navigation</span>
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
      <div className="absolute inset-0 z-[120] bg-[#f8fafc] dark:bg-slate-950 flex flex-col overflow-hidden">
        <header className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0">
          <button onClick={() => { setSubView('none'); setFilterTab('agendados' as any); }} className="size-11 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black text-slate-700 dark:text-white">arrow_back</span>
          </button>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Agendamento</h2>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
          </div>
          <button onClick={async () => {
            if (!await showConfirm({ message: 'Cancelar este agendamento?' })) return;
            await supabase.from('orders_delivery').update({ status: 'cancelado' }).eq('id', selectedItem.id);
            setSubView('none'); fetchMyOrders(userId!); toastSuccess('Agendamento cancelado.');
          }} className="px-4 py-2 border border-red-200 dark:border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Cancelar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">
          {/* Status */}
          <div className={`rounded-[28px] p-5 flex items-center gap-4 ${hasDriver ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}`}>
            <div className={`size-12 rounded-[18px] flex items-center justify-center ${hasDriver ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
              <span className={`material-symbols-outlined text-2xl ${hasDriver ? 'text-emerald-500' : 'text-blue-500'}`}>{hasDriver ? 'verified' : 'pending'}</span>
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${hasDriver ? 'text-emerald-500' : 'text-blue-400'}`}>{hasDriver ? 'Motorista Confirmado' : 'Aguardando Confirmação'}</p>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{hasDriver ? 'Seu motorista está confirmado!' : 'Buscando motorista disponível...'}</h3>
            </div>
          </div>

          {/* Detalhes */}
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500 text-xl">{icon}</span>
              <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Serviço</p><p className="text-sm font-black text-slate-900 dark:text-white">{label}</p></div>
            </div>
            {scheduledAt && <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">event</span>
              <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Agendado para</p><p className="text-sm font-black text-slate-900 dark:text-white capitalize">{scheduledAt}</p></div>
            </div>}
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-500 text-xl mt-0.5">trip_origin</span>
              <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Origem</p><p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedItem.pickup_address}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">location_on</span>
              <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Destino</p><p className="text-sm font-bold text-slate-900 dark:text-white">{selectedItem.delivery_address}</p></div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">R$ {(selectedItem.total_price||0).toFixed(2).replace('.',',')}</span>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações para o Motorista</p>
            <textarea value={schedObsState} onChange={e => setSchedObsState(e.target.value)}
              placeholder="Ex: Tenho bagagens, endereço tem portão azul, preciso de nota fiscal..."
              rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 resize-none"
            />
            <button onClick={saveObservation} disabled={isSavingObsState}
              className="w-full py-3 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
              {isSavingObsState ? 'Salvando...' : 'Salvar Observação'}
            </button>
          </div>

          {/* Chat */}
          <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-500 text-xl">chat</span>
              <p className="text-sm font-black text-slate-900 dark:text-white">Chat com o Motorista</p>
            </div>
            <div className="p-4 min-h-[100px] space-y-3">
              {schedMessagesState.length === 0 && (
                <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest py-4">
                  {hasDriver ? 'Inicie a conversa com seu motorista' : 'Disponível após confirmação do motorista'}
                </p>
              )}
              {schedMessagesState.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-[18px] ${msg.from === 'user' ? 'bg-blue-500 text-white rounded-tr-[6px]' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-[6px]'}`}>
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
                className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 disabled:opacity-40"
              />
              <button onClick={sendScheduledMessage} disabled={!hasDriver || !schedChatInputState.trim()}
                className="size-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-90 transition-all disabled:opacity-30">
                <span className="material-symbols-outlined font-black">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

    const renderPaymentProcessing = () => {
    return (
      <div className="absolute inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
        {/* Radar/Scan effect */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,217,0,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,217,0,0.05)_2px,transparent_2px)] bg-[size:30px_30px]"></div>
        
        <div className="relative mb-12">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="w-48 h-48 border-2 border-primary/20 rounded-full border-t-primary shadow-[0_0_30px_rgba(255,217,0,0.1)]"
           />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center relative overflow-hidden group">
                 <motion.div 
                   animate={{ y: [-40, 40, -40] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-x-0 h-[2px] bg-primary shadow-[0_0_15px_#ffd900] z-20"
                 />
                 <span className="material-symbols-outlined text-5xl text-primary animate-pulse relative z-10 fill-1">fingerprint</span>
              </div>
           </div>
        </div>

        <div className="space-y-4 relative z-10">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-2 animate-pulse">Izi Security Protocol</p>
          <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
            Autenticando Transação...
          </h1>
          <p className="text-white/40 text-[11px] leading-relaxed max-w-[250px] mx-auto font-bold uppercase tracking-widest">
            Aguarde um instante. Estamos verificando os dados via API segura Izi.
          </p>
        </div>

        <div className="mt-16 bg-white/5 backdrop-blur-md px-6 py-4 rounded-[25px] border border-white/10 flex items-center gap-4">
           <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
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
      <div className="absolute inset-0 z-[150] bg-background-light flex flex-col items-center justify-center p-6 text-center text-slate-900">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-5xl">
              report
            </span>
          </div>
          <div className="absolute inset-0 w-24 h-24 bg-red-100 rounded-full animate-ping opacity-20"></div>
        </div>
        <div className="mb-10">
          <h1 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">
            Pagamento não aprovado
          </h1>
          <p className="text-slate-500 leading-relaxed max-w-[280px] mx-auto font-medium">
            Houve um problema ao processar seu pagamento. Por favor, verifique
            os dados do cartão ou escolha outra forma de pagamento.
          </p>
        </div>
        <div className="w-full space-y-3 max-w-xs">
          <button
            onClick={() => setSubView("checkout")}
            className="w-full bg-primary text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => { setPaymentsOrigin("checkout"); setSubView("payments"); }}
            className="w-full bg-white border border-slate-200 text-slate-700 font-black py-5 rounded-2xl active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            Trocar Forma
          </button>
        </div>
        <div className="mt-12 flex items-center gap-2 text-slate-500 font-bold text-sm cursor-pointer hover:text-slate-900 transition-colors">
          <span className="material-symbols-outlined">chat</span>
          <span>Falar com o Suporte</span>
        </div>
      </div>
    );
  };

  const renderPaymentSuccess = () => {
    if (!selectedItem) return null;
    return (
      <div className="absolute inset-0 z-[150] bg-white flex flex-col overflow-y-auto hide-scrollbar text-slate-900">
        <header className="flex flex-col items-center pt-16 pb-8 px-6">
          <div className="mb-6">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-emerald-500 text-5xl font-black">
                check
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 text-center tracking-tighter">
            Pagamento Aprovado!
          </h1>
          <p className="text-slate-500 mt-2 text-center font-medium">
            Tudo certo com seu pedido.
          </p>
        </header>

        <main className="flex-grow px-6 space-y-8">
          <section className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Pedido
                </span>
                <p className="text-lg font-black text-slate-900">
                  #{selectedItem.id.toString().slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Pago
                </span>
                <p className="text-lg font-black text-slate-900">
                  R$ {selectedItem.total_price?.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            <div className="pt-4 flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-xl">
                <span className="material-symbols-outlined text-slate-800">
                  schedule
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">
                  Entrega Estimada
                </span>
                <p className="text-sm font-black text-slate-900">25 - 35 min</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              O que acontece agora?
            </h2>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-black text-slate-900 shrink-0">
                1
              </div>
              <div>
                <p className="font-black text-slate-900">Preparação</p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  O estabelecimento recebeu seu pedido e já está começando a
                  preparar tudo com carinho.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 opacity-50">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 shrink-0">
                2
              </div>
              <div>
                <p className="font-black text-slate-400">Entrega</p>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Assim que estiver pronto, um entregador será acionado para
                  levar o pedido até você.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="p-6 pb-12 space-y-3">
          <button
            onClick={() => setSubView("active_order")}
            className="w-full bg-primary text-slate-900 font-extrabold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
          >
            Acompanhar Pedido
            <span className="material-symbols-outlined font-black">
              arrow_forward
            </span>
          </button>
          <button
            onClick={() => {
              setSubView("none");
              setTab("home");
              window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
            }}
            className="w-full bg-transparent text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]"
          >
            Voltar para o Início
          </button>
        </footer>
      </div>
    );
  };

  const BottomNav = () => {
    const navItems = [
      { id: "home", icon: "home", label: "Início" },
      { id: "orders", icon: "receipt_long", label: "Pedidos" },
      { id: "wallet", icon: "account_balance_wallet", label: "Carteira" },
      { id: "profile", icon: "person", label: "Perfil" },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-around px-2 pt-2 pb-3 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id as any);
                setSubView("none");
                window.history.replaceState({ view: "app", tab: item.id, subView: "none" }, "");
              }}
              className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2.5">
                <span className={`material-symbols-outlined text-[22px] transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-slate-400"}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className={`text-[10px] font-bold transition-all duration-300 leading-none ${isActive ? "text-primary" : "text-slate-400"}`}>{item.label}</span>
              </div>
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 dark:bg-black/10 scale-x-50" />
              )}
            </button>
          );
        })}
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
        {/* Izi AI Advisor */}
        <button onClick={() => setIsAIOpen(true)} className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 active:scale-95 transition-transform">
          <div className={`relative flex items-center justify-center size-9 rounded-2xl transition-all ${isAIOpen ? "bg-slate-900 dark:bg-primary" : "bg-slate-100 dark:bg-slate-800"}`}>
            <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse" />
            <span className="material-symbols-outlined text-[20px] relative z-10 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 leading-none">AI</span>
        </button>
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
        {/* Cart Quick Access */}
        <button onClick={() => navigateSubView("cart")} className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 active:scale-95 transition-transform">
          <div className="relative flex items-center justify-center size-9 rounded-2xl bg-primary shadow-md shadow-primary/30">
            <span className="material-symbols-outlined text-slate-900 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900">
                {cart.length > 99 ? "99+" : cart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-primary leading-none">{cart.length > 0 ? `R$${cart.reduce((s,i) => s+(i.price||0),0).toFixed(0)}` : "Cart"}</span>
        </button>
        </div>
      </nav>
    );
  };

  return (
    <div className="w-full h-[100dvh] bg-background font-sans overflow-hidden relative">
      <AnimatePresence mode="wait">
        {view === "loading" && (
          <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">Carregando...</p>
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
              {subView === "transit_selection" && (
                <motion.div
                  key="transit"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 z-[110]"
                >
                  {renderTransitSelection()}
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
              {subView === "scheduled_order" && (
                <motion.div key="sched_ord" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-[120]">
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
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      Pagamento PIX
                    </h3>
                    <p className="text-slate-500 font-medium mb-8">
                      Copie a chave abaixo para pagar no app do seu banco.
                    </p>

                    <div className="bg-slate-100 p-5 rounded-[24px] mb-8 relative group text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Chave Copia e Cola
                      </p>
                      <p className="font-mono text-[11px] break-all text-slate-600 leading-tight">
                        00020126360014BR.GOV.BCB.PIX011478029382000190520400005303986540510.005802BR5915RouteDelivery6009SAO
                        PAULO62070503***6304E2B1
                      </p>
                      <button
                        onClick={() => toast("Chave copiada!")}
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

                    <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
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
              {showInfinityCard && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="fixed inset-0 z-[170]"
                >
                  {renderInfinityCard()}
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
