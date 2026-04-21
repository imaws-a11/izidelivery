import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
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
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Converte snap points em valores numéricos (pixels a partir do fundo)
  const getSnapValues = () => {
    const height = window.innerHeight;
    return snapPoints.map(point => {
      if (point.endsWith("vh")) return (parseFloat(point) / 100) * height;
      if (point.endsWith("%")) return (parseFloat(point) / 100) * height;
      return parseFloat(point);
    });
  };

  const snapValues = getSnapValues();

  useEffect(() => {
    // Inicializa na posição correta
    const targetY = window.innerHeight - snapValues[initialSnap];
    controls.set({ y: targetY });
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const snapValuesPixels = getSnapValues();
    const currentY = window.innerHeight - info.point.y;
    
    // Encontra o snap point mais próximo
    let closestSnap = 0;
    let minDistance = Math.abs(currentY - snapValuesPixels[0]);

    snapValuesPixels.forEach((val, index) => {
      const dist = Math.abs(currentY - val);
      if (dist < minDistance) {
        minDistance = dist;
        closestSnap = index;
      }
    });

    const targetY = window.innerHeight - snapValuesPixels[closestSnap];
    setCurrentSnap(closestSnap);
    controls.start({ 
      y: targetY,
      transition: { type: "spring", damping: 25, stiffness: 200 }
    });
  };

  return (
    <motion.div
      ref={sheetRef}
      drag="y"
      dragConstraints={{ top: window.innerHeight - snapValues[snapValues.length - 1], bottom: window.innerHeight - snapValues[0] }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="fixed inset-x-0 bottom-0 z-[130] flex flex-col pointer-events-none"
      style={{ height: "100vh" }}
    >
      {/* Spacer para empurrar o conteúdo para baixo */}
      <div className="flex-1" />

      {/* O Sheet real */}
      <div 
        className="pointer-events-auto flex flex-col w-full h-full relative"
        style={{
          background: "linear-gradient(180deg, #09090b 0%, #000000 100%)",
          borderRadius: "40px 40px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Handle de arraste */}
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-zinc-800/80" />
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </motion.div>
  );
};
