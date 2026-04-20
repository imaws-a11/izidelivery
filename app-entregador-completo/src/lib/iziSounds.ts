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
    if (role === 'driver') {
        audio.loop = false;
        let count = 0;
        const maxRepeats = 5; // Aumentado para 5 repetições (aprox. 30-40 segundos de som)
        audio.addEventListener('ended', () => {
            if (count < maxRepeats) { 
                count++;
                audio.currentTime = 0;
                audio.play().catch(e => console.error('Erro na repetição do som:', e));
            }
        });
        (window as any)._iziActiveAlarm = audio;
    }

    audio.currentTime = 0;
    audio.load();
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.catch((e) => {
            console.warn(`[iziSounds] Bloqueio de áudio detectado para ${role}:`, e);
            // Fallback para melodia melódica rítmica se for driver (Certo para alertar)
            if (ctx && role === 'driver') {
                const now = ctx.currentTime;
                // Melodia ascendente tripla (Drip Sound)
                [440, 660, 880].forEach((freq, index) => {
                    playTone(ctx, freq, 'triangle', index * 0.15, 0.4, 0.1);
                    playTone(ctx, freq * 1.5, 'sine', index * 0.15 + 0.05, 0.2, 0.05);
                });
            }
        });
    }

  } catch (e) {
    console.warn('Erro ao reproduzir som:', e);
  }
};

export const stopIziSounds = () => {
  if ((window as any)._iziActiveAlarm) {
    try {
      (window as any)._iziActiveAlarm.pause();
      (window as any)._iziActiveAlarm.currentTime = 0;
      (window as any)._iziActiveAlarm = null;
    } catch (e) {
      console.error('Erro ao parar som:', e);
    }
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
