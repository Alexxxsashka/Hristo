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
  Globe,
  Tag,
  Menu,
  History,
  Ticket,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useShopStore } from '../store/shopStore';
import { useOrderStore } from '../store/orderStore';
import { useSettingsStore } from '../store/settingsStore';
import { WEAPON_SLOTS, MODULE_CATEGORIES, BLOG_CATEGORIES } from '../constants';
import { Category, Product, BlogPost, PolicyPage, Characteristic, BIWidgetData, Order, ServiceRequest } from '../types';
import { databaseService } from '../services/databaseService';
import { formatEnum, formatModelName } from '../utils/format';
import { formatLabel } from '../utils/formatText';
import { NoImage } from '../components/NoImage';
import { syncManager } from '../utils/sync';
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
import { ServiceRequestManager } from '../components/admin/ServiceRequestManager';
import { ReportModal } from '../components/admin/ReportModal';
import { AuditManager } from '../components/admin/AuditManager';
import { CouponManager } from '../components/admin/CouponManager';
import { AuditLog } from '../types';
import { DashboardSkeleton, TableRowSkeleton } from '../components/Skeleton';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'add' | 'categories' | 'add-category' | 'blog' | 'messages' | 'policies' | 'orders' | 'coupons' | 'settings' | 'audit'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { products, categories, fetchProducts, fetchCategories, deleteProduct: deleteProductStore } = useShopStore();
  const { orders, fetchOrders } = useOrderStore();
  const { settings, fetchSettings } = useSettingsStore();
  
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [policies, setPolicies] = useState<PolicyPage[]>([]);
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
  const { user, logout, isInitialized } = useAuthStore();

  const isDataLoading = React.useRef(false);
  const loadAllData = async (force = false) => {
    if (isDataLoading.current) return;
    
    const isFirstLoad = products.length === 0 && orders.length === 0;
    if (isFirstLoad || force) {
      setIsLoading(true);
    }
    
    isDataLoading.current = true;
    
    try {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBlogPosts(),
        fetchPolicies(),
        fetchOrders(),
        fetchSettings(),
        databaseService.getUsers().then(u => setUsersList(u || [])),
        databaseService.getMessages().then(m => setMessages(m || [])),
        databaseService.getAllServiceRequests().then(sr => setServiceRequests(sr as ServiceRequest[] || [])),
        fetchAuditLogs()
      ]);
    } catch (e) {
      console.error('Data loading error:', e);
    } finally {
      setIsLoading(false);
      isDataLoading.current = false;
    }
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
    if (!isInitialized) return;
    
    const isAdmin = user?.role === 'admin';
    if (!user || !isAdmin) {
      if (isInitialized) navigate('/login');
      return;
    }

    loadAllData();

    const auditInterval = setInterval(fetchAuditLogs, 10000);
    const interval = setInterval(() => {
      fetchOrders();
      fetchProducts();
    }, 20000);

    return () => {
      clearInterval(auditInterval);
      clearInterval(interval);
    };
  }, [user?.id, user?.role, navigate, isInitialized]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteProductStore(id);
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

  const deleteServiceRequest = async (id: string) => {
    try {
      await databaseService.deleteServiceRequest(id);
      setServiceRequests(serviceRequests.filter(sr => sr.id !== id));
      showNotification('Service request deleted successfully');
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to delete service request', err);
      showNotification('Failed to delete service request', 'error');
    }
  };

  const updateServiceRequestStatus = async (id: string, status: string, newUpdate?: string) => {
    try {
      const updates: any = { status };
      if (newUpdate) {
        const req = serviceRequests.find(r => r.id === id);
        if (req) {
          updates.updates = [...req.updates, { date: new Date().toLocaleDateString(), message: newUpdate }];
        }
      }
      await databaseService.updateServiceRequest(id, updates);
      showNotification('Status updated successfully');
      fetchAuditLogs();
      loadAllData(); // reload to get fresh data
    } catch (err) {
      console.error('Failed to update service request', err);
      showNotification('Failed to update service request', 'error');
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex text-[var(--text-primary)] relative transition-colors duration-300">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 z-[120] w-64 bg-[var(--admin-sidebar-bg)] border-r border-white/10 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Settings className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-white leading-none">Admin</span>
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-1">Control Panel</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<ShoppingBag size={20} />}
            label="Orders"
            active={activeTab === 'orders'}
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<Ticket size={20} />}
            label="Coupons"
            active={activeTab === 'coupons'}
            onClick={() => { setActiveTab('coupons'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<Package size={20} />}
            label="Products"
            active={activeTab === 'products'}
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<Layers size={20} />}
            label="Categories"
            active={activeTab === 'categories'}
            onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<FileText size={20} />}
            label="Blog"
            active={activeTab === 'blog'}
            onClick={() => { setActiveTab('blog'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<MessageSquare size={20} />}
            label="Messages"
            active={activeTab === 'messages'}
            badge={messages.length + serviceRequests.length > 0 ? messages.length + serviceRequests.length : undefined}
            onClick={() => { setActiveTab('messages'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<Shield size={20} />}
            label="Policies"
            active={activeTab === 'policies'}
            onClick={() => { setActiveTab('policies'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<Globe size={20} />}
            label="Website"
            active={activeTab === 'settings'}
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          />
          <SidebarItem
            icon={<History size={20} />}
            label="Audit"
            active={activeTab === 'audit'}
            onClick={() => { setActiveTab('audit'); setIsSidebarOpen(false); }}
          />
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Floating Mobile Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 p-3 lg:hidden bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-2xl shadow-xl z-50 text-[var(--text-secondary)]"
        >
          <Menu size={20} />
        </button>

        <div className="p-4 sm:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Dashboard</h2>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Store Performance Overview</p>
                  </div>
                  <button 
                    onClick={() => loadAllData(true)}
                    className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {isLoading ? (
                  <DashboardSkeleton />
                ) : (
                  <>
                    <BIAnalytics orders={orders} users={users_list} />
                    <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-8 rounded-[32px] border border-[var(--border-color)] relative overflow-hidden shadow-sm">
                      <div className="relative z-10 max-w-2xl">
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Welcome to Admin Panel</h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
                          This is where you manage your entire store.
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
                      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-5" />
                    </div>
                  </>
                )}
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
                  onUpdate={() => { fetchOrders(); fetchAuditLogs(); }}
                />
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Inventory</h2>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Manage Products & Stock</p>
                  </div>
                </div>

                {/* Product Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                      <input
                        type="text"
                        placeholder="Search products, brand, or SKU..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                      <select
                        value={productFilter}
                        onChange={e => setProductFilter(e.target.value as any)}
                        className="pl-12 pr-10 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-red-600 appearance-none font-bold text-xs uppercase tracking-widest min-w-[160px]"
                      >
                        <option value="all">All Products</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="premium">Premium ({'>'}€500)</option>
                      </select>
                    </div>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                      <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="pl-12 pr-10 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl outline-none focus:ring-2 focus:ring-red-600 appearance-none font-bold text-xs uppercase tracking-widest min-w-[160px]"
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
                      className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all border border-[var(--border-color)]"
                    >
                      <FileText size={16} />
                      Report (PDF)
                    </button>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setActiveTab('add');
                      }}
                      className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
                    >
                      <Plus size={18} />
                      Add Product
                    </button>
                  </div>
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Product</th>
                        <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">SKU</th>
                        <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Stock</th>
                        <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Price</th>
                        <th className="px-6 py-4 font-semibold text-[var(--text-secondary)]">Discount</th>
                        <th className="px-6 py-4 font-semibold text-[var(--text-secondary)] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i}>
                            <td colSpan={6} className="px-0 py-0">
                              <TableRowSkeleton columns={6} />
                            </td>
                          </tr>
                        ))
                      ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                          <tr key={product.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] relative">
                                  {product.image || (product.images && product.images.length > 0) ? (
                                    <img 
                                      src={product.images && product.images.length > 0 ? product.images[0] : product.image} 
                                      className="w-full h-full object-cover"
                                      alt=""
                                    />
                                  ) : (
                                    <NoImage className="w-full h-full" iconSize={16} text="" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-[var(--text-primary)]">{product.name}</div>
                                  <div className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-mono text-[var(--text-secondary)]">{product.sku || '-'}</td>
                            <td className="px-6 py-4">
                              <div className={`font-bold ${product.stock <= (product.minStockLevel || 0) ? 'text-red-600' : 'text-[var(--text-primary)]'}`}>
                                {product.stock}
                              </div>
                              {product.stock <= (product.minStockLevel || 0) && (
                                <div className="text-[10px] text-red-500 font-bold uppercase">Low Stock</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-[var(--text-secondary)] font-medium">€{product.price}</td>
                            <td className="px-6 py-4">
                              {product.discount ? (
                                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                                  -{product.discount}%
                                </span>
                              ) : (
                                <span className="text-[var(--text-secondary)] opacity-50 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setActiveTab('add');
                                  }}
                                  className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center justify-center text-[var(--text-secondary)]">
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
                <div className="flex items-center justify-between mb-6 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm font-bold"
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
                serviceRequests={serviceRequests}
                onConfirm={confirmAction}
                onDelete={deleteMessage}
                onDeleteServiceRequest={deleteServiceRequest}
                onUpdateServiceRequestStatus={updateServiceRequestStatus}
              />
            )}

            {activeTab === 'coupons' && (
              <CouponManager />
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
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-[32px] max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Confirm Action</h3>
              <p className="text-[var(--text-secondary)] mb-8 leading-relaxed font-medium">{confirmDialog.message}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDialog(null)}
                  disabled={isConfirmingAction}
                  className="flex-1 py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-bold transition-all disabled:opacity-50"
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
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
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

const SidebarItem = ({ icon, label, description, showHelp, active, badge, onClick }: { icon: any, label: string, description?: string, showHelp?: boolean, active: boolean, badge?: number, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col gap-1 px-4 py-3 rounded-xl transition-all group ${active
      ? 'bg-white/20 text-white shadow-xl backdrop-blur-md'
      : 'text-[var(--admin-sidebar-text)] hover:bg-white/10 hover:text-white'
      }`}
  >
    <div className="flex items-center gap-3 w-full">
      {icon}
      <span className="font-bold text-sm uppercase tracking-widest">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {active && badge === undefined && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </div>
    {showHelp && description && (
      <span className={`text-[10px] text-left font-medium transition-all ${active ? 'text-white/90' : 'text-white/50'}`}>
        {description}
      </span>
    )}
  </button>
);

const QuickLink = ({ title, desc, onClick, icon }: { title: string, desc: string, onClick: () => void, icon: any }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl transition-all text-left group"
  >
    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shadow-red-600/20">
      {icon}
    </div>
    <div>
      <div className="font-bold text-sm text-[var(--text-primary)]">{title}</div>
      <div className="text-xs text-[var(--text-secondary)]">{desc}</div>
    </div>
  </button>
);
