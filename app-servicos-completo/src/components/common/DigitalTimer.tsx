import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DigitalTimerProps {
  targetDate: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

const DigitBox = ({ value, label, current, variant }: { value: string, label: string, current: any, variant: 'dark' | 'light' }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`${current.box} ${variant === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-black/5 border-black/5'} rounded-xl border flex items-center justify-center relative overflow-hidden`}>
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={value}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className={`${current.text} font-black ${variant === 'dark' ? 'text-yellow-400' : 'text-black'} tracking-tighter z-10 flex items-center justify-center w-full h-full`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
    {label && <span className={`${current.label} font-black text-zinc-500 uppercase tracking-widest`}>{label}</span>}
  </div>
);

export const DigitalTimer: React.FC<DigitalTimerProps> = ({ targetDate, size = 'md', variant = 'dark' }) => {
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { h: '00', m: '00', s: '00' };

      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
      return { h, m, s };
    };

    const timer = setInterval(() => {
      const next = calculate();
      setTimeLeft(prev => {
        if (prev.h === next.h && prev.m === next.m && prev.s === next.s) return prev;
        return next;
      });
    }, 1000);

    setTimeLeft(calculate());
    return () => clearInterval(timer);
  }, [targetDate]);

  const sizes = {
    sm: { box: 'w-8 h-9', text: 'text-base', label: 'text-[6px]' },
    md: { box: 'w-10 h-12', text: 'text-xl', label: 'text-[8px]' },
    lg: { box: 'w-14 h-16', text: 'text-3xl', label: 'text-[10px]' }
  };

  const current = sizes[size];

  return (
    <div className="flex items-center gap-1.5">
      <DigitBox value={timeLeft.h} label={size === 'lg' ? "Horas" : ""} current={current} variant={variant} />
      <motion.span 
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className={`${current.text} font-black ${variant === 'dark' ? 'text-yellow-400' : 'text-black/30'}`}
      >
        :
      </motion.span>
      <DigitBox value={timeLeft.m} label={size === 'lg' ? "Minutos" : ""} current={current} variant={variant} />
      <motion.span 
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className={`${current.text} font-black ${variant === 'dark' ? 'text-yellow-400' : 'text-black/30'}`}
      >
        :
      </motion.span>
      <DigitBox value={timeLeft.s} label={size === 'lg' ? "Segundos" : ""} current={current} variant={variant} />
    </div>
  );
};
