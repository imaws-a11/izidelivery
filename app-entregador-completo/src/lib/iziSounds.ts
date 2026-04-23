// Sistema de som Izi Delivery - App Entregador
// Uso de múltiplas camadas de fallback para garantir 100% de confiabilidade

let audioCtxInstance: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtxInstance || audioCtxInstance.state === 'closed') {
      audioCtxInstance = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
      });
    }
    return audioCtxInstance;
  } catch (e) {
    console.error('[AUDIO-CTX] Erro ao criar context:', e);
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
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
    
    // Envelope de volume mais agressivo para APK
    gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startOffset + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startOffset + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  } catch (e) {
    console.warn('[AUDIO-TONE] Erro ao tocar tom:', e);
  }
};

let audioGeneration = 0; // Previne sons "fantasmas" iniciados concorrentemente

export const playIziSound = async (role: 'merchant' | 'driver' | 'success') => {
  console.log(`[AUDIO] Chamada para: ${role} no APK/Web`);
  
  if (role === 'driver') stopIziSounds();
  
  audioGeneration++;
  const currentGen = audioGeneration;

  const ctx = getAudioContext();
  if (!ctx) {
      console.error('[AUDIO] AudioContext não disponível.');
      return;
  }

  // Forçar retomada do contexto
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    try { 
        await ctx.resume(); 
        console.log('[AUDIO] AudioContext resumido com sucesso.');
    } catch (e) { 
        console.warn('[AUDIO] Falha ao resumir:', e); 
    }
  }

  if (currentGen !== audioGeneration) return; // Abortado durante o resume

  // Beep inicial de alta frequência para "furar" o silêncio do sistema
  playTone(ctx, 1000, 'sine', 0, 0.2, 0.5);

  // Vibração (Tátil)
  if (role === 'driver' && 'vibrate' in navigator) {
    navigator.vibrate([1000, 500, 1000, 500, 1000]); 
  } else if (role === 'success' && 'vibrate' in navigator) {
    navigator.vibrate(200); 
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
    if (currentGen !== audioGeneration) return true; // Aborta silenciosamente
    
    try {
      console.log(`[AUDIO] Tentando carregar: ${urls[index]}`);
      const response = await fetch(urls[index]);
      if (!response.ok) throw new Error('Fetch failed');
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      if (currentGen !== audioGeneration) return true; // O usuário recusou DURANTE o fetch/decode! Abortar reprodução.
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      if (role === 'driver') {
         source.loop = true;
         (window as any)._iziActiveSource = source;
      }
      
      source.start(0);
      console.log(`[AUDIO] Reprodução iniciada: ${urls[index]}`);
      return true;
    } catch (err) {
      console.warn(`[AUDIO] Falha no índice ${index}:`, err);
      return playFromBuffer(index + 1);
    }
  };

  const success = await playFromBuffer(0);
  
  if (!success && currentGen === audioGeneration) {
    console.log('[AUDIO] Fallback: Usando sintetizador local...');
    playModernChime(ctx, role);
  }
};

export const stopIziSounds = () => {
  audioGeneration++; // Invalida todas as tentativas de tocar som pendentes
  
  if ((window as any)._iziActiveSource) {
    try {
      (window as any)._iziActiveSource.stop();
      (window as any)._iziActiveSource = null;
      console.log('[AUDIO] Som parado manualmente.');
    } catch (e) {
      console.error('[AUDIO] Erro ao parar som:', e);
    }
  }
};

function playModernChime(ctx: AudioContext, role: string) {
  try {
    if (role === 'driver') {
        // Alerta ultra-sonoro de emergência
        for(let i=0; i<10; i++) {
            playTone(ctx, 1200, 'square', i * 0.5, 0.3, 0.4);
            playTone(ctx, 800, 'square', i * 0.5 + 0.25, 0.3, 0.3);
        }
    } else {
        playTone(ctx, 880, 'sine', 0, 0.5, 0.3);
        playTone(ctx, 1318.51, 'sine', 0.1, 0.3, 0.1);
    }
  } catch (e) {
    console.error('[AUDIO] Erro no sintetizador:', e);
  }
}

// Desbloqueio global de áudio
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      ctx.resume().then(() => {
        console.log('🔊 [AUDIO] Desbloqueado via interação.');
        // Toca um silêncio para manter o context ativo em alguns dispositivos
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(0.1);
      });
    }
  };
  
  ['mousedown', 'touchstart', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: true, capture: true });
  });
}
