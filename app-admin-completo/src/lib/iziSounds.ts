// Sistema de som Izi Delivery - Admin / Lojista
// Uso de múltiplas camadas de fallback + Voz para garantir 100% de confiabilidade

let audioCtxInstance: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtxInstance || audioCtxInstance.state === 'closed') {
      audioCtxInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxInstance;
  } catch {
    return null;
  }
};

const playTone = (
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  startOffset: number,
  duration: number,
  volume: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startOffset + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration);
};

let orderLoopInterval: any = null;

export const startOrderLoop = async (role: 'merchant' | 'driver' = 'merchant') => {
  if (orderLoopInterval) return;
  
  // Toca a primeira vez imediatamente
  playIziSound(role);
  
  orderLoopInterval = setInterval(() => {
    playIziSound(role);
  }, 5000); // Toca a cada 5 segundos (intervalo de som + 3s de folga)
  
  console.log('🔊 [AUDIO] Loop de novos pedidos iniciado.');
};

export const stopOrderLoop = () => {
  if (orderLoopInterval) {
    clearInterval(orderLoopInterval);
    orderLoopInterval = null;
    console.log('🔇 [AUDIO] Loop de novos pedidos parado.');
  }
};

export const playIziSound = async (role: 'merchant' | 'driver' | 'payment' | 'candidate') => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    try { await ctx.resume(); } catch (e) { console.warn('Falha ao resumir AudioContext:', e); }
  }

  // Beep inicial rápido para garantir que o canal de áudio esteja aberto
  playTone(ctx, 440, 'sine', 0, 0.05, 0.1);

  // Lista de URLs prioritárias
  const soundUrls = ['/sounds/notification.mp3', 'https://cdn.pixabay.com/audio/2021/08/04/audio_06dce69623.mp3'];
  
  const playFromBuffer = async (index: number): Promise<boolean> => {
    if (index >= soundUrls.length) return false;
    
    try {
      const response = await fetch(soundUrls[index]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      return true;
    } catch (err) {
      return playFromBuffer(index + 1);
    }
  };

  const success = await playFromBuffer(0);
  if (!success) {
    playModernChime(ctx);
  }
};

/**
 * Som sintetizado de alta qualidade (Ding-Dong modernizado)
 * Garantido que funciona sem internet e sem arquivos externos.
 */
function playModernChime(ctx: AudioContext) {
  try {
    // Primeiro tom (Ding) - Agudo e brilhante
    playTone(ctx, 880, 'sine', 0, 0.8, 0.4);      // A5
    playTone(ctx, 1318.51, 'sine', 0.05, 0.5, 0.1); // E6
    
    // Segundo tom (Dong) - Mais grave e ressonante
    playTone(ctx, 698.46, 'sine', 0.4, 1.2, 0.4);  // F5
    playTone(ctx, 1046.50, 'sine', 0.45, 0.8, 0.1); // C6
  } catch (e) {
    console.error('[AUDIO] Erro no sintetizador:', e);
  }
}

// Habilitar AudioContext após primeira interação do usuário (Obrigatório em navegadores modernos)
if (typeof window !== 'undefined') {
  const enableAudio = () => {
    console.log('[AUDIO] Interação detectada, desbloqueando som...');
    const ctx = getAudioContext();
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      ctx.resume().then(() => {
        console.log('🔊 [AUDIO] Sistema de áudio desbloqueado e pronto.');
      });
    }
  };
  
  // Registrar múltiplos eventos para garantir a captura do gesto
  ['mousedown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, enableAudio, { once: true, capture: true });
  });
}
