import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface SplashScreenProps {
  finishLoading: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ finishLoading }) => {
  useEffect(() => {
    // A animação dura cerca de 6s em loop, mas vamos liberar o app após 4.5s
    // para dar tempo do usuário ver a convergência inicial.
    const timer = setTimeout(() => {
      finishLoading();
    }, 4500);

    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden select-none" style={{ backgroundColor: '#FFD400' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap');

        .react-splash-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            position: relative;
            perspective: 2000px;
            font-family: 'Fredoka', sans-serif;
            background-color: #FFD400;
        }

        /* LOGOTIPO ESTABILIZADO - Nitidez absoluta e movimento fluido */
        .react-logo-section {
            z-index: 100;
            text-align: center;
            will-change: transform, opacity;
            backface-visibility: hidden;
            transform-style: preserve-3d;
            animation: 
                react-logo-entrance 1.2s cubic-bezier(0.5, -0.6, 0.2, 1.5) both,
                react-logo-float-smooth 4s ease-in-out infinite alternate;
        }

        @keyframes react-logo-entrance {
            0% { transform: scale(0.8) rotate(-2deg) translateZ(0); opacity: 0; }
            100% { transform: scale(1) rotate(0deg) translateZ(0); opacity: 1; }
        }

        @keyframes react-logo-float-smooth {
            0% { transform: translateY(0) translateZ(0); }
            100% { transform: translateY(-8px) translateZ(0); }
        }

        .react-izi-text {
            font-size: 9rem;
            color: #121212;
            font-weight: 700;
            line-height: 0.75;
            margin: 0;
            letter-spacing: -4px;
            filter: drop-shadow(0 10px 8px rgba(0,0,0,0.08));
            -webkit-text-stroke: 1px #121212;
        }

        .react-delivery-tag {
            font-size: 1.4rem;
            color: #121212;
            font-weight: 700;
            letter-spacing: 8px;
            margin-top: 10px;
            text-transform: uppercase;
            opacity: 0.95;
        }

        /* ÍCONES CINEMATOGRÁFICOS */
        .react-icon-item {
            position: absolute;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #121212;
            border-radius: 28px;
            opacity: 0;
            will-change: transform, opacity;
            
            box-shadow: 
                inset -4px -4px 8px rgba(255,255,255,0.1),
                inset 4px 4px 8px rgba(0,0,0,0.4),
                0 15px 35px rgba(0,0,0,0.2);
            
            animation: react-cinematic-motion 8s infinite ease-in-out;
        }

        .react-icon-item svg {
            width: 38px;
            height: 38px;
            fill: #FFD400;
        }

        @keyframes react-cinematic-motion {
            0% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.5); }
            10% { opacity: 1; transform: translate(var(--x), var(--y)) scale(1); }
            30% { transform: translate(calc(var(--x) + 15px), calc(var(--y) - 20px)) scale(1.02); }
            45% { opacity: 1; transform: translate(0, 0) scale(0.35) rotate(180deg); }
            60% { transform: translate(var(--x), var(--y)) scale(1.05) rotate(0deg); }
            85% { opacity: 1; transform: translate(calc(var(--x) - 8px), calc(var(--y) + 10px)) scale(1); }
            100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.5); }
        }

        /* Coordenadas */
        .react-icon-1 { --x: -160%; --y: -280%; animation-delay: 0.1s; }
        .react-icon-2 { --x: 180%; --y: -240%; animation-delay: 1.2s; }
        .react-icon-3 { --x: -240%; --y: 20%;  animation-delay: 2.3s; }
        .react-icon-4 { --x: 230%; --y: 100%;  animation-delay: 3.4s; }
        .react-icon-5 { --x: -150%; --y: 320%; animation-delay: 0.5s; }
        .react-icon-6 { --x: 170%; --y: 280%;  animation-delay: 4.5s; }
      `}</style>

      <div className="react-splash-container">
        {/* Ícones de Serviço */}
        <div className="react-icon-item react-icon-1"><svg viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg></div>
        <div className="react-icon-item react-icon-2"><svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg></div>
        <div className="react-icon-item react-icon-3"><svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg></div>
        <div className="react-icon-item react-icon-4"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg></div>
        <div className="react-icon-item react-icon-5"><svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg></div>
        <div className="react-icon-item react-icon-6"><svg viewBox="0 0 24 24"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.11.9 2 2 2h16c1.1 0 2-.89 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zM11 15.5l-3.5-2 3.5-2 3.5 2-3.5 2z"/></svg></div>

        {/* LOGOTIPO CENTRAL ESTABILIZADO */}
        <div className="react-logo-section">
            <h1 className="react-izi-text">izi</h1>
            <div className="react-delivery-tag">Delivery</div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
