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
  contactEmail: "order@hristo.hr",
  contactPhone: "+385 1 613 1713",
  address: "Ulica grada Chicaga 31, 10 000 Zagreb, Croatia",
  footerDescription: "Professional airsoft equipment and advanced 3D weapon customization. We provide the highest quality gear for enthusiasts and professionals alike.",
  footerTags: ["airsoft", "tactical gear", "custom builds", "Zagreb", "Croatia"],
  facebookUrl: "https://www.facebook.com/HristoAirsoftTrgovina/",
  instagramUrl: "https://www.instagram.com/hristotrgovina/",
  youtubeUrl: "https://www.youtube.com/channel/UC8AcfE1diaC1gk1XniOa3Lw",
  announcement: "SUMMER SALE: UP TO 30% OFF!",
  showAnnouncement: true,
  announcementLink: "/shop",
  heroFeatureMediaType: 'image',
  heroFeatureImage: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?q=80&w=800",
  seoTitle: "HRISTO Airsoft Store - Professional Gear & Custom Engineering",
  seoDescription: "The leading airsoft shop in Croatia. Premium weapons, tactical gear, and the most advanced 3D weapon configurator. Build your ultimate loadout today.",
  seoKeywords: "airsoft, tactical gear, 3d configurator, custom airsoft, Hristo, Croatia, Zagreb",
  liveDemoModelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb"
};
