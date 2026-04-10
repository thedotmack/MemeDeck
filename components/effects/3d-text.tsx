'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import * as THREE from 'three';
import { CELEBRATION_TEXT_LINES_MAP } from '@/lib/constants/celebration-texts';

interface Text3DProps {
  text: string;
  isActive: boolean;
  color?: string;
  size?: number;
  animationMode?: 'rotate' | 'pulse' | 'glow' | 'bounce' | 'all';
  yOffset?: number;
}


const CELEBRATION_TEXTS = Array.from(
  new Set(
    Object.values(CELEBRATION_TEXT_LINES_MAP).flat()
  )
);


useLoader.preload(FontLoader, '/fonts/Nasa_Reg_Rev.json');


const geometryCache: Map<string, TextGeometry> = new Map();


function usePrecacheCelebrationGeometries(font: any) {
  React.useEffect(() => {
    if (!font) return;
    for (const text of CELEBRATION_TEXTS) {
      const key = `${text}-80`;
      if (!geometryCache.has(key)) {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: 80,
          depth: 8,
          bevelEnabled: true,
          bevelThickness: 2,
          bevelSize: 2,
          bevelOffset: 0,
          bevelSegments: 3
        });
        textGeometry.computeBoundingBox();
        textGeometry.center();
        geometryCache.set(key, textGeometry);
      }
    }
  }, [font]);
}

const AnimatedText = React.forwardRef<THREE.Mesh, {
  text: string;
  color: string;
  size: number;
  animationMode: 'rotate' | 'pulse' | 'glow' | 'bounce' | 'all';
  yOffset?: number;
}>(({ text, color, size, animationMode, yOffset }, forwardedRef) => {

  const textRef = useRef<THREE.Mesh>(null);
  const actualRef = forwardedRef || textRef;
  const rotationDirection = useRef(1);
  const animationTime = useRef(0);
  const emissiveColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    const meshRef = actualRef as React.RefObject<THREE.Mesh>;
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    animationTime.current += 0.016; 
    const time = animationTime.current;

    if (animationMode === 'all') {
      
      mesh.rotation.y += 0.002 * rotationDirection.current;
      if (mesh.rotation.y > 0.5) rotationDirection.current = -1;
      else if (mesh.rotation.y < -0.5) rotationDirection.current = 1;
      
      const pulseScale = 1 + Math.sin(time * 1.2) * 0.11;
      mesh.scale.setScalar(pulseScale);
      
      mesh.position.y = (yOffset || 0) + Math.sin(time * 6) * 22;
      mesh.rotation.z = Math.sin(time * 3) * 0.115;
      
      const material = mesh.material as THREE.MeshPhongMaterial;
      const glowIntensity = 0.5 + Math.sin(time * 0.85) * 0.5;
      material.emissive = new THREE.Color(color);
      material.emissiveIntensity = glowIntensity * 0.325;
    } else {
      switch (animationMode) {
        case 'rotate':
          mesh.rotation.y += 0.001 * rotationDirection.current;
          if (mesh.rotation.y > 0.5) rotationDirection.current = -1;
          else if (mesh.rotation.y < -0.5) rotationDirection.current = 1;
          break;
        case 'pulse':
          const pulseScale = 1 + Math.sin(time * 0.8) * 0.1;
          mesh.scale.setScalar(pulseScale);
          break;
        case 'bounce':
          mesh.position.y = Math.sin(time * 4) * 20;
          mesh.rotation.z = Math.sin(time * 2) * 0.1;
          break;
        case 'glow':
          const material = mesh.material as THREE.MeshPhongMaterial;
          const glowIntensity = 0.5 + Math.sin(time * 0.5) * 0.5;
          material.emissive = new THREE.Color(color);
          material.emissiveIntensity = glowIntensity * 0.3;
          break;
      }
    }
  });

  const font = useLoader(FontLoader, '/fonts/Nasa_Reg_Rev.json');
  usePrecacheCelebrationGeometries(font);
  
  const geometry = useMemo(() => {
    const key = `${text}-${size}`;
    if (geometryCache.has(key)) {
      return geometryCache.get(key)!.clone();
    }
    
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: size,
      depth: size * 0.1,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 2,
      bevelOffset: 0,
      bevelSegments: 3
    });
    textGeometry.computeBoundingBox();
    textGeometry.center();
    return textGeometry;
  }, [text, size, font]);

  return (
    <mesh ref={actualRef} geometry={geometry}>
      <meshPhongMaterial 
        color={color}
        shininess={600}
        specular={0xffffff}
        emissive={color}
        emissiveIntensity={0.7}
        reflectivity={1}
        transparent={false}
      />
    </mesh>
  );
});

AnimatedText.displayName = 'AnimatedText';



export default function Text3D({ 
  text, 
  isActive, 
  color = '#00ff00', 
  size = 80, 
  animationMode = 'rotate',
  yOffset = 0
}: Text3DProps) {
  const textRef = useRef<THREE.Mesh>(null);
  
  if (!text) return null;

  

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    >
      <Canvas 
        className="pointer-events-none"
        key={`canvas-${text}-${animationMode}-${yOffset}`}
        camera={{ position: [0, 0, 400], fov: 75 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "default"
        }}
        dpr={1}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        {}
        <ambientLight intensity={0.7} color={0xffffff} />
        {}
        {}
        <directionalLight 
          intensity={0.7} 
          position={[50, 50, 50]} 
          color={0xffffff} 
        />
        <directionalLight 
          intensity={0.3} 
          position={[-50, 0, -50]} 
          color={0x00ffff} 
        />
        <directionalLight 
          intensity={0.2} 
          position={[50, -50, 0]} 
          color={0xff00ff} 
        />
        
        <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="red" /></mesh>}>
          <group position={[0, yOffset, 0]}>
            <AnimatedText 
              text={text || "LOADING"}
              color={color || "#00ff00"}
              size={size || 80}
              animationMode={animationMode || "rotate"}
              ref={textRef}
              yOffset={yOffset}
            />
          </group>
        </Suspense>
        
        {}
      </Canvas>
    </div>
  );
}