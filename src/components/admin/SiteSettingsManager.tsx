import React, { useState, useEffect } from 'react';
import { Upload, Save, Link as LinkIcon, Mail, Phone, MapPin, Globe, Facebook, Instagram, Youtube, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { databaseService } from '../../services/databaseService';
import { SiteSettings } from '../../types';

export const SiteSettingsManager = ({ onNotify }: { onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
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

      if (logoFile) {
        const extension = logoFile.name.split('.').pop();
        const path = `site/2d/logo_${Date.now()}.${extension}`;
        
        // Delete old logo if it exists
        if (settings.logoUrl) {
          await databaseService.deleteFile(settings.logoUrl);
        }
        
        const url = await databaseService.uploadFile(logoFile, path, (p) => setUploadProgress(p));
        finalSettings.logoUrl = url;
        setLogoFile(null);
      }

      if (heroFile) {
        setUploadProgress(0);
        const extension = heroFile.name.split('.').pop();
        const path = `site/2d/hero_${Date.now()}.${extension}`;
        
        // Delete old hero if it exists
        if (settings.heroImageUrl) {
          await databaseService.deleteFile(settings.heroImageUrl);
        }

        const url = await databaseService.uploadFile(heroFile, path, (p) => setUploadProgress(p));
        finalSettings.heroImageUrl = url;
        setHeroFile(null);
      }

      await databaseService.updateSiteSettings(finalSettings);
      setSettings(finalSettings);
      onNotify('Site settings updated successfully!');
    } catch (err) {
      console.error('Save failed', err);
      onNotify('Failed to update settings', 'error');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Website Configuration</h2>
          <p className="text-zinc-500 font-medium">Manage global website assets and information stored in Google Storage.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-3 transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Branding Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/10 rounded-2xl">
              <Globe size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Branding</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Website Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden relative group">
                  {logoFile ? (
                    <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain p-2" />
                  ) : settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Upload size={24} className="text-zinc-700" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer p-3 bg-white rounded-xl text-black">
                      <Upload size={20} />
                    </label>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    Upload your site logo. This file will be stored in <code className="text-red-500 text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded">site/2d/</code> in Google Storage.
                  </p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Recommended: PNG or SVG (Max 2MB)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Announcement Banner</label>
              <input
                type="text"
                value={settings.announcement || ''}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                placeholder="e.g. Free shipping on orders over €500!"
                className="w-full px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
              <div className="flex items-center mt-3 gap-2">
                <input
                  type="checkbox"
                  id="show-announcement"
                  checked={settings.showAnnouncement || false}
                  onChange={(e) => setSettings({ ...settings, showAnnouncement: e.target.checked })}
                  className="w-4 h-4 bg-zinc-950 border-zinc-800 rounded text-red-600"
                />
                <label htmlFor="show-announcement" className="text-xs font-bold text-zinc-500 uppercase tracking-widest cursor-pointer">Show banner on homepage</label>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/10 rounded-2xl">
              <Upload size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Main Hero Asset</h3>
          </div>

          <div className="space-y-6">
            <div className="aspect-video w-full bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden relative group">
              {heroFile ? (
                <img src={URL.createObjectURL(heroFile)} alt="Preview" className="w-full h-full object-cover" />
              ) : settings.heroImageUrl ? (
                <img src={settings.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
              ) : (
                <Upload size={32} className="text-zinc-700" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <input
                  type="file"
                  id="hero-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="hero-upload" className="cursor-pointer p-3 bg-white rounded-xl text-black">
                  <Upload size={24} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={settings.heroTitle || ''}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                placeholder="Hero Title"
                className="w-full px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
              <textarea
                value={settings.heroSubtitle || ''}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                placeholder="Hero Subtitle"
                rows={3}
                className="w-full px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/10 rounded-2xl">
              <Mail size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Contact Information</h3>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="Support Email"
                className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                placeholder="Contact Phone"
                className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
              <textarea
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Physical Address"
                rows={2}
                className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/10 rounded-2xl">
              <LinkIcon size={24} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Social Media</h3>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Facebook size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={settings.facebookUrl || ''}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                placeholder="Facebook URL"
                className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Instagram size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={settings.instagramUrl || ''}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                placeholder="Instagram URL"
                className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Youtube size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={settings.youtubeUrl || ''}
                onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                placeholder="YouTube URL"
                className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-medium focus:border-red-600 outline-none transition-all"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="bg-red-600/10 border border-red-600/20 p-6 rounded-3xl flex gap-4">
        <AlertCircle className="text-red-600 shrink-0" />
        <p className="text-zinc-500 text-xs font-medium leading-relaxed">
          <strong className="text-white">Note regarding Storage:</strong> Every time you upload a new asset (Logo, Hero Image), the previous one will be automatically deleted from Google Storage to optimize space. Assets are hosted on Firebase Storage for production-grade delivery.
        </p>
      </div>

      {saving && uploadProgress > 0 && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Upload size={40} className="text-red-600 animate-bounce" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Uploading Assets...</h3>
            <div className="space-y-4">
              <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div 
                  className="h-full bg-red-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{Math.round(uploadProgress)}% COMPLETED</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
