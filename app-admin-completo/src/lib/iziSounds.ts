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
  if (ctx && ctx.state === 'suspended') {
    try { await ctx.resume(); } catch (e) { console.warn('Falha ao resumir AudioContext:', e); }
  }

  if (ctx) {
     // Beep inicial rápido para "acordar" o sistema e o usuário
     playTone(ctx, 440, 'sine', 0, 0.1, 0.2);
  }

  // URLs de fallback para sons de notificação (MP3)
  // O primeiro é o arquivo local que o usuário deve colocar na pasta /public/sounds/
  const soundUrls = [
    '/sounds/notification.mp3', // ARQUIVO LOCAL (Recomendado)
    'https://cdn.pixabay.com/audio/2022/10/04/audio_79bd7a4d75.mp3', // Fallback Principal (Ding Dong)
    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Fallback 1
    'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'  // Fallback 2
  ];

  const tryPlay = async (index: number): Promise<boolean> => {
    if (index >= soundUrls.length) return false;
    
    console.log(`[AUDIO] Tentando reproduzir: ${soundUrls[index]}`);
    
    return new Promise((resolve) => {
      const audio = new Audio(soundUrls[index]);
      audio.volume = 1.0;
      audio.preload = 'auto';
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => resolve(true))
          .catch((err) => {
            if (err.name === 'NotAllowedError') {
                console.error('⚠️ [AUDIO] O navegador bloqueou o som. Por favor, CLIQUE em qualquer lugar da tela para habilitar o áudio.');
            }
            resolve(tryPlay(index + 1));
          });
      } else {
        resolve(false);
      }
    });
  };

  const success = await tryPlay(0);
  
  if (!success && ctx) {
    console.log('[AUDIO] Todos os sons externos falharam. Usando sintetizador local...');
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
        // Beep de confirmação discreto
        playTone(ctx, 523.25, 'sine', 0, 0.05, 0.05);
      });
    }
  };
  
  // Registrar múltiplos eventos para garantir a captura do gesto
  ['mousedown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, enableAudio, { once: true, capture: true });
  });
}
