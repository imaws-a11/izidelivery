import React, { useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface SimulatedTrackingMapProps {
  status: string;
  serviceType?: string;
}

export const SimulatedTrackingMap: React.FC<SimulatedTrackingMapProps> = ({ status, serviceType }) => {
  const isMobility = ["mototaxi", "carro", "van", "utilitario"].includes(serviceType || "");

  // Mapeamento de progresso por status (0 a 1)
  const progress = useMemo(() => {
    const statusMap: Record<string, number> = isMobility 
      ? {
          'waiting_driver': 0.1,
          'novo': 0.1,
          'aceito': 0.25,
          'confirmado': 0.3,
          'a_caminho': 0.45,
          'at_pickup': 0.55,
          'picked_up': 0.7,
          'em_rota': 0.85,
          'no_local': 0.95,
          'concluido': 1
        }
      : {
          'pendente_pagamento': 0.05,
          'novo': 0.15,
          'preparando': 0.35,
          'pronto': 0.5,
          'waiting_driver': 0.6,
          'picked_up': 0.75,
          'em_rota': 0.85,
          'no_local': 0.95,
          'concluido': 1
        };
    
    return statusMap[status] || 0.2;
  }, [status, isMobility]);

  // SVG Path dimensionado para cobrir a tela
  const pathData = "M 50 400 Q 150 350 250 400 T 450 300 Q 550 200 650 300 T 850 200";
  // Alternativa mais verticalizada para Mobile:
  const mobilePath = "M 200 800 Q 100 600 250 500 T 150 300 Q 300 200 400 100";

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden">
      {/* Imagem de Fundo Estilizada (Geometria Urbana) */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `url('file:///C:/Users/swami/.gemini/antigravity/brain/1f8f2f8c-1ba0-4980-ae7d-997b54734563/stylized_izi_map_background_1775947559936.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'hue-rotate(15deg) brightness(1.2)'
        }}
      />

      {/* Grid Tech sutil */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #444 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* SVG do Trajeto Simulado */}
      <svg 
        viewBox="0 0 400 900" 
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Linha de Trajeto Base (Cinza escura) */}
        <path
          d={mobilePath}
          fill="transparent"
          stroke="#222"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Linha de Trajeto Ativa (Glow Neon Amarelo) */}
        <motion.path
          d={mobilePath}
          fill="transparent"
          stroke="url(#glowGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />

        {/* Gradiente para o Glow */}
        <defs>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="4" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Marcador do Entregador/Motorista (Icone Móvel) */}
        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: `${progress * 100}%` }}
          transition={{ duration: 3, ease: "easeInOut" }}
          style={{ offsetPath: `path('${mobilePath}')` }}
        >
          {/* Sombra/Glow do Marcador */}
          <circle r="20" fill="#facc15" className="opacity-20 blur-xl" />
          
          <circle r="12" fill="#facc15" className="shadow-lg" />
          <circle r="12" fill="transparent" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
          
          {/* Icone dependendo do tipo de serviço */}
          <text 
            x="0" 
            y="5" 
            textAnchor="middle" 
            className="material-symbols-outlined fill-black text-[14px]"
            style={{ fontSize: '14px', fontWeight: '900' }}
          >
            {isMobility ? 'directions_car' : 'delivery_dining'}
          </text>
        </motion.g>

        {/* Marcador de Destino (Fixo no final do path) */}
        <g transform="translate(400, 100)">
           <circle r="15" fill="#facc15" className="opacity-10 animate-ping" />
           <circle r="6" fill="#facc15" />
           <text x="-10" y="-15" fill="white" className="text-[10px] uppercase font-black tracking-widest" style={{ fontSize: '8px' }}>Destino</text>
        </g>
      </svg>

      {/* Overlay de Vinheta para focar no centro/movimento */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_20%,rgba(0,0,0,0.8)_100%)]" />
      
      {/* Partículas de movimento (opcional para dar vida) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute size-1 bg-yellow-400/20 rounded-full"
            initial={{ 
              x: Math.random() * 400, 
              y: Math.random() * 800, 
              opacity: 0 
            }}
            animate={{ 
              y: [null, -200],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>
    </div>
  );
};
