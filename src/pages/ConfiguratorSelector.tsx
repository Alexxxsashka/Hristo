import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, ChevronRight, Binary, Shield, Crosshair } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const ConfiguratorSelector: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <Navbar />
      
      <main className="flex-1 relative flex items-center justify-center py-20 px-4">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 w-full max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
              SELECT YOUR <span className="text-red-600">ENGINE</span>
            </h1>
            <p className="text-zinc-500 font-mono text-xs md:text-sm uppercase tracking-[0.4em]">
              [ CHOOSE CONFIGURATION PROTOCOL ]
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* V1.2 Version */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -8 }}
              className="group relative h-[450px] bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden cursor-pointer p-8 flex flex-col justify-between transition-all hover:border-red-600/50"
              onClick={() => navigate('/configurator/v1.2')}
            >
              <div className="absolute top-0 right-0 p-8">
                <Sparkles size={40} className="text-zinc-800 group-hover:text-red-600 transition-colors duration-500" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    STABLE PROTOCOL
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                  VERSION <span className="text-red-600">1.2</span>
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                  The proven assembly engine. Optimized for fast previews, stable compatibility, and comprehensive weapons lists. Perfect for quick builds and price estimations.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Shield size={16} className="text-zinc-700 group-hover:text-red-500" />
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">STABLE</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Binary size={16} className="text-zinc-700 group-hover:text-red-500" />
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">LEGACY</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Crosshair size={16} className="text-zinc-700 group-hover:text-red-500" />
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">FAST</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                  <span className="text-xs font-black text-white uppercase tracking-widest">ENTER ARMORY</span>
                  <ChevronRight size={20} className="text-red-600 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>

            {/* V1.3 Version */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -8 }}
              className="group relative h-[450px] bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden cursor-pointer p-8 flex flex-col justify-between transition-all hover:border-white/20"
              onClick={() => navigate('/configurator/v1.3')}
            >
              <div className="absolute top-0 right-0 p-8">
                <Zap size={40} className="text-zinc-800 group-hover:text-amber-500 transition-colors duration-500" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    EXPERIMENTAL PROTOCOL
                  </div>
                  <div className="px-2 py-1 bg-amber-500/10 rounded-md text-[8px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                    LIVE NOW
                  </div>
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                  VERSION <span className="text-zinc-500">1.3</span>
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                  Powered by the EFT-style recursive mounting engine. Real-time slot detection, hierarchical attachment logic, and premium tactical shaders. The future of 3D customization.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Zap size={16} className="text-zinc-800 group-hover:text-amber-500" />
                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">RECURSIVE</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Binary size={16} className="text-zinc-800 group-hover:text-amber-500" />
                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">PHYSICS</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Shield size={16} className="text-zinc-800 group-hover:text-amber-500" />
                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">HD</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
                  <span className="text-xs font-black text-white uppercase tracking-widest">INITIATE ASSEMBLY</span>
                  <ChevronRight size={20} className="text-amber-500 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 text-center"
          >
            <p className="text-[10px] text-zinc-800 font-mono uppercase tracking-[0.6em]">
              SECURE ACCESS // LEVEL 4 AUTHORIZATION REQUIRED PARA-CONVEX
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
