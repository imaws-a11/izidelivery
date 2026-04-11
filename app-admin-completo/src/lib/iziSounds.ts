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

/**
 * Fala um texto usando síntese de voz nativa
 */
const speak = (text: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancela falas anteriores para evitar fila
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Falha na síntese de voz:', e);
  }
};

export const playIziSound = async (role: 'merchant' | 'driver' | 'payment') => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try { await ctx.resume(); } catch (e) { console.warn('Falha ao resumir AudioContext:', e); }
  }

  // 1. Tentar Avisar por Voz (Muito eficaz para lojistas distraídos)
  if (role === 'merchant') {
    speak('Atenção: Novo pedido recebido!');
  } else if (role === 'payment') {
    speak('Pagamento confirmado!');
  }

  // 2. URLs de fallback para sons de notificação (MP3)
  const soundUrls = [
    'https://cdn.pixabay.com/audio/2022/10/04/audio_79bd7a4d75.mp3', // Principal (Ding Dong)
    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Fallback 1
    'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'  // Fallback 2
  ];

  const tryPlay = async (index: number): Promise<boolean> => {
    if (index >= soundUrls.length) return false;
    
    return new Promise((resolve) => {
      const audio = new Audio(soundUrls[index]);
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => resolve(true))
          .catch(() => {
            console.warn(`Som de fallback ${index} falhou, tentando próximo...`);
            resolve(tryPlay(index + 1));
          });
      } else {
        resolve(false);
      }
    });
  };

  const success = await tryPlay(0);
  
  if (!success && ctx) {
    console.log('Todos os sons externos falharam. Usando sintetizador interno...');
    playModernChime(ctx);
  }
};

/**
 * Som sintetizado de alta qualidade (Ding-Dong modernizado)
 * Garantido que funciona sem internet e sem arquivos externos.
 */
function playModernChime(ctx: AudioContext) {
  // Primeiro tom (Ding) - Agudo e brilhante
  playTone(ctx, 880, 'sine', 0, 1.2, 0.3);      // A5
  playTone(ctx, 1318.51, 'sine', 0, 0.8, 0.1); // E6
  
  // Segundo tom (Dong) - Mais grave e ressonante
  playTone(ctx, 698.46, 'sine', 0.5, 1.5, 0.3);  // F5
  playTone(ctx, 1046.50, 'sine', 0.5, 1.0, 0.1); // C6
}

// Habilitar AudioContext após primeira interação do usuário (Obrigatório em navegadores modernos)
if (typeof window !== 'undefined') {
  const enableAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('🔊 AudioContext/Voz ativados com sucesso.');
      });
    }
    // Também dispara uma fala vazia para "acordar" a síntese de voz se necessário
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
  };
  
  window.addEventListener('mousedown', enableAudio, { once: true });
  window.addEventListener('touchstart', enableAudio, { once: true });
  window.addEventListener('keydown', enableAudio, { once: true });
}
