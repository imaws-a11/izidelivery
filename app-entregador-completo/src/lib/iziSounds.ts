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
    // 1. Tentar tocar o som personalizado (Uber Eats para motorista)
    const soundUrl = role === 'driver' 
      ? 'https://www.myinstants.com/media/sounds/uber_driver_2019-99d7bb65-f449-4a38-b010-1ff9ff0454f2.mp3'
      : role === 'success'
      ? 'https://cdn.pixabay.com/audio/2021/08/04/audio_346b0a6e0e.mp3' // Success chime
      : 'https://cdn.pixabay.com/audio/2022/10/04/audio_79bd7a4d75.mp3';

    const audio = new Audio(soundUrl);
    audio.play().catch(err => {
       console.warn('Erro ao tocar áudio personalizado, tentando sintetizador:', err);
       playSyntheticRing(ctx);
    });

    // Função de fallback sintética
    function playSyntheticRing(ac: AudioContext | null) {
      if (!ac) return;
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.8;
        for (let j = 0; j < 15; j++) {
          const microOffset = offset + (j * 0.02);
          const freq = (j % 2 === 0) ? 440 : 480;
          playTone(ac, freq, 'square', microOffset, 0.04, 0.45); 
          playTone(ac, freq * 1.5, 'sawtooth', microOffset, 0.04, 0.15); 
        }
        const offset2 = offset + 0.35;
        for (let j = 0; j < 12; j++) {
           const microOffset = offset2 + (j * 0.02);
           const freq = (j % 2 === 0) ? 440 : 480;
           playTone(ac, freq, 'square', microOffset, 0.04, 0.45);
        }
      }
    }

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
