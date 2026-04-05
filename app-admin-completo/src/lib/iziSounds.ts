// Sistema de som Izi Delivery - Admin / Lojista
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

export const playIziSound = (role: 'merchant' | 'driver') => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();

  try {
    // 1. Tentar tocar o som personalizado do Pixabay
    const audio = new Audio('https://cdn.pixabay.com/audio/2022/10/04/audio_79bd7a4d75.mp3');
    audio.play().catch(err => {
       console.warn('Erro ao tocar áudio personalizado, tentando sintetizador:', err);
       playSyntheticRing(ctx);
    });

    // Função de fallback sintético se o áudio externo falhar
    function playSyntheticRing(ac: AudioContext | null) {
      if (!ac) return;
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.8;
        for (let j = 0; j < 15; j++) {
          const microOffset = offset + (j * 0.02);
          const freq = (j % 2 === 0) ? 440 : 480;
          playTone(ac, freq, 'square', microOffset, 0.04, 0.4); 
          playTone(ac, freq * 1.5, 'sawtooth', microOffset, 0.04, 0.15);
        }
        const offset2 = offset + 0.35;
        for (let j = 0; j < 12; j++) {
           const microOffset = offset2 + (j * 0.02);
           const freq = (j % 2 === 0) ? 440 : 480;
           playTone(ac, freq, 'square', microOffset, 0.04, 0.4);
        }
      }
    }

  } catch (e) {
    console.warn('Erro ao reproduzir som:', e);
  }
};

// Habilitar AudioContext após primeira interação do usuário (obrigatório nos navegadores modernos)
if (typeof window !== 'undefined') {
  const enableAudio = () => {
    getAudioContext();
    window.removeEventListener('click', enableAudio);
    window.removeEventListener('touchstart', enableAudio);
  };
  window.addEventListener('click', enableAudio, { once: true });
  window.addEventListener('touchstart', enableAudio, { once: true });
}
