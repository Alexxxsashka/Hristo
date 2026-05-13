import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

export const TarkovBackground: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for damped movement
  const springConfig = { damping: 50, stiffness: 300, mass: 1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax mappings for different layers
  // Layer 1 (Background): Slowest
  const bgX = useTransform(smoothX, [-0.5, 0.5], ['-2%', '2%']);
  const bgY = useTransform(smoothY, [-0.5, 0.5], ['-2%', '2%']);

  // Layer 2 (Dust/Mid): Faster
  const dustX = useTransform(smoothX, [-0.5, 0.5], ['-5%', '5%']);
  const dustY = useTransform(smoothY, [-0.5, 0.5], ['-5%', '5%']);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position to range [-0.5, 0.5]
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#050505]">
      {/* Base Layer: Industrial Warehouse */}
      <motion.div 
        style={{ 
          x: bgX, 
          y: bgY,
          scale: 1.1 // Slightly larger to prevent edges from showing during parallax
        }}
        className="absolute inset-[-5%] bg-cover bg-center bg-no-repeat opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 2 }}
      >
        <img 
          src="/images/configurator/tarkov_bg.png" 
          className="w-full h-full object-cover"
          alt=""
        />
      </motion.div>

      {/* Atmospheric Layer: Dust and Fog */}
      <motion.div 
        style={{ 
          x: dustX, 
          y: dustY,
          scale: 1.2
        }}
        className="absolute inset-[-10%] bg-cover bg-center bg-no-repeat mix-blend-screen opacity-30"
      >
        <img 
          src="/images/configurator/tarkov_dust.png" 
          className="w-full h-full object-cover"
          alt=""
        />
      </motion.div>

      {/* Vignette & Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] opacity-60" />
      
      {/* Noise/Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      
      {/* Scanning Line Effect (Very subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
    </div>
  );
};
