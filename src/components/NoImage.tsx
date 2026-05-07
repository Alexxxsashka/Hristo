import React from 'react';
import { ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface NoImageProps {
  className?: string;
  text?: string;
  iconSize?: number;
}

export const NoImage: React.FC<NoImageProps> = ({ 
  className = '', 
  text = 'Image Not Available',
  iconSize = 32
}) => {
  return (
    <div className={`flex flex-col items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-secondary)] p-6 text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        <ImageOff size={iconSize} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
          {text}
        </span>
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03)_0%,transparent_70%)] pointer-events-none" />
    </div>
  );
};
