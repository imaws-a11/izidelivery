export const playIziSound = (role: 'merchant' | 'driver') => {
  try {
    // URLs de sons premium selecionados para alta visibilidade e profissionalismo
    const sounds = {
      merchant: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3", // Ringtone de telefone digital (Atencioso e Alto)
      driver: "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"     // Notificação "Pop" rápida e energética
    };

    const audio = new Audio(sounds[role] || sounds.merchant);
    audio.volume = role === 'merchant' ? 1.0 : 0.8; // Lojista volume máximo (conforme solicitado)
    
    // Tenta tocar, tratando bloqueio de autopaly do navegador
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Autoplay bloqueado ou falha no áudio:", error);
        // Fallback para tom sintético se a URL falhar
        playSyntheticFallback(role);
      });
    }
  } catch (err) {
    console.error("Erro ao reproduzir som:", err);
    playSyntheticFallback(role);
  }
};

const playSyntheticFallback = (role: 'merchant' | 'driver') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    const playTone = (freq: number, type: OscillatorType, start: number, duration: number, volume: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    if (role === 'merchant') {
      playTone(880, 'sine', now, 0.4, 0.3);
      playTone(1108, 'sine', now + 0.1, 0.5, 0.2);
    } else {
      playTone(1320, 'square', now, 0.1, 0.1);
      playTone(1760, 'square', now + 0.15, 0.2, 0.1);
    }
  } catch (e) {}
};
