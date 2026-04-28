import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Plus,
  LogOut,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  ChevronRight,
  Settings,
  Layers,
  Crosshair,
  Check,
  FileText,
  Search,
  MessageSquare,
  Mail,
  Shield,
  Database,
  ShoppingCart,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Filter,
  RefreshCw,
  Minus,
  ShoppingBag,
  Eye,
  Truck,
  Barcode,
  Scan,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { WEAPON_SLOTS, MODULE_CATEGORIES, BLOG_CATEGORIES } from '../constants';
import { Category, Product, BlogPost, PolicyPage, Characteristic, BIWidgetData, Order } from '../types';
import { databaseService } from '../services/databaseService';
import { formatEnum, formatModelName } from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';



import { generateOrdersReport, generateProductsReport } from '../utils/reportGenerator';
import { BIAnalytics } from '../components/admin/BIAnalytics';
import { BlogManager } from '../components/admin/BlogManager';
import { OrderManager } from '../components/admin/OrderManager';
import { ProductForm } from '../components/admin/ProductForm';
import { PolicyManager } from '../components/admin/PolicyManager';

import { SiteSettingsManager } from '../components/admin/SiteSettingsManager';
import { CategoryManager } from '../components/admin/CategoryManager';
import { CategoryForm } from '../components/admin/CategoryForm';
import { MessageManager } from '../components/admin/MessageManager';
import { ReportModal } from '../components/admin/ReportModal';
import { AuditManager } from '../components/admin/AuditManager';
import { AuditLog } from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'add' | 'categories' | 'add-category' | 'blog' | 'messages' | 'policies' | 'orders' | 'settings' | 'audit'>('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [policies, setPolicies] = useState<PolicyPage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users_list, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productFilter, setProductFilter] = useState<'all' | 'out_of_stock' | 'premium'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'shipped'>('all');
  const [indexedSearch, setIndexedSearch] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [isProductReportModalOpen, setIsProductReportModalOpen] = useState(false);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadAllData();
    
    // 🕵️ Audit Real-time Polling (Every 10 seconds to catch actions from other admins)
    const auditInterval = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(auditInterval);
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchProducts().catch(e => console.error('Failed to fetch products:', e)),
      fetchCategories().catch(e => console.error('Failed to fetch categories:', e)),
      fetchBlogPosts().catch(e => console.error('Failed to fetch blog posts:', e)),
      fetchPolicies().catch(e => console.error('Failed to fetch policies:', e)),
      fetchOrdersInternal().catch(e => console.error('Failed to fetch orders:', e)),
      databaseService.getUsers().then(u => setUsersList(u || [])).catch(e => console.error('Failed to fetch users:', e)),
      databaseService.getMessages().then(m => setMessages(m || [])).catch(e => console.error('Failed to fetch messages:', e)),
      fetchAuditLogs()
    ]);
    setIsLoading(false);
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await databaseService.getAuditLogs();
      setAuditLogs(logs || []);
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    }
  };



  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    loadAllData();


    // Auto-refresh orders and products in the background every 30 seconds
    const interval = setInterval(() => {
      fetchOrdersInternal();
      fetchProducts();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const fetchProducts = async () => {
    try {
      const p = await databaseService.getProducts();
      setProducts(p as Product[] || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const c = await databaseService.getCategories();
      setCategories(c || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const b = await databaseService.getBlogPosts();
      setBlogPosts(b as BlogPost[] || []);
    } catch (err) {
      console.error('Failed to fetch blog posts', err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const pol = await databaseService.getPolicies();
      setPolicies(pol as PolicyPage[] || []);
    } catch (err) {
      console.error('Failed to fetch policies', err);
    }
  };

  const fetchOrdersInternal = async () => {
    try {
      const o = await databaseService.getAllOrders();
      setOrders(o || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const deleteProduct = async (id: string) => {
    try {
      await databaseService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      showNotification('Product deleted successfully');
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to delete product', err);
      showNotification('Failed to delete product', 'error');
    }
  };

  const deletePost = async (id: string) => {
    try {
      await databaseService.deleteBlogPost(id);
      setBlogPosts(blogPosts.filter(p => p.id !== id));
      showNotification('Post deleted successfully');
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to delete post', err);
      showNotification('Failed to delete post', 'error');
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await databaseService.deleteMessage(id);
      setMessages(messages.filter(m => m.id !== id));
      showNotification('Message deleted successfully');
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to delete message', err);
      showNotification('Failed to delete message', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchLower) ||
      p.brand.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower) ||
      p.category?.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower);

    const matchesFilter = 
      productFilter === 'all' ||
      (productFilter === 'out_of_stock' && p.stock <= (p.minStockLevel || 0)) ||
      (productFilter === 'premium' && p.price > 500);

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter || p.subcategory === categoryFilter;

    return matchesSearch && matchesFilter && matchesCategory;
  });

  const filteredBlogPosts = blogPosts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900">
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Settings className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-zinc-900 leading-none">Admin</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Control Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            description="Overview of your store stats"
            showHelp={showHelp}
            active={activeTab === 'dashboard'}
            onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
          />
          <SidebarItem
            icon={<ShoppingBag size={20} />}
            label="Orders"
            description="Fulfillment & Invoices"
            showHelp={showHelp}
            active={activeTab === 'orders'}
            onClick={() => { setActiveTab('orders'); setSearchQuery(''); }}
          />
          <SidebarItem
            icon={<Package size={20} />}
            label="Products"
            description="Manage your inventory"
            showHelp={showHelp}
            active={activeTab === 'products'}
            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
          />
          <SidebarItem
            icon={<Layers size={20} />}
            label="Categories"
            description="Organize your shop"
            showHelp={showHelp}
            active={activeTab === 'categories'}
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Blog"
            description="Write news & articles"
            showHelp={showHelp}
            active={activeTab === 'blog'}
            onClick={() => { setActiveTab('blog'); setSearchQuery(''); }}
          />
          <SidebarItem
            icon={<MessageSquare size={20} />}
            label="Messages"
            description="Customer inquiries"
            showHelp={showHelp}
            active={activeTab === 'messages'}
            onClick={() => { setActiveTab('messages'); setSearchQuery(''); }}
          />
          <SidebarItem
            icon={<Shield size={20} />}
            label="Policies"
            description="Legal & info pages"
            showHelp={showHelp}
            active={activeTab === 'policies'}
            onClick={() => { setActiveTab('policies'); setSearchQuery(''); }}
          />

          <SidebarItem
            icon={<Globe size={20} />}
            label="Website"
            description="Site branding & configuration"
            showHelp={showHelp}
            active={activeTab === 'settings'}
            onClick={() => { setActiveTab('settings'); setSearchQuery(''); }}
          />


          <SidebarItem
            icon={<Shield size={18} />}
            label="Audit"
            active={activeTab === 'audit'}
            onClick={() => { setActiveTab('audit'); setSearchQuery(''); }}
          />

        </nav>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${showHelp ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
          >
            <div className="flex items-center gap-3">
              <Settings size={16} />
              {showHelp ? 'Help Mode: ON' : 'Help Mode: OFF'}
            </div>
            {showHelp && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-zinc-200 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">
              {editingProduct ? 'Edit Product' : activeTab}
            </h2>
            {showHelp && (
              <span className="text-xs text-zinc-400 font-medium mt-1">
                {activeTab === 'dashboard' && 'Quick overview of your store performance'}
                {activeTab === 'orders' && 'Manage fulfillment and customer invoices'}
                {activeTab === 'products' && 'List of all items available in your shop'}
                {activeTab === 'add' && 'Form to create or update product details'}
                {activeTab === 'categories' && 'Manage how products are grouped'}
                {activeTab === 'blog' && 'Manage news and articles for your customers'}
                {activeTab === 'messages' && 'Read and reply to customer messages'}
                {activeTab === 'policies' && 'Edit legal documents and information pages'}
                {activeTab === 'audit' && 'Security Registry of system events'}
              </span>
            )}
          </div>

        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <BIAnalytics orders={orders} users={users_list} />

                <div className="bg-zinc-900 text-white p-8 rounded-[32px] relative overflow-hidden">
                  <div className="relative z-10 max-w-2xl">
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Welcome to Admin Panel</h3>
                    <p className="text-zinc-400 leading-relaxed mb-8">
                      This is where you manage your entire store. If you're new, we recommend turning on <b>Help Mode</b> in the sidebar to see explanations for each section.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <QuickLink
                        title="Add New Product"
                        desc="Start selling something new"
                        onClick={() => setActiveTab('add')}
                        icon={<Plus size={18} />}
                      />
                      <QuickLink
                        title="Check Messages"
                        desc="See what customers are asking"
                        onClick={() => setActiveTab('messages')}
                        icon={<MessageSquare size={18} />}
                      />
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <OrderManager
                  orders={orders}
                  onNotify={showNotification}
                  onConfirm={confirmAction}
                  onUpdate={() => { fetchOrdersInternal(); fetchAuditLogs(); }}
                />
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm mb-8">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search products, brand, or SKU..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <select
                        value={productFilter}
                        onChange={e => setProductFilter(e.target.value as any)}
                        className="pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none font-bold text-xs uppercase tracking-widest min-w-[160px]"
                      >
                        <option value="all">All Products</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="premium">Premium ({'>'}€500)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="pl-12 pr-10 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 appearance-none font-bold text-xs uppercase tracking-widest min-w-[160px]"
                      >
                        <option value="all">All Categories</option>
                        {categories.filter(c => !c.parent).map(mainCat => (
                          <React.Fragment key={mainCat.id}>
                            <option value={mainCat.id}>{mainCat.name}</option>
                            {categories.filter(c => c.parent === mainCat.id).map(subCat => (
                              <option key={subCat.id} value={subCat.id}>
                                &nbsp;&nbsp;— {subCat.name}
                              </option>
                            ))}
                          </React.Fragment>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsProductReportModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200"
                    >
                      <FileText size={16} />
                      Report (PDF)
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setActiveTab('add');
                      }}
                      className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/20"
                    >
                      <Plus size={18} />
                      Add Product
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-zinc-700">Product</th>
                        <th className="px-6 py-4 font-semibold text-zinc-700">SKU</th>
                        <th className="px-6 py-4 font-semibold text-zinc-700">Stock</th>
                        <th className="px-6 py-4 font-semibold text-zinc-700">Price</th>
                        <th className="px-6 py-4 font-semibold text-zinc-700">Discount</th>
                        <th className="px-6 py-4 font-semibold text-zinc-700 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
                                <Package size={20} />
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900">{product.name}</div>
                                <div className="text-xs text-zinc-500 truncate max-w-[200px]">{product.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-zinc-500">{product.sku || '-'}</td>
                          <td className="px-6 py-4">
                            <div className={`font-bold ${product.stock <= (product.minStockLevel || 0) ? 'text-red-600' : 'text-zinc-900'}`}>
                              {product.stock}
                            </div>
                            {product.stock <= (product.minStockLevel || 0) && (
                              <div className="text-[10px] text-red-500 font-bold uppercase">Low Stock</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 font-medium">€{product.price}</td>
                          <td className="px-6 py-4">
                            {product.discount ? (
                              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                                -{product.discount}%
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">

                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setActiveTab('add');
                                }}
                                className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => confirmAction(`Are you sure you want to delete the product "${product.name}"?`, () => deleteProduct(product.id))}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center justify-center text-zinc-400">
                              <Package size={48} className="mb-4 opacity-20" />
                              <p className="font-black uppercase tracking-widest text-xs">No products found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'add' && (
              <ProductForm
                initialData={editingProduct}
                categories={categories}
                weapons={products.filter(p => p.type === 'weapon')}
                showHelp={showHelp}
                onNotify={showNotification}
                onConfirm={confirmAction}
                onSuccess={() => {
                  fetchProducts();
                  fetchAuditLogs();
                  setActiveTab('products');
                  setEditingProduct(null);
                }}
                onCancel={() => {
                  setActiveTab('products');
                  setEditingProduct(null);
                }}
              />
            )}

            {activeTab === 'categories' && (
              <CategoryManager
                categories={categories}
                onUpdate={() => { fetchCategories(); fetchAuditLogs(); }}
                onNotify={showNotification}
                onConfirm={confirmAction}
                onAddCategory={(parentId?: string) => {
                  if (parentId) {
                    setEditingCategory({ parent: parentId, name: '', slots: [], compatibleModuleCategories: [], filters: [] } as any);
                  } else {
                    setEditingCategory(null);
                  }
                  setActiveTab('add-category');
                }}
                onEditCategory={(cat) => {
                  setEditingCategory(cat);
                  setActiveTab('add-category');
                }}
              />
            )}

            {activeTab === 'add-category' && (
              <CategoryForm
                initialData={editingCategory}
                categories={categories}
                showHelp={showHelp}
                onUpdate={() => { fetchCategories(); fetchAuditLogs(); }}
                onNotify={showNotification}
                onConfirm={confirmAction}
                onSuccess={() => {
                  fetchCategories();
                  fetchAuditLogs();
                  setActiveTab('categories');
                  setEditingCategory(null);
                }}
                onCancel={() => {
                  setActiveTab('categories');
                  setEditingCategory(null);
                }}
              />
            )}

            {activeTab === 'blog' && (
              <motion.div
                key="blog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-zinc-200">
                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <BlogManager
                  posts={filteredBlogPosts}
                  onUpdate={() => { fetchBlogPosts(); fetchAuditLogs(); }}
                  onNotify={showNotification}
                  onConfirm={confirmAction}
                />
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <MessageManager
                messages={messages}
                onConfirm={confirmAction}
                onDelete={deleteMessage}
              />
            )}

            {activeTab === 'orders' && (
              <OrderManager 
                orders={orders}
                onUpdate={() => { fetchOrdersInternal(); fetchAuditLogs(); }}
                onNotify={showNotification} 
                onConfirm={confirmAction}
              />
            )}

            {activeTab === 'policies' && (
              <PolicyManager
                policies={policies}
                onUpdate={() => { fetchPolicies(); fetchAuditLogs(); }}
                onNotify={showNotification}
                onConfirm={confirmAction}
              />
            )}



            {activeTab === 'settings' && (
              <SiteSettingsManager 
                onNotify={showNotification} 
                onConfirm={confirmAction} 
                onUpdate={() => { loadAllData(); fetchAuditLogs(); }} 
              />
            )}


            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AuditManager logs={auditLogs} onRefresh={loadAllData} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-red-600 border-red-500 text-white'
              }`}
          >
            {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <span className="font-bold text-sm tracking-wide">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Confirm Action</h3>
              <p className="text-zinc-400 mb-8 leading-relaxed font-medium">{confirmDialog.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDialog(null)}
                  disabled={isConfirmingAction}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsConfirmingAction(true);
                    try {
                      await confirmDialog.onConfirm();
                    } finally {
                      setIsConfirmingAction(false);
                      setConfirmDialog(null);
                    }
                  }}
                  disabled={isConfirmingAction}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isConfirmingAction ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={isProductReportModalOpen}
        onClose={() => setIsProductReportModalOpen(false)}
        title="Product Performance Report"
        onGenerate={(start, end) => {
          const filteredOrders = orders.filter(o => {
            const date = new Date(o.createdAt);
            return date >= start && date <= end;
          });
          generateProductsReport(products, filteredOrders, { start, end });
          showNotification(`Product report generated for ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
        }}
      />
    </div>
  );
};

const SidebarItem = ({ icon, label, description, showHelp, active, onClick }: { icon: any, label: string, description?: string, showHelp?: boolean, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col gap-1 px-4 py-3 rounded-xl transition-all group ${active
      ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'
      : 'text-zinc-500 hover:bg-zinc-100'
      }`}
  >
    <div className="flex items-center gap-3 w-full">
      {icon}
      <span className="font-bold text-sm uppercase tracking-widest">{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </div>
    {showHelp && description && (
      <span className={`text-[10px] text-left font-medium transition-all ${active ? 'text-zinc-400' : 'text-zinc-400'}`}>
        {description}
      </span>
    )}
  </button>
);

const QuickLink = ({ title, desc, onClick, icon }: { title: string, desc: string, onClick: () => void, icon: any }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all text-left group"
  >
    <div className="w-10 h-10 bg-zinc-700 group-hover:bg-zinc-600 rounded-xl flex items-center justify-center text-white transition-all">
      {icon}
    </div>
    <div>
      <div className="font-bold text-sm text-white">{title}</div>
      <div className="text-xs text-zinc-400">{desc}</div>
    </div>
  </button>
);
