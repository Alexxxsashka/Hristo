import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  DocumentData,
  QueryConstraint,
  runTransaction,
  increment,
  Timestamp,
  arrayUnion
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { db, storage, auth } from "../firebase";

import { Category, Product, BlogPost, PolicyPage, Order, OrderItem, BIWidgetData, UserProfile, Address, ServiceRequest, SavedBuild } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Generic error handler for Firestore permissions
const handleFirestoreError = (error: any, operation: string, path: string) => {
  const errInfo = {
    error: error.message || String(error),
    operation,
    path,
    timestamp: new Date().toISOString()
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const RANK_THRESHOLDS = [
  { rank: 'Recruit', threshold: 0, discount: 0 },
  { rank: 'Private', threshold: 500, discount: 3 },
  { rank: 'Sergeant', threshold: 1500, discount: 5 },
  { rank: 'Special Forces', threshold: 3000, discount: 10 },
  { rank: 'Operator', threshold: 5000, discount: 15 },
  { rank: 'Commander', threshold: 10000, discount: 20 }
];

export const firebaseService = {
  // Storage
  _urlCache: {} as Record<string, string>,
  _productsCache: null as Product[] | null,
  _categoriesCache: null as Category[] | null,

  async uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
    console.log(`Attempting to upload file to path: ${path}`, { fileName: file.name, fileSize: file.size, fileType: file.type });
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("Upload failed: No authenticated user.");
      throw new Error("You must be logged in to upload files.");
    }
    console.log("Authenticated user found:", currentUser.uid);

    try {
      const storageRef = ref(storage, path);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress.toFixed(2)}% done`);
            if (onProgress) onProgress(progress);
          }, 
          (error) => {
            console.error("Storage Error during uploadTask:", error);
            reject(new Error(`Failed to upload file: ${error.message || 'Unknown error'}`));
          }, 
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL retrieved:', url);
            resolve(url);
          }
        );
      });
    } catch (error: any) {
      console.error("Storage Error during uploadFile setup:", error);
      throw new Error(`Failed to initialize upload: ${error.message || 'Unknown error'}`);
    }
  },

  async getFileURL(path: string): Promise<string> {
    if (this._urlCache[path]) {
      return this._urlCache[path];
    }
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      this._urlCache[path] = url;
      return url;
    } catch (error: any) {
      // Fallback to local assets if storage fails
      const localPath = `/${path}`;
      console.warn(`Storage access failed for "${path}", falling back to local path: ${localPath}`, error.message);
      return localPath;
    }
  },
  // Products
  async getProducts(category?: string, type?: string): Promise<Product[]> {
    if (!category && !type && this._productsCache) return this._productsCache;
    try {
      const url = new URL('/api/products', window.location.origin);
      if (category) url.searchParams.append('category', category);
      if (type) url.searchParams.append('type', type);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const products = await response.json();
      if (!category && !type) this._productsCache = products;
      return products;
    } catch (error) {
      console.error("API products fetch failed:", error);
      return [];
    }
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`API product ${id} fetch failed:`, error);
      return null;
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (this._categoriesCache) return this._categoriesCache;
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const categories = await response.json();
      this._categoriesCache = categories;
      return categories;
    } catch (error) {
      console.error("API categories fetch failed:", error);
      return [];
    }
  },

  // Blog
  async getBlogPosts(category?: string, limitCount: number = 10): Promise<BlogPost[]> {
    try {
      const url = new URL('/api/blog', window.location.origin);
      if (category) url.searchParams.append('category', category);
      url.searchParams.append('limit', limitCount.toString());
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      const data = await response.json();
      return data.posts || [];
    } catch (error) {
      console.error("API blog posts fetch failed:", error);
      return [];
    }
  },

  // Policies
  async getPolicies(): Promise<PolicyPage[]> {
    try {
      const response = await fetch('/api/policies');
      if (!response.ok) throw new Error('Failed to fetch policies');
      return await response.json();
    } catch (error) {
      console.error("API policies fetch failed:", error);
      return [];
    }
  },

  async getPolicy(id: string): Promise<PolicyPage | null> {
    try {
      const response = await fetch(`/api/policies/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`API policy ${id} fetch failed:`, error);
      return null;
    }
  },

  // Contact
  async sendContactMessage(message: any) {
    const path = "contact_messages";
    try {
      const docRef = await addDoc(collection(db, path), {
        ...message,
        date: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, "create", path);
    }
  },

  async getMessages() {
    const path = "contact_messages";
    try {
      const q = query(collection(db, path), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, "get", path);
    }
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete product');
      this._productsCache = null;
    } catch (error) {
      console.error("API product delete failed:", error);
      throw error;
    }
  },

  async deleteBlogPost(id: string) {
    const path = `blog_posts/${id}`;
    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete blog post');
    } catch (error) {
      console.error("API blog post delete failed:", error);
      throw error;
    }
  },

  async deleteMessage(id: string) {
    const path = `contact_messages/${id}`;
    try {
      await deleteDoc(doc(db, "contact_messages", id));
    } catch (error) {
      handleFirestoreError(error, "delete", path);
    }
  },

  async saveProduct(product: any) {
    const path = product.id ? `products/${product.id}` : "products";
    try {
      const url = product.id ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = product.id ? 'PUT' : 'POST';
      
      // We send as JSON because ProductForm already handles file uploads separately
      // and passes the URLs in the product object.
      // Note: server.ts expects multipart for /api/admin/products, 
      // but we can also use /api/products (public) if we want, 
      // or update server.ts to handle JSON for admin too.
      
      // Actually, server.ts has app.put("/api/products/:id") which is generic and handles JSON.
      // Let's use that one if it's easier, or use the admin one.
      // The admin one uses uploadMemory.fields, so it expects multipart.
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(product.id ? product : { ...product, id: `prod-${Date.now()}` })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save product');
      }
      
      this._productsCache = null;
    } catch (error) {
      console.error("API product save failed:", error);
      throw error;
    }
  },

  async saveBlogPost(post: any) {
    const path = post.id ? `blog_posts/${post.id}` : "blog_posts";
    try {
      const url = post.id ? `/api/blog/${post.id}` : '/api/blog';
      const method = post.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(post)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save blog post');
      }
    } catch (error) {
      console.error("API blog post save failed:", error);
      throw error;
    }
  },

  async saveCategory(category: any) {
    const path = category.id ? `categories/${category.id}` : "categories";
    try {
      const url = category.id ? `/api/categories/${category.id}` : '/api/categories';
      const method = category.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(category)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
      
      this._categoriesCache = null;
    } catch (error) {
      console.error("API category save failed:", error);
      throw error;
    }
  },

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete category');
      this._categoriesCache = null;
    } catch (error) {
      console.error("API category delete failed:", error);
      throw error;
    }
  },

  async savePolicy(policy: any) {
    const path = policy.id ? `policies/${policy.id}` : "policies";
    try {
      const url = policy.id ? `/api/policies/${policy.id}` : '/api/policies';
      const method = policy.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(policy)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save policy');
      }
    } catch (error) {
      console.error("API policy save failed:", error);
      throw error;
    }
  },

  async deletePolicy(id: string) {
    const path = `policies/${id}`;
    try {
      const response = await fetch(`/api/policies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete policy');
    } catch (error) {
      console.error("API policy delete failed:", error);
      throw error;
    }
  },

  async saveMessage(message: any) {
    const path = message.id ? `contact_messages/${message.id}` : "contact_messages";
    try {
      if (message.id) {
        const { id, ...data } = message;
        await setDoc(doc(db, "contact_messages", id), data, { merge: true });
      } else {
        await addDoc(collection(db, "contact_messages"), {
          ...message,
          date: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, message.id ? "write" : "create", path);
    }
  },

  async saveUserProfile(uid: string, profile: any) {
    const path = `users/${uid}`;
    try {
      await setDoc(doc(db, "users", uid), profile, { merge: true });
    } catch (error) {
      handleFirestoreError(error, "write", path);
    }
  },

  async getBlogPost(id: string) {
    const path = `blog_posts/${id}`;
    try {
      const docRef = doc(db, "blog_posts", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, "get", path);
    }
  },

  // User Dashboard Specific
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`/api/users/${uid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return null;
      const users = await response.json();
      // If the API returns a list (legacy) or a single user
      if (Array.isArray(users)) {
        return users.find((u: any) => u.id === uid) || null;
      }
      return users;
    } catch (error) {
      console.error(`API user profile ${uid} fetch failed:`, error);
      return null;
    }
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update profile');
    } catch (error) {
      console.error("API profile update failed:", error);
      throw error;
    }
  },

  async addAddress(userId: string, address: Omit<Address, 'id'>): Promise<void> {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      const currentAddresses = userDoc.data()?.addressBook || [];
      
      const newAddress = {
        ...address,
        id: Math.random().toString(36).substr(2, 9),
      };

      // If this is the first address or marked as default, unset other defaults
      const updatedAddresses = address.isDefault 
        ? currentAddresses.map((a: any) => ({ ...a, isDefault: false })).concat(newAddress)
        : currentAddresses.concat(newAddress);

      await updateDoc(userRef, {
        addressBook: updatedAddresses,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, "update", path);
    }
  },

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      const currentAddresses = userDoc.data()?.addressBook || [];
      
      const updatedAddresses = currentAddresses.filter((a: any) => a.id !== addressId);

      await updateDoc(userRef, {
        addressBook: updatedAddresses,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, "update", path);
    }
  },

  async updateAddress(userId: string, address: Address): Promise<void> {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      const currentAddresses = userDoc.data()?.addressBook || [];
      
      let updatedAddresses = currentAddresses.map((a: any) => 
        a.id === address.id ? address : (address.isDefault ? { ...a, isDefault: false } : a)
      );

      await updateDoc(userRef, {
        addressBook: updatedAddresses,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, "update", path);
    }
  },

  // Service Requests
  async createServiceRequest(request: Omit<ServiceRequest, 'id'>): Promise<string> {
    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error('Failed to create service request');
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error("API service request creation failed:", error);
      return "";
    }
  },

  async getUserServiceRequests(userId: string): Promise<ServiceRequest[]> {
    try {
      const response = await fetch('/api/service-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch service requests');
      return await response.json();
    } catch (error) {
      console.error("API service requests fetch failed:", error);
      return [];
    }
  },

  async getUserOrders(uid: string) {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
    } catch (error) {
      console.error("API orders fetch failed:", error);
      return [];
    }
  },

  async getUserLoadouts(uid: string) {
    try {
      const response = await fetch('/api/loadouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch loadouts');
      return await response.json();
    } catch (error) {
      console.error("API loadouts fetch failed:", error);
      return [];
    }
  },

  async saveLoadout(loadout: any) {
    try {
      const response = await fetch('/api/loadouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(loadout)
      });
      if (!response.ok) throw new Error('Failed to save loadout');
    } catch (error) {
      console.error("API loadout save failed:", error);
      throw error;
    }
  },

  async saveBuild(build: any) {
    try {
      const response = await fetch('/api/saved-builds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(build)
      });
      if (!response.ok) throw new Error('Failed to save build');
    } catch (error) {
      console.error("API build save failed:", error);
      throw error;
    }
  },

  async deleteBuild(id: string) {
    try {
      const response = await fetch(`/api/saved-builds/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete build');
    } catch (error) {
      console.error("API build deletion failed:", error);
      throw error;
    }
  },

  async getUserBuilds(uid: string) {
    try {
      const response = await fetch('/api/saved-builds', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch saved builds');
      return await response.json();
    } catch (error) {
      console.error("API saved builds fetch failed:", error);
      return [];
    }
  },

  // ERP / IMS
  async getWarehouses() {
    try {
      const response = await fetch('/api/admin/warehouses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      return await response.json();
    } catch (error) {
      console.error("API warehouses fetch failed:", error);
      return [];
    }
  },

  async saveWarehouse(warehouse: any) {
    try {
      const response = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(warehouse)
      });
      if (!response.ok) throw new Error('Failed to save warehouse');
    } catch (error) {
      console.error("API warehouse save failed:", error);
      throw error;
    }
  },

  async getSuppliers() {
    try {
      const response = await fetch('/api/admin/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return await response.json();
    } catch (error) {
      console.error("API suppliers fetch failed:", error);
      return [];
    }
  },

  async saveSupplier(supplier: any) {
    try {
      const response = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(supplier)
      });
      if (!response.ok) throw new Error('Failed to save supplier');
    } catch (error) {
      console.error("API supplier save failed:", error);
      throw error;
    }
  },

  async getPurchaseOrders() {
    try {
      const response = await fetch('/api/admin/purchase-orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      return await response.json();
    } catch (error) {
      console.error("API purchase orders fetch failed:", error);
      return [];
    }
  },

  async savePurchaseOrder(po: any) {
    try {
      const response = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(po)
      });
      if (!response.ok) throw new Error('Failed to save purchase order');
    } catch (error) {
      console.error("API purchase order save failed:", error);
      throw error;
    }
  },

  async getStock() {
    try {
      const response = await fetch('/api/admin/stock', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stock');
      return await response.json();
    } catch (error) {
      console.error("API stock fetch failed:", error);
      return [];
    }
  },

  async saveStockItem(item: any) {
    try {
      const response = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error('Failed to save stock item');
    } catch (error) {
      console.error("API stock item save failed:", error);
      throw error;
    }
  },

  async getInventoryLogs(productId?: string) {
    try {
      const url = productId ? `/api/admin/inventory-logs?productId=${productId}` : '/api/admin/inventory-logs';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch inventory logs');
      return await response.json();
    } catch (error) {
      console.error("API inventory logs fetch failed:", error);
      return [];
    }
  },

  async deleteWarehouse(id: string) {
    const path = "warehouses";
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, "delete", path);
    }
  },

  async deleteSupplier(id: string) {
    const path = "suppliers";
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, "delete", path);
    }
  },

  async deleteStockItem(id: string) {
    const path = "stock";
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, "delete", path);
    }
  },


  async logInventoryChange(log: any) {
    const path = "inventory_logs";
    try {
      await addDoc(collection(db, path), {
        ...log,
        timestamp: new Date().toISOString(),
        userId: auth.currentUser?.uid
      });
    } catch (error) {
      handleFirestoreError(error, "create", path);
    }
  },

  async getCurrencyRates() {
    const path = "currency_rates";
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, "get", path);
    }
  },

  async seedStockData(products: Product[]) {
    try {
      // 1. Ensure at least one warehouse exists
      const warehouses = await this.getWarehouses();
      let warehouseId = '';
      
      if (!warehouses || warehouses.length === 0) {
        warehouseId = 'wh-default';
        await this.saveWarehouse({
          id: warehouseId,
          name: 'Main Distribution Center',
          location: 'Central Hub',
          type: 'distribution'
        });
      } else {
        warehouseId = warehouses[0].id;
      }

      // 2. Process each product
      for (const product of products) {
        let updatedProduct = { ...product };
        let needsProductUpdate = false;

        // Generate random SKU if missing
        if (!product.sku) {
          const randomSku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          updatedProduct.sku = randomSku;
          needsProductUpdate = true;
        }

        // Generate random Barcode if missing
        if (!product.barcode) {
          const randomBarcode = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
          updatedProduct.barcode = randomBarcode;
          needsProductUpdate = true;
        }

        if (needsProductUpdate) {
          await this.saveProduct(updatedProduct);
        }

        // 3. Check if stock entry exists for this product and warehouse
        const stockQuery = query(
          collection(db, "stock"),
          where("productId", "==", product.id),
          where("warehouseId", "==", warehouseId)
        );
        const stockSnap = await getDocs(stockQuery);

        if (stockSnap.empty) {
          // Create random stock entry
          const randomQty = Math.floor(Math.random() * 50) + 10;
          await this.saveStockItem({
            productId: product.id,
            warehouseId: warehouseId,
            quantity: randomQty,
            reservedQuantity: 0,
            status: 'available',
            updatedAt: new Date().toISOString()
          });

          // Also update the product's main stock field for consistency
          await this.saveProduct({ ...updatedProduct, stock: randomQty });
          
          // Log the initial seeding
          await this.logInventoryChange({
            productId: product.id,
            sku: updatedProduct.sku,
            changeType: 'in',
            quantityChange: randomQty,
            previousBalance: 0,
            newBalance: randomQty,
            reason: 'Initial System Seeding'
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Error seeding stock data:", error);
      throw error;
    }
  },

  async findProductByCode(code: string): Promise<Product | null> {
    try {
      // Try SKU first
      const qSku = query(collection(db, "products"), where("sku", "==", code));
      const snapSku = await getDocs(qSku);
      if (!snapSku.empty) return { id: snapSku.docs[0].id, ...snapSku.docs[0].data() } as Product;

      // Try Barcode
      const qBarcode = query(collection(db, "products"), where("barcode", "==", code));
      const snapBarcode = await getDocs(qBarcode);
      if (!snapBarcode.empty) return { id: snapBarcode.docs[0].id, ...snapBarcode.docs[0].data() } as Product;

      return null;
    } catch (error) {
      console.error("Error finding product by code:", error);
      return null;
    }
  },

  async updateStockByCode(code: string, quantityChange: number, warehouseId: string, reason: string): Promise<boolean> {
    try {
      const product = await this.findProductByCode(code);
      if (!product) throw new Error("Product not found");

      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, "products", product.id);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) throw new Error("Product does not exist");
        
        const currentStock = productSnap.data().stock || 0;
        const newStock = currentStock + quantityChange;
        
        // Update main product stock
        transaction.update(productRef, { stock: newStock });

        // Update warehouse specific stock
        const stockQuery = query(
          collection(db, "stock"), 
          where("productId", "==", product.id),
          where("warehouseId", "==", warehouseId)
        );
        const stockSnap = await getDocs(stockQuery);
        
        if (!stockSnap.empty) {
          const stockDoc = stockSnap.docs[0];
          const currentWarehouseStock = stockDoc.data().quantity || 0;
          transaction.update(doc(db, "stock", stockDoc.id), { 
            quantity: currentWarehouseStock + quantityChange 
          });
        } else {
          const newStockRef = doc(collection(db, "stock"));
          transaction.set(newStockRef, {
            productId: product.id,
            warehouseId,
            quantity: quantityChange,
            reservedQuantity: 0,
            status: 'available',
            updatedAt: new Date().toISOString()
          });
        }

        // Log the change
        const logRef = doc(collection(db, "inventory_logs"));
        transaction.set(logRef, {
          productId: product.id,
          sku: product.sku || '',
          changeType: quantityChange > 0 ? 'in' : 'out',
          quantityChange,
          previousBalance: currentStock,
          newBalance: newStock,
          reason,
          timestamp: new Date().toISOString(),
          userId: auth.currentUser?.uid
        });
      });

      return true;
    } catch (error) {
      console.error("Error updating stock by code:", error);
      throw error;
    }
  },

  async saveCurrencyRate(rate: any) {
    const path = `currency_rates/${rate.code}`;
    try {
      await setDoc(doc(db, "currency_rates", rate.code), {
        ...rate,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async receivePurchaseOrder(poId: string, warehouseId: string) {
    try {
      return await runTransaction(db, async (transaction) => {
        const poRef = doc(db, "purchase_orders", poId);
        const poSnap = await transaction.get(poRef);
        if (!poSnap.exists()) throw new Error("Purchase order not found");
        const po = poSnap.data();
        if (po.status === 'received') throw new Error("Purchase order already received");

        const timestamp = new Date().toISOString();

        // Update each item's stock
        for (const item of po.items) {
          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);
          
          if (productSnap.exists()) {
            const product = productSnap.data();
            transaction.update(productRef, {
              stock: increment(item.quantity)
            });

            // Log the change
            const logRef = doc(collection(db, "inventory_logs"));
            transaction.set(logRef, {
              productId: item.productId,
              sku: product.sku || '',
              type: 'in',
              quantity: item.quantity,
              previousBalance: product.stock,
              newBalance: product.stock + item.quantity,
              user: 'System (PO Received)',
              timestamp,
              reason: `PO Received: ${poId}`,
              referenceId: poId
            });

            // Update stock item in warehouse
            const stockQuery = query(
              collection(db, "stock_items"),
              where("productId", "==", item.productId),
              where("warehouseId", "==", warehouseId)
            );
            const stockSnaps = await getDocs(stockQuery);
            
            if (stockSnaps.empty) {
              const newStockRef = doc(collection(db, "stock_items"));
              transaction.set(newStockRef, {
                productId: item.productId,
                warehouseId,
                quantity: item.quantity,
                reservedQuantity: 0,
                status: 'available',
                lastUpdated: timestamp
              });
            } else {
              const stockDoc = stockSnaps.docs[0];
              transaction.update(stockDoc.ref, {
                quantity: increment(item.quantity),
                lastUpdated: timestamp
              });
            }
          }
        }

        // Update PO status
        transaction.update(poRef, {
          status: 'received',
          receivedAt: timestamp,
          warehouseId
        });

        return true;
      });
    } catch (error) {
      console.error("Error receiving purchase order:", error);
      throw error;
    }
  },

  // E-commerce Full Cycle
  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'auditTrail'>) {
    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();
    
    try {
      return await runTransaction(db, async (transaction) => {
        // 1. Fetch all products and categories for authoritative calculation
        const productRefs = orderData.items.map(item => doc(db, "products", item.productId));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        
        // Fetch categories for category-level discounts
        const categoryIds = [...new Set(productSnaps.map(snap => (snap.data() as Product).category))];
        const categoryRefs = categoryIds.map(id => doc(db, "categories", id));
        const categorySnaps = await Promise.all(categoryRefs.map(ref => transaction.get(ref)));
        const categoriesMap = categorySnaps.reduce((acc, snap) => {
          if (snap.exists()) acc[snap.id] = snap.data() as Category;
          return acc;
        }, {} as Record<string, Category>);

        // Fetch user profile if not guest
        let userProfile: UserProfile | null = null;
        if (orderData.userId !== 'guest') {
          const userSnap = await transaction.get(doc(db, "users", orderData.userId));
          if (userSnap.exists()) userProfile = userSnap.data() as UserProfile;
        }

        let authoritativeSubtotal = 0;
        let authoritativeProfit = 0;
        const updatedItems: OrderItem[] = [];

        for (let i = 0; i < productSnaps.length; i++) {
          const snap = productSnaps[i];
          const item = orderData.items[i];
          if (!snap.exists()) throw new Error(`Product ${item.name} not found`);
          const product = snap.data() as Product;
          
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${product.stock}`);
          }

          // Authoritative Price Calculation (apply best discount)
          const productDiscount = product.discount || 0;
          const categoryDiscount = categoriesMap[product.category]?.discount || 0;
          const userDiscount = userProfile?.discountLevel || 0;
          
          // Use the highest applicable discount
          const bestDiscount = Math.max(productDiscount, categoryDiscount, userDiscount);
          const discountedPrice = product.price * (1 - bestDiscount / 100);
          
          authoritativeSubtotal += discountedPrice * item.quantity;
          
          // Profit calculation: (Price - LandingCost) * Qty
          const landingCost = product.landingCost || (product.price * 0.6);
          authoritativeProfit += (discountedPrice - landingCost) * item.quantity;

          updatedItems.push({
            ...item,
            price: discountedPrice,
            landingCost: landingCost,
            sku: product.sku || ''
          });

          // 2. Deduct stock
          transaction.update(productRefs[i], {
            stock: increment(-item.quantity)
          });

          // Log the change
          const logRef = doc(collection(db, "inventory_logs"));
          transaction.set(logRef, {
            productId: item.productId,
            sku: product.sku || '',
            type: orderData.payment.method === 'cod' ? 'reservation' : 'out',
            quantity: item.quantity,
            previousBalance: product.stock,
            newBalance: product.stock - item.quantity,
            user: orderData.userId === 'guest' ? 'System (Guest)' : orderData.userId,
            timestamp,
            reason: `Order ${orderNumber}`
          });
        }

        const authoritativeTotal = authoritativeSubtotal + orderData.shippingCost;
        // Final profit also subtracts shipping cost if we pay for it (assuming shippingCost is what customer pays)
        // If we want actual profit, we'd need our actual shipping cost, but for now:
        // profit = (revenue from items - cost of items)
        
        // 3. Create/Update Customer Profile & CRM Stats
        let customerId = '';
        const phone = orderData.shipping.phone;
        const customerQuery = query(collection(db, "customers"), where("phone", "==", phone));
        const customerSnaps = await getDocs(customerQuery);
        
        if (customerSnaps.empty) {
          const newCustomerRef = doc(collection(db, "customers"));
          customerId = newCustomerRef.id;
          transaction.set(newCustomerRef, {
            email: orderData.shipping.email,
            phone: orderData.shipping.phone,
            fullName: orderData.shipping.fullName,
            isGhost: orderData.userId === 'guest',
            orderCount: 1,
            totalSpent: authoritativeTotal,
            lastOrderDate: timestamp,
            createdAt: timestamp
          });
        } else {
          const customerDoc = customerSnaps.docs[0];
          customerId = customerDoc.id;
          transaction.update(customerDoc.ref, {
            orderCount: increment(1),
            totalSpent: increment(authoritativeTotal),
            lastOrderDate: timestamp
          });
        }

        // 4. Update User Rank & Points
        if (orderData.userId !== 'guest' && userProfile) {
          const pointsEarned = Math.floor(authoritativeTotal * 0.1);
          const newPoints = (userProfile.points || 0) + pointsEarned;
          
          // Determine new rank
          let newRank = userProfile.rank || 'Recruit';
          let newDiscountLevel = userProfile.discountLevel || 0;
          let nextThreshold = 1000;

          for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
            if (newPoints >= RANK_THRESHOLDS[i].threshold) {
              newRank = RANK_THRESHOLDS[i].rank;
              newDiscountLevel = RANK_THRESHOLDS[i].discount;
              nextThreshold = RANK_THRESHOLDS[i + 1]?.threshold || RANK_THRESHOLDS[i].threshold;
              break;
            }
          }

          transaction.update(doc(db, "users", orderData.userId), {
            points: newPoints,
            rank: newRank,
            discountLevel: newDiscountLevel,
            nextRankThreshold: nextThreshold,
            updatedAt: timestamp
          });
        }

        // 5. Create Order
        const orderRef = doc(collection(db, "orders"));
        const finalOrder: Order = {
          ...orderData,
          id: orderRef.id,
          orderNumber,
          items: updatedItems,
          subtotal: authoritativeSubtotal,
          total: authoritativeTotal,
          profit: authoritativeProfit,
          createdAt: timestamp,
          updatedAt: timestamp,
          auditTrail: [{
            timestamp,
            action: 'created',
            user: orderData.userId === 'guest' ? 'Guest' : 'User',
            details: `Order created via ${orderData.payment.method}. Authoritative price check passed.`
          }]
        };
        
        transaction.set(orderRef, finalOrder);
        return finalOrder;
      });
    } catch (error) {
      console.error("Transaction failed: ", error);
      throw error;
    }
  },

  async getBIAnalytics(): Promise<BIWidgetData> {
    const ordersPath = "orders";
    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
    const startOfWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
    const startOfMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();

    try {
      const allOrdersSnap = await getDocs(collection(db, ordersPath));
      const orders = allOrdersSnap.docs.map(d => d.data() as Order);

      const filterByDate = (date: string) => orders.filter(o => o.createdAt >= date && o.status !== 'cancelled');

      const daily = filterByDate(startOfDay);
      const weekly = filterByDate(startOfWeek);
      const monthly = filterByDate(startOfMonth);

      const sum = (arr: Order[], key: 'total' | 'profit') => arr.reduce((acc, o) => acc + o[key], 0);

      // Top Sellers logic
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      orders.forEach(o => {
        if (o.status === 'cancelled') return;
        o.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        });
      });

      const topSellers = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Low Stock logic
      const productsSnap = await getDocs(collection(db, "products"));
      const lowStock = productsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Product))
        .filter(p => p.stock <= (p.minStockLevel || 5));

      return {
        revenue: sum(weekly, 'total'),
        profit: sum(weekly, 'profit'),
        conversionRate: 3.2, // Mocked
        avgOrderValue: weekly.length ? sum(weekly, 'total') / weekly.length : 0,
        salesVelocity: weekly.map(o => ({ date: new Date(o.createdAt).toLocaleDateString(), revenue: o.total, orders: 1 })),
        topSellers: topSellers.map(s => ({ ...s, sales: s.quantity })),
        lowStockAlerts: lowStock.map(p => ({ 
          id: p.id, 
          name: p.name, 
          sku: p.sku || 'N/A', 
          stock: p.stock, 
          velocity: 0,
          minLevel: p.minStockLevel || 5
        }))
      };
    } catch (error) {
      handleFirestoreError(error, "get", ordersPath);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status'], ttn?: string, userType: string = 'Admin', reason?: string) {
    const orderRef = doc(db, "orders", orderId);
    const timestamp = new Date().toISOString();
    
    try {
      const updateData: any = {
        status,
        updatedAt: timestamp,
        cancelRequested: false, // Clear request when status is updated
        'shipping.trackingNumber': ttn || '',
        'shipping.status': status === 'shipped' ? 'shipped' : 'pending',
        auditTrail: arrayUnion({
          timestamp,
          action: 'status_change',
          user: userType,
          details: `Status changed to ${status}${ttn ? ` with TTN: ${ttn}` : ''}${reason ? `. Reason: ${reason}` : ''}`
        })
      };

      if (reason && status === 'cancelled') {
        updateData.cancelReason = reason;
      }

      await updateDoc(orderRef, updateData);

      // If cancelled, release stock
      if (status === 'cancelled') {
        const snap = await getDoc(orderRef);
        const order = snap.data() as Order;
        await this.releaseOrderStock(order);
      }
    } catch (error) {
      handleFirestoreError(error, "update", `orders/${orderId}`);
    }
  },

  async requestOrderCancellation(orderId: string, userId: string) {
    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error("Order not found");
    
    const order = snap.data() as Order;
    if (order.userId !== userId) {
      throw new Error("Unauthorized");
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new Error("Cancellation can only be requested for pending or processing orders");
    }

    const timestamp = new Date().toISOString();
    try {
      await updateDoc(orderRef, {
        cancelRequested: true,
        cancelRequestedAt: timestamp,
        updatedAt: timestamp,
        auditTrail: arrayUnion({
          timestamp,
          action: 'cancellation_requested',
          user: 'User',
          details: 'User requested order cancellation'
        })
      });
    } catch (error) {
      handleFirestoreError(error, "update", `orders/${orderId}`);
    }
  },

  async cancelOrder(orderId: string, userId: string) {
    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error("Order not found");
    
    const order = snap.data() as Order;
    if (order.userId !== userId && userId !== 'admin') {
      throw new Error("Unauthorized to cancel this order");
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new Error("Order cannot be cancelled in its current state");
    }

    return this.updateOrderStatus(orderId, 'cancelled', undefined, userId === 'admin' ? 'Admin' : 'User');
  },

  async generateInvoice(orderId: string): Promise<string> {
    const orderSnap = await getDoc(doc(db, 'orders', orderId));
    if (!orderSnap.exists()) throw new Error('Order not found');
    const order = orderSnap.data() as Order;

    return `
      <div style="font-family: sans-serif; padding: 40px; color: #333; background: white;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <h1 style="margin: 0; color: #ef4444;">TACTICAL HUB</h1>
            <p>Order #${order.orderNumber}</p>
          </div>
          <div style="text-align: right;">
            <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Status: ${order.status.toUpperCase()}</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Billed To:</h3>
            <p>${order.shipping.fullName}</p>
            <p>${order.shipping.email}</p>
            <p>${order.shipping.phone}</p>
          </div>
          <div>
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Shipping Address:</h3>
            <p>${order.shipping.address}</p>
            <p>${order.shipping.city}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #eee;">Item</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid #eee;">Qty</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #eee;">Price</th>
              <th style="text-align: right; padding: 12px; border-bottom: 2px solid #eee;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">€${item.price.toFixed(2)}</td>
                <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">€${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: right; font-size: 1.2em;">
          <p>Subtotal: €${order.subtotal.toFixed(2)}</p>
          <p>Shipping: €${order.shippingCost.toFixed(2)}</p>
          <p style="font-weight: bold; color: #ef4444; font-size: 1.5em;">Total: €${order.total.toFixed(2)}</p>
        </div>

        <div style="margin-top: 80px; font-size: 0.8em; color: #999; text-align: center;">
          <p>Thank you for your business!</p>
          <p>Tactical Hub - Professional Airsoft Equipment</p>
        </div>
      </div>
    `;
  },

  async syncCourierAPI(orderId: string): Promise<{ trackingNumber: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const trackingNumber = `NP${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    await updateDoc(doc(db, 'orders', orderId), {
      'shipping.trackingNumber': trackingNumber,
      'shipping.status': 'shipped',
      status: 'shipped',
      updatedAt: new Date().toISOString(),
      auditTrail: arrayUnion({
        action: 'status_change',
        timestamp: new Date().toISOString(),
        user: 'System',
        details: `Generated tracking number: ${trackingNumber}`
      })
    });

    return { trackingNumber };
  },

  async releaseOrderStock(order: Order) {
    await runTransaction(db, async (transaction) => {
      for (const item of order.items) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await transaction.get(productRef);
        if (productSnap.exists()) {
          const product = productSnap.data() as Product;
          transaction.update(productRef, {
            stock: increment(item.quantity)
          });

          const logRef = doc(collection(db, "inventory_logs"));
          transaction.set(logRef, {
            productId: item.productId,
            sku: product.sku || '',
            type: 'release',
            quantity: item.quantity,
            previousBalance: product.stock,
            newBalance: product.stock + item.quantity,
            user: 'System (Cancellation)',
            timestamp: new Date().toISOString(),
            reason: `Order ${order.orderNumber} cancelled`
          });
        }
      }
    });
  }
};
