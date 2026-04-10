import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import React, { useCallback, useEffect, useRef } from 'react';

interface TrailTextProps { className?: string }
const TrailText: React.FC<TrailTextProps> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rectCacheRef = useRef<{ width: number; height: number; left: number; top: number }>({ width: 0, height: 0, left: 0, top: 0 });
  const rafRef = useRef<number | null>(null);
  

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  

  const gridX = useTransform(mouseX, (x) => {
    const width = rectCacheRef.current.width;
    if (width === 0) return 7;
    const gridPos = Math.floor((x / width) * 15);
    return Math.max(0, Math.min(14, gridPos));
  });
  
  const gridY = useTransform(mouseY, (y) => {
    const height = rectCacheRef.current.height;
    if (height === 0) return 7;
    const gridPos = Math.floor((y / height) * 15);
    return Math.max(0, Math.min(14, gridPos));
  });
  

  const springX = useSpring(gridX, { stiffness: 70, damping: 30 });
  const springY = useSpring(gridY, { stiffness: 70, damping: 30 });

  const updateRectCache = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      rectCacheRef.current = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      };
    }
  }, []);

  const resetToCenter = useCallback(() => {
    const { width, height } = rectCacheRef.current;
    if (width > 0 && height > 0) {
      mouseX.set(width / 2);
      mouseY.set(height / 2);
    }
  }, [mouseX, mouseY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      const { left, top } = rectCacheRef.current;
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    });
  }, [mouseX, mouseY]);

  const handleMouseLeave = () => {

    resetToCenter();
  };


  useEffect(() => {
    updateRectCache();
    resetToCenter();
    

    const handleResize = () => {
      updateRectCache();
      resetToCenter();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateRectCache, resetToCenter]);




  const layer0 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 7 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 7 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer1 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 6 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 6 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer2 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 5 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 5 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer3 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 4 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 4 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer4 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 3 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 3 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer5 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 2 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 2 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer6 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 1 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 1 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer7 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * 0 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * 0 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer8 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * -1 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * -1 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  const layer9 = {
    x: useTransform([springX], ([x]) => -(x as number - 7) * -2 * 3),
    y: useTransform([springY], ([y]) => -(y as number - 7) * -2 * 3),
    rotateX: useTransform([springY], ([y]) => -(y as number - 7) * 5),
    rotateY: useTransform([springX], ([x]) => (x as number - 7) * 5),
  };
  
  const layerTransforms = [
    { id: 'layer-0', ...layer0 },
    { id: 'layer-1', ...layer1 },
    { id: 'layer-2', ...layer2 },
    { id: 'layer-3', ...layer3 },
    { id: 'layer-4', ...layer4 },
    { id: 'layer-5', ...layer5 },
    { id: 'layer-6', ...layer6 },
    { id: 'layer-7', ...layer7 },
    { id: 'layer-8', ...layer8 },
    { id: 'layer-9', ...layer9 },
  ];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-transparent overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
  {layerTransforms.map(({ id, ...transforms }, index: number) => (
            <motion.div
              key={id}
              className="absolute select-none font-bold"
              style={{
                fontSize: `${60 + index * 8}px`,
                opacity: 0.1 + index * 0.1,
                fontFamily: 'NASA, "Blauer Nue", sans-serif',
                textShadow: '0 0 10px rgba(0,0,0,0.6)',
                transformStyle: 'preserve-3d',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                ...transforms,
              }}
            >
              <motion.span
                animate={{ 
                  color: [
                    'hsl(0, 75%, 75%)',
                    'hsl(36, 75%, 75%)', 
                    'hsl(72, 75%, 75%)',
                    'hsl(108, 75%, 75%)',
                    'hsl(144, 75%, 75%)',
                    'hsl(180, 75%, 75%)',
                    'hsl(216, 75%, 75%)',
                    'hsl(252, 75%, 75%)',
                    'hsl(288, 75%, 75%)',
                    'hsl(324, 75%, 75%)',
                    'hsl(360, 75%, 75%)',
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * -0.3,
                }}
              >
                <div className="leading-[0.8] text-center">
                  <span className="block sm:inline ">MEME</span>
                  <span className="block sm:inline transform-3d scale-[1.3]">DECK</span>
                </div>
              </motion.span>
            </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrailText; 