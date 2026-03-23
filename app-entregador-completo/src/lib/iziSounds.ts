export const playIziSound = (role: 'merchant' | 'driver') => {
  try {
    const sounds = {
      merchant: "https://www.soundjay.com/phone/phone-ringing-08.mp3", // Ringtone
      driver: "https://www.soundjay.com/communication/beep-07.mp3"     // Alerta bip
    };

    const audio = new Audio(sounds[role] || sounds.driver);
    audio.setAttribute('preload', 'auto');
    audio.volume = 1.0;
    
    audio.load();
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
      playTone(440, 'sine', now, 0.5, 0.5);
    } else {
      playTone(1320, 'square', now, 0.1, 0.15);
      playTone(1760, 'square', now + 0.15, 0.2, 0.15);
    }
  } catch (e) {}
};
