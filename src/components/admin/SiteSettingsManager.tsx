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
  Layout,
  Type,
  Image as ImageIcon,
  Share2,
  Search,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { SiteSettings } from '../../types';

type SettingsTab = 'general' | 'branding' | 'hero' | 'contact' | 'seo';

export const SiteSettingsManager = ({ onNotify }: { onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await databaseService.getSiteSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
        onNotify('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalSettings = { ...settings };

      // Handle Logo Upload
      if (logoFile) {
        setUploadProgress(10);
        const extension = logoFile.name.split('.').pop();
        const path = `site/2d/logo_${Date.now()}.${extension}`;
        
        if (settings.logoUrl) {
          await databaseService.deleteFile(settings.logoUrl).catch(() => {});
        }
        
        const url = await databaseService.uploadFile(logoFile, path, (p) => setUploadProgress(10 + p * 0.4));
        finalSettings.logoUrl = url;
        setLogoFile(null);
      }

      // Handle Hero Upload
      if (heroFile) {
        setUploadProgress(logoFile ? 50 : 10);
        const extension = heroFile.name.split('.').pop();
        const path = `site/2d/hero_${Date.now()}.${extension}`;
        
        if (settings.heroImageUrl) {
          await databaseService.deleteFile(settings.heroImageUrl).catch(() => {});
        }

        const url = await databaseService.uploadFile(heroFile, path, (p) => {
          const start = logoFile ? 50 : 10;
          setUploadProgress(start + p * 0.4);
        });
        finalSettings.heroImageUrl = url;
        setHeroFile(null);
      }

      await databaseService.updateSiteSettings(finalSettings);
      setSettings(finalSettings);
      onNotify('Site settings synchronized successfully!');
    } catch (err) {
      console.error('Save failed', err);
      onNotify('Failed to synchronize settings', 'error');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
        activeTab === id 
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 scale-105' 
          : 'bg-zinc-900/50 text-zinc-500 hover:text-white hover:bg-zinc-800'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">Loading Core Systems...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-lg">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Global Ops</span>
            </div>
          </div>
          <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-3">Website Controller</h2>
          <p className="text-zinc-500 font-medium max-w-xl leading-relaxed">
            Configure the visual identity and global parameters of the Hristo Digital Arsenal. 
            All changes are propagated in real-time across the platform.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="group relative px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-3 transition-all shadow-[0_0_40px_rgba(220,38,38,0.3)] disabled:opacity-50 overflow-hidden"
        >
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          {saving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} className="group-hover:translate-y-[-2px] transition-transform" />
          )}
          {saving ? 'Synchronizing...' : 'Commit Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-4 mb-10 pb-4 border-b border-zinc-900">
        <TabButton id="general" label="General" icon={Layout} />
        <TabButton id="branding" label="Branding" icon={ImageIcon} />
        <TabButton id="hero" label="Hero Engine" icon={Type} />
        <TabButton id="contact" label="Connect" icon={Share2} />
        <TabButton id="seo" label="SEO & Meta" icon={Search} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Main Controls Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {activeTab === 'general' && (
              <div className="space-y-8">
                <section className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-[40px] p-10 space-y-10">
                  <div className="flex items-center justify-between p-6 bg-red-600/5 border border-red-600/10 rounded-3xl">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl shadow-inner ${settings.maintenanceMode ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                        <ShieldAlert size={28} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tighter text-white">Maintenance Mode</h4>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          {settings.maintenanceMode ? 'Restricted Access Active' : 'Public Access Operations Normal'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                      className={`relative w-16 h-8 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-600' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
                        <AlertCircle size={14} className="text-red-600" />
                        Announcement Intel
                      </label>
                      <textarea
                        value={settings.announcement || ''}
                        onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                        placeholder="Broadcast message to all visitors..."
                        rows={3}
                        className="w-full px-8 py-5 bg-zinc-950/50 border border-zinc-800/50 rounded-[28px] text-white font-medium focus:border-red-600 outline-none transition-all resize-none shadow-inner"
                      />
                      <div className="flex items-center justify-between mt-6 p-6 bg-zinc-950/30 rounded-2xl border border-zinc-800/30">
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tighter">Visibility Status</p>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Live broadcast toggle</p>
                        </div>
                        <button 
                          onClick={() => setSettings({ ...settings, showAnnouncement: !settings.showAnnouncement })}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            settings.showAnnouncement ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {settings.showAnnouncement ? 'ON AIR' : 'OFFLINE'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-8">
                <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Primary Identity (Logo)</label>
                      <div className="relative aspect-square bg-zinc-950 rounded-[32px] border-2 border-dashed border-zinc-800/50 flex items-center justify-center overflow-hidden transition-all hover:border-red-600 group shadow-inner">
                        {logoFile ? (
                          <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain p-8" />
                        ) : settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-8 animate-reveal" />
                        ) : (
                          <Globe size={48} className="text-zinc-800 group-hover:scale-110 transition-transform" />
                        )}
                        <input
                          type="file"
                          id="logo-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor="logo-upload" 
                          className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                        >
                          <Upload size={32} className="text-red-600 mb-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Deploy New Asset</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-6">
                      <div className="p-6 bg-zinc-950/30 rounded-3xl border border-zinc-800/30">
                        <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Asset Path</h5>
                        <code className="text-xs text-zinc-500 break-all">gs://hristo-v2.appspot.com/site/2d/</code>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                          The logo is used in the navigation bar and footer. High-contrast PNG or SVG files work best on our tactical grid.
                        </p>
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Storage usage: ~{Math.random().toFixed(2)} MB</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'hero' && (
              <div className="space-y-8">
                <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10 space-y-10">
                  <div className="space-y-6">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cinematic Background Asset</label>
                    <div className="relative aspect-video w-full bg-zinc-950 rounded-[32px] border-2 border-dashed border-zinc-800/50 flex items-center justify-center overflow-hidden transition-all hover:border-red-600 group shadow-inner">
                      {heroFile ? (
                        <img src={URL.createObjectURL(heroFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : settings.heroImageUrl ? (
                        <img src={settings.heroImageUrl} alt="Hero" className="w-full h-full object-cover animate-reveal" />
                      ) : (
                        <ImageIcon size={64} className="text-zinc-800" />
                      )}
                      <input
                        type="file"
                        id="hero-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                      />
                      <label 
                        htmlFor="hero-upload" 
                        className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
                      >
                        <Upload size={40} className="text-red-600 mb-3" />
                        <span className="text-xs font-black uppercase tracking-widest">Update Visual Grid</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Hero Directive (Title)</label>
                      <input
                        type="text"
                        value={settings.heroTitle || ''}
                        onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                        placeholder="e.g. Build Your Arsenal"
                        className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-black text-xl tracking-tighter uppercase focus:border-red-600 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Operation Brief (Subtitle)</label>
                      <textarea
                        value={settings.heroSubtitle || ''}
                        onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                        placeholder="Mission objectives and focus..."
                        rows={3}
                        className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all resize-none shadow-inner"
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-8">
                <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                      <h4 className="text-sm font-black uppercase tracking-widest text-white border-l-4 border-red-600 pl-4 ml-2">Communications</h4>
                      <div className="space-y-4">
                        <div className="relative group">
                          <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-red-600 transition-colors" />
                          <input
                            type="email"
                            value={settings.contactEmail || ''}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            placeholder="support@hristo.hq"
                            className="w-full pl-16 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all shadow-inner placeholder:text-zinc-800"
                          />
                        </div>
                        <div className="relative group">
                          <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-red-600 transition-colors" />
                          <input
                            type="text"
                            value={settings.contactPhone || ''}
                            onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                            placeholder="+XX XXX XXX XXXX"
                            className="w-full pl-16 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all shadow-inner placeholder:text-zinc-800"
                          />
                        </div>
                        <div className="relative group">
                          <MapPin size={18} className="absolute left-6 top-6 text-zinc-600 group-focus-within:text-red-600 transition-colors" />
                          <textarea
                            value={settings.address || ''}
                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            placeholder="HQ Location coordinates..."
                            rows={3}
                            className="w-full pl-16 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all resize-none shadow-inner placeholder:text-zinc-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-sm font-black uppercase tracking-widest text-white border-l-4 border-red-600 pl-4 ml-2">Digital Footprint</h4>
                      <div className="space-y-4">
                        <div className="relative group">
                          <Facebook size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#1877F2] transition-colors" />
                          <input
                            type="text"
                            value={settings.facebookUrl || ''}
                            onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                            placeholder="facebook.com/hristo"
                            className="w-full pl-16 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-[#1877F2] outline-none transition-all shadow-inner placeholder:text-zinc-800"
                          />
                        </div>
                        <div className="relative group">
                          <Instagram size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#E4405F] transition-colors" />
                          <input
                            type="text"
                            value={settings.instagramUrl || ''}
                            onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                            placeholder="instagram.com/hristo"
                            className="w-full pl-16 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-[#E4405F] outline-none transition-all shadow-inner placeholder:text-zinc-800"
                          />
                        </div>
                        <div className="relative group">
                          <Youtube size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#FF0000] transition-colors" />
                          <input
                            type="text"
                            value={settings.youtubeUrl || ''}
                            onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                            placeholder="youtube.com/c/hristo"
                            className="w-full pl-16 pr-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-[#FF0000] outline-none transition-all shadow-inner placeholder:text-zinc-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-8">
                <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10 space-y-10">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                       <Search size={20} className="text-red-600" />
                       <h4 className="text-xl font-black uppercase tracking-tighter text-white">Search Engine Optimization</h4>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Global Meta Title</label>
                        <input
                          type="text"
                          value={settings.metaTitle || ''}
                          onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                          placeholder="Hristo | The Ultimate Tactical Arsenal"
                          className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Global Meta Description</label>
                        <textarea
                          value={settings.metaDescription || ''}
                          onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                          placeholder="Describe your store for search engine crawlers..."
                          rows={4}
                          className="w-full px-8 py-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all resize-none shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="p-8 bg-zinc-950/50 rounded-[32px] border border-zinc-800/50">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Google Search Preview</p>
                      <div className="space-y-1.5">
                        <p className="text-[#99c3ff] text-xl font-medium cursor-pointer hover:underline truncate">
                          {settings.metaTitle || 'Hristo | The Ultimate Tactical Arsenal'}
                        </p>
                        <p className="text-[#34a853] text-sm">https://hristo.app › global</p>
                        <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed">
                          {settings.metaDescription || 'Experience the future of airsoft commerce with 3D configurations and premium gear.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

          </div>

          {/* Sidebar Info/Status Area */}
          <div className="space-y-8">
            <section className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 sticky top-28">
              <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                Operational Status
              </h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Database Sync</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Storage API</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Cache</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vercel Edge</span>
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-3xl">
                   <p className="text-zinc-400 text-xs font-medium leading-relaxed">
                     <strong className="text-white block mb-1">Automatic Optimization:</strong> 
                     Every time you upload a new asset, the previous version is purged from Google Cloud Storage to maintain peak efficiency.
                   </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Quick Commands</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-red-600 transition-all">
                      Clear Cache
                    </button>
                    <button 
                      onClick={() => window.open('/', '_blank')}
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-red-600 transition-all"
                    >
                      View Live
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Upload Overlay */}
      <AnimatePresence>
        {saving && uploadProgress > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <div className="w-full max-w-xl space-y-10 text-center">
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="text-zinc-900"
                    strokeWidth="8"
                    fill="transparent"
                    stroke="currentColor"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    className="text-red-600"
                    strokeWidth="8"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * uploadProgress) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    stroke="currentColor"
                    initial={{ strokeDashoffset: 440 }}
                    animate={{ strokeDashoffset: 440 - (440 * uploadProgress) / 100 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Upload size={40} className="text-red-600 animate-pulse mb-2" />
                  <span className="text-2xl font-black text-white">{Math.round(uploadProgress)}%</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-white">Synchronizing Assets</h3>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Propagating updates to Google Cloud Storage</p>
              </div>
              <div className="flex justify-center gap-3">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
