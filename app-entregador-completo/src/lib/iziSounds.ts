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

export const playIziSound = (role: 'merchant' | 'driver') => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (role === 'merchant') {
      // Som de telefone tocando - insistente (ring ring ring)
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.7;
        playTone(ctx, 440, 'sine', offset, 0.3, 0.4);
        playTone(ctx, 480, 'sine', offset, 0.3, 0.4);
      }
    } else {
      // Som de alerta de missão pro entregador - 3 bips crescentes rápidos
      playTone(ctx, 880, 'square', 0, 0.08, 0.12);
      playTone(ctx, 1100, 'square', 0.12, 0.08, 0.14);
      playTone(ctx, 1320, 'square', 0.24, 0.08, 0.16);
      // Segundo grupo mais alto
      playTone(ctx, 880, 'square', 0.5, 0.08, 0.14);
      playTone(ctx, 1100, 'square', 0.62, 0.08, 0.16);
      playTone(ctx, 1760, 'square', 0.74, 0.15, 0.2);
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
