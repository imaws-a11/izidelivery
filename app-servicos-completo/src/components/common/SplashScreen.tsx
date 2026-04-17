import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  finishLoading: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ finishLoading }) => {
  const [loadingText, setLoadingText] = useState('Inicializando...');

  useEffect(() => {
    const timer = setTimeout(() => {
      finishLoading();
    }, 3000); 

    const textTimer = setTimeout(() => setLoadingText('Conectando ao servidor...'), 1000);
    const textTimer2 = setTimeout(() => setLoadingText('Sincronizando dados...'), 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(textTimer);
      clearTimeout(textTimer2);
    };
  }, [finishLoading]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-[#FFD900] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center w-full px-8">
        
        {/* Mascote Robô com Animação Elegantemente Suave */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.8 }}
          animate={{ 
            y: [0, -20, 0], // Flutuação suave
            opacity: 1, 
            scale: 1,
            rotate: [0, -2, 2, 0], 
          }}
          transition={{ 
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.8 },
            scale: { duration: 0.8 }
          }}
          className="w-72 h-72 mb-6 relative"
        >
          {/* Sombra Suave */}
          <motion.div 
            animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/10 blur-xl rounded-full"
          />

          <img 
            src="/mascot_robot.png" 
            alt="Mascote IZI" 
            className="w-full h-full object-contain" 
          />
        </motion.div>

        {/* Logotipo Texto Aumentado */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col items-center"
        >
           <img 
             src="/izi_logo_text.png" 
             alt="IZI Delivery" 
             className="w-80 h-auto object-contain" 
           />
        </motion.div>
      </div>

      {/* Modern Loading Indicator */}
      <div className="absolute bottom-20 left-10 right-10 flex flex-col items-center">
        <div className="w-[85%] max-w-[320px] h-1 bg-black/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.2 }}
            className="h-full bg-black shadow-[0_0_10px_black]"
          />
        </div>
        
        <motion.span 
          key={loadingText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-[12px] font-black text-black uppercase tracking-widest text-center"
        >
          {loadingText}
        </motion.span>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
