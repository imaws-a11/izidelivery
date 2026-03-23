export const playIziSound = (role: 'merchant' | 'driver') => {
  try {
    const sounds = {
      merchant: "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3", // Ringtone de telefone digital
      driver: "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3"     // Alerta pop energético
    };

    const audio = new Audio(sounds[role] || sounds.driver);
    audio.volume = role === 'merchant' ? 1.0 : 0.8; 
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => playSyntheticFallback(role));
    }
  } catch (err) {
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
    } else {
      playTone(1320, 'square', now, 0.1, 0.1);
      playTone(1760, 'square', now + 0.15, 0.2, 0.1);
    }
  } catch (e) {}
};
