import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashOfferTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  initialDate?: string;
}

const FlashOfferTimerModal = ({ isOpen, onClose, onConfirm, initialDate }: FlashOfferTimerModalProps) => {
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        const d = new Date(initialDate);
        setTempDate(d.toISOString().split('T')[0]);
        setTempTime(d.toTimeString().slice(0, 5));
      } else {
        const now = new Date();
        setTempDate(now.toISOString().split('T')[0]);
        setTempTime('23:59');
      }
    }
  }, [isOpen, initialDate]);

  const handleQuickSelect = (hours: number) => {
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    setTempDate(future.toISOString().split('T')[0]);
    setTempTime(future.toTimeString().slice(0, 5));
  };

  const handleConfirm = () => {
    if (tempDate && tempTime) {
      const finalDate = new Date(`${tempDate}T${tempTime}:00`);
      onConfirm(finalDate.toISOString());
      onClose();
    }
  };

  const quickDeals = [
    { label: '30m', value: 0.5 },
    { label: '1h', value: 1 },
    { label: '3h', value: 3 },
    { label: '6h', value: 6 },
    { label: '12h', value: 12 },
    { label: '24h', value: 24 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full relative z-10 overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-9xl text-rose-500 font-fill rotate-12">schedule</span>
            </div>

            <div className="text-center mb-8 relative">
              <div className="size-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4 border border-rose-500/20 shadow-inner">
                <span className="material-symbols-outlined text-3xl font-fill animate-pulse">schedule</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Izi Flash Timer</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Defina o término da oferta</p>
            </div>

            <div className="space-y-6 relative">
              {/* Quick Selects */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Seleção Rápida</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickDeals.map((deal) => (
                    <button
                      key={deal.label}
                      onClick={() => handleQuickSelect(deal.value)}
                      className="py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 transition-all font-mono"
                    >
                      +{deal.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Data de Encerramento</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 text-lg transition-transform group-focus-within:scale-110">calendar_month</span>
                    <input
                      type="date"
                      value={tempDate}
                      onChange={e => setTempDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-6 py-4 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Horário</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 text-lg transition-transform group-focus-within:scale-110">alarm</span>
                    <input
                      type="time"
                      value={tempTime}
                      onChange={e => setTempTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-6 py-4 font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 text-2xl transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-10 relative">
              <button
                type="button"
                onClick={onClose}
                className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-[24px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="py-4 bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[24px] shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-95 transition-all border border-rose-400/20"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FlashOfferTimerModal;
