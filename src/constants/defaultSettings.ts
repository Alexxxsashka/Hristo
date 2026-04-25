import { SiteSettings } from '../types';

export const DEFAULT_SITE_SETTINGS: Partial<SiteSettings> = {
  heroTitle: "Build your ultimate arsenal",
  heroSubtitle: "Explore our curated collection of professional airsoft weapons and tactical gear.",
  heroSlides: [
    {
      id: 'default-slide-1',
      image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=1200",
      title: "Build your ultimate arsenal",
      subtitle: "Explore our curated collection of professional airsoft weapons and tactical gear.",
      ctaText: "Start 3D Config",
      ctaLink: "/configurator",
      active: true
    }
  ],
  featuredCategoriesList: [
    { id: 'weapons', categoryId: 'weapons', active: true },
    { id: 'attachments', categoryId: 'attachments', active: true },
    { id: 'gear', categoryId: 'gear', active: true },
    { id: 'internal_parts', categoryId: 'internal_parts', active: true },
  ],
  promoBanners: [
    {
      id: 'default-promo',
      image: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=800&auto=format&fit=crop",
      title: "Get 20% OFF",
      subtitle: "Your first order of professional equipment.",
      ctaText: "Claim Discount",
      ctaLink: "/register",
      bgColor: "#dc2626",
      active: true
    }
  ],
  aboutUsTitle: "Hristo Identity",
  aboutUsText: "We are more than just a store. We are a hub for airsoft enthusiasts, providing the highest quality gear and custom engineering services.",
  aboutUsImage: "https://images.unsplash.com/photo-1595164539573-047fa1a48c3b?q=80&w=1200",
  aboutUsLink: "/about",
  contactEmail: "info@hristo.hr",
  contactPhone: "+385 1 234 5678",
  address: "Tactical Street 123, Zagreb, Croatia",
  footerDescription: "Hristo Airsoft Store is the leading provider of airsoft equipment and custom builds in Croatia.",
  footerTags: ["airsoft", "tactical gear", "custom builds", "Zagreb", "Croatia"],
  announcement: "SUMMER SALE: UP TO 30% OFF!",
  showAnnouncement: true,
  announcementLink: "/shop",
  heroFeatureMediaType: 'image',
  heroFeatureImage: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?q=80&w=800",
};
