import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
const Configurator3DV13 = lazy(() => import('../components/Configurator3DV13').then(m => ({ default: m.Configurator3DV13 })));
import { LoadingScreen } from '../components/LoadingScreen';
import { useGLTF } from '@react-three/drei';
import { PricePanel } from '../components/PricePanel';
import { CompatibilityModal } from '../components/CompatibilityModal';
import { HelpModal } from '../components/HelpModal';
import { useConfiguratorStore, SavedBuild } from '../store/configuratorStore';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Maximize2, HelpCircle, ShieldCheck, ChevronRight, Box, Trash2, Clock, Zap } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CartIcon } from '../components/CartIcon';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../services/databaseService';

export const ConfiguratorPageV13: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveProduct, activeProduct, showHUD, isFullscreen, setIsFullscreen, toggleFullscreen, savedBuilds, loadBuild, deleteBuild } = useConfiguratorStore();
  const [loading, setLoading] = useState(true);
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [weapons, setWeapons] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const { t } = useTranslation();
  const pageRef = React.useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchSavedBuilds = async () => {
      if (user) {
        try {
          const userBuilds = await databaseService.getUserBuilds(user.id);
          if (userBuilds) {
            useConfiguratorStore.setState({ savedBuilds: userBuilds as SavedBuild[] });
          }
        } catch (error) {
          console.error('Error fetching builds for configurator:', error);
        }
      }
    };
    fetchSavedBuilds();
  }, [user]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [setIsFullscreen]);

  useEffect(() => {
    if (isFullscreen && pageRef.current) {
      if (!document.fullscreenElement) {
        pageRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else if (!isFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const fetchWeapons = async () => {
      setLoading(true);
      try {
        const data = await databaseService.getProducts();
        if (data) {
          const weaponList = data.filter((p: Product) => 
            (p.category?.toLowerCase() === 'weapons' || p.type?.toLowerCase() === 'weapon') && 
            p.stock > 0
          );
          setWeapons(weaponList);
          
          if (id) {
            const activeW = weaponList.find(w => w.id === id);
            if (activeW) {
              const rawPath = activeW.model3D || activeW.model;
              if (rawPath) {
                const path = rawPath.startsWith('http') ? rawPath : `/models/${rawPath}`;
                useGLTF.preload(path);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching weapons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeapons();
  }, []);

  useEffect(() => {
    if (id) {
      if (!activeProduct || activeProduct.id !== id) {
        setLoading(true);
        databaseService.getProduct(id)
          .then(data => {
            if (data) {
              setActiveProduct(data as Product);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    } else {
      if (activeProduct) {
        setActiveProduct(null);
      }
    }
  }, [id, setActiveProduct]);

  if (loading && weapons.length === 0) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">{t('initializing_system')}</div>;

  const isSelectionScreen = !id;

  return (
    <div ref={pageRef} className="fixed inset-0 w-full h-[100dvh] bg-[#020202] overflow-hidden flex flex-col select-none">
      <LoadingScreen />
      <motion.header 
        initial={false}
        animate={{ 
          y: (showHUD || isSelectionScreen) ? 0 : -64,
          opacity: (showHUD || isSelectionScreen) ? 1 : 0
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-16 border-b border-zinc-900/50 flex items-center justify-between px-4 sm:px-8 bg-zinc-950/80 backdrop-blur-2xl z-50 absolute top-0 left-0 w-full"
      >
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to="/configurator" className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-500 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="h-6 w-px bg-zinc-900 hidden sm:block" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-[0.2em] leading-none sm:leading-normal">
                {isSelectionScreen ? "EFT ASSEMBLY v1.3" : "ASSEMBLY"}
              </span>
              <div className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[8px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1">
                <Zap size={8} className="text-amber-500" />
                V1.3
              </div>
            </div>
            {!isSelectionScreen && (
              <div className="flex items-center gap-2">
                <span className="text-white font-black uppercase tracking-tighter text-xs sm:text-lg truncate max-w-[120px] sm:max-w-none">{activeProduct?.name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <CartIcon />
            <div className="h-6 w-px bg-zinc-900 mx-1" />
            <LanguageSwitcher />
            <div className="h-6 w-px bg-zinc-900 mx-1" />
          </div>
          {!isSelectionScreen && (
            <button 
              onClick={() => setIsCompModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all text-zinc-400 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest"
            >
              <ShieldCheck size={16} />
              <span className="hidden xs:inline">{t('check_compatibility')}</span>
            </button>
          )}
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 text-zinc-600 hover:text-white transition-colors hidden sm:block"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-zinc-600 hover:text-white transition-colors hidden sm:block"
          >
            <Maximize2 size={20} />
          </button>
          <div className="sm:hidden">
            <CartIcon />
          </div>
        </div>
      </motion.header>

      <main className="absolute inset-0 z-10">
        <AnimatePresence mode="wait">
          {isSelectionScreen ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full overflow-y-auto pt-24 pb-12 px-4 sm:px-8 flex flex-col items-center"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-zinc-900/5 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020202_70%)]" />
              </div>

              <div className="z-10 w-full max-w-6xl">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 1 }}
                  className="mb-16 text-center"
                >
                  <h2 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter mb-4 leading-none mix-blend-difference">
                    NEXT-GEN <span className="text-zinc-500">ASSEMBLY</span>
                  </h2>
                  <p className="text-zinc-600 font-mono text-xs sm:text-sm uppercase tracking-[0.5em] mt-6">
                    [ VERSION 1.3 // EFT RECURSIVE ENGINE ]
                  </p>
                </motion.div>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-12">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-8 py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all border ${
                      activeTab === 'all' 
                        ? 'bg-white border-white text-black shadow-2xl shadow-white/10' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    SELECT WEAPON
                  </button>
                  <button 
                    onClick={() => setActiveTab('saved')}
                    className={`px-8 py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all border ${
                      activeTab === 'saved' 
                        ? 'bg-white border-white text-black shadow-2xl shadow-white/10' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    SAVED BUILDS
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {activeTab === 'all' ? (
                    weapons.map((weapon, index) => (
                      <motion.div 
                        key={weapon.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.08 }}
                        className="group relative bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all duration-700 cursor-pointer"
                        onClick={() => navigate(`/configurator/v1.3/${weapon.id}`)}
                      >
                        <div className="aspect-[16/9] relative overflow-hidden bg-black">
                          <img 
                            src={weapon.images && weapon.images.length > 0 ? weapon.images[0] : weapon.image}
                            alt={weapon.name}
                            className="w-full h-full object-contain p-4 opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 grayscale group-hover:grayscale-0"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                        </div>
                        
                        <div className="p-8 relative">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest font-mono">CODE_{weapon.uid || weapon.id.split('_')[1]}</span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{weapon.brand}</span>
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 group-hover:text-amber-500 transition-colors">
                            {weapon.name}
                          </h3>
                          <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                               <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">CALIBRATED</span>
                             </div>
                             <ChevronRight size={18} className="text-zinc-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    savedBuilds.length > 0 ? (
                      savedBuilds.map((build, index) => (
                        <motion.div 
                          key={build.id}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.1 }}
                          className="group relative bg-[#0a0a0a] border border-zinc-900 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-700 cursor-pointer"
                        >
                          <div 
                            className="aspect-[16/9] relative overflow-hidden bg-black"
                            onClick={() => {
                              loadBuild(build);
                              navigate(`/configurator/v1.3/${build.activeProduct.id}`);
                            }}
                          >
                            <img 
                              src={build.activeProduct.images?.[0] || build.activeProduct.image}
                              alt={build.name}
                              className="w-full h-full object-contain p-4 opacity-40 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0"
                            />
                          </div>
                          
                          <div className="p-8 relative">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
                                <Clock size={10} />
                                {new Date(build.date).toLocaleDateString()}
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBuild(build.id);
                                }}
                                className="p-2 text-zinc-800 hover:text-white transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div onClick={() => {
                              loadBuild(build);
                              navigate(`/configurator/v1.3/${build.activeProduct.id}`);
                            }}>
                              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                                {build.name}
                              </h3>
                              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-6">BASE // {build.activeProduct.name}</p>
                              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                                <span className="text-xl font-black text-white font-mono">€{build.totalPrice.toLocaleString()}</span>
                                <ChevronRight size={18} className="text-zinc-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                        <Box size={48} className="mx-auto mb-6 text-zinc-800" />
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">NO DATA DETECTED</h3>
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">START CONFIGURATION TO SAVE LOCAL BUILDS</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="configurator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="w-full h-full flex overflow-hidden relative"
            >
              <div className="flex-1 relative h-full">
                <Suspense fallback={<div className="w-full h-full bg-[#020202] flex items-center justify-center"><div className="w-16 h-16 border-2 border-white/10 border-t-white rounded-full animate-spin" /></div>}>
                  <Configurator3DV13 key={id} />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isSelectionScreen && (
        <motion.footer 
          initial={false}
          animate={{ 
            y: showHUD ? 0 : 120,
            opacity: showHUD ? 1 : 0
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="z-50 absolute bottom-0 left-0 w-full"
        >
          <PricePanel />
        </motion.footer>
      )}

      <CompatibilityModal 
        isOpen={isCompModalOpen} 
        onClose={() => setIsCompModalOpen(false)} 
      />

      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </div>
  );
};
