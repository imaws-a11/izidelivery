import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";
import { toast, toastSuccess, toastError, toastWarning, showConfirm } from "./lib/useToast";
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { ServicesContext } from './context/ServicesContext';
import React, { Suspense } from 'react';

// Lazy-loaded view components
const HomeView            = React.lazy(() => import('./components/HomeView'));
const LoginView           = React.lazy(() => import('./components/LoginView'));
const OrdersView          = React.lazy(() => import('./components/OrdersView'));
const ProfileView         = React.lazy(() => import('./components/ProfileView'));
const WalletView          = React.lazy(() => import('./components/WalletView'));
const CartView            = React.lazy(() => import('./components/CartView'));
const CheckoutView        = React.lazy(() => import('./components/CheckoutView'));
const ActiveOrderView     = React.lazy(() => import('./components/ActiveOrderView'));
const PaymentsView        = React.lazy(() => import('./components/PaymentsView'));
const AddressesView       = React.lazy(() => import('./components/AddressesView'));
const RestaurantListView  = React.lazy(() => import('./components/RestaurantListView'));
const RestaurantMenuView  = React.lazy(() => import('./components/RestaurantMenuView'));
const MarketListView      = React.lazy(() => import('./components/MarketListView'));
const PharmacyListView    = React.lazy(() => import('./components/PharmacyListView'));
const GenericListView     = React.lazy(() => import('./components/GenericListView'));
const StoreCatalogView    = React.lazy(() => import('./components/StoreCatalogView'));
const ProductDetailView   = React.lazy(() => import('./components/ProductDetailView'));
const TransitSelectionView= React.lazy(() => import('./components/TransitSelectionView'));
const MobilityPaymentView = React.lazy(() => import('./components/MobilityPaymentView'));
const WaitingDriverView   = React.lazy(() => import('./components/WaitingDriverView'));
const ScheduledOrderView  = React.lazy(() => import('./components/ScheduledOrderView'));
const ShippingDetailsView = React.lazy(() => import('./components/ShippingDetailsView'));
const PaymentSuccessView  = React.lazy(() => import('./components/PaymentSuccessView'));
const PixPaymentView      = React.lazy(() => import('./components/PixPaymentView'));
const LightningPaymentView= React.lazy(() => import('./components/LightningPaymentView'));
const QuestCenterView     = React.lazy(() => import('./components/QuestCenterView'));
const IziBlackPurchaseView= React.lazy(() => import('./components/IziBlackPurchaseView'));
const IziBlackCardView    = React.lazy(() => import('./components/IziBlackCardView'));
const IziBlackWelcomeView = React.lazy(() => import('./components/IziBlackWelcomeView'));
const MasterPerksView     = React.lazy(() => import('./components/MasterPerksView'));
const OrderSupportView    = React.lazy(() => import('./components/OrderSupportView'));
const OrderFeedbackView   = React.lazy(() => import('./components/OrderFeedbackView'));
const OrderChatView       = React.lazy(() => import('./components/OrderChatView'));
const BurgerListView      = React.lazy(() => import('./components/BurgerListView'));
const PizzaListView       = React.lazy(() => import('./components/PizzaListView'));
const AcaiListView        = React.lazy(() => import('./components/AcaiListView'));
const JaponesaListView    = React.lazy(() => import('./components/JaponesaListView'));
const BrasileiraListView  = React.lazy(() => import('./components/BrasileiraListView'));
const ExploreRestaurantsView = React.lazy(() => import('./components/ExploreRestaurantsView'));
const DailyMenusView      = React.lazy(() => import('./components/DailyMenusView'));
const HealthPlantaoView   = React.lazy(() => import('./components/HealthPlantaoView'));
const AllPharmaciesView   = React.lazy(() => import('./components/AllPharmaciesView'));
const BeveragesListView   = React.lazy(() => import('./components/BeveragesListView'));
const BeverageOffersView  = React.lazy(() => import('./components/BeverageOffersView'));
const ExclusiveOfferView  = React.lazy(() => import('./components/ExclusiveOfferView'));
const ExploreMobilityView = React.lazy(() => import('./components/ExploreMobilityView'));
const ExploreCategoryView = React.lazy(() => import('./components/ExploreCategoryView'));
const ExploreEnviosView   = React.lazy(() => import('./components/ExploreEnviosView'));

const ViewFallback = () => (
  <div className="flex items-center justify-center h-screen bg-[#0f0f0f]">
    <div className="flex flex-col items-center gap-3 text-slate-400">
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest text-yellow-400/60">Carregando...</p>
    </div>
  </div>
);

// Chave pública do Stripe (Placeholder - Usuário deve substituir pela sua real)
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string || "";
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

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
      const apiKey = "GMAPS_KEY";
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
    origin: "",
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
      "Hoje é sexta! Temos cupons especiais de 20% em bebidas para membros Izi Black. 🍻",
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
      const apiKey = "GMAPS_KEY";
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
              const address = data.display_name.split(",")[0];
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
        fetchSavedAddresses(session.user.id);
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
              'concluido': 'Pedido finalizado com sucesso! Obrigado por usar Izi. ✨',
              'cancelado': 'Ah não, seu pedido foi cancelado. 🛑'
            };

            const msg = statusMessages[newOrder.status] || `Status do pedido atualizado: ${newOrder.status}`;
            showToast(msg, newOrder.status === 'cancelado' ? 'warning' : 'success');

            // Se o pagamento lightning foi confirmado, fechar a tela de pagamento
            if (newOrder.payment_status === 'paid' && subViewRef.current === "lightning_payment") {
              setSubView("payment_success");
            }

            // Abrir tela de avaliação ao concluir (exceto para assinaturas Izi Black)
            if (newOrder.status === 'concluido') {
              setTimeout(() => {
                if (newOrder.service_type === 'subscription') {
                  setShowIziBlackWelcome(true);
                  setSubView("none");
                } else {
                  setSubView("order_feedback");
                }
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
    const isFree = selectedShop?.freeDelivery || (isIziBlackMembership && subtotal >= 50);
    const taxaBase = isFree ? 0 : 5.0; 
    const taxaDinamica = isFree ? 0 : calculateDynamicPrice(taxaBase);
    
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
      showToast("Saldo insuficiente na carteira! Adicione fundos para continuar.");
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
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
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
          
          const newCashback = iziCashbackEarned + (isIziBlackMembership ? (subtotal * 0.05) : (subtotal * 0.01));
          await supabase.from('users_delivery').update({ cashback_earned: newCashback }).eq('id', userId);
          setIziCashbackEarned(newCashback);

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
      const newCashback = iziCashbackEarned + (isIziBlackMembership ? (subtotal * 0.05) : (subtotal * 0.01));
      supabase.from('users_delivery').update({ cashback_earned: newCashback }).eq('id', userId).then();
      setIziCashbackEarned(newCashback);

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
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
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
    } else if (paymentMethod === "bitcoin_lightning") {
      setSubView("payment_processing");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada.");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const lnResponse = await fetch(`${supabaseUrl}/functions/v1/create-lightning-invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({
            amount: total,
            orderId: orderData.id,
            memo: `Pedido IziDelivery #${orderData.id.slice(0,8).toUpperCase()}`
          }),
        });

        if (!lnResponse.ok) {
          const errText = await lnResponse.text();
          throw new Error(`Erro ao gerar Invoice Lightning: ${errText}`);
        }

        const lnResult = await lnResponse.json();
        setLightningData(lnResult);
        setSubView("lightning_payment");
      } catch (err: any) {
        toastError(err.message);
        setSubView("payment_error");
      } finally {
        setIsLoading(false);
      }
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
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
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
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ amount: price, orderId: data.id, email, customer: { name: userName, cpf: cpf } }),
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

  const renderMasterPerks = () => {
    const tierPerks = [
      { icon: 'monetization_on', label: 'Cashback Elite 5%', desc: 'Em todos os pedidos via Carteira Digital' },
      { icon: 'bolt', label: 'Priority Match', desc: 'Fure a fila em horários de pico' },
      { icon: 'support_agent', label: 'Concierge 24/7', desc: 'Atendimento exclusivo via WhatsApp' },
      { icon: 'card_giftcard', label: 'Surprise Box', desc: 'Presente exclusivo mensal' },
    ];

    return (
      <div className="absolute inset-0 z-[180] bg-black flex flex-col hide-scrollbar overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-60 bg-gradient-to-b from-primary/[0.06] to-transparent pointer-events-none" />
        
        <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-xl z-20 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl fill-1">workspace_premium</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-none">Recompensas</h2>
              <p className="text-[9px] font-black text-primary/70 uppercase tracking-[0.3em]">Desbloqueáveis</p>
            </div>
          </div>
          <button 
            onClick={() => setShowMasterPerks(false)}
            className="size-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/30 active:scale-90 transition-all border border-white/[0.06]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </header>

        <main className="px-6 pb-32 space-y-8 relative z-10">
          {/* Tier Visual */}
          <div className="text-center py-8">
            <p className="text-[9px] font-black text-primary/50 uppercase tracking-[0.4em] mb-3">Próximo Tier</p>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none mb-2">Master</h1>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest max-w-[240px] mx-auto">Onde tecnologia encontra o luxo em serviços</p>
          </div>

          {/* Rewards */}
          <div className="space-y-3">
            {tierPerks.map((perk, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] flex items-start gap-4"
              >
                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined fill-1">{perk.icon}</span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white tracking-tight mb-1">{perk.label}</h4>
                  <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest leading-relaxed">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Boost */}
          <div className="bg-white/[0.03] rounded-2xl p-6 border border-primary/10 text-center">
            <p className="text-[9px] font-black text-primary/50 uppercase tracking-[0.3em] mb-2">Boost Ativo</p>
            <h3 className="text-2xl font-black text-white tracking-tight mb-1">+200% IziCoins</h3>
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-5">Ative por 24h e suba de tier mais rápido</p>
            <button className="w-full py-4 bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl active:scale-[0.98] transition-all">
              Ativar Boost
            </button>
          </div>
        </main>
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


  return (
    <ServicesContext.Provider value={contextValue}>
      <div className="relative w-full h-[100dvh] max-w-[430px] mx-auto bg-background-light dark:bg-background-dark overflow-hidden font-display">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-[90vw]">
            <div className="bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl">
              {toast}
            </div>
          </div>
        )}

        {/* Loading screen */}
        {view === "loading" && (
          <div className="flex items-center justify-center h-full bg-[#0f0f0f]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Carregando...</p>
            </div>
          </div>
        )}

        {/* Login screen */}
        {view === "login" && (
          <Suspense fallback={<ViewFallback />}>
            <LoginView />
          </Suspense>
        )}

        {/* Main App */}
        {view === "app" && (
          <div className="flex flex-col h-full">
            {/* Tab content */}
            <main className="flex-1 overflow-hidden relative">
              <Suspense fallback={<ViewFallback />}>
                {tab === "home" && <HomeView />}
                {tab === "orders" && <OrdersView />}
                {tab === "wallet" && <WalletView />}
                {tab === "profile" && <ProfileView />}
              </Suspense>

              {/* Sub Views — Unified Layering */}
              <AnimatePresence>
                {subView === "generic_list" && (
                  <motion.div key="glist" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><GenericListView /></Suspense>
                  </motion.div>
                )}
                {subView === "restaurant_list" && (
                  <motion.div key="rlist" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><RestaurantListView /></Suspense>
                  </motion.div>
                )}
                {subView === "market_list" && (
                  <motion.div key="mlist" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><MarketListView /></Suspense>
                  </motion.div>
                )}
                {subView === "pharmacy_list" && (
                  <motion.div key="plist" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><PharmacyListView /></Suspense>
                  </motion.div>
                )}
                {subView === "all_pharmacies" && (
                  <motion.div key="allph" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><AllPharmaciesView /></Suspense>
                  </motion.div>
                )}
                {subView === "burger_list" && (
                  <motion.div key="blst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><BurgerListView /></Suspense>
                  </motion.div>
                )}
                {subView === "pizza_list" && (
                  <motion.div key="pzlst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><PizzaListView /></Suspense>
                  </motion.div>
                )}
                {subView === "acai_list" && (
                  <motion.div key="aclst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><AcaiListView /></Suspense>
                  </motion.div>
                )}
                {subView === "japonesa_list" && (
                  <motion.div key="jplst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><JaponesaListView /></Suspense>
                  </motion.div>
                )}
                {subView === "brasileira_list" && (
                  <motion.div key="brlst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><BrasileiraListView /></Suspense>
                  </motion.div>
                )}
                {subView === "explore_restaurants" && (
                  <motion.div key="exrst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ExploreRestaurantsView /></Suspense>
                  </motion.div>
                )}
                {subView === "daily_menus" && (
                  <motion.div key="dmnu" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><DailyMenusView /></Suspense>
                  </motion.div>
                )}
                {subView === "health_plantao" && (
                  <motion.div key="hlth" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><HealthPlantaoView /></Suspense>
                  </motion.div>
                )}
                {subView === "beverages_list" && (
                  <motion.div key="bvlst" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><BeveragesListView /></Suspense>
                  </motion.div>
                )}
                {subView === "beverage_offers" && (
                  <motion.div key="bvoff" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><BeverageOffersView /></Suspense>
                  </motion.div>
                )}
                {subView === "exclusive_offer" && (
                  <motion.div key="exoff" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ExclusiveOfferView /></Suspense>
                  </motion.div>
                )}
                {subView === "store_catalog" && (
                  <motion.div key="stcat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><StoreCatalogView /></Suspense>
                  </motion.div>
                )}
                {subView === "restaurant_menu" && (
                  <motion.div key="rmnu" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><RestaurantMenuView /></Suspense>
                  </motion.div>
                )}
                {subView === "product_detail" && (
                  <motion.div key="pdet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><ProductDetailView /></Suspense>
                  </motion.div>
                )}
                {subView === "addresses" && (
                  <motion.div key="addr" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><AddressesView /></Suspense>
                  </motion.div>
                )}
                {subView === "payments" && (
                  <motion.div key="pmts" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><PaymentsView /></Suspense>
                  </motion.div>
                )}
                {subView === "wallet" && (
                  <motion.div key="wllt" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><WalletView /></Suspense>
                  </motion.div>
                )}
                {subView === "cart" && (
                  <motion.div key="cart" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><CartView /></Suspense>
                  </motion.div>
                )}
                {subView === "checkout" && (
                  <motion.div key="chk" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><CheckoutView /></Suspense>
                  </motion.div>
                )}
                {subView === "explore_mobility" && (
                  <motion.div key="exmob" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ExploreMobilityView /></Suspense>
                  </motion.div>
                )}
                {subView === "explore_category" && (
                  <motion.div key="excat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ExploreCategoryView /></Suspense>
                  </motion.div>
                )}
                {subView === "explore_envios" && (
                  <motion.div key="exenv" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ExploreEnviosView /></Suspense>
                  </motion.div>
                )}
                {subView === "transit_selection" && (
                  <motion.div key="trnsl" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><TransitSelectionView /></Suspense>
                  </motion.div>
                )}
                {subView === "mobility_payment" && (
                  <motion.div key="mobpay" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><MobilityPaymentView /></Suspense>
                  </motion.div>
                )}
                {subView === "waiting_driver" && (
                  <motion.div key="waitd" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><WaitingDriverView /></Suspense>
                  </motion.div>
                )}
                {subView === "scheduled_order" && (
                  <motion.div key="sched" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ScheduledOrderView /></Suspense>
                  </motion.div>
                )}
                {subView === "shipping_details" && (
                  <motion.div key="ship" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><ShippingDetailsView /></Suspense>
                  </motion.div>
                )}
                {subView === "active_order" && (
                  <motion.div key="actord" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><ActiveOrderView /></Suspense>
                  </motion.div>
                )}
                {subView === "payment_processing" && (
                  <motion.div key="pprc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center bg-white dark:bg-slate-900">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Processando...</p>
                    </div>
                  </motion.div>
                )}
                {subView === "payment_error" && (
                  <motion.div key="perr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60]">
                    {renderPaymentError()}
                  </motion.div>
                )}
                {subView === "payment_success" && (
                  <motion.div key="psuc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60]">
                    <Suspense fallback={<ViewFallback />}><PaymentSuccessView /></Suspense>
                  </motion.div>
                )}
                {subView === "izi_black_purchase" && (
                  <motion.div key="izbp" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><IziBlackPurchaseView /></Suspense>
                  </motion.div>
                )}
                {subView === "order_support" && (
                  <motion.div key="osup" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    {renderOrderSupport()}
                  </motion.div>
                )}
                {subView === "order_feedback" && (
                  <motion.div key="ofbk" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    {renderOrderFeedback()}
                  </motion.div>
                )}
                {subView === "order_chat" && (
                  <motion.div key="ochat" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-40">
                    <Suspense fallback={<ViewFallback />}><OrderChatView /></Suspense>
                  </motion.div>
                )}
                {subView === "quest_center" && (
                  <motion.div key="qctr" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><QuestCenterView /></Suspense>
                  </motion.div>
                )}
                {subView === "pix_payment" && (
                  <motion.div key="pix" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><PixPaymentView /></Suspense>
                  </motion.div>
                )}
                {subView === "lightning_payment" && (
                  <motion.div key="lgtn" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-0 z-50">
                    <Suspense fallback={<ViewFallback />}><LightningPaymentView /></Suspense>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modals de overlay — Izi Black */}
              <AnimatePresence>
                {showIziBlackWelcome && (
                  <motion.div key="ibwlc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80]">
                    <Suspense fallback={<ViewFallback />}><IziBlackWelcomeView /></Suspense>
                  </motion.div>
                )}
                {showIziBlackCard && (
                  <motion.div key="ibcard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80]">
                    <Suspense fallback={<ViewFallback />}><IziBlackCardView /></Suspense>
                  </motion.div>
                )}
                {showMasterPerks && (
                  <motion.div key="mperks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80]">
                    <Suspense fallback={<ViewFallback />}><MasterPerksView /></Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Navigation */}
            <nav className="flex border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              {([
                { id: "home",    icon: "home",           label: "Início"   },
                { id: "orders",  icon: "receipt_long",   label: "Pedidos"  },
                { id: "wallet",  icon: "account_balance_wallet", label: "Carteira" },
                { id: "profile", icon: "person",         label: "Perfil"   },
              ] as const).map(item => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setSubView("none"); }}
                  className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all ${
                    tab === item.id ? "text-primary" : "text-slate-400"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: tab === item.id ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </ServicesContext.Provider>
  );
}

export default App;
