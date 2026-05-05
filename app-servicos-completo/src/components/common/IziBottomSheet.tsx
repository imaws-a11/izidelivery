import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useDragControls } from "framer-motion";
import type { PanInfo } from "framer-motion";

interface IziBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[]; // e.g., ["20%", "50%", "90%"]
  initialSnap?: number;
  theme?: 'dark' | 'silver';
}

export const IziBottomSheet: React.FC<IziBottomSheetProps> = ({
  children,
  snapPoints = ["35vh", "65vh", "92vh"],
  initialSnap = 0,
  theme = 'silver',
}) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [windowHeight] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  const getSnapValues = () => {
    return snapPoints.map(point => {
      if (point.endsWith("vh")) return (parseFloat(point) / 100) * windowHeight;
      if (point.endsWith("%")) return (parseFloat(point) / 100) * windowHeight;
      return parseFloat(point);
    });
  };

  const snapValues = getSnapValues();
  const maxSnapHeight = snapValues[snapValues.length - 1];

  useEffect(() => {
    const initialTargetY = maxSnapHeight - snapValues[initialSnap];
    controls.set({ y: initialTargetY });
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const snapValuesPixels = getSnapValues();
    const projectedY = info.point.y + (info.velocity.y * 0.15); 
    const currentVisibleHeight = windowHeight - projectedY;
    
    let closestSnap = 0;
    let minDistance = Math.abs(currentVisibleHeight - snapValuesPixels[0]);

    snapValuesPixels.forEach((val, index) => {
      const dist = Math.abs(currentVisibleHeight - val);
      if (dist < minDistance) {
        minDistance = dist;
        closestSnap = index;
      }
    });

    const targetY = maxSnapHeight - snapValuesPixels[closestSnap];
    setCurrentSnap(closestSnap);
    
    controls.start({ 
      y: targetY,
      transition: { 
        type: "spring", 
        stiffness: 350,
        damping: 35,
        mass: 0.8
      }
    });
  };

  const marginTopOffset = windowHeight - maxSnapHeight;

  return (
    <motion.div
      ref={sheetRef}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: maxSnapHeight - snapValues[0] }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="fixed inset-x-0 top-0 z-[130] w-full pointer-events-none"
      style={{ 
        height: maxSnapHeight,
        marginTop: marginTopOffset > 0 ? marginTopOffset : 0 
      }}
    >
      <div 
        className="pointer-events-auto flex flex-col w-full h-full relative"
        style={{
          background: theme === 'dark' 
            ? "linear-gradient(180deg, #09090b 0%, #000000 100%)" 
            : "#ffffff",
          borderRadius: "48px 48px 0 0",
          borderTop: theme === 'dark' ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.02)",
          boxShadow: theme === 'dark' ? "0 -20px 40px rgba(0,0,0,0.6)" : "0 -20px 60px rgba(0,0,0,0.12)",
        }}
      >
        {/* Handle de Arraste Unificado */}
        <div 
          className="w-full flex flex-col items-center pt-5 pb-3 cursor-grab active:cursor-grabbing relative shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: "none" }}
        >
           <div className="w-12 h-1.5 rounded-full shadow-inner z-20" 
             style={{ background: theme === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} 
           />
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          {children}
        </div>
      </div>
    </motion.div>
  );
};
