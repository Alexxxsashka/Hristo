export interface FilterDefinition {
  id: string;
  label: string;
  type: 'select' | 'range' | 'boolean';
  options?: string[]; // For select type
}

export interface Category {
  id: string;
  name: string;
  nameHr?: string;
  slug: string;
  image?: string;
  parent: string | null;
  filters?: FilterDefinition[]; // Category-specific filters
  slots?: string[];
  compatibleModuleCategories?: string[];
  discount?: number; // Percentage discount for the entire category
}

export interface AttachPoint {
  id: string;
  slotType: string;
  position: [number, number, number];
  rotation: [number, number, number];
  meshName?: string; // Name of the mesh in the GLB that acts as the anchor
}

export interface Characteristic {
  emoji: string;
  label: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku?: string;
  name: string; // e.g., "Red / XL"
  attributes: Record<string, string>; // e.g., { color: "Red", size: "XL" }
  price?: number; // Optional price override
  stock: number;
}

export interface ProductAttribute {
  name: string; // e.g., "Color"
  options: string[]; // e.g., ["Red", "Blue"]
}

export interface Product {
  id: string;
  uid: string; // Unique identifier for the compatibility engine
  sku?: string;
  barcode?: string;
  slug?: string;
  name: string;
  nameHr?: string;
  description: string;
  descriptionHr?: string;
  type: 'weapon' | 'module' | 'gear' | 'part' | 'consumable';
  category: string;
  subcategory: string;
  category_id?: string;
  brand: string;
  model: string;
  price: number;
  landingCost?: number;
  msrp?: number;
  currency?: string;
  discount?: number; // Percentage discount for the product
  stock: number;
  minStockLevel?: number;
  status?: string;
  tags: string[];
  image?: string;
  images?: string[];
  model3D: string;
  model3DName?: string; // Original filename of the 3D model
  meshName?: string; // The name of the root mesh in the GLB file
  socketPoint?: [number, number, number]; // Offset for attachment point on the module itself
  characteristics?: Characteristic[];
  variantAttributes?: ProductAttribute[];
  variants?: ProductVariant[];
  categoryFilters?: Record<string, string | number | boolean>; // Values for category-specific filters
  has3D?: boolean;
  mountType?: string; // e.g., 'Picatinny', 'M-LOK', 'Dovetail', 'KeyMod'
  longDescription?: string; // Extended product story/history
  longDescriptionHr?: string;
  
  // Compatibility Engine fields
  allowedSlots?: string[]; // Types of slots this item can fit into
  compatibleIds?: string[]; // UIDs of products that can be attached to this item
  
  // For weapons/modules with attachment points
  slots?: string[];
  compatibleModuleCategories?: string[];
  attachPoints?: AttachPoint[];
  
  // Legacy/Other fields
  attachmentSlot?: string;
  compatibleWeapons?: string[];
  attributes?: {
    weight?: string;
    length?: string;
    type?: string;
    [key: string]: string | undefined;
  };
}

export interface FilterState {
  search: string;
  categories: string[];
  subcategories: string[];
  brands: string[];
  mountTypes: string[];
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  categoryFilters: Record<string, any>; // For category-specific filter values
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  image: string;
  excerpt: string;
  content: string;
  date: string;
  category: 'Guides' | 'Product Reviews' | 'News' | 'Tutorials';
  author: string;
  relatedProductIds?: string[];
}

export interface PolicyPage {
  id: string;
  title: string;
  content: string;
  title_hr?: string;
  content_hr?: string;
  lastUpdated: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  callsign?: string;
  teamName?: string;
  role: 'admin' | 'manager' | 'clerk' | 'tech' | 'user';
  points?: number;
  rank?: string;
  nextRankThreshold?: number;
  discountLevel?: number;
  avatar?: string;
  addressBook?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingInfo {
  method: 'hp_shipping' | 'gls_express' | 'boxnow_locker' | 'pickup' | 'courier';
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  postalCode?: string;
  trackingNumber?: string;
  status: 'pending' | 'ready_for_shipment' | 'shipped' | 'delivered' | 'returned';
  cost: number;
}

export interface PaymentInfo {
  method: 'stripe' | 'keks_pay' | 'cod' | 'bank_transfer';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: string;
}

export interface OrderItem {
  productId: string;
  sku?: string;
  name: string;
  category?: string;
  price: number;
  landingCost?: number; // For actual margin calculation
  quantity: number;
  image?: string;
  selectedVariant?: {
    id: string;
    name: string;
    attributes: Record<string, string>;
  };
  configuration?: Record<string, string | number | boolean>;
}

export interface Order {
  id: string;
  orderNumber: string; // Human readable like #5502
  userId: string | 'guest';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discountAmount?: number;
  shippingCost: number;
  total: number;
  profit: number;
  pointsEarned?: number;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'awaiting_payment';
  cancelRequested?: boolean;
  cancelRequestedAt?: string;
  cancelReason?: string;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  auditTrail: {
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
}

export interface StockLog {
  id: string;
  productId: string;
  sku: string;
  orderId?: string;
  type: 'in' | 'out' | 'adjustment' | 'reservation' | 'release';
  quantity: number;
  previousBalance: number;
  newBalance: number;
  user: string;
  timestamp: string;
  reason: string;
}

export interface Customer {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  isGhost: boolean; // True if created from guest checkout
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface BIWidgetData {
  revenue: number;
  profit: number;
  conversionRate: number;
  avgOrderValue: number;
  salesVelocity: { date: string; revenue: number; orders: number }[];
  topSellers: { name: string; quantity: number; revenue: number; sales: number }[];
  lowStockAlerts: { id: string; name: string; sku: string; stock: number; velocity: number; minLevel: number }[];
}

export interface Loadout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  productIds: string[];
  createdAt: string;
}

export interface SavedBuild {
  id: string;
  userId: string;
  name: string;
  weaponId: string;
  weaponName: string;
  configuration: Record<string, string>;
  image?: string;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  weaponName: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Ready for Pickup';
  date: string;
  updates: { date: string; message: string }[];
}

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  active: boolean;
}

export interface PromoBanner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  active: boolean;
}

export interface FeaturedCategory {
  id: string;
  categoryId: string;
  customName?: string;
  active: boolean;
}

export interface SiteSettings {
  id: string;
  logoUrl?: string;
  heroImageUrl?: string; // Legacy
  heroTitle?: string; // Legacy
  heroSubtitle?: string; // Legacy
  heroSlides?: HeroSlide[];
  promoBanners?: PromoBanner[];
  featuredCategoriesList?: FeaturedCategory[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  announcement?: string;
  showAnnouncement?: boolean;
  announcementLink?: string;
  
  // New CMS Sections
  aboutUsTitle?: string;
  aboutUsText?: string;
  aboutUsImage?: string;
  aboutUsLink?: string;
  
  footerTags?: string[];
  footerDescription?: string;
}
