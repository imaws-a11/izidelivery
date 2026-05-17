import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';

interface IncomingOrderOverlayProps {
  order: any | null;
  onAccept: (order: any) => void;
  onDismiss: () => void;
  getServicePresentation: (order: any) => any;
  getNetEarnings: (order: any) => number;
}

const OVERLAY_TIMEOUT_MS = 30000; // Auto-dismiss após 30 segundos (segurança)

/**
 * IncomingOrderOverlay — Plano 2 (Full-Screen Intent Hybrid)
 * 
 * Renderizado via React Portal diretamente no <body> para:
 * 1. Evitar conflitos de z-index com a árvore de componentes
 * 2. Garantir que aparece SOBRE todos os outros elementos
 * 3. Nunca bloquear a renderização do app em caso de crash
 * 
 * Proteções contra tela branca:
 * - Auto-dismiss após 30s (OVERLAY_TIMEOUT_MS)
 * - Dismiss ao clicar no backdrop
 * - Error boundary via try/catch no render
 * - Cleanup garantido no unmount
 * - Estado controlado externamente (pai controla visibilidade)
 */
const IncomingOrderOverlay: React.FC<IncomingOrderOverlayProps> = ({
  order,
  onAccept,
  onDismiss,
  getServicePresentation,
  getNetEarnings
}) => {
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup refs ao desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer de auto-dismiss + countdown visual
  useEffect(() => {
    if (!order) return;

    setCountdown(30);

    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) onDismiss();
    }, OVERLAY_TIMEOUT_MS);

    // Countdown visual (1s)
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCountdown(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [order?.realId || order?.id]);

  const handleAccept = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (order) onAccept(order);
  }, [order, onAccept]);

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onDismiss();
  }, [onDismiss]);

  // Proteção: se não tem pedido, não renderiza nada
  if (!order) return null;

  // Calcular dados com proteção contra crash
  let presentation: any = { headline: 'Nova Entrega', pickupText: '', isMobility: false, details: { icon: 'local_shipping' } };
  let earnings = 0;
  try {
    presentation = getServicePresentation(order) || presentation;
    earnings = getNetEarnings(order) || 0;
  } catch (e) {
    console.error('[OVERLAY] Erro ao calcular dados do pedido:', e);
  }

  const cleanAddress = (text: string | null | undefined): string => {
    if (!text) return 'Endereço não informado';
    return text.split('|')[0].trim();
  };

  const overlayContent = (
    <AnimatePresence>
      <motion.div
        key="incoming-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 flex flex-col items-center justify-center p-6"
        style={{ zIndex: 99999 }} // Acima de TUDO
        onClick={(e) => {
          // Dismiss ao clicar no backdrop (não nos botões)
          if (e.target === e.currentTarget) handleDismiss();
        }}
      >
        {/* Backdrop escuro com blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Card Principal */}
        <motion.div
          initial={{ scale: 0.8, y: 60 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-sm"
        >
          {/* Countdown Ring */}
          <div className="absolute -top-4 right-4 z-10">
            <div className="relative size-10 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3"
                  strokeDasharray={`${(countdown / 30) * 100}, 100`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
              </svg>
              <span className="text-[10px] font-black text-white">{countdown}</span>
            </div>
          </div>

          {/* Ícone Superior Pulsante */}
          <div className="flex justify-center mb-[-28px] relative z-10">
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                boxShadow: [
                  '0 0 0 0 rgba(250,204,21,0.4)',
                  '0 0 0 20px rgba(250,204,21,0)',
                  '0 0 0 0 rgba(250,204,21,0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`size-16 rounded-2xl flex items-center justify-center ${
                presentation.isMobility ? 'bg-indigo-600' : 'bg-yellow-400'
              }`}
            >
              <Icon 
                name={presentation.details?.icon || 'local_shipping'} 
                className={`text-[32px] ${presentation.isMobility ? 'text-white' : 'text-zinc-900'}`} 
              />
            </motion.div>
          </div>

          {/* Card Body */}
          <div className="bg-zinc-900 rounded-[28px] border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="pt-10 pb-4 px-6 text-center">
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2"
              >
                ⚡ Nova Missão Disponível
              </motion.p>
              <h2 className="text-white text-xl font-black uppercase tracking-tight leading-tight">
                {presentation.headline || 'Nova Entrega'}
              </h2>
            </div>

            {/* Valor */}
            <div className="mx-6 mb-4 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Você ganha</p>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-4xl font-black ${presentation.isMobility ? 'text-indigo-400' : 'text-yellow-400'}`}>
                  R$ {earnings.toFixed(2).replace('.', ',')}
                </span>
                <Icon 
                  name="local_fire_department" 
                  className={`text-2xl ${presentation.isMobility ? 'text-indigo-400' : 'text-yellow-500'}`} 
                />
              </div>
            </div>

            {/* Endereços */}
            <div className="mx-6 mb-4 space-y-2">
              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <div className="size-8 rounded-lg bg-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="store" className="text-yellow-400" size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-yellow-400/70 text-[8px] font-black uppercase tracking-widest mb-0.5">Coleta</p>
                  <p className="text-white text-xs font-bold leading-tight truncate">
                    {order.store_name || order.merchant_name || 'Parceiro Izi'}
                  </p>
                  <p className="text-white/50 text-[10px] leading-tight truncate">
                    {cleanAddress(order.origin || order.pickup_address)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="location_on" className="text-white/60" size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-0.5">Destino</p>
                  <p className="text-white/80 text-[10px] leading-tight truncate">
                    {cleanAddress(order.destination || order.delivery_address)}
                  </p>
                </div>
              </div>
            </div>

            {/* Distância Badge */}
            {(order.distance_km || order.distance) && (
              <div className="mx-6 mb-4 flex justify-center">
                <div className="bg-yellow-400 px-3 py-1 rounded-lg">
                  <span className="text-zinc-900 text-[10px] font-black uppercase tracking-tight">
                    {order.distance_km ? `${parseFloat(order.distance_km).toFixed(1)} km` : order.distance}
                  </span>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="p-4 space-y-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 ${
                  presentation.isMobility
                    ? 'bg-indigo-500 text-white'
                    : 'bg-yellow-400 text-zinc-900'
                }`}
              >
                <Icon name="check" size={20} />
                Aceitar Agora
              </motion.button>

              <button
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl text-white/30 font-bold text-[10px] uppercase tracking-widest active:text-white/60 transition-colors"
              >
                Recusar Chamada
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Renderizar via Portal no body — isolado da árvore React do app
  try {
    return ReactDOM.createPortal(overlayContent, document.body);
  } catch (e) {
    console.error('[OVERLAY] Falha ao renderizar portal:', e);
    return null; // Nunca crasha o app
  }
};

/**
 * Error Boundary — Captura qualquer crash no overlay e retorna null
 * Garante que o app NUNCA exibe tela branca por causa do overlay
 */
export class OverlayErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[OVERLAY ERROR BOUNDARY]', error, info);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return null; // Silenciosamente remove o overlay
    return this.props.children;
  }
}

export default IncomingOrderOverlay;
