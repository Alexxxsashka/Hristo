import React, { useEffect, useState, Suspense } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowRight, ShieldCheck, Truck, Clock, Award, Star, Zap, Mail, Settings, Maximize2, LayoutGrid } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { Link } from 'react-router-dom';
const ModelViewer = React.lazy(() => import('../components/ModelViewer').then(m => ({ default: m.ModelViewer })));
import { databaseService } from '../services/databaseService';
import { useAuthStore } from '../store/authStore';
import { User as UserIcon } from 'lucide-react';

import { SEO } from '../components/SEO';
import { SiteSettings } from '../types';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const { t } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsData, settingsData] = await Promise.all([
          databaseService.getProducts(),
          databaseService.getSiteSettings()
        ]);
        setProducts(productsData || []);
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredProducts = products.slice(0, 4);
  const bestsellers = products.slice(4, 8);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <SEO 
        title="Home"
        description="Welcome to Hristo Airsoft Store. The best place for airsoft weapons, tactical gear, and custom 3D weapon configurations."
      />

      {settings?.showAnnouncement && settings?.announcement && (
        <div className="fixed top-0 left-0 w-full z-[60] bg-red-600 py-2.5 px-4 text-center">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3">
            <Zap size={14} className="fill-white animate-pulse" />
            {settings.announcement}
            <Zap size={14} className="fill-white animate-pulse" />
          </p>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-8 overflow-hidden pt-20 lg:pt-0">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute inset-0 bg-[#0a0a0a]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#dc262615,transparent_50%)]" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto relative w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-12 lg:py-0">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 text-center lg:text-left"
          >
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                {t('next_gen_tactical')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                  {t('live_3d_configurator_active')}
                </span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.85] mb-8">
              {settings?.heroTitle ? (
                <>
                  {settings.heroTitle.split(' ').slice(0, -1).join(' ')} <br />
                  <span className="text-red-600">{settings.heroTitle.split(' ').slice(-1)}</span>
                </>
              ) : (
                <>
                  {t('build_your')} <br />
                  <span className="text-red-600">{t('ultimate')}</span> <br />
                  {t('arsenal')}
                </>
              )}
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base md:text-xl leading-relaxed mb-10 max-w-xl font-medium mx-auto lg:mx-0">
              {settings?.heroSubtitle || t('hero_desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
              <Link 
                to="/configurator"
                className="px-8 py-5 lg:px-10 lg:py-6 bg-red-600 hover:bg-red-700 text-white font-black tracking-widest uppercase text-xs lg:text-sm rounded-2xl transition-all shadow-[0_0_40px_rgba(220,38,38,0.3)] flex items-center justify-center gap-3 group lg:scale-105"
              >
                {t('start_3d_config')}
                <Zap size={20} className="fill-white" />
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 sm:gap-8 border-t border-zinc-900 pt-8">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white">500+</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('3d_modules')}</span>
              </div>
              <div className="w-px h-8 bg-zinc-900" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white">100%</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('compatibility')}</span>
              </div>
              <div className="w-px h-8 bg-zinc-900" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white">4K</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('visuals')}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative aspect-square sm:aspect-video lg:aspect-auto lg:h-[700px] group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent rounded-full blur-[120px] opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="w-full h-full relative z-10">
              <img 
                src={settings?.heroImageUrl || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1200&auto=format&fit=crop"} 
                className="w-full h-full object-contain filter drop-shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                alt="3D Weapon Preview"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating UI Elements */}
              <div className="absolute top-1/4 right-0 p-3 sm:p-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl shadow-2xl animate-bounce-slow">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Settings size={16} className="text-red-600 animate-spin-slow sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('active_slot')}</p>
                    <p className="text-[10px] sm:text-xs font-black text-white uppercase">{t('picatinny_top')}</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 left-0 p-3 sm:p-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-xl sm:rounded-2xl shadow-2xl animate-bounce-slow delay-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <ShieldCheck size={16} className="text-emerald-500 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('compatibility')}</p>
                    <p className="text-[10px] sm:text-xs font-black text-white uppercase">{t('verified')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Features Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 md:py-32">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <span className="text-red-600 text-xs font-black tracking-[0.3em] uppercase mb-4">{t('the_experience')}</span>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
            {t('revolutionary')} <span className="text-zinc-500">{t('3d_tech')}</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl font-medium text-sm sm:text-base">
            {t('revolutionary_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[600px]">
          <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">{t('real_time')} <br /> <span className="text-red-600">{t('compatibility')}</span></h3>
                <p className="text-zinc-400 max-w-sm font-medium text-sm sm:text-base">{t('real_time_desc')}</p>
              </div>
              <Link to="/configurator" className="w-fit flex items-center gap-3 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs group-hover:text-red-600 transition-colors mt-6">
                {t('try_it_now')} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-full md:w-2/3 h-full opacity-10 md:opacity-20 group-hover:opacity-40 transition-opacity">
              <img src="https://images.unsplash.com/photo-1585123334904-845d60e97b29?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Tactical Equipment" referrerPolicy="no-referrer" />
            </div>
          </div>

          <div className="bg-red-600 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 flex flex-col justify-between group hover:bg-red-700 transition-colors">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8">
              <Maximize2 size={24} className="text-white sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-4">{t('4k_textures')}</h3>
              <p className="text-white/80 text-xs sm:text-sm font-medium">{t('4k_textures_desc')}</p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 flex flex-col justify-between group hover:border-red-600/50 transition-all">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-800 rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-red-600/10 transition-colors">
              <LayoutGrid size={24} className="text-red-600 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-4">{t('modular_system')}</h3>
              <p className="text-zinc-500 text-xs sm:text-sm font-medium">{t('modular_system_desc')}</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">{t('one_click_checkout').split(' ')[0]} <br /> <span className="text-red-600">{t('one_click_checkout').split(' ').slice(1).join(' ')}</span></h3>
                <p className="text-zinc-400 max-w-sm font-medium text-sm sm:text-base">{t('one_click_checkout_desc')}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 mt-6">
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-900 rounded-lg sm:rounded-xl border border-zinc-800 text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {t('fast_shipping')}
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-900 rounded-lg sm:rounded-xl border border-zinc-800 text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {t('secure')}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-2/3 bg-gradient-to-tl from-red-600/10 to-transparent" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-zinc-950 border-y border-zinc-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Truck, title: t('free_shipping'), desc: t('free_shipping_desc') },
            { icon: ShieldCheck, title: t('secure_payments'), desc: t('secure_payments_desc') },
            { icon: Clock, title: t('fast_delivery'), desc: t('fast_delivery_desc') },
            { icon: Award, title: t('warranty'), desc: t('warranty_desc') },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-red-600/50 transition-colors shrink-0">
                <item.icon size={24} className="text-red-600" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-widest uppercase text-white">{item.title}</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live 3D Preview Section */}
      <section className="bg-zinc-950 py-20 md:py-32 border-y border-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 h-[400px] md:h-[600px] relative group">
              <div className="absolute inset-0 bg-red-600/5 rounded-[40px] blur-3xl group-hover:bg-red-600/10 transition-colors" />
              <div className="w-full h-full relative z-10">
                <Suspense fallback={<div className="w-full h-full bg-zinc-900/50 rounded-[40px] animate-pulse flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
                  <ModelViewer modelPath="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb" />
                </Suspense>
                
                {/* Interaction Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full flex items-center gap-3 shadow-2xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('interactive_preview_hint')}</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-red-600 text-xs font-black tracking-[0.3em] uppercase mb-6 block">{t('live_demo')}</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">
                {t('test_the')} <br />
                <span className="text-zinc-500 text-3xl md:text-5xl">{t('future_of_shopping')}</span>
              </h2>
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shrink-0">
                    <Zap size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">{t('instant_feedback')}</h4>
                    <p className="text-zinc-500 text-sm font-medium">{t('instant_feedback_desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shrink-0">
                    <Maximize2 size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">{t('full_360_control')}</h4>
                    <p className="text-zinc-500 text-sm font-medium">{t('full_360_control_desc')}</p>
                  </div>
                </div>
              </div>
              <Link 
                to="/configurator"
                className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black font-black tracking-widest uppercase text-sm rounded-2xl hover:bg-zinc-200 transition-all group"
              >
                {t('open_full_configurator')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 md:py-32">
        <div className="flex flex-col items-center text-center mb-12 md:mb-20">
          <span className="text-red-600 text-xs font-black tracking-[0.3em] uppercase mb-4">{t('equipment')}</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            {t('explore')} <span className="text-zinc-500">{t('categories')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { id: 'weapons', name: 'Weapons', img: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800&auto=format&fit=crop' },
            { id: 'attachments', name: 'Optics & Attach', img: 'https://images.unsplash.com/photo-1585123334904-845d60e97b29?q=80&w=800&auto=format&fit=crop' },
            { id: 'gear', name: 'Tactical Gear', img: 'https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=800&auto=format&fit=crop' },
            { id: 'internal_parts', name: 'Internal Parts', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop' },
          ].map((cat) => {
            const count = products.filter(p => p.category === cat.id).length;
            return (
              <Link 
                key={cat.id}
                to={`/shop/${cat.id}`}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900"
              >
                <img 
                  src={cat.img} 
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-[10px] font-black text-red-600 tracking-widest uppercase mb-2 block">
                    {count} {count === 1 ? t('product') : t('products')}
                  </span>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">{cat.name}</h3>
                  <div className="w-10 h-1 bg-red-600 group-hover:w-full transition-all duration-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-zinc-950 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 md:mb-16">
            <div>
              <span className="text-red-600 text-xs font-black tracking-[0.3em] uppercase mb-4 block">{t('new_arrivals')}</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                {t('latest')} <span className="text-zinc-500">{t('gear')}</span>
              </h2>
            </div>
            <Link to="/shop" className="w-fit px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black tracking-widest uppercase rounded-xl border border-zinc-800 transition-all flex items-center gap-2">
              {t('view_all')} <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-zinc-900/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-12 md:mb-16">
            <div>
              <span className="text-red-600 text-xs font-black tracking-[0.3em] uppercase mb-4 block">{t('popular')}</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                {t('best')} <span className="text-zinc-500">{t('sellers')}</span>
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-zinc-900/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 md:pb-32">
        <div className="relative rounded-[32px] md:rounded-[40px] overflow-hidden bg-red-600 p-8 sm:p-12 md:p-24">
          <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=800&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-50 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="px-4 py-2 bg-white text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 md:mb-8 inline-block">
              {t('limited_time_offer')}
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6 md:mb-8">
              {t('get_20_off')} <br />
              {t('your_first_order')}
            </h2>
            <p className="text-white/80 text-base md:text-lg font-medium mb-8 md:mb-12 max-w-md">
              {t('promo_desc')}
            </p>
            <Link 
              to="/register"
              className="w-full sm:w-fit px-10 py-5 bg-white text-red-600 font-black tracking-widest uppercase text-sm rounded-2xl transition-all hover:scale-105 shadow-2xl inline-block text-center"
            >
              {t('claim_discount')}
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-zinc-950 py-20 md:py-32 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 border border-red-600/20">
            <Mail size={28} className="text-red-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
            {t('stay')} <span className="text-red-600">{t('informed')}</span>
          </h2>
          <p className="text-zinc-500 font-medium mb-8 md:mb-12 text-sm md:text-base">
            {t('newsletter_desc')}
          </p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder={t('enter_email') || 'Enter your email address'}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-red-600 transition-colors text-sm"
            />
            <button className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black tracking-widest uppercase text-sm rounded-2xl transition-all shadow-lg shadow-red-600/20">
              {t('subscribe')}
            </button>
          </form>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-6">
            {t('newsletter_disclaimer')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
