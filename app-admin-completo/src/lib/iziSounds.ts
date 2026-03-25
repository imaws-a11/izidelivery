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
  if (!ctx) return;

  try {
    // SOM DE TELEFONE ANTIGO (RETRO-RING) - ALTO E PENETRANTE
    // Usamos ondas Square e Sawtooth com frequências clássicas de campainha mecânica
    const playRetroRing = () => {
      const repeat = 3 * 0.8; // 3 toques principais
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.8;
        
        // Simular o motor da campainha (vibrato rápido entre 440 e 480Hz)
        for (let j = 0; j < 15; j++) {
          const microOffset = offset + (j * 0.02);
          const freq = (j % 2 === 0) ? 440 : 480;
          playTone(ctx, freq, 'square', microOffset, 0.04, 0.4); 
          // Camada extra para brilho e volume
          playTone(ctx, freq * 1.5, 'sawtooth', microOffset, 0.04, 0.15);
        }
        
        // Breve pausa no meio do ring-ring duplo clássico
        const offset2 = offset + 0.35;
        for (let j = 0; j < 12; j++) {
           const microOffset = offset2 + (j * 0.02);
           const freq = (j % 2 === 0) ? 440 : 480;
           playTone(ctx, freq, 'square', microOffset, 0.04, 0.4);
        }
      }
    };

    playRetroRing();

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
