export const playIziSound = (role: 'merchant' | 'driver') => {
  try {
    // Endereços de sons públicos e estáveis (estilo Ringtone e Alerta)
    const sounds = {
      merchant: "https://www.soundjay.com/phone/phone-ringing-08.mp3", // Ringtone de telefone ALTO e insistente para o lojista
      driver: "https://www.soundjay.com/communication/beep-07.mp3"     // Alerta de comunicação agudo e rápido para o entregador
    };

    const audio = new Audio(sounds[role] || sounds.merchant);
    audio.setAttribute('preload', 'auto');
    audio.volume = 1.0; // Volume máximo para garantir a audição
    
    // Tentativa de execução com tratamento de erro e carregamento explícito
    audio.load();
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Autoplay bloqueado pelo navegador. É necessária uma interação prévia na página.", error);
        // Tenta tocar o sintético se o arquivo falhar ou for bloqueado
        playSyntheticFallback(role);
      });
    }
  } catch (err) {
    console.error("Erro no som:", err);
    playSyntheticFallback(role);
  }
};

const playSyntheticFallback = (role: 'merchant' | 'driver') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Se o AudioContext estiver suspenso (comum em navegadores modernos), tenta resumir
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

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

    const now = audioCtx.currentTime;
    if (role === 'merchant') {
      // Tom de telefone sintético (Ring Ring)
      playTone(440, 'sine', now, 0.5, 0.5);
      playTone(480, 'sine', now, 0.5, 0.5);
      playTone(440, 'sine', now + 0.6, 0.5, 0.5);
      playTone(480, 'sine', now + 0.6, 0.5, 0.5);
    } else {
      // Alerta rápido
      playTone(1320, 'square', now, 0.1, 0.15);
      playTone(1760, 'square', now + 0.15, 0.2, 0.15);
    }
  } catch (e) {}
};
