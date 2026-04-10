'use client';

import { motion } from "motion/react";
import { ReactNode } from 'react';

interface TutorialOverlayProps {
  children: ReactNode;
  isScaled: boolean;
  isActive: boolean;
}

export function TutorialOverlay({ children, isScaled, isActive }: TutorialOverlayProps) {
  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className="tutorial-overlay-container"
      initial={{ scale: 1 }}
      animate={{ 
        scale: isScaled ? 0.3 : 1,
        transformOrigin: 'center center'
      }}
      transition={{
        duration: 0.8,
        ease: 'easeInOut'
      }}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: isScaled ? 'visible' : 'hidden'
      }}
    >
      {children}
      
      {}
      {isScaled && (
        <motion.div
          className="absolute inset-0 bg-black/60 pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  );
}