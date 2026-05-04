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
    <div className="fixed inset-0 z-[10000] bg-[#FFD400] font-['Poppins',_sans-serif] overflow-hidden select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap');

        .splash-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            position: relative;
            perspective: 1200px;
        }

        /* Logo Central com Efeito de Escala e Sombra Suave */
        .logo-main {
            z-index: 100;
            text-align: center;
            animation: logo-pop 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        @keyframes logo-pop {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }

        .izi-text {
            font-size: 6.5rem;
            color: #121212;
            line-height: 0.8;
            margin: 0;
            filter: drop-shadow(0px 10px 15px rgba(0,0,0,0.1));
            font-weight: 800;
        }

        .delivery-text {
            font-size: 1.3rem;
            color: #121212;
            font-weight: 800;
            letter-spacing: 7px;
            margin-top: 12px;
            text-transform: uppercase;
        }

        /* Ícones 3D Customizados (Estilo Claymorphism) */
        .icon-3d {
            position: absolute;
            width: 75px;
            height: 75px;
            opacity: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #121212;
            border-radius: 24px;
            /* Efeito de profundidade 3D no card */
            box-shadow: 
                inset -5px -5px 12px rgba(255,255,255,0.08),
                inset 5px 5px 12px rgba(0,0,0,0.4),
                10px 20px 40px rgba(0,0,0,0.25);
            animation: converge-bounce 6s infinite cubic-bezier(0.68, -0.6, 0.3, 1.6);
        }

        .icon-3d svg {
            width: 38px;
            height: 38px;
            fill: #FFD400;
        }

        /* Animação Mola: Convergência Total ao Centro e Retorno */
        @keyframes converge-bounce {
            0% { 
                opacity: 0;
                transform: translate(var(--startX), var(--startY)) scale(0.4) rotate(-10deg); 
            }
            15% { 
                opacity: 1;
                transform: translate(var(--startX), var(--startY)) scale(1) rotate(0deg); 
            }
            40%, 60% { 
                opacity: 1;
                transform: translate(0, 0) scale(0.5) rotate(20deg); /* Converge atrás do logo */
            }
            85% { 
                opacity: 1;
                transform: translate(var(--startX), var(--startY)) scale(1) rotate(0deg); /* Volta com bounce */
            }
            100% { 
                opacity: 0;
                transform: translate(var(--startX), var(--startY)) scale(0.4) rotate(10deg); 
            }
        }

        /* Posições Iniciais Estratégicas */
        .i-rest { --startX: -160%; --startY: -280%; animation-delay: 0.1s; }
        .i-mkt  { --startX: 160%; --startY: -240%; animation-delay: 0.3s; }
        .i-trav { --startX: -200%; --startY: 60%; animation-delay: 0.5s; }
        .i-phar { --startX: 200%; --startY: 100%; animation-delay: 0.7s; }
        .i-hosp { --startX: -140%; --startY: 280%; animation-delay: 0.9s; }
        .i-event { --startX: 140%; --startY: 260%; animation-delay: 1.1s; }
      `}</style>

      <div className="splash-container">
        {/* Ícones de Serviços */}
        <div className="icon-3d i-rest">
            <svg viewBox="0 0 24 24"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
        </div>
        <div className="icon-3d i-mkt">
            <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </div>
        <div className="icon-3d i-trav">
            <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
        </div>
        <div className="icon-3d i-phar">
            <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
        </div>
        <div className="icon-3d i-hosp">
            <svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
        </div>
        <div className="icon-3d i-event">
            <svg viewBox="0 0 24 24"><path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.11.9 2 2 2h16c1.1 0 2-.89 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zM11 15.5l-3.5-2 3.5-2 3.5 2-3.5 2z"/></svg>
        </div>

        {/* Logotipo Central */}
        <div className="logo-main">
            <h1 className="izi-text">izi</h1>
            <div className="delivery-text">DELIVERY</div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
