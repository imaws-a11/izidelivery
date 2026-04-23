// Sistema de som Izi Delivery - App Entregador
// Uso de múltiplas camadas de fallback para garantir 100% de confiabilidade

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

export const playIziSound = async (role: 'merchant' | 'driver' | 'success') => {
  if (role === 'driver') stopIziSounds();
  
  const ctx = getAudioContext();
  console.log(`[AUDIO-CHECK] playIziSound para: ${role}, State: ${ctx?.state}`);
  
  if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
    try { await ctx.resume(); } catch (e) { console.warn('Falha ao resumir AudioContext:', e); }
  }

  // Beep inicial rápido para "acordar" o sistema e garantir atenção
  if (ctx) {
     playTone(ctx, 440, 'sine', 0, 0.1, 0.2);
  }

  // Vibração (Tátil)
  if (role === 'driver' && 'vibrate' in navigator) {
    navigator.vibrate([500, 200, 500, 200, 500]); 
  } else if (role === 'success' && 'vibrate' in navigator) {
    navigator.vibrate(100); 
  }

  // Lista de URLs prioritárias
  const soundUrls = {
    driver: ['/sounds/mission_call.wav', 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3'],
    success: ['https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3'],
    merchant: ['https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3']
  };
  
  const urls = soundUrls[role] || [];

  const playFromBuffer = async (index: number): Promise<boolean> => {
    if (index >= urls.length || !ctx) return false;
    
    try {
      const response = await fetch(urls[index]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      if (role === 'driver') {
         source.loop = true; // No driver, queremos que o som continue até ele aceitar ou o alerta acabar
         (window as any)._iziActiveSource = source;
      }
      
      source.start(0);
      return true;
    } catch (err) {
      console.warn(`[AUDIO] Falha ao carregar ${urls[index]}, tentando próxima...`);
      return playFromBuffer(index + 1);
    }
  };

  const success = await playFromBuffer(0);
  
  if (!success && ctx) {
    console.log('[AUDIO] MP3/WAV falharam. Usando sintetizador local...');
    playModernChime(ctx, role);
  }
};

export const stopIziSounds = () => {
  if ((window as any)._iziActiveSource) {
    try {
      (window as any)._iziActiveSource.stop();
      (window as any)._iziActiveSource = null;
    } catch (e) {
      console.error('Erro ao parar som:', e);
    }
  }
};

function playModernChime(ctx: AudioContext, role: string) {
  try {
    if (role === 'driver') {
        // Melodia de alerta persistente
        for(let i=0; i<5; i++) {
            playTone(ctx, 880, 'triangle', i * 1.0, 0.8, 0.3);
            playTone(ctx, 660, 'triangle', i * 1.0 + 0.4, 0.6, 0.2);
        }
    } else {
        playTone(ctx, 880, 'sine', 0, 0.5, 0.3);
        playTone(ctx, 1318.51, 'sine', 0.1, 0.3, 0.1);
    }
  } catch (e) {
    console.error('[AUDIO] Erro no sintetizador:', e);
  }
}

// Habilitar AudioContext após primeira interação do usuário
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
  
  ['mousedown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, enableAudio, { once: true, capture: true });
  });
}
