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
import { AnimatePresence } from 'framer-motion';

import { SEO } from '../components/SEO';
import { SiteSettings } from '../types';
import { useSettingsStore } from '../store/settingsStore';

const QuickPreviewModal = Suspense ? React.lazy(() => import('../components/QuickPreviewModal').then(m => ({ default: m.QuickPreviewModal }))) : null;

import { useToastStore } from '../store/toastStore';

const HomePage: React.FC = () => {
  const { addToast } = useToastStore();
  const { settings, fetchSettings } = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [selectedQuickView, setSelectedQuickView] = useState<any>(null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          databaseService.getProducts(),
          databaseService.getCategories()
        ]);
        setProducts(productsData || []);
        setCategories(categoriesData || []);
        if (!settings) fetchSettings();
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchSettings]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNewsletterStatus('success');
      addToast(t('newsletter_success') || 'Thank you for subscribing!', 'success');
      setNewsletterEmail('');
      // In a real app, we'd call databaseService.subscribeNewsletter(newsletterEmail)
    } catch (err) {
      setNewsletterStatus('idle');
    }
  };

  const activeSlides = Array.isArray(settings?.heroSlides) ? settings.heroSlides.filter(s => s.active) : [];

  useEffect(() => {
    if (activeSlides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % activeSlides.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [activeSlides.length]);

  const featuredProducts = products.slice(0, 4);
  const bestsellers = products.slice(4, 8);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <SEO />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden pt-20 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlideIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-[var(--bg-primary)] opacity-60 z-10" />
            {activeSlides[currentSlideIndex]?.mediaType === 'video' && activeSlides[currentSlideIndex]?.videoUrl ? (
              <video 
                src={activeSlides[currentSlideIndex].videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img 
                src={activeSlides[currentSlideIndex]?.image || settings?.heroImageUrl || ""} 
                className="w-full h-full object-cover"
                alt="Hero Background"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#ab101710,transparent_60%)] z-20" />

        <div className="max-w-7xl mx-auto relative w-full z-30 px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-12 lg:py-0">
          <motion.div 
            key={`content-${currentSlideIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
              <span className="px-3 py-1 bg-[#ab1017] text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                {t('next_gen_tactical')}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ab1017] rounded-full animate-pulse" />
                <span className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest">
                  {t('live_3d_configurator_active')}
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.85] mb-8">
              {activeSlides[currentSlideIndex] && activeSlides[currentSlideIndex].title ? (
                <>
                  {(activeSlides[currentSlideIndex].title || '').split(' ').slice(0, -1).join(' ')} <br />
                  <span className="text-[#ab1017]">{(activeSlides[currentSlideIndex].title || '').split(' ').slice(-1)}</span>
                </>
              ) : (
                <>
                  {(settings?.heroTitle || t('build_your')).split(' ').slice(0, -1).join(' ')} <br />
                  <span className="text-[#ab1017]">{(settings?.heroTitle || t('ultimate')).split(' ').slice(-1)}</span>
                </>
              )}
            </h1>

            <p className="text-[var(--text-secondary)] text-sm sm:text-base md:text-xl leading-relaxed mb-10 max-w-xl font-medium mx-auto lg:mx-0 drop-shadow-lg">
              {activeSlides[currentSlideIndex]?.subtitle || settings?.heroSubtitle || t('hero_desc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start">
              <Link 
                to={activeSlides[currentSlideIndex]?.ctaLink || "/configurator"}
                className="px-8 py-5 lg:px-10 lg:py-6 bg-[#ab1017] hover:bg-[#8e0d13] text-white font-black tracking-widest uppercase text-xs lg:text-sm rounded-2xl transition-all shadow-[0_0_40px_rgba(171,16,23,0.3)] flex items-center justify-center gap-3 group lg:scale-105"
              >
                {activeSlides[currentSlideIndex]?.ctaText || t('start_3d_config')}
                <Zap size={20} className="fill-white" />
              </Link>
            </div>

            {/* Slide Indicators */}
            {activeSlides.length > 1 && (
              <div className="mt-12 flex justify-center lg:justify-start gap-3">
                {activeSlides.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`h-1 rounded-full transition-all duration-500 ${i === currentSlideIndex ? 'w-12 bg-[#ab1017]' : 'w-4 bg-[var(--bg-tertiary)] hover:bg-[var(--text-secondary)]'}`}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="hidden lg:block relative aspect-square group"
          >
            <div className="absolute inset-0 bg-[#ab1017]/10 rounded-full blur-[120px] opacity-30" />
            {/* Contextual Graphics */}
            <div className="relative z-10 w-full h-full border border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-3xl rounded-[64px] overflow-hidden group-hover:border-[#ab1017]/30 transition-all duration-500 shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none z-20">
                  <div className="absolute top-10 left-10 w-20 h-px bg-white" />
                  <div className="absolute top-10 left-10 w-px h-20 bg-white" />
                  <div className="absolute bottom-10 right-10 w-20 h-px bg-white" />
                  <div className="absolute bottom-10 right-10 w-px h-20 bg-white" />
               </div>

               {(settings?.heroFeatureImage || settings?.heroFeatureVideo) ? (
                 <div className="absolute inset-0 w-full h-full">
                   {settings.heroFeatureMediaType === 'video' && settings.heroFeatureVideo ? (
                     <video 
                       src={settings.heroFeatureVideo}
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                       autoPlay
                       muted
                       loop
                       playsInline
                     />
                   ) : settings.heroFeatureImage ? (
                     <img 
                       src={settings.heroFeatureImage}
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                       alt="Hero Feature"
                     />
                   ) : null}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 </div>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <div className="w-24 h-24 bg-[#ab1017] rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                      <Maximize2 size={40} className="text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Next-Gen Interface</h3>
                      <p className="text-[var(--text-secondary)] font-medium text-sm">Industrial grade tactile response <br /> & modular engineering</p>
                    </div>
                 </div>
               )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Features Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 md:py-32">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24">
          <span className="text-[#ab1017] text-xs font-black tracking-[0.3em] uppercase mb-4">{t('the_experience')}</span>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-[var(--text-primary)]">
            {t('revolutionary')} <span className="text-[var(--text-secondary)] opacity-50">{t('3d_tech')}</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl font-medium text-sm sm:text-base">
            {t('revolutionary_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[600px]">
          <div className="md:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden group shadow-xl">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-primary)]">{t('real_time')} <br /> <span className="text-[#ab1017]">{t('compatibility')}</span></h3>
                <p className="text-[var(--text-secondary)] max-w-sm font-medium text-sm sm:text-base">{t('real_time_desc')}</p>
              </div>
              <Link to="/configurator" className="w-fit flex items-center gap-3 text-[var(--text-primary)] font-black uppercase tracking-widest text-[10px] sm:text-xs group-hover:text-[#ab1017] transition-colors mt-6">
                {t('try_it_now')} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-full md:w-2/3 h-full opacity-10 md:opacity-20 group-hover:opacity-40 transition-opacity">
              <img src="/images/tactical_gear.png" className="w-full h-full object-cover" alt="Tactical Equipment" referrerPolicy="no-referrer" />
            </div>
          </div>

          <div className="bg-[#ab1017] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 flex flex-col justify-between group hover:bg-[#8e0d13] transition-colors shadow-xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8">
              <Maximize2 size={24} className="text-white sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-4">{t('4k_textures')}</h3>
              <p className="text-white/90 text-xs sm:text-sm font-medium">{t('4k_textures_desc')}</p>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 flex flex-col justify-between group hover:border-[#ab1017]/50 transition-all shadow-xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#ab1017]/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:bg-[#ab1017]/20 transition-colors">
              <LayoutGrid size={24} className="text-[#ab1017] sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)] mb-4">{t('modular_system')}</h3>
              <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">{t('modular_system_desc')}</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-12 relative overflow-hidden group shadow-xl">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-primary)]">{t('one_click_checkout').split(' ')[0]} <br /> <span className="text-[#ab1017]">{t('one_click_checkout').split(' ').slice(1).join(' ')}</span></h3>
                <p className="text-[var(--text-secondary)] max-w-sm font-medium text-sm sm:text-base">{t('one_click_checkout_desc')}</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 mt-6">
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--bg-tertiary)] rounded-lg sm:rounded-xl border border-[var(--border-color)] text-[8px] sm:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  {t('fast_shipping')}
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--bg-tertiary)] rounded-lg sm:rounded-xl border border-[var(--border-color)] text-[8px] sm:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  {t('secure')}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-2/3 bg-gradient-to-tl from-[#ab1017]/10 to-transparent" />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-[var(--bg-primary)] border-y border-[var(--border-color)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Truck, title: t('free_shipping'), desc: t('free_shipping_desc') },
            { icon: ShieldCheck, title: t('secure_payments'), desc: t('secure_payments_desc') },
            { icon: Clock, title: t('fast_delivery'), desc: t('fast_delivery_desc') },
            { icon: Award, title: t('warranty'), desc: t('warranty_desc') },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] group-hover:border-[#ab1017]/50 transition-colors shrink-0 shadow-sm">
                <item.icon size={24} className="text-[#ab1017]" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-widest uppercase text-[var(--text-primary)]">{item.title}</h4>
                <p className="text-[10px] font-bold text-[var(--text-secondary)] opacity-60 uppercase tracking-widest mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live 3D Preview Section */}
      <section className="bg-[var(--bg-primary)] py-20 md:py-32 border-b border-[var(--border-color)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 h-[400px] md:h-[600px] relative group">
              <div className="absolute inset-0 bg-[#ab1017]/5 rounded-[40px] blur-3xl group-hover:bg-[#ab1017]/10 transition-colors" />
              <div className="w-full h-full relative z-10">
                <Suspense fallback={<div className="w-full h-full bg-[var(--bg-secondary)] rounded-[40px] animate-pulse flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#ab1017] border-t-transparent rounded-full animate-spin" /></div>}>
                  <ModelViewer modelPath={settings?.liveDemoModelUrl || ""} />
                </Suspense>
                
                {/* Interaction Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border-color)] rounded-full flex items-center gap-3 shadow-2xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#ab1017] rounded-full animate-ping" />
                    <div className="w-1.5 h-1.5 bg-[#ab1017] rounded-full" />
                  </div>
                  <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{t('interactive_preview_hint')}</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-[#ab1017] text-xs font-black tracking-[0.3em] uppercase mb-6 block">{t('live_demo')}</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none text-[var(--text-primary)]">
                {t('test_the')} <br />
                <span className="text-[var(--text-secondary)] opacity-50 text-3xl md:text-5xl">{t('future_of_shopping')}</span>
              </h2>
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] shrink-0 shadow-sm">
                    <Zap size={20} className="text-[#ab1017]" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-black uppercase tracking-widest text-sm mb-1">{t('instant_feedback')}</h4>
                    <p className="text-[var(--text-secondary)] text-sm font-medium opacity-70">{t('instant_feedback_desc')}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] shrink-0 shadow-sm">
                    <Maximize2 size={20} className="text-[#ab1017]" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-black uppercase tracking-widest text-sm mb-1">{t('full_360_control')}</h4>
                    <p className="text-[var(--text-secondary)] text-sm font-medium opacity-70">{t('full_360_control_desc')}</p>
                  </div>
                </div>
              </div>
              <Link 
                to="/configurator"
                className="inline-flex items-center gap-4 px-10 py-5 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black tracking-widest uppercase text-sm rounded-2xl hover:bg-[var(--text-secondary)] transition-all group shadow-xl"
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
          <span className="text-[#ab1017] text-xs font-black tracking-[0.3em] uppercase mb-4">{t('equipment')}</span>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)]">
            {t('explore')} <span className="text-[var(--text-secondary)] opacity-50">{t('categories')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {(settings?.featuredCategoriesList || []).filter(c => c.active).map((cat) => {
            const actualCategory = categories.find(c => c.id === cat.categoryId);
            const categoryName = cat.customName || actualCategory?.name || cat.categoryId.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
            const categoryImage = actualCategory?.image || (cat as any).customImage || "";
            const count = (Array.isArray(products) ? products : []).filter(p => p.category === cat.categoryId).length;
            return (
              <Link 
                key={cat.id}
                to={`/shop/${cat.categoryId}`}
                className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xl"
              >
                <img 
                  src={categoryImage} 
                  alt={categoryName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-[10px] font-black text-[#ab1017] tracking-widest uppercase mb-2 block">
                    {count} {count === 1 ? t('product') : t('products')}
                  </span>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-[var(--text-primary)]">{categoryName}</h3>
                  <div className="w-10 h-1 bg-[#ab1017] group-hover:w-full transition-all duration-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-[var(--bg-primary)] py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 md:mb-16">
            <div>
              <span className="text-[#ab1017] text-xs font-black tracking-[0.3em] uppercase mb-4 block">{t('new_arrivals')}</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)]">
                {t('latest')} <span className="text-[var(--text-secondary)] opacity-50">{t('gear')}</span>
              </h2>
            </div>
            <Link to="/shop" className="w-fit px-6 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[10px] font-black tracking-widest uppercase rounded-xl border border-[var(--border-color)] transition-all flex items-center gap-2 shadow-sm">
              {t('view_all')} <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-[var(--bg-secondary)] rounded-3xl animate-pulse border border-[var(--border-color)]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickPreview={(p) => setSelectedQuickView(p)}
                />
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
              <span className="text-[#ab1017] text-xs font-black tracking-[0.3em] uppercase mb-4 block">{t('popular')}</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)]">
                {t('best')} <span className="text-[var(--text-secondary)] opacity-50">{t('sellers')}</span>
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-[var(--bg-secondary)] rounded-3xl animate-pulse border border-[var(--border-color)]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onQuickPreview={(p) => setSelectedQuickView(p)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Us Dynamic Section */}
      {(settings?.aboutUsTitle || settings?.aboutUsText) && (
        <section className="bg-[var(--bg-secondary)] py-20 md:py-32 border-y border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative aspect-video rounded-[40px] overflow-hidden group shadow-2xl border border-[var(--border-color)]"
              >
                <img 
                  src={settings.aboutUsImage || ""} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt="About Section"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent opacity-60" />
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-[#ab1017] text-xs font-black tracking-[0.3em] uppercase mb-4 block">Hristo Identity</span>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none text-[var(--text-primary)]">
                  {settings.aboutUsTitle?.split(' ').slice(0, -1).join(' ')} <br />
                  <span className="text-[#ab1017]">{settings.aboutUsTitle?.split(' ').slice(-1)}</span>
                </h2>
                <p className="text-[var(--text-secondary)] text-lg font-medium leading-relaxed mb-12 opacity-80">
                  {settings.aboutUsText}
                </p>
                {settings.aboutUsLink && (
                  <Link 
                    to={settings.aboutUsLink}
                    className="inline-flex items-center gap-4 text-[var(--text-primary)] font-black uppercase tracking-widest text-xs border-b-2 border-[#ab1017] pb-2 hover:text-[#ab1017] transition-colors"
                  >
                    Learn our mission <ArrowRight size={16} />
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Promo Banners */}
      {(settings?.promoBanners || []).filter(b => b.active).map((banner) => (
        <section key={banner.id} className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 md:pb-32">
          <div 
            className="relative rounded-[32px] md:rounded-[40px] overflow-hidden p-8 sm:p-12 md:p-24 shadow-2xl"
            style={{ backgroundColor: banner.bgColor }}
          >
            <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
              {banner.mediaType === 'video' && banner.videoUrl ? (
                <video 
                  src={banner.videoUrl}
                  className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img 
                  src={banner.image} 
                  className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                  referrerPolicy="no-referrer"
                  alt=""
                />
              )}
            </div>
            <div className="relative z-10 max-w-2xl">
              <span className="px-4 py-2 bg-white text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6 md:mb-8 inline-block shadow-lg">
                {t('limited_time_offer')}
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6 md:mb-8">
                {banner.title}
              </h2>
              <p className="text-white/80 text-base md:text-lg font-medium mb-8 md:mb-12 max-w-md">
                {banner.subtitle}
              </p>
              <Link 
                to={banner.ctaLink}
                className="w-full sm:w-fit px-10 py-5 bg-white font-black tracking-widest uppercase text-sm rounded-2xl transition-all hover:scale-105 shadow-2xl inline-block text-center hover:bg-zinc-100"
                style={{ color: banner.bgColor }}
              >
                {banner.ctaText}
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* Newsletter */}
      <section className="bg-[var(--bg-primary)] py-20 md:py-32 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ab1017]/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 border border-[#ab1017]/20">
            <Mail size={28} className="text-[#ab1017]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-primary)]">
            {t('stay')} <span className="text-[#ab1017]">{t('informed')}</span>
          </h2>
          <p className="text-[var(--text-secondary)] font-medium mb-8 md:mb-12 text-sm md:text-base opacity-70">
            {t('newsletter_desc')}
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              required
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              placeholder={t('enter_email') || 'Enter your email address'}
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[#ab1017] transition-colors text-sm shadow-inner"
              disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
            />
            <button 
              type="submit"
              disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
              className="px-10 py-4 bg-[#ab1017] hover:bg-[#8e0d13] text-white font-black tracking-widest uppercase text-sm rounded-2xl transition-all shadow-lg shadow-[#ab1017]/20 disabled:opacity-50"
            >
              {newsletterStatus === 'loading' ? t('subscribing') || '...' : 
               newsletterStatus === 'success' ? t('subscribed') || 'DONE!' : 
               t('subscribe')}
            </button>
          </form>
          {newsletterStatus === 'success' && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-500 font-bold text-xs uppercase tracking-widest mt-4"
            >
              {t('newsletter_success') || 'Successfully subscribed!'}
            </motion.p>
          )}
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-6">
            {t('newsletter_disclaimer')}
          </p>
        </div>
      </section>
      {/* Quick Preview Modal */}
      {QuickPreviewModal && (
        <Suspense fallback={null}>
          <QuickPreviewModal 
            isOpen={!!selectedQuickView}
            product={selectedQuickView}
            onClose={() => setSelectedQuickView(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default HomePage;
