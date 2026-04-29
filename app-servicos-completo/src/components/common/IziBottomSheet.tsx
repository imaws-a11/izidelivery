import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useDragControls } from "framer-motion";
import type { PanInfo } from "framer-motion";

interface IziBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[]; // e.g., ["20%", "50%", "90%"]
  initialSnap?: number;
}

export const IziBottomSheet: React.FC<IziBottomSheetProps> = ({
  children,
  snapPoints = ["35vh", "65vh", "92vh"],
  initialSnap = 0,
}) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Cache da altura no mount para que a abertura do teclado virtual
  // não diminua o window.innerHeight e quebre as constraints de arraste.
  const [windowHeight] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  // Converte snap points em valores numéricos (pixels a partir do fundo)
  const getSnapValues = () => {
    return snapPoints.map(point => {
      if (point.endsWith("vh")) return (parseFloat(point) / 100) * windowHeight;
      if (point.endsWith("%")) return (parseFloat(point) / 100) * windowHeight;
      return parseFloat(point);
    });
  };

  const snapValues = getSnapValues();

  const maxSnapHeight = snapValues[snapValues.length - 1]; // ex: 90vh

  useEffect(() => {
    // Inicializa empurrando o topo do painel para baixo o suficiente para esconder a área excedente
    // Como a altura total é maxSnapHeight, e queremos exibir snapValues[initialSnap]...
    // O valor Y para transladar para baixo é: Altura Total - Altura Visível
    const initialTargetY = maxSnapHeight - snapValues[initialSnap];
    controls.set({ y: initialTargetY });
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const snapValuesPixels = getSnapValues();
    
    // Física Avançada: Projeta a posição final baseada na velocidade do dedo (Inércia)
    // Se o usuário 'jogar' o painel rápido, ele desliza para o próximo ponto de ancoragem
    const projectedY = info.point.y + (info.velocity.y * 0.15); 
    const currentVisibleHeight = windowHeight - projectedY;
    
    // Encontra o snap point mais próximo pela altura visível projetada
    let closestSnap = 0;
    let minDistance = Math.abs(currentVisibleHeight - snapValuesPixels[0]);

    snapValuesPixels.forEach((val, index) => {
      const dist = Math.abs(currentVisibleHeight - val);
      if (dist < minDistance) {
        minDistance = dist;
        closestSnap = index;
      }
    });

    // O targetY é a translação descendente que recobre a diferença
    const targetY = maxSnapHeight - snapValuesPixels[closestSnap];
    setCurrentSnap(closestSnap);
    
    controls.start({ 
      y: targetY,
      transition: { 
        type: "spring", 
        stiffness: 350,  // Mola mais ágil
        damping: 35,     // Amortecimento natural, sem pular
        mass: 0.8        // Leveza na queda
      }
    });
  };

  // Desconta o maxSnapHeight da altura da janela para "plantar" a caixa na borda de baixo
  const marginTopOffset = windowHeight - maxSnapHeight;

  return (
    <motion.div
      ref={sheetRef}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      // Top constraints = 0 (Totalmente expandido, y=0)
      // Bottom constraints = maxSnapHeight - snap[0] (Totalmente encolhido na primeira aba)
      dragConstraints={{ top: 0, bottom: maxSnapHeight - snapValues[0] }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="fixed inset-x-0 top-0 z-[130] w-full pointer-events-none shadow-2xl"
      style={{ 
        height: maxSnapHeight,
        marginTop: marginTopOffset > 0 ? marginTopOffset : 0 
      }}
    >
      {/* O Sheet real que engloba os 100% desta caixa dimensional */}
      <div 
        className="pointer-events-auto flex flex-col w-full h-full relative"
        style={{
          background: "linear-gradient(180deg, #09090b 0%, #000000 100%)",
          borderRadius: "40px 40px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -20px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Hitbox expandido de arraste (toda a zona superior) */}
        <div 
          className="w-full flex flex-col items-center pt-3 pb-6 cursor-grab active:cursor-grabbing relative"
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: "none" }}
        >
           {/* Área invisível gigante para facilitar o toque no celular */}
           <div className="absolute inset-0 z-10" />
           {/* Traço visual */}
           <div className="w-14 h-1.5 rounded-full bg-zinc-600/60 shadow-inner z-20" />
        </div>

        {/* Conteúdo com Scroll - pb-56 garante que o botão fixo + nav bar não sobreponham o conteúdo */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: "14rem" }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};
