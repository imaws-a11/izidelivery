export const playIziSound = (role: 'merchant' | 'driver') => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
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
    // Izi Merchant: Two elegant high tones (Professional & Minimalist)
    playTone(880, 'sine', now, 0.4, 0.15); // A5
    playTone(1108.73, 'sine', now + 0.12, 0.5, 0.12); // C#6
  } else if (role === 'driver') {
    // Izi Driver: Energetic high-pitched sequence (Urgent & Alert)
    playTone(1320, 'square', now, 0.08, 0.08); // E6
    playTone(1320, 'square', now + 0.12, 0.08, 0.08); // E6
    playTone(1760, 'square', now + 0.24, 0.15, 0.08); // A6
  }
};
