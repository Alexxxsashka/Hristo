import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Youtube, 
  CreditCard,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { databaseService } from '../services/databaseService';
import { useAuthStore } from '../store/authStore';
import { SiteSettings } from '../types';

import { useSettingsStore } from '../store/settingsStore';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { settings, fetchSettings } = useSettingsStore();
  const [paymentLogos, setPaymentLogos] = useState<{ [key: string]: string }>({});
  const { user } = useAuthStore();

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  return (
    <footer className="bg-[#ab1017] border-t border-white/10 pt-16 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12 mb-16 md:mb-24">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="HRISTO Airsoft" 
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : settings ? (
                <span className="text-2xl font-black text-white tracking-tighter">HRISTO<span className="text-white">.</span></span>
              ) : (
                <div className="h-12 w-32 bg-zinc-900 animate-pulse rounded-lg" />
              )}
            </Link>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm font-medium">
              {settings?.footerDescription || "Professional airsoft equipment and advanced 3D weapon customization. We provide the highest quality gear for enthusiasts and professionals alike."}
            </p>
            {Array.isArray(settings?.footerTags) && settings.footerTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {settings.footerTags.map((tag, i) => (
                  <span key={i} className="text-[8px] font-black uppercase tracking-widest text-white/60 border border-white/10 px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4">
              <a href={settings?.facebookUrl || "https://www.facebook.com/HristoAirsoftTrgovina/"} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-red-600 transition-all duration-500 border border-white/10">
                <Facebook size={20} />
              </a>
              <a href={settings?.instagramUrl || "https://www.instagram.com/hristotrgovina/"} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-red-600 transition-all duration-500 border border-white/10">
                <Instagram size={20} />
              </a>
              <a href={settings?.youtubeUrl || "https://www.youtube.com/channel/UC8AcfE1diaC1gk1XniOa3Lw"} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-red-600 transition-all duration-500 border border-white/10">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="space-y-8">
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">SHOP</h3>
            <ul className="space-y-4">
              {[
                { name: 'Weapons', slug: 'airsoft-weapons' },
                { name: 'Attachments', slug: 'airsoft-attachments' },
                { name: 'Tactical Gear', slug: 'tactical-gear' },
                { name: 'Internal Parts', slug: 'internal-parts' },
                { name: 'Apparel', slug: 'apparel' }
              ].map(link => (
                <li key={link.name}>
                  <Link to={`/shop/${link.slug}`} className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Information */}
          <div className="space-y-8">
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">{t('information') || 'INFORMATION'}</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('about_us') || 'About Us'}</Link></li>
              <li><Link to="/contact" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('contact') || 'Contact'}</Link></li>
              {user && (
                <li><Link to="/account" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('my_account')}</Link></li>
              )}
              <li><Link to="/blog" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('blog') || 'Blog'}</Link></li>
              <li><Link to="/shipping" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('shipping_delivery') || 'Shipping'}</Link></li>
              <li><Link to="/returns" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('refund_return_policy') || 'Returns'}</Link></li>
              <li><Link to="/privacy" className="text-white/70 hover:text-white transition-colors text-xs font-black tracking-widest uppercase">{t('privacy_policy') || 'Privacy Policy'}</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-8">
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs">{t('contact') || 'CONTACT'}</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin size={18} className="text-white shrink-0" />
                <p className="text-white/80 text-xs font-bold leading-relaxed uppercase tracking-widest">
                  {settings?.address || 'Ulica grada Chicaga 31\n10 000 Zagreb, Croatia'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Phone size={18} className="text-white shrink-0" />
                <p className="text-white text-xs font-black tracking-widest uppercase">{settings?.contactPhone || '+385 1 613 1713'}</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail size={18} className="text-white shrink-0" />
                <p className="text-white text-xs font-black tracking-widest uppercase">{settings?.contactEmail || 'order@hristo.hr'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Trust */}
        <div className="border-t border-white/10 py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex flex-wrap justify-center gap-8 brightness-0 invert opacity-60 hover:opacity-100 transition-all duration-700 items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-2.5" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" className="h-8" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" referrerPolicy="no-referrer" />
          </div>
          
          <div className="flex items-center gap-4 px-6 py-3 bg-white/10 rounded-2xl border border-white/10">
            <ShieldCheck size={20} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('payments_secured') || 'SSL SECURED CHECKOUT'}</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            © 2024 HRISTO AIRSOFT. {t('all_rights_reserved') || 'ALL RIGHTS RESERVED.'}
          </p>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            <Link to="/terms" className="hover:text-white transition-colors">{t('terms_conditions') || 'TERMS'}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{t('privacy_policy') || 'PRIVACY'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
