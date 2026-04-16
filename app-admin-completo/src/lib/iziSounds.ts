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

export const playIziSound = async (role: 'merchant' | 'driver' | 'payment') => {
  const ctx = getAudioContext();
  console.log(`[AUDIO-CHECK] playIziSound chamada para: ${role}, Contexto: ${ctx?.state}`);
  
  if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
    try { await ctx.resume(); } catch (e) { console.warn('Falha ao resumir AudioContext:', e); }
  }

  if (ctx) {
     // Beep inicial rápido para "acordar" o sistema e o usuário
     playTone(ctx, 440, 'sine', 0, 0.1, 0.2);
  }

  // Lista de URLs prioritárias
  const soundUrls = ['/sounds/notification.mp3', 'https://cdn.pixabay.com/audio/2021/08/04/audio_06dce69623.mp3'];
  
  const playFromBuffer = async (url: number): Promise<boolean> => {
    if (url >= soundUrls.length || !ctx) return false;
    
    try {
      const response = await fetch(soundUrls[url]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      return true;
    } catch (err) {
      console.warn(`[AUDIO] Falha ao carregar ${soundUrls[url]}, tentando próxima...`);
      return playFromBuffer(url + 1);
    }
  };

  const success = await playFromBuffer(0);
  
  if (!success && ctx) {
    console.log('[AUDIO] Todos os MP3 falharam. Usando sintetizador local...');
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
