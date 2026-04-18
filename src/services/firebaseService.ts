import { 
  getAuth,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import { storage, auth } from "../firebase";

import { Category, Product, BlogPost, PolicyPage, Order, OrderItem, BIWidgetData, UserProfile, Address, ServiceRequest, SavedBuild, SiteSettings } from "../types";

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

export const firebaseService = {
  // Storage
  _urlCache: {} as Record<string, string>,
  _productsCache: null as Product[] | null,
  _categoriesCache: null as Category[] | null,

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
      
      if (fileForUpload.size > VERCEL_FUNCTION_BODY_LIMIT_BYTES) {
        throw new Error("Image is too large for upload. Please use a smaller file.");
      }

      const blob = await upload(uploadPath, fileForUpload, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload-handle',
        clientPayload: JSON.stringify({ path: uploadPath }),
        // @ts-ignore - passing token for the backend to verify
        headers: {
          'Authorization': `Bearer ${token}`
        },
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
    
    // Support Firebase Storage deletion
    if (urlOrPath.includes('firebasestorage.googleapis.com')) {
      try {
        const fileRef = ref(storage, urlOrPath);
        await deleteObject(fileRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') console.error(`Error deleting Firebase file: ${urlOrPath}`, error);
      }
      return;
    }

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
    if (this._urlCache[path]) return this._urlCache[path];
    try {
      const url = await getDownloadURL(ref(storage, path));
      this._urlCache[path] = url;
      return url;
    } catch {
      return `/${path}`;
    }
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
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`/api/products/${id}`);
      return res.ok ? await res.json() : null;
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
    if (!res.ok) throw new Error('Failed to save product');
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
    return res.ok ? await res.json() : [];
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
    if (res.ok) {
      const data = await res.json();
      return data.posts || [];
    }
    return [];
  },

  async getBlogPost(id: string) {
    const res = await fetch(`/api/blog/${id}`);
    return res.ok ? await res.json() : null;
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
    return res.ok ? await res.json() : [];
  },

  async getPolicy(id: string): Promise<PolicyPage | null> {
    const res = await fetch(`/api/policies/${id}`);
    return res.ok ? await res.json() : null;
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

  async getMessages() {
    const res = await fetch('/api/admin/messages', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return res.ok ? await res.json() : [];
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
  },

  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const res = await fetch(`/api/users/${uid}`, {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return res.ok ? await res.json() : null;
  },

  async saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await this.updateProfile(uid, data);
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
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
      throw new Error(err.error || 'Failed to create order');
    }
    return await res.json();
  },

  async createPaymentIntent(amount: number, currency: string = 'eur') {
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create payment intent');
    }
    return await res.json();
  },

  async getUserOrders(uid: string) {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
  async getBIAnalytics(): Promise<BIWidgetData> {
    const res = await fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    if (res.ok) return await res.json();
    throw new Error('Failed to fetch analytics');
  },

  // Site Settings
  async getSiteSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/site-settings');
    if (res.ok) return await res.json();
    return { id: 'default' };
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
    if (!res.ok) throw new Error('Failed to update site settings');
  },

  // Currency
  async getCurrencyRates() {
    const res = await fetch('/api/currency-rates');
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : [];
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
};
