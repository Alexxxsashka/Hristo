import { Category, Product, BlogPost, PolicyPage, Order, OrderItem, BIWidgetData, UserProfile, Address, ServiceRequest, SavedBuild, SiteSettings, AuditLog, Coupon } from "../types";

const VERCEL_FUNCTION_BODY_LIMIT_BYTES = 4 * 1024 * 1024;
const IMAGE_COMPRESSION_TARGET_BYTES = Math.floor(VERCEL_FUNCTION_BODY_LIMIT_BYTES * 0.9);

async function compressImageToTargetSize(file: File, targetBytes: number): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image for compression"));
      image.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0);

    let quality = 0.9;
    let compressedBlob: Blob | null = null;
    while (quality >= 0.45) {
      // WebP gives better compression for product images.
      compressedBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (compressedBlob && compressedBlob.size <= targetBytes) break;
      quality -= 0.1;
    }

    if (!compressedBlob) return file;
    if (compressedBlob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([compressedBlob], `${baseName}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export const databaseService = {
  // Storage
  _urlCache: {} as Record<string, string>,
  _productsCache: null as Product[] | null,
  _categoriesCache: null as Category[] | null,

  async _handleResponse(res: Response) {
    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        console.warn(`Auth error (${res.status}) for ${res.url}. Check your admin privileges.`);
      } else {
        console.error(`API error (${res.status}) for ${res.url}`);
      }
      return null;
    }
    
    try {
      const json = await res.json();
      if (json && typeof json === 'object' && json.success === true && 'data' in json) {
        return json.data;
      }
      return json;
    } catch (e) {
      console.error('Failed to parse JSON response', e);
      return null;
    }
  },

  async uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const { upload } = await import('@vercel/blob/client');
      const token = this.getToken();
      let fileForUpload = file;
      let uploadPath = path;

      if (file.type.startsWith("image/") && file.size > IMAGE_COMPRESSION_TARGET_BYTES) {
        fileForUpload = await compressImageToTargetSize(file, IMAGE_COMPRESSION_TARGET_BYTES);
        if (fileForUpload.type === "image/webp" && !uploadPath.toLowerCase().endsWith(".webp")) {
          uploadPath = uploadPath.replace(/\.[^/.]+$/, "") + ".webp";
        }
      }
      
      // Client-side upload via handleUploadUrl doesn't have the 4.5MB limit 
      // of Vercel Serverless Functions, so we can upload much larger files.

      const blob = await upload(uploadPath, fileForUpload, {
        access: 'public',
        handleUploadUrl: `${window.location.origin}/api/admin/upload-handle?token=${encodeURIComponent(token)}`,
        clientPayload: JSON.stringify({ path: uploadPath }),
        onUploadProgress: (progressEvent) => {
          if (onProgress) onProgress(progressEvent.percentage);
        }
      });

      return blob.url;
    } catch (error: any) {
      console.error('Blob upload error:', error);
      throw new Error(`Failed to upload to Vercel Blob: ${error.message}`);
    }
  },

  async deleteFile(urlOrPath: string): Promise<void> {
    if (!urlOrPath) return;

    // Support Vercel Blob deletion
    if (urlOrPath.includes('blob.vercel-storage.com')) {
      try {
        const token = this.getToken();
        await fetch(`/api/admin/upload?url=${encodeURIComponent(urlOrPath)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error deleting Vercel Blob:', error);
      }
      return;
    }
  },

  async getFileURL(path: string): Promise<string> {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    if (this._urlCache[path]) return this._urlCache[path];
    const resolvedPath = path.startsWith('/') ? path : `/${path}`;
    this._urlCache[path] = resolvedPath;
    return resolvedPath;
  },

  // Auth Helpers
  getToken() {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return parsed.state?.token;
      } catch {
        return null;
      }
    }
    return null;
  },

  // Products
  async getProducts(category?: string, type?: string): Promise<Product[]> {
    try {
      const url = new URL('/api/products', window.location.origin);
      if (category) url.searchParams.append('category', category);
      if (type) url.searchParams.append('type', type);
      const res = await fetch(url.toString());
      return await this._handleResponse(res) || [];
    } catch { return []; }
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`/api/products/${id}`);
      return await this._handleResponse(res);
    } catch { return null; }
  },

  async saveProduct(product: any) {
    const url = product.id ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = product.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      let errorDetail = 'Unknown error';
      try {
        const errJson = await res.json();
        errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch (e) {
        try {
          errorDetail = await res.text();
        } catch (e2) {}
      }
      throw new Error(`Failed to save product: ${errorDetail}`);
    }
  },

  async deleteProduct(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    return await this._handleResponse(res) || [];
  },

  async saveCategory(category: any) {
    const url = category.id ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
    const method = category.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(category)
    });
    if (!res.ok) throw new Error('Failed to save category');
  },

  async deleteCategory(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  // Blog
  async getBlogPosts(category?: string, limitCount: number = 10): Promise<BlogPost[]> {
    const url = new URL('/api/blog', window.location.origin);
    if (category) url.searchParams.append('category', category);
    url.searchParams.append('limit', limitCount.toString());
    const res = await fetch(url.toString());
    return await this._handleResponse(res) || [];
  },

  async getBlogPost(id: string) {
    const res = await fetch(`/api/blog/${id}`);
    return await this._handleResponse(res);
  },

  async saveBlogPost(post: any) {
    const url = post.id ? `/api/admin/blog/${post.id}` : '/api/admin/blog';
    const method = post.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(post)
    });
    if (!res.ok) throw new Error('Failed to save blog post');
  },

  async deleteBlogPost(id: string) {
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete blog post');
  },

  // Policies
  async getPolicies(): Promise<PolicyPage[]> {
    const res = await fetch('/api/policies');
    return await this._handleResponse(res) || [];
  },

  async getPolicy(id: string): Promise<PolicyPage | null> {
    const res = await fetch(`/api/policies/${id}`);
    return await this._handleResponse(res);
  },

  async savePolicy(policy: any) {
    const url = policy.id ? `/api/admin/policies/${policy.id}` : '/api/admin/policies';
    const method = policy.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(policy)
    });
    if (!res.ok) throw new Error('Failed to save policy');
  },

  async deletePolicy(id: string) {
    const res = await fetch(`/api/admin/policies/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete policy');
  },

  // Messages
  async sendContactMessage(message: any) {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    if (!res.ok) throw new Error('Failed to send message');
  },

  // Orders
  async createOrder(orderData: any) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(orderData)
    });
    if (!res.ok) {
      const err = await res.json();
      const detailMsg = err.details ? ': ' + err.details.map((d: any) => `${d.path} ${d.message}`).join(', ') : '';
      throw new Error((err.error || 'Failed to create order') + detailMsg);
    }
    const json = await res.json();
    return json.data || json;
  },

  async createPaymentIntent(items: any[], shipping_cost: number, orderId?: string, subtotal?: number) {
    const res = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ items, shipping_cost, orderId, subtotal })
    });
    if (!res.ok) {
      const err = await res.json();
      const detailMsg = err.details ? ': ' + err.details.map((d: any) => `${d.path} ${d.message}`).join(', ') : '';
      throw new Error((err.error || 'Failed to create payment intent') + detailMsg);
    }
    const json = await res.json();
    return json.data || json;
  },

  async getUserOrders(uid: string) {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string, updatedBy?: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ status, tracking_number: trackingNumber, updatedBy })
    });
    if (!res.ok) throw new Error('Failed to update order status');
  },

  async getAllOrders() {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  // Inventory / Stock
  async getStock() {
    const res = await fetch('/api/admin/stock', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return res.ok ? await res.json() : [];
  },

  async getInventoryLogs() {
    const res = await fetch('/api/admin/inventory-logs', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return res.ok ? await res.json() : [];
  },

  async getTestStats() {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return res.ok ? await res.json() : null;
  },

  async findProductByCode(code: string): Promise<Product | null> {
    const res = await fetch(`/api/products/find-by-code?code=${code}`);
    return res.ok ? await res.json() : null;
  },

  async updateStockByCode(code: string, quantity: number, warehouseId: string, reason: string) {
    const res = await fetch('/api/admin/stock/update-by-code', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ code, quantity, warehouseId, reason })
    });
    if (!res.ok) throw new Error('Failed to update stock');
  },

  // BI Analytics
  async getCoupons(): Promise<Coupon[]> {
    const res = await fetch('/api/admin/coupons', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async saveCoupon(coupon: any) {
    const url = coupon.id ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons';
    const method = coupon.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(coupon)
    });
    if (!res.ok) throw new Error('Failed to save coupon');
  },

  async deleteCoupon(id: string) {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete coupon');
  },

  async validateCoupon(code: string, cartItems: any[]) {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, items: cartItems })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        return { 
          valid: false, 
          message: data.message || data.error || `Validation error (${res.status})` 
        };
      }
      
      return data;
    } catch (err) {
      console.error('Coupon validation error:', err);
      return { valid: false, message: 'Network or server error' };
    }
  },

  async getBIAnalytics(): Promise<BIWidgetData> {
    const res = await fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await this._handleResponse(res);
    if (data) {
      const stats = data.stats || {};
      return {
        revenue: Number(stats.revenue ?? data.revenue ?? data.totalRevenue ?? 0),
        profit: Number(stats.profit ?? data.profit ?? 0),
        conversionRate: Number(stats.conversionRate ?? data.conversionRate ?? 0),
        avgOrderValue: Number(stats.avgOrderValue ?? data.avgOrderValue ?? 0),
        salesVelocity: Array.isArray(data.salesVelocity) ? data.salesVelocity : [],
        topSellers: Array.isArray(data.topSellers) ? data.topSellers : [],
        lowStockAlerts: Array.isArray(data.lowStockAlerts) ? data.lowStockAlerts : [],
      };
    }
    throw new Error('Failed to fetch analytics');
  },

  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      const res = await fetch('/api/site-settings');
      const data = await this._handleResponse(res);
      if (data) {
        // Ensure critical array fields are actually arrays to prevent UI crashes
        return {
          ...data,
          heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : [],
          promoBanners: Array.isArray(data.promoBanners) ? data.promoBanners : [],
          featuredCategoriesList: Array.isArray(data.featuredCategoriesList) ? data.featuredCategoriesList : [],
          footerTags: Array.isArray(data.footerTags) ? data.footerTags : [],
          heroFeatureMediaType: data.heroFeatureMediaType || 'image'
        };
      }
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
    }
    return { 
      id: 'default',
      heroSlides: [],
      promoBanners: [],
      featuredCategoriesList: [],
      footerTags: [],
      heroFeatureMediaType: 'image'
    };
  },

  async updateSiteSettings(settings: Partial<SiteSettings>) {
    const res = await fetch('/api/site-settings', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update site settings');
    }
  },

  // Currency
  async getCurrencyRates() {
    const res = await fetch('/api/currency-rates');
    return await this._handleResponse(res) || [];
  },

  async saveCurrencyRate(rate: any) {
    const res = await fetch('/api/currency-rates', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(rate)
    });
    if (!res.ok) throw new Error('Failed to save currency rate');
  },

  // ERP / Warehouse Management
  async getWarehouses() {
    const res = await fetch('/api/admin/warehouses', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async saveWarehouse(warehouse: any) {
    const res = await fetch('/api/admin/warehouses', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(warehouse)
    });
    if (!res.ok) throw new Error('Failed to save warehouse');
  },

  async deleteWarehouse(id: string) {
    const res = await fetch(`/api/admin/warehouses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete warehouse');
  },

  async getSuppliers() {
    const res = await fetch('/api/admin/suppliers', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async saveSupplier(supplier: any) {
    const res = await fetch('/api/admin/suppliers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(supplier)
    });
    if (!res.ok) throw new Error('Failed to save supplier');
  },

  async deleteSupplier(id: string) {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete supplier');
  },

  async seedStockData() {
    const res = await fetch('/api/admin/stock/seed', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to seed stock data');
  },

  async saveStockItem(item: any) {
    const res = await fetch('/api/admin/stock', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to save stock item');
  },

  async getPurchaseOrders() {
    const res = await fetch('/api/admin/purchase-orders', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async savePurchaseOrder(po: any) {
    const res = await fetch('/api/admin/purchase-orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(po)
    });
    if (!res.ok) throw new Error('Failed to save purchase order');
  },

  async receivePurchaseOrder(poId: string, warehouseId: string) {
    const res = await fetch(`/api/admin/purchase-orders/${poId}/receive`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify({ warehouseId })
    });
    if (!res.ok) throw new Error('Failed to receive purchase order');
  },

  // Misc
  async getUserLoadouts(uid: string) {
    const res = await fetch('/api/loadouts', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async saveLoadout(loadout: any) {
    const res = await fetch('/api/loadouts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(loadout)
    });
    if (!res.ok) throw new Error('Failed to save loadout');
  },

  async getUserBuilds(uid: string) {
    const res = await fetch('/api/saved-builds', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async saveBuild(build: any) {
    const res = await fetch('/api/saved-builds', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(build)
    });
    if (!res.ok) throw new Error('Failed to save build');
  },

  async deleteBuild(id: string) {
    const res = await fetch(`/api/saved-builds/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete build');
  },

  async createServiceRequest(request: any) {
    const res = await fetch('/api/service-requests', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(request)
    });
    if (res.ok) return await res.json();
    throw new Error('Failed to create service request');
  },

  async getUserServiceRequests(uid: string) {
    const res = await fetch('/api/service-requests', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async updateAddress(uid: string, address: Address) {
    const user = await this.getUserProfile(uid);
    if (!user) return;
    const addresses = (user.addresses || []).map(a => a.id === address.id ? address : a);
    await this.updateProfile(uid, { addresses });
  },

  async addAddress(uid: string, address: any) {
    const user = await this.getUserProfile(uid);
    if (!user) return;
    const newAddress = { ...address, id: address.id || Math.random().toString(36).substr(2, 9) };
    const addresses = [...(user.addresses || []), newAddress];
    await this.updateProfile(uid, { addresses });
  },

  async deleteAddress(uid: string, addressId: string) {
    const user = await this.getUserProfile(uid);
    if (!user) return;
    const addresses = (user.addresses || []).filter(a => a.id !== addressId);
    await this.updateProfile(uid, { addresses });
  },

  async syncCourierAPI(orderId: string) {
    // Dummy sync for demo
    return true;
  },

  async generateInvoice(orderId: string) {
    // Dummy invoice generation
    return `<html><body><h1>Invoice for Order ${orderId}</h1><p>This is a dummy invoice.</p></body></html>`;
  },

  async requestOrderCancellation(orderId: string, reason: string) {
    await this.updateOrderStatus(orderId, 'cancelled', reason);
  },

  async cancelOrder(orderId: string) {
    await this.updateOrderStatus(orderId, 'cancelled');
  },

  async runMigrations() {
    const token = this.getToken();
    const res = await fetch(`/api/admin/migrate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  },
  
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/admin/audit', {
        headers: { 'Authorization': `Bearer ${this.getToken()}` }
      });
      return await this._handleResponse(res) || [];
    } catch {
      return [];
    }
  },

  // Users Management
  async getUsers(): Promise<any[]> {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async getUserProfile(id: string): Promise<UserProfile | null> {
    const res = await fetch(`/api/users/${id}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res);
  },

  async saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await this.updateProfile(uid, data);
  },

  async updateProfile(id: string, data: Partial<UserProfile>) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return await res.json();
  },

  // Messages / Contact
  async getMessages(): Promise<any[]> {
    const res = await fetch('/api/admin/messages', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return await this._handleResponse(res) || [];
  },

  async saveMessage(message: any) {
    const url = message.id ? `/api/admin/messages/${message.id}` : '/api/admin/messages';
    const method = message.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(message)
    });
    if (!res.ok) throw new Error('Failed to save message');
  },

  async deleteMessage(id: string) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to delete message');
  }
};

