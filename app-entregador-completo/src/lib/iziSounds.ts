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

  // Função de voz (Backup Infalível)
  const speak = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Limpa filas anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch(e) {}
  };

  try {
    // 1. Som Sintético (Funciona mesmo sem internet)
    if (ctx) {
      if (role === 'driver') {
        playTone(ctx, 880, 'triangle', 0, 0.4, 0.3); // A5
        playTone(ctx, 1320, 'triangle', 0.2, 0.6, 0.2); // E6
      } else if (role === 'success') {
        playTone(ctx, 523, 'sine', 0, 0.2, 0.3);
        playTone(ctx, 783, 'sine', 0.1, 0.3, 0.2);
      }
    }

    // 2. Voz (Reforço auditivo)
    if (role === 'driver') speak('Atenção: Nova missão disponível');

    // 3. Vibração (Tátil)
    if (role === 'driver' && 'vibrate' in navigator) {
      navigator.vibrate([500, 200, 500]); // Vibração longa para chamadas
    } else if (role === 'success' && 'vibrate' in navigator) {
      navigator.vibrate(100); // Vibração curta para sucesso
    }

    // 4. Audio MP3 (Textura premium)
    const soundUrls = {
      driver: 'https://cdn.freesound.org/previews/219/219244_4082826-lq.mp3',
      success: 'https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3',
      merchant: 'https://cdn.freesound.org/previews/263/263133_2064400-lq.mp3'
    };

    const audio = new Audio(soundUrls[role]);
    audio.play().catch(() => {
        // Fallback já garantido pelo som sintético e voz
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
