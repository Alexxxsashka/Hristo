import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
const Configurator3DV12 = lazy(() => import('../components/Configurator3DV12').then(m => ({ default: m.Configurator3DV12 })));
import { LoadingScreen } from '../components/LoadingScreen';
import { useGLTF } from '@react-three/drei';
import { PricePanel } from '../components/PricePanel';
import { CompatibilityModal } from '../components/CompatibilityModal';
import { HelpModal } from '../components/HelpModal';
import { useConfiguratorStore, SavedBuild } from '../store/configuratorStore';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Maximize2, HelpCircle, ShieldCheck, ChevronRight, Box, Trash2, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CartIcon } from '../components/CartIcon';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../services/databaseService';

export const ConfiguratorPageV12: React.FC = () => {
  const params = useParams();
  const id = params.id || params['*'];
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
          // More inclusive filtering for weapons
          const weaponList = data.filter((p: Product) => {
            const cat = p.category?.toLowerCase() || '';
            const type = p.type?.toLowerCase() || '';
            const name = p.name?.toLowerCase() || '';
            return (
              cat.includes('weapon') || 
              type.includes('weapon') || 
              cat === 'rifles' ||
              cat === 'pistols' ||
              type === 'base_weapon'
            ) && (p.stock > 0 || p.stock === undefined); // Some items might not have stock defined
          });
          setWeapons(weaponList);
          
          // Only preload the active weapon if it's in the list
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
    <div ref={pageRef} className="fixed inset-0 w-full h-[100dvh] bg-[#050505] overflow-hidden flex flex-col select-none z-[1000]">
      <LoadingScreen />
      <motion.header 
        initial={false}
        animate={{ 
          y: (showHUD || isSelectionScreen) ? 0 : -64,
          opacity: (showHUD || isSelectionScreen) ? 1 : 0
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-8 bg-zinc-950/50 backdrop-blur-xl z-50 absolute top-0 left-0 w-full"
      >
        <div className="flex items-center gap-4 sm:gap-8">
          <Link to={isSelectionScreen ? "/" : "/configurator"} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none sm:leading-normal">
                {isSelectionScreen ? t('platform_selection') : t('configurator')}
              </span>
              <div className="px-1.5 py-0.5 bg-red-600 rounded text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={8} />
                V1.2
              </div>
            </div>
            {!isSelectionScreen && (
              <div className="flex items-center gap-2">
                <span className="text-white font-black uppercase tracking-tighter text-xs sm:text-base truncate max-w-[120px] sm:max-w-none">{activeProduct?.name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <CartIcon />
            <div className="h-6 w-px bg-zinc-800 mx-2" />
            <LanguageSwitcher />
            <div className="h-6 w-px bg-zinc-800 mx-2" />
          </div>
          {!isSelectionScreen && (
            <button 
              onClick={() => setIsCompModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-red-600/50 rounded-lg transition-all text-zinc-400 hover:text-red-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest"
            >
              <ShieldCheck size={16} />
              <span className="hidden xs:inline">{t('check_compatibility')}</span>
            </button>
          )}
          <div className="hidden sm:block h-6 w-px bg-zinc-800 mx-2" />
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 text-zinc-500 hover:text-white transition-colors hidden sm:block"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-zinc-500 hover:text-white transition-colors hidden sm:block"
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
              </div>

              <div className="z-10 w-full max-w-6xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="mb-12 text-center"
                >
                  <h2 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                    V1.2 <span className="text-red-600">{t('armory')}</span>
                  </h2>
                  <p className="text-zinc-500 font-mono text-xs sm:text-sm uppercase tracking-[0.3em]">
                    {t('armory_access_granted')}
                  </p>
                </motion.div>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`px-4 sm:px-8 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border ${
                      activeTab === 'all' 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {t('all_platforms')}
                  </button>
                  <button 
                    onClick={() => setActiveTab('saved')}
                    className={`px-4 sm:px-8 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border ${
                      activeTab === 'saved' 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {t('saved_builds')} ({savedBuilds.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTab === 'all' ? (
                    weapons.length > 0 ? (
                      weapons.map((weapon, index) => (
                        <motion.div 
                          key={weapon.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                          className="group relative bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-600/50 hover:bg-zinc-900/60 transition-all duration-500 cursor-pointer"
                          onClick={() => navigate(`/configurator/${weapon.id}`)}
                        >
                          <div className="aspect-[16/10] relative overflow-hidden">
                            <img 
                              src={weapon.images && weapon.images.length > 0 ? weapon.images[0] : (weapon.image?.startsWith('http') ? weapon.image : (weapon.image || `https://picsum.photos/seed/${weapon.id}/800/500`))}
                              alt={weapon.name}
                              className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                          </div>
                          
                          <div className="p-6 relative">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">0{index + 1}</span>
                              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{weapon.brand}</span>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 group-hover:text-red-500 transition-colors">
                              {weapon.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-red-600 rounded-full" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('ready_for_mods')}</span>
                              </div>
                              <ChevronRight size={16} className="text-zinc-700 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                          <div className="absolute inset-0 border-2 border-red-600/0 group-hover:border-red-600/20 rounded-3xl transition-all pointer-events-none" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                          <Box size={32} className="animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{t('no_weapons_available')}</h3>
                        <p className="text-zinc-500 text-sm uppercase tracking-widest mb-6 max-w-md mx-auto">
                          {t('armory_empty_desc')}
                        </p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-8 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-700 transition-all"
                        >
                          {t('retry_connection')}
                        </button>
                      </div>
                    )
                  ) : (
                    savedBuilds.length > 0 ? (
                      savedBuilds.map((build, index) => (
                        <motion.div 
                          key={build.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }}
                          className="group relative bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-600/50 hover:bg-zinc-900/60 transition-all duration-500 cursor-pointer"
                        >
                          <div 
                            className="aspect-[16/10] relative overflow-hidden"
                            onClick={() => {
                              loadBuild(build);
                              navigate(`/configurator/${build.activeProduct.id}`);
                            }}
                          >
                            <img 
                              src={build.activeProduct.images && build.activeProduct.images.length > 0 ? build.activeProduct.images[0] : (build.activeProduct.image?.startsWith('http') ? build.activeProduct.image : (build.activeProduct.image || `https://picsum.photos/seed/${build.activeProduct.id}/800/500`))}
                              alt={build.name}
                              className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
                          </div>
                          
                          <div className="p-6 relative">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                                <Clock size={10} />
                                {new Date(build.date).toLocaleDateString()}
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBuild(build.id);
                                }}
                                className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div onClick={() => {
                              loadBuild(build);
                              navigate(`/configurator/${build.activeProduct.id}`);
                            }}>
                              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1 group-hover:text-red-500 transition-colors">
                                {build.name}
                              </h3>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">{t('base')}: {build.activeProduct.name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-black text-white font-mono">€{build.totalPrice.toLocaleString()}</span>
                                <ChevronRight size={16} className="text-zinc-700 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute inset-0 border-2 border-red-600/0 group-hover:border-red-600/20 rounded-3xl transition-all pointer-events-none" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-700">
                          <Box size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{t('no_saved_builds')}</h3>
                        <p className="text-zinc-500 text-sm uppercase tracking-widest">{t('start_configuring_to_save')}</p>
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
              transition={{ duration: 0.8 }}
              className="w-full h-full flex overflow-hidden relative"
            >
              <div className="flex-1 relative h-full">
                <Suspense fallback={<div className="w-full h-full bg-[#050505] flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
                  <Configurator3DV12 key={id} />
                </Suspense>
                
                {/* System status removed as unnecessary info */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isSelectionScreen && (
        <motion.footer 
          initial={false}
          animate={{ 
            y: showHUD ? 0 : 250,
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
