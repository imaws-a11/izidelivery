// Sistema de som Izi Delivery - App Entregador
// Usa AudioContext sintético como método principal (100% confiável, sem dependência externa)

let audioCtxInstance: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtxInstance || audioCtxInstance.state === 'closed') {
      audioCtxInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxInstance.state === 'suspended') {
      audioCtxInstance.resume();
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
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startOffset);
  osc.stop(ctx.currentTime + startOffset + duration);
};

export const playIziSound = (role: 'merchant' | 'driver' | 'success') => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();

  try {
    // 1. Vibração (Tátil)
    if (role === 'driver' && 'vibrate' in navigator) {
      navigator.vibrate([500, 200, 500]); 
    } else if (role === 'success' && 'vibrate' in navigator) {
      navigator.vibrate(100); 
    }

    // 2. Audio MP3 (Som principal - Único ativo conforme pedido)
    const soundUrls = {
      driver: '/sounds/mission_call.wav',
      success: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3',
      merchant: 'https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3'
    };

    const audio = new Audio(soundUrls[role]);
    audio.play().catch(() => {
        // Fallback dinâmico se o navegador bloquear
        if (ctx && role === 'driver') {
            playTone(ctx, 880, 'triangle', 0, 0.4, 0.1); 
        }
    });

  } catch (e) {
    console.warn('Erro ao reproduzir som:', e);
  }
};

// Habilitar AudioContext após primeira interação do usuário
if (typeof window !== 'undefined') {
  const enableAudio = () => {
    getAudioContext();
    window.removeEventListener('click', enableAudio);
    window.removeEventListener('touchstart', enableAudio);
  };
  window.addEventListener('click', enableAudio, { once: true });
  window.addEventListener('touchstart', enableAudio, { once: true });
}
