import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DigitalTimerProps {
  targetDate: string;
  createdDate?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light' | 'premium-red' | 'izi-flash';
}

const getBoxStyle = (variant: string, isUrgent: boolean) => {
  if (variant === 'izi-flash') {
    return `bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 border border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.6),inset_0_2px_10px_rgba(255,255,255,0.4)] relative overflow-hidden ${isUrgent ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''}`;
  }
  if (variant === 'premium-red') {
    return `bg-[#1a0505] border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4),inset_0_0_20px_rgba(239,68,68,0.2)] backdrop-blur-xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:z-0 ${isUrgent ? 'animate-pulse' : ''}`;
  }
  if (variant === 'dark') {
    return 'bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:z-0';
  }
  return 'bg-gradient-to-b from-white to-zinc-100 border border-zinc-200 shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] relative overflow-hidden';
};

const getTextStyle = (variant: string) => {
  if (variant === 'izi-flash') return 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]';
  if (variant === 'premium-red') return 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]';
  if (variant === 'dark') return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]';
  return 'text-zinc-800 drop-shadow-sm';
};

const getSeparatorStyle = (variant: string) => {
  if (variant === 'izi-flash') return 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,1)]';
  if (variant === 'premium-red') return 'text-red-500/60 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
  if (variant === 'dark') return 'text-yellow-400/50';
  return 'text-zinc-400';
};

const DigitBox = ({ value, label, current, variant, isUrgent }: { value: string, label: string, current: any, variant: 'dark' | 'light' | 'premium-red' | 'izi-flash', isUrgent: boolean }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`${current.box} ${getBoxStyle(variant, isUrgent)} rounded-lg sm:rounded-xl flex items-center justify-center`}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0, scale: 0.8, rotateX: -45 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ y: -20, opacity: 0, scale: 0.8, rotateX: 45 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
          className={`${current.text} font-black ${getTextStyle(variant)} tracking-tighter z-10 flex items-center justify-center w-full h-full transform-gpu`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20 z-20 mix-blend-overlay"></div>
    </div>
    {label && (
      <span className={`${current.label} font-black uppercase tracking-[0.2em] opacity-80 ${variant === 'light' ? 'text-zinc-500' : 'text-white/60'}`}>
        {label}
      </span>
    )}
  </div>
);

export const DigitalTimer: React.FC<DigitalTimerProps> = ({ targetDate, createdDate, size = 'md', variant = 'dark' }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00', totalHours: 0 });
  const [percentage, setPercentage] = useState(100);
  const [timeLabel, setTimeLabel] = useState('');

  useEffect(() => {
    const calculate = () => {
      const start = createdDate ? new Date(createdDate).getTime() : new Date(targetDate).getTime() - 2 * 60 * 60 * 1000;
      const end = new Date(targetDate).getTime();
      const now = Date.now();

      const total = end - start;
      const elapsed = now - start;

      let pct = 100;
      if (total > 0) {
        pct = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100));
      }

      const diff = end - now;
      if (diff <= 0) {
        return { h: '00', m: '00', s: '00', totalHours: 0, pct: 0, label: 'Expirado' };
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const h = totalHours.toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

      let label = '';
      if (totalHours > 0) {
        label = `${totalHours}h ${m}m`;
      } else if (parseInt(m) > 0) {
        label = `${m}m ${s}s`;
      } else {
        label = `${s}s`;
      }

      return { h, m, s, totalHours, pct, label };
    };

    const timer = setInterval(() => {
      const res = calculate();
      setTimeLeft({ h: res.h, m: res.m, s: res.s, totalHours: res.totalHours });
      setPercentage(res.pct);
      setTimeLabel(res.label);
    }, 1000);

    const initial = calculate();
    setTimeLeft({ h: initial.h, m: initial.m, s: initial.s, totalHours: initial.totalHours });
    setPercentage(initial.pct);
    setTimeLabel(initial.label);

    return () => clearInterval(timer);
  }, [targetDate, createdDate]);

  if (variant === 'izi-flash') {
    // Elegant neon bar with subtle pulsing glow
    const barGlow = percentage < 20 
      ? 'rgba(239, 68, 68, 0.8)' // vibrant red
      : 'rgba(234, 179, 8, 0.9)'; // yellow gold

    const remainingColor = percentage < 20 ? 'text-red-500' : 'text-yellow-400';

    return (
      <div className="w-full space-y-2 mt-auto">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest leading-none">
          <span className="text-white/60">Tempo restante</span>
          <span className={`${remainingColor} font-mono tracking-normal animate-pulse`}>
            {timeLabel}
          </span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-[1px] backdrop-blur-md relative shadow-inner">
          <motion.div
            className={`h-full rounded-full ${percentage < 20 ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500'}`}
            style={{
              width: `${percentage}%`,
              boxShadow: `0 0 10px ${barGlow}, 0 0 20px ${barGlow}`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
      </div>
    );
  }

  const sizes = {
    sm: { box: 'w-7 h-8 sm:w-8 sm:h-9', text: 'text-sm sm:text-base', label: 'text-[5px] sm:text-[6px]' },
    md: { box: 'w-9 h-11 sm:w-11 sm:h-12', text: 'text-lg sm:text-xl', label: 'text-[7px] sm:text-[8px]' },
    lg: { box: 'w-12 h-14 sm:w-16 sm:h-20', text: 'text-2xl sm:text-4xl', label: 'text-[9px] sm:text-[11px]' }
  };

  const current = sizes[size];
  const isUrgent = variant === 'premium-red' && timeLeft.totalHours < 1;

  return (
    <div className="flex items-start gap-1 sm:gap-1.5">
      <DigitBox value={timeLeft.h} label="Horas" current={current} variant={variant} isUrgent={isUrgent} />
      <div className={`flex flex-col items-center justify-center ${current.box} w-auto`}>
        <motion.span 
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${current.text} font-black ${getSeparatorStyle(variant)} -mt-1`}
        >
          :
        </motion.span>
      </div>
      <DigitBox value={timeLeft.m} label="Minutos" current={current} variant={variant} isUrgent={isUrgent} />
      <div className={`flex flex-col items-center justify-center ${current.box} w-auto`}>
        <motion.span 
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`${current.text} font-black ${getSeparatorStyle(variant)} -mt-1`}
        >
          :
        </motion.span>
      </div>
      <DigitBox value={timeLeft.s} label="Segundos" current={current} variant={variant} isUrgent={isUrgent} />
    </div>
  );
};
