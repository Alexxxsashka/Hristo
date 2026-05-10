import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, LogIn, UserPlus, Menu, X, Search, Heart, ShieldCheck, Truck, Clock, GitCompare, LayoutGrid, LayoutDashboard, Package, Crosshair, TrendingUp, Zap } from 'lucide-react';
import { CartIcon } from './CartIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { CatalogMenu } from './CatalogMenu';
import { useWishlistStore } from '../store/wishlistStore';
import { useCompareStore } from '../store/compareStore';
import { databaseService } from '../services/databaseService';
import { useTranslation } from '../hooks/useTranslation';
import { SiteSettings } from '../types';
import { useSettingsStore } from '../store/settingsStore';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();
  const { compareProducts } = useCompareStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const { settings, fetchSettings } = useSettingsStore();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData] = await Promise.all([
          databaseService.getCategories()
        ]);
        setCategories(categoriesData || []);
        if (!settings) fetchSettings();
      } catch (err) {
        console.error('Failed to fetch navbar data:', err);
      }
    };
    fetchData();
  }, [fetchSettings]);

  const isHomePage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const toggleSearch = () => {
    if (isHomePage) {
      // On home page, search is typically a full screen overlay or scroll to search
      // For now, let's just navigate to shop
      navigate('/shop');
    } else {
      setIsSearchOpen(!isSearchOpen);
    }
  };

  const weaponsCat = categories.find(c => c.id === 'weapons' || c.slug === 'airsoft-weapons');
  
  const navLinks = [
    { to: '/shop', label: t('shop') },
    ...(weaponsCat ? [{
      to: `/shop/${weaponsCat.slug}`,
      label: weaponsCat.name
    }] : []),
    { to: '/configurator', label: t('configurator'), highlight: true },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-[100]" role="banner">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[#ab1017] focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">Skip to content</a>
      {settings?.showAnnouncement && settings?.announcement && (
        <div className="bg-red-600 py-2.5 px-4 text-center">
          <Link 
            to={settings.announcementLink || "#"} 
            className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Zap size={14} className="fill-white animate-pulse" />
            {settings.announcement}
            <Zap size={14} className="fill-white animate-pulse" />
          </Link>
        </div>
      )}
      {/* Top Bar */}
      <div className="bg-[#ab1017] border-b border-white/10 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-[10px] font-bold tracking-widest text-white/90 uppercase">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Truck size={12} className="text-white" />
              {t('free_shipping_over')}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-white" />
              {t('same_day_dispatch')}
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-white" />
              {t('secure_payments')}
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/about" className="hover:text-zinc-50 transition-colors">{t('about_us')}</Link>
            <Link to="/contact" className="hover:text-zinc-50 transition-colors">{t('contact')}</Link>
            <Link to="/shipping" className="hover:text-zinc-50 transition-colors">{t('shipping')}</Link>
            <div className="h-3 w-px bg-white/20 mx-2" />
            {isAuthenticated ? (
              <div className="flex items-center gap-4 relative group/user">
                <Link to="/account" className="hover:text-white transition-colors flex items-center gap-2">
                  <User size={12} className="text-white" />
                  {user?.callsign || user?.username}
                </Link>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 z-[60] py-2">
                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                        <ShieldCheck size={14} />
                        {t('admin_panel')}
                      </Link>
                      <div className="h-px bg-zinc-800 my-1" />
                    </>
                  )}
                  <Link to="/account" className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold hover:bg-zinc-800 transition-colors">
                    <LayoutDashboard size={14} className="text-red-600" />
                    {t('dashboard')}
                  </Link>
                  <Link to="/account?tab=orders" className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold hover:bg-zinc-800 transition-colors">
                    <Package size={14} className="text-red-600" />
                    {t('my_orders')}
                  </Link>
                  <Link to="/account?tab=loyalty" className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold hover:bg-zinc-800 transition-colors">
                    <TrendingUp size={14} className="text-red-600" />
                    {t('loyalty_points')}
                  </Link>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} />
                    {t('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:text-zinc-50 transition-colors">{t('login')}</Link>
                <Link to="/register" className="text-red-500 hover:text-red-400 transition-colors">{t('join')}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="bg-[var(--header-bg)] backdrop-blur-xl border-b border-white/10" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4 sm:gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            {settings?.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt="HRISTO Airsoft" 
                className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : settings ? (
              <span className="text-xl font-black text-white tracking-tighter">HRISTO<span className="text-white/50">.</span></span>
            ) : (
              <div className="h-8 sm:h-10 md:h-12 w-24 sm:w-32 bg-zinc-900 animate-pulse rounded-lg" />
            )}
          </Link>

          <button
            onClick={() => setIsCatalogOpen(true)}
            className="hidden lg:flex items-center justify-center gap-2 w-[140px] h-10 bg-white text-red-600 font-black uppercase tracking-widest text-[11px] rounded-xl shadow-lg shadow-black/10 hover:bg-zinc-100 transition-all group shrink-0"
          >
            <LayoutGrid size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {t('catalog')}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 mx-4 xl:mx-8">
            {navLinks.map(link => (
              <Link 
                key={link.to}
                to={link.to} 
                className={`text-[11px] font-black tracking-widest transition-colors uppercase flex items-center gap-2 whitespace-nowrap ${
                  link.highlight ? 'text-white hover:text-zinc-200' : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
                {link.highlight && (
                  <span className="px-1.5 py-0.5 bg-white text-[#ab1017] text-[8px] rounded-sm animate-pulse">
                    {t('live')}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Search Bar Area */}
          <div className="hidden md:flex flex-1 justify-end px-4">
            {!isHomePage && (
              <motion.div 
                initial={false}
                animate={{ width: isSearchOpen || searchQuery ? '280px' : '180px' }}
                className="relative"
              >
                <form onSubmit={handleSearch} className="w-full" role="search" aria-label="Site search">
                  <input 
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => setIsSearchOpen(false)}
                    aria-label="Search products"
                    className="w-full bg-black/10 border border-white/10 rounded-xl py-2 h-9 pl-10 pr-4 text-xs text-white placeholder:text-white/50 focus:outline-none focus:bg-black/20 transition-all duration-300"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                </form>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 justify-end ml-4">
            <div className="flex items-center gap-2 sm:gap-4">
              {!isHomePage && (
                <button 
                  onClick={toggleSearch}
                  className="p-2 text-white/80 hover:text-white transition-colors md:hidden"
                >
                  <Search size={20} />
                </button>
              )}
              <Link to="/compare" className="relative p-2 text-white/80 hover:text-white transition-colors hidden sm:block">
                <GitCompare size={20} />
                {compareProducts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-zinc-950">
                    {compareProducts.length}
                  </span>
                )}
              </Link>
              <Link to="/wishlist" className="relative p-2 text-white/80 hover:text-white transition-colors hidden sm:block">
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-zinc-950">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <CartIcon />
              <div className="hidden sm:flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white/80 hover:text-white transition-colors lg:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#ab1017] border-b border-white/10 overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6">
                {!isHomePage && (
                  <div className="relative">
                    <form onSubmit={handleSearch}>
                      <input 
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/50"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                    </form>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setIsCatalogOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white text-[#ab1017] font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-black/20"
                  >
                    {t('catalog')}
                    <LayoutGrid size={20} />
                  </button>
                  {navLinks.map(link => (
                    <Link 
                      key={link.to} 
                      to={link.to} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-base font-black uppercase tracking-tighter transition-colors flex items-center justify-between ${
                        link.highlight ? 'text-red-500 border-red-500/20' : 'text-zinc-400 hover:text-zinc-50'
                      }`}
                    >
                      {link.label}
                      {link.highlight && (
                        <span className="px-2 py-1 bg-red-600 text-white text-[10px] rounded-md animate-pulse">
                          {t('live_3d')}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                <div className="pt-6 border-t border-zinc-800 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <LanguageSwitcher />
                    </div>
                    <div className="flex gap-4">
                      <Link to="/compare" className="flex items-center gap-2 text-zinc-400 font-bold">
                        <GitCompare size={20} /> {t('compare')}
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-2 text-zinc-400 font-bold">
                        <Heart size={20} /> {t('wishlist')}
                      </Link>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <div className="flex flex-col gap-4">
                      {user?.role === 'admin' && (
                        <Link 
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20"
                        >
                          <ShieldCheck size={20} />
                          {t('admin_panel')}
                        </Link>
                      )}
                      <div className="flex gap-4">
                        <Link 
                          to="/account"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white font-bold rounded-2xl border border-zinc-800"
                        >
                          <User size={20} />
                          {user?.callsign || t('profile')}
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600/10 text-red-500 font-bold rounded-2xl"
                        >
                          <LogOut size={20} />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <Link 
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white font-bold rounded-2xl border border-zinc-800"
                      >
                        <LogIn size={20} />
                        {t('login')}
                      </Link>
                      <Link 
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600 text-white font-bold rounded-2xl"
                      >
                        <UserPlus size={20} />
                        {t('register')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <CatalogMenu isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />
    </header>
  );
};
