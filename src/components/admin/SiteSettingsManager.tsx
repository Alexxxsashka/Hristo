import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Save, 
  Link as LinkIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Facebook, 
  Instagram, 
  Youtube, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Layout, 
  Image as ImageIcon, 
  Monitor, 
  Info,
  ExternalLink,
  Settings,
  Eye,
  CheckCircle2,
  Zap,
  Tag,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { SiteSettings, HeroSlide, PromoBanner, FeaturedCategory } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { DEFAULT_SITE_SETTINGS } from '../../constants/defaultSettings';

type SettingsTab = 'general' | 'hero' | 'homepage' | 'social' | 'footer';

export const SiteSettingsManager = ({ onNotify, onUpdate }: { 
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onUpdate?: () => void
}) => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Pending uploads
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingHero, setPendingHero] = useState<File | null>(null);
  const [pendingAboutImage, setPendingAboutImage] = useState<File | null>(null);
  const [pendingHeroFeatureImage, setPendingHeroFeatureImage] = useState<File | null>(null);
  const [pendingHeroFeatureVideo, setPendingHeroFeatureVideo] = useState<File | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await databaseService.getSiteSettings();
        
        // Robust merge: Use default if database value is missing, empty string, or empty array
        const merged = { ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings;
        
        (Object.keys(DEFAULT_SITE_SETTINGS) as Array<keyof SiteSettings>).forEach(key => {
          const value = (data as any)[key];
          if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
            (merged as any)[key] = (DEFAULT_SITE_SETTINGS as any)[key];
          }
        });

        setSettings(merged);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileUpload = async (file: File, folder: string, previousUrl?: string) => {
    if (previousUrl) await databaseService.deleteFile(previousUrl);
    const extension = file.name.split('.').pop();
    const path = `site/${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${extension}`;
    return await databaseService.uploadFile(file, path, (p) => setUploadProgress(p));
  };

  const handleFileDelete = async (url: string) => {
    if (url) await databaseService.deleteFile(url);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalSettings = { ...settings };

      // Handle simple image uploads
      if (pendingLogo) {
        if (settings.logoUrl) await databaseService.deleteFile(settings.logoUrl);
        finalSettings.logoUrl = await handleFileUpload(pendingLogo, 'branding');
        setPendingLogo(null);
      }

      if (pendingHero) {
        if (settings.heroImageUrl) await databaseService.deleteFile(settings.heroImageUrl);
        finalSettings.heroImageUrl = await handleFileUpload(pendingHero, 'hero');
        setPendingHero(null);
      }

      if (pendingAboutImage) {
        if (settings.aboutUsImage) await databaseService.deleteFile(settings.aboutUsImage);
        finalSettings.aboutUsImage = await handleFileUpload(pendingAboutImage, 'about');
        setPendingAboutImage(null);
      }

      if (pendingHeroFeatureImage) {
        if (settings.heroFeatureImage) await databaseService.deleteFile(settings.heroFeatureImage);
        finalSettings.heroFeatureImage = await handleFileUpload(pendingHeroFeatureImage, 'hero-feature');
        setPendingHeroFeatureImage(null);
      }

      if (pendingHeroFeatureVideo) {
        if (settings.heroFeatureVideo) await databaseService.deleteFile(settings.heroFeatureVideo);
        finalSettings.heroFeatureVideo = await handleFileUpload(pendingHeroFeatureVideo, 'hero-feature');
        setPendingHeroFeatureVideo(null);
      }

      await databaseService.updateSiteSettings(finalSettings);
      useSettingsStore.getState().updateSettings(finalSettings);
      setSettings(finalSettings);
      onNotify('Site configuration updated successfully!', 'success');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Save failed', err);
      onNotify('Failed to update settings', 'error');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const addHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=1200',
      title: 'New Dynamic Slide',
      subtitle: 'Premium combat gear ready for deployment',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      active: true
    };
    setSettings({ ...settings, heroSlides: [...(Array.isArray(settings.heroSlides) ? settings.heroSlides : []), newSlide] });
  };

  const updateHeroSlide = (id: string, updates: Partial<HeroSlide>) => {
    setSettings({
      ...settings,
      heroSlides: (Array.isArray(settings.heroSlides) ? settings.heroSlides : []).map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const deleteHeroSlide = async (id: string) => {
    const slides = Array.isArray(settings.heroSlides) ? settings.heroSlides : [];
    const slide = slides.find(s => s.id === id);
    if (slide?.image) await handleFileDelete(slide.image);
    setSettings({
      ...settings,
      heroSlides: (Array.isArray(settings.heroSlides) ? settings.heroSlides : []).filter(s => s.id !== id)
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-12 h-12 border-4 border-zinc-900 border-t-red-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex gap-12 min-h-[800px]">
      {/* Navigation Sidebar */}
      <aside className="w-64 space-y-2 sticky top-24 h-fit">
        <div className="mb-8 px-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 leading-none mb-2">Website</h2>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Configuration Engine</p>
        </div>

        <TabButton 
          active={activeTab === 'general'} 
          onClick={() => setActiveTab('general')} 
          icon={<Globe size={18} />} 
          label="General Settings" 
        />
        <TabButton 
          active={activeTab === 'hero'} 
          onClick={() => setActiveTab('hero')} 
          icon={<Monitor size={18} />} 
          label="Hero & Slider" 
        />
        <TabButton 
          active={activeTab === 'homepage'} 
          onClick={() => setActiveTab('homepage')} 
          icon={<Layout size={18} />} 
          label="Landing Page" 
        />
        <TabButton 
          active={activeTab === 'social'} 
          onClick={() => setActiveTab('social')} 
          icon={<LinkIcon size={18} />} 
          label="Social & Links" 
        />
        <TabButton 
          active={activeTab === 'footer'} 
          onClick={() => setActiveTab('footer')} 
          icon={<Settings size={18} />} 
          label="Footer & Legal" 
        />

        <div className="pt-8 px-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save size={16} /> Save Config</>}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 space-y-12">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div 
              key="general"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <SectionHeader 
                icon={<Globe className="text-zinc-900" />} 
                title="Global Branding" 
                subtitle="Primary identity and announcement system" 
              />

              <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Website Logo</label>
                    <div className="relative group aspect-square max-w-[200px] bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl flex items-center justify-center overflow-hidden transition-all hover:border-zinc-900">
                      {(pendingLogo || settings.logoUrl) ? (
                        <img 
                          src={pendingLogo ? URL.createObjectURL(pendingLogo) : settings.logoUrl} 
                          alt="Logo" 
                          className="w-full h-full object-contain p-6" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-300">
                          <ImageIcon size={32} />
                          <span className="text-xs font-bold uppercase tracking-widest">No Logo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="p-3 bg-white text-zinc-900 rounded-xl cursor-pointer hover:scale-110 transition-transform">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={e => setPendingLogo(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Announcement Bar</label>
                      <input 
                        type="text" 
                        value={settings.announcement || ''}
                        onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        placeholder="e.g. SUMMER SALE: UP TO 30% OFF!"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Banner CTA Link</label>
                      <input 
                        type="text" 
                        value={settings.announcementLink || ''}
                        onChange={e => setSettings({ ...settings, announcementLink: e.target.value })}
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                        placeholder="/shop/summer-collection"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSettings({ ...settings, showAnnouncement: !settings.showAnnouncement })}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.showAnnouncement ? 'bg-red-600' : 'bg-zinc-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.showAnnouncement ? 'left-7' : 'left-1'}`} />
                      </button>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">Display globally</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'hero' && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-8">
                <SectionHeader 
                  icon={<Monitor className="text-zinc-900" />} 
                  title="Hero Slideshow" 
                  subtitle="Dynamic primary visuals and CTAs" 
                />
                
                <button 
                  onClick={addHeroSlide}
                  className="flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/20"
                >
                  <Plus size={16} /> Add Slide
                </button>
              </div>

              {/* Hero Feature Media Section - Dedicated Card */}
              <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 flex items-center gap-3">
                    <Zap size={20} className="text-red-600" />
                    Hero Feature Media (Right Graphic)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Media Type</label>
                      <select 
                        value={settings.heroFeatureMediaType || 'image'}
                        onChange={e => setSettings({ ...settings, heroFeatureMediaType: e.target.value as 'image' | 'video' })}
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    {settings.heroFeatureMediaType === 'image' ? (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Feature Image</label>
                        <div className="relative group aspect-square w-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl overflow-hidden transition-all hover:border-zinc-900 mx-auto">
                          {(pendingHeroFeatureImage || settings.heroFeatureImage) ? (
                            <img 
                              src={pendingHeroFeatureImage ? URL.createObjectURL(pendingHeroFeatureImage) : settings.heroFeatureImage} 
                              alt="Hero Feature" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-300">
                              <ImageIcon size={32} />
                              <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="p-3 bg-white text-zinc-900 rounded-xl cursor-pointer hover:scale-110 transition-transform">
                              <Upload size={20} />
                              <input type="file" className="hidden" accept="image/*" onChange={e => setPendingHeroFeatureImage(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Feature Video</label>
                        <div className="relative group aspect-square w-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl overflow-hidden transition-all hover:border-zinc-900 mx-auto">
                          {(pendingHeroFeatureVideo || settings.heroFeatureVideo) ? (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                              <Video size={32} className="text-white" />
                              <span className="absolute bottom-4 text-[8px] text-white font-bold uppercase tracking-widest">Video Selected</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-300">
                              <Video size={32} />
                              <span className="text-xs font-bold uppercase tracking-widest">No Video</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="p-3 bg-white text-zinc-900 rounded-xl cursor-pointer hover:scale-110 transition-transform">
                              <Upload size={20} />
                              <input type="file" className="hidden" accept="video/*" onChange={e => setPendingHeroFeatureVideo(e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-50 rounded-[32px] p-8 flex flex-col justify-center border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                      <Zap size={120} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 mb-4 flex items-center gap-2">
                      <Info size={14} className="text-red-600" />
                      Visual Instructions
                    </h4>
                    <div className="space-y-4">
                      <p className="text-[11px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wide">
                        This media appears in the decorative block on the right side of the main hero section.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Image: Transparent PNG/WebP (Best)
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Video: Short looping MP4 (Muted)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {(Array.isArray(settings.heroSlides) ? settings.heroSlides : []).map((slide, index) => (
                  <HeroSlideEditor 
                    key={slide.id}
                    slide={slide}
                    index={index}
                    onUpdate={(updates) => updateHeroSlide(slide.id, updates)}
                    onDelete={() => deleteHeroSlide(slide.id)}
                    onUploadMedia={async (file) => {
                      const isVideo = slide.mediaType === 'video';
                      const currentUrl = isVideo ? slide.videoUrl : slide.image;
                      const url = await handleFileUpload(file, 'hero-banners', currentUrl);
                      if (isVideo) {
                        updateHeroSlide(slide.id, { videoUrl: url });
                      } else {
                        updateHeroSlide(slide.id, { image: url });
                      }
                    }}
                    onRemoveMedia={async () => {
                      const isVideo = slide.mediaType === 'video';
                      const currentUrl = isVideo ? slide.videoUrl : slide.image;
                      if (currentUrl) await handleFileDelete(currentUrl);
                      if (isVideo) {
                        updateHeroSlide(slide.id, { videoUrl: '' });
                      } else {
                        updateHeroSlide(slide.id, { image: '' });
                      }
                    }}
                  />
                ))}

                {(Array.isArray(settings.heroSlides) ? settings.heroSlides : []).length === 0 && (
                  <div className="p-20 text-center bg-white border border-zinc-200 border-dashed rounded-[32px]">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Monitor size={32} className="text-zinc-200" />
                    </div>
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No slides configured. Default static hero will be used.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'homepage' && (
            <motion.div 
              key="homepage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <SectionHeader 
                icon={<Layout className="text-zinc-900" />} 
                title="Landing Page CMS" 
                subtitle="Manage various homepage sections and content" 
              />

              {/* About Us Section */}
              <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 flex items-center gap-3">
                    <Info size={20} className="text-zinc-400" />
                    About Us Section
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Section Title</label>
                      <input 
                        type="text" 
                        value={settings.aboutUsTitle || ''}
                        onChange={e => setSettings({ ...settings, aboutUsTitle: e.target.value })}
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Paragraph Content</label>
                      <textarea 
                        rows={6}
                        value={settings.aboutUsText || ''}
                        onChange={e => setSettings({ ...settings, aboutUsText: e.target.value })}
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Learn More Link</label>
                      <input 
                        type="text" 
                        value={settings.aboutUsLink || ''}
                        onChange={e => setSettings({ ...settings, aboutUsLink: e.target.value })}
                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Section Image</label>
                    <div className="relative group aspect-video bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl overflow-hidden transition-all hover:border-zinc-900">
                      {(pendingAboutImage || settings.aboutUsImage) ? (
                        <img 
                          src={pendingAboutImage ? URL.createObjectURL(pendingAboutImage) : settings.aboutUsImage} 
                          alt="About" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-300">
                          <ImageIcon size={32} />
                          <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="p-3 bg-white text-zinc-900 rounded-xl cursor-pointer hover:scale-110 transition-transform">
                          <Upload size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={e => setPendingAboutImage(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center mt-2">Recommended: 1920x1080px WebP</p>
                  </div>
                </div>
              </div>

              {/* Promo Banner Editor */}
              <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 flex items-center gap-3">
                    <Tag size={20} className="text-zinc-400" />
                    Floating Promo Banner
                  </h3>
                  <button 
                    onClick={() => {
                      const newBanner: PromoBanner = {
                        id: `banner-${Date.now()}`,
                        image: 'https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=800',
                        title: 'New Promo',
                        subtitle: 'Limited time offer description',
                        ctaText: 'Claim Offer',
                        ctaLink: '/shop',
                        bgColor: '#dc2626',
                        active: true
                      };
                      setSettings({ ...settings, promoBanners: [...(Array.isArray(settings.promoBanners) ? settings.promoBanners : []), newBanner] });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                  >
                    <Plus size={16} /> Add Banner
                  </button>
                </div>

                <div className="space-y-6">
                  {(Array.isArray(settings.promoBanners) ? settings.promoBanners : []).map((banner, index) => (
                    <PromoBannerEditor 
                      key={banner.id}
                      banner={banner}
                      index={index}
                      onUpdate={(updates) => {
                        setSettings({
                          ...settings,
                          promoBanners: (Array.isArray(settings.promoBanners) ? settings.promoBanners : []).map(b => b.id === banner.id ? { ...b, ...updates } : b)
                        });
                      }}
                      onDelete={async () => {
                        if (banner.image) await handleFileDelete(banner.image);
                        if (banner.videoUrl) await handleFileDelete(banner.videoUrl);
                        setSettings({
                          ...settings,
                          promoBanners: (Array.isArray(settings.promoBanners) ? settings.promoBanners : []).filter(b => b.id !== banner.id)
                        });
                      }}
                      onUploadMedia={async (file) => {
                        const isVideo = banner.mediaType === 'video';
                        const currentUrl = isVideo ? banner.videoUrl : banner.image;
                        const url = await handleFileUpload(file, 'banners', currentUrl);
                        setSettings({
                          ...settings,
                          promoBanners: (Array.isArray(settings.promoBanners) ? settings.promoBanners : []).map(b => b.id === banner.id ? { ...b, [isVideo ? 'videoUrl' : 'image']: url } : b)
                        });
                      }}
                      onRemoveMedia={async () => {
                        const isVideo = banner.mediaType === 'video';
                        const currentUrl = isVideo ? banner.videoUrl : banner.image;
                        if (currentUrl) await handleFileDelete(currentUrl);
                        setSettings({
                          ...settings,
                          promoBanners: (Array.isArray(settings.promoBanners) ? settings.promoBanners : []).map(b => b.id === banner.id ? { ...b, [isVideo ? 'videoUrl' : 'image']: '' } : b)
                        });
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Featured Categories Editor */}
              <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-zinc-900 flex items-center gap-3">
                    <Layout size={20} className="text-zinc-400" />
                    Featured Categories
                  </h3>
                  <button 
                    onClick={() => {
                      const newCat: FeaturedCategory = {
                        id: `fc-${Date.now()}`,
                        categoryId: 'weapons',
                        active: true
                      };
                      setSettings({ ...settings, featuredCategoriesList: [...(Array.isArray(settings.featuredCategoriesList) ? settings.featuredCategoriesList : []), newCat] });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(Array.isArray(settings.featuredCategoriesList) ? settings.featuredCategoriesList : []).map((fc, index) => (
                    <FeaturedCategoryEditor 
                      key={fc.id}
                      fc={fc}
                      index={index}
                      onUpdate={(updates) => {
                        setSettings({
                          ...settings,
                          featuredCategoriesList: (Array.isArray(settings.featuredCategoriesList) ? settings.featuredCategoriesList : []).map(item => item.id === fc.id ? { ...item, ...updates } : item)
                        });
                      }}
                      onDelete={() => {
                        setSettings({
                          ...settings,
                          featuredCategoriesList: (Array.isArray(settings.featuredCategoriesList) ? settings.featuredCategoriesList : []).filter(item => item.id !== fc.id)
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'social' && (
            <motion.div 
              key="social"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <SectionHeader 
                icon={<LinkIcon className="text-zinc-900" />} 
                title="Social & Contact" 
                subtitle="Manage how users reach you" 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-4">Direct Contact</h3>
                  <SocialInput 
                    icon={<Mail size={18} />} 
                    label="Business Email" 
                    value={settings.contactEmail} 
                    onChange={v => setSettings({...settings, contactEmail: v})} 
                  />
                  <SocialInput 
                    icon={<Phone size={18} />} 
                    label="Phone Support" 
                    value={settings.contactPhone} 
                    onChange={v => setSettings({...settings, contactPhone: v})} 
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Headquarters Address</label>
                    <textarea 
                      rows={3}
                      value={settings.address || ''}
                      onChange={e => setSettings({...settings, address: e.target.value})}
                      className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-zinc-900 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-100 pb-4">Social Media Presence</h3>
                  <SocialInput 
                    icon={<Facebook size={18} className="text-blue-600" />} 
                    label="Facebook Page" 
                    value={settings.facebookUrl} 
                    onChange={v => setSettings({...settings, facebookUrl: v})} 
                  />
                  <SocialInput 
                    icon={<Instagram size={18} className="text-pink-600" />} 
                    label="Instagram Profile" 
                    value={settings.instagramUrl} 
                    onChange={v => setSettings({...settings, instagramUrl: v})} 
                  />
                  <SocialInput 
                    icon={<Youtube size={18} className="text-red-600" />} 
                    label="YouTube Channel" 
                    value={settings.youtubeUrl} 
                    onChange={v => setSettings({...settings, youtubeUrl: v})} 
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'footer' && (
            <motion.div 
              key="footer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <SectionHeader 
                icon={<Settings className="text-zinc-900" />} 
                title="Footer & Global Content" 
                subtitle="Legal text and SEO information" 
              />

              <div className="bg-white border border-zinc-200 rounded-[32px] p-8 shadow-sm space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Footer Description</label>
                  <textarea 
                    rows={4}
                    value={settings.footerDescription || ''}
                    onChange={e => setSettings({ ...settings, footerDescription: e.target.value })}
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none"
                    placeholder="Short description of your store shown in footer"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">SEO / Footer Tags (Comma separated)</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text" 
                      value={(Array.isArray(settings.footerTags) ? settings.footerTags : []).join(', ')}
                      onChange={e => setSettings({ ...settings, footerTags: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full pl-14 pr-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none"
                      placeholder="airsoft, tactical gear, custom builds, CROATIA..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4">
                <AlertCircle className="text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-amber-900 font-bold text-sm tracking-tight">Legal Compliance Reminder</p>
                  <p className="text-amber-700/80 text-xs font-medium leading-relaxed">
                    Ensure all your policy pages (Privacy, Terms, Shipping) are updated in the <b className="text-amber-900">Policies</b> tab. Links to these pages are automatically generated in the footer based on your policy database.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Upload Progress Modal */}
      {saving && uploadProgress > 0 && (
        <div className="fixed inset-0 z-[200] bg-zinc-900/80 backdrop-blur-xl flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center">
                <Upload size={32} className="text-red-600 animate-bounce" />
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">Syncing with Blob</h3>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Optimizing assets for speed</p>
            </div>
            <div className="space-y-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <motion.div 
                  className="h-full bg-red-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span>{Math.round(uploadProgress)}% COMPLETED</span>
                <span>STATUS: ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${
      active ? 'bg-white text-zinc-900 shadow-md border border-zinc-200' : 'text-zinc-400 hover:text-zinc-600'
    }`}
  >
    <span className={active ? 'text-zinc-900' : 'text-zinc-400'}>{icon}</span>
    {label}
  </button>
);

const SectionHeader = ({ icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
  <div className="flex items-center gap-5">
    <div className="w-14 h-14 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center shadow-sm">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
    <div>
      <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 leading-none">{title}</h2>
      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1.5">{subtitle}</p>
    </div>
  </div>
);

const SocialInput = ({ icon, label, value, onChange }: { icon: any, label: string, value?: string, onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors">
        {icon}
      </div>
      <input 
        type="text" 
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-sm"
        placeholder="https://..."
      />
    </div>
  </div>
);

const HeroSlideEditor = ({ slide, index, onUpdate, onDelete, onUploadMedia, onRemoveMedia }: { 
  slide: HeroSlide, 
  index: number, 
  onUpdate: (updates: Partial<HeroSlide>) => void, 
  onDelete: () => void,
  onUploadMedia: (file: File) => void,
  onRemoveMedia: () => void
}) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);

  return (
    <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div 
        className="p-6 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
            {slide.mediaType === 'video' && slide.videoUrl ? (
              <Video size={20} className="text-zinc-400" />
            ) : (
              <img src={slide.image} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h4 className="font-black uppercase tracking-tighter text-zinc-900">Slide #{index + 1}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{slide.title || 'Untitled Slide'}</span>
              <div className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span className={`text-[8px] font-black uppercase tracking-widest ${slide.active ? 'text-emerald-500' : 'text-red-500'}`}>
                {slide.active ? 'Active' : 'Draft'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={18} />
          </button>
          <div className={`p-2 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-zinc-100"
          >
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Slide Heading</label>
                  <input 
                    type="text" 
                    value={slide.title}
                    onChange={e => onUpdate({ title: e.target.value })}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sub-heading / Description</label>
                  <textarea 
                    rows={3}
                    value={slide.subtitle}
                    onChange={e => onUpdate({ subtitle: e.target.value })}
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Button Text</label>
                    <input 
                      type="text" 
                      value={slide.ctaText}
                      onChange={e => onUpdate({ ctaText: e.target.value })}
                      className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Target Link</label>
                    <input 
                      type="text" 
                      value={slide.ctaLink}
                      onChange={e => onUpdate({ ctaLink: e.target.value })}
                      className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onUpdate({ active: !slide.active })}
                    className={`w-10 h-5 rounded-full transition-all relative ${slide.active ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${slide.active ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Enable Slide</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={() => onUpdate({ mediaType: 'image' })}
                    className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${slide.mediaType !== 'video' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'}`}
                  >
                    Image
                  </button>
                  <button 
                    onClick={() => onUpdate({ mediaType: 'video' })}
                    className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${slide.mediaType === 'video' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'}`}
                  >
                    Video
                  </button>
                </div>

                <div className="relative group aspect-video rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  {slide.mediaType === 'video' && slide.videoUrl ? (
                    <video 
                      src={slide.videoUrl} 
                      className="w-full h-full object-cover"
                      muted 
                      loop 
                      autoPlay 
                      playsInline
                    />
                  ) : (
                    <img src={slide.image} alt="" className="w-full h-full object-cover" />
                  )}
                  
                  <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                    <div className="flex gap-4">
                      <label className="flex flex-col items-center gap-2 cursor-pointer bg-white px-6 py-3 rounded-2xl text-zinc-900 font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                        <Upload size={18} />
                        {slide.mediaType === 'video' ? 'Upload Video' : 'Upload Image'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept={slide.mediaType === 'video' ? 'video/*' : 'image/*'} 
                          onChangeCapture={async e => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) onUploadMedia(file);
                          }} 
                        />
                      </label>
                      {(slide.mediaType === 'video' ? slide.videoUrl : slide.image) && (
                        <button 
                          onClick={onRemoveMedia}
                          className="flex flex-col items-center gap-2 bg-red-600 px-6 py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          <Trash2 size={18} />
                          Remove
                        </button>
                      )}
                    </div>
                    {slide.mediaType === 'video' && (
                       <span className="text-[10px] text-white/60 font-medium">MP4/WebM recommended</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium text-center italic">Stored in Vercel Blob /site/hero-banners/</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FeaturedCategoryEditor = ({ fc, index, onUpdate, onDelete }: {
  fc: FeaturedCategory,
  index: number,
  onUpdate: (updates: Partial<FeaturedCategory>) => void,
  onDelete: () => void
}) => {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 space-y-6 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Category Slot #{index + 1}</h4>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onUpdate({ active: !fc.active })}
            className={`w-10 h-5 rounded-full transition-all relative ${fc.active ? 'bg-emerald-500' : 'bg-zinc-200'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${fc.active ? 'left-6' : 'left-1'}`} />
          </button>
          <button onClick={onDelete} className="p-2 text-zinc-300 hover:text-red-600 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">System Category ID</label>
          <select 
            value={fc.categoryId}
            onChange={e => onUpdate({ categoryId: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs font-bold"
          >
            <option value="weapons">Weapons</option>
            <option value="attachments">Attachments</option>
            <option value="gear">Tactical Gear</option>
            <option value="internal_parts">Internal Parts</option>
            <option value="apparel">Apparel</option>
            <option value="consumables">Consumables</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Display Name Overlay</label>
          <input 
            type="text" 
            value={fc.customName || ''}
            onChange={e => onUpdate({ customName: e.target.value })}
            placeholder="e.g. PREMIUM OPTICS"
            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Section Status</label>
          <div className="flex items-center gap-2 p-3 bg-white border border-zinc-200 rounded-xl">
             <div className={`w-2 h-2 rounded-full ${fc.active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
               {fc.active ? 'Active on Landing' : 'Hidden from Landing'}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PromoBannerEditor = ({ banner, index, onUpdate, onDelete, onUploadMedia, onRemoveMedia }: {
  banner: PromoBanner,
  index: number,
  onUpdate: (updates: Partial<PromoBanner>) => void,
  onDelete: () => void,
  onUploadMedia: (file: File) => void,
  onRemoveMedia: () => void
}) => {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 relative">
       <div className="flex items-center justify-between mb-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Promotion #{index + 1}</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onUpdate({ active: !banner.active })}
                className={`w-10 h-5 rounded-full transition-all relative ${banner.active ? 'bg-emerald-500' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${banner.active ? 'left-6' : 'left-1'}`} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Enable</span>
            </div>
            <button onClick={onDelete} className="p-2 text-zinc-300 hover:text-red-600 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Heading</label>
                <input 
                  type="text" 
                  value={banner.title}
                  onChange={e => onUpdate({ title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sub-heading</label>
                <input 
                  type="text" 
                  value={banner.subtitle}
                  onChange={e => onUpdate({ subtitle: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Button Text</label>
                <input 
                  type="text" 
                  value={banner.ctaText}
                  onChange={e => onUpdate({ ctaText: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Target Link</label>
                <input 
                  type="text" 
                  value={banner.ctaLink}
                  onChange={e => onUpdate({ ctaLink: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Accent Color</label>
              <div className="flex gap-4">
                <input 
                  type="color" 
                  value={banner.bgColor}
                  onChange={e => onUpdate({ bgColor: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                />
                <input 
                  type="text" 
                  value={banner.bgColor}
                  onChange={e => onUpdate({ bgColor: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Banner Visual</label>
              
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => onUpdate({ mediaType: 'image' })}
                  className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${banner.mediaType !== 'video' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'}`}
                >
                  Image
                </button>
                <button 
                  onClick={() => onUpdate({ mediaType: 'video' })}
                  className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${banner.mediaType === 'video' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'}`}
                >
                  Video
                </button>
              </div>

              <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-200 bg-white group">
                {banner.mediaType === 'video' && banner.videoUrl ? (
                  <video 
                    src={banner.videoUrl} 
                    className="w-full h-full object-cover"
                    muted 
                    loop 
                    autoPlay 
                    playsInline
                  />
                ) : (
                  <img src={banner.image} className="w-full h-full object-cover" alt="" />
                )}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/60 backdrop-blur-sm">
                  <div className="flex gap-4">
                    <label className="flex flex-col items-center gap-3 bg-white px-6 py-3 rounded-2xl text-zinc-900 font-bold text-xs uppercase tracking-widest cursor-pointer hover:scale-105 transition-transform">
                      <Upload size={18} />
                      {banner.mediaType === 'video' ? 'Upload Video' : 'Sync with Blob'}
                      <input type="file" className="hidden" accept={banner.mediaType === 'video' ? 'video/*' : 'image/*'} onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onUploadMedia(file);
                      }} />
                    </label>
                    {(banner.mediaType === 'video' ? banner.videoUrl : banner.image) && (
                      <button 
                        onClick={onRemoveMedia}
                        className="flex flex-col items-center gap-3 bg-red-600 px-6 py-3 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        <Trash2 size={18} />
                        Remove
                      </button>
                    )}
                  </div>
                  {banner.mediaType === 'video' && (
                    <span className="text-[10px] text-white/60 font-medium">MP4/WebM recommended</span>
                  )}
                </div>
              </div>
          </div>
       </div>
    </div>
  );
};
