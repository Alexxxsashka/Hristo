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



import { SiteSettingsManager } from '../components/admin/SiteSettingsManager';
import { StatisticTest } from '../components/admin/StatisticTest';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'add' | 'categories' | 'blog' | 'messages' | 'policies' | 'erp' | 'orders' | 'settings'>('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [policies, setPolicies] = useState<PolicyPage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFilter, setProductFilter] = useState<'all' | 'out_of_stock' | 'premium'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'shipped'>('all');
  const [indexedSearch, setIndexedSearch] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    
    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBlogPosts(),
        fetchPolicies(),
        fetchOrdersInternal(),
        databaseService.getMessages().then(m => setMessages(m || []))
      ]);
      setIsLoading(false);
    };

    loadAllData();
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
    confirmAction('Are you sure you want to delete this product?', async () => {
      try {
        await databaseService.deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
        showNotification('Product deleted successfully');
      } catch (err) {
        console.error('Failed to delete product', err);
        showNotification('Failed to delete product', 'error');
      }
    });
  };

  const deletePost = async (id: string) => {
    confirmAction('Are you sure you want to delete this post?', async () => {
      try {
        await databaseService.deleteBlogPost(id);
        setBlogPosts(blogPosts.filter(p => p.id !== id));
        showNotification('Post deleted successfully');
      } catch (err) {
        console.error('Failed to delete post', err);
        showNotification('Failed to delete post', 'error');
      }
    });
  };

  const deleteMessage = async (id: string) => {
    confirmAction('Are you sure you want to delete this message?', async () => {
      try {
        await databaseService.deleteMessage(id);
        setMessages(messages.filter(m => m.id !== id));
        showNotification('Message deleted successfully');
      } catch (err) {
        console.error('Failed to delete message', err);
        showNotification('Failed to delete message', 'error');
      }
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (productFilter === 'out_of_stock') return matchesSearch && p.stock <= 0;
    if (productFilter === 'premium') return matchesSearch && p.price > 500;
    
    if (indexedSearch) {
      return p.sku?.toLowerCase().includes(indexedSearch.toLowerCase()) || 
             p.id.toLowerCase().includes(indexedSearch.toLowerCase());
    }
    
    return matchesSearch;
  });

  const filteredBlogPosts = blogPosts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchOrders = async () => {
    try {
      const o = await databaseService.getAllOrders();
      return o;
    } catch { return []; }
  };

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
            icon={<Database size={20} />} 
            label="ERP / IMS" 
            description="Inventory & Procurement"
            showHelp={showHelp}
            active={activeTab === 'erp'} 
            onClick={() => { setActiveTab('erp'); setSearchQuery(''); }} 
          />
          <SidebarItem 
            icon={<Globe size={20} />} 
            label="Website" 
            description="Site branding & configuration"
            showHelp={showHelp}
            active={activeTab === 'settings'} 
            onClick={() => { setActiveTab('settings'); setSearchQuery(''); }} 
          />

        </nav>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
              showHelp ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
                <BIAnalytics />

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
                <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-200">
                  <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setOrderFilter('all')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        orderFilter === 'all' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400'
                      }`}
                    >All</button>
                    <button 
                      onClick={() => setOrderFilter('pending')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        orderFilter === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-400'
                      }`}
                    >Pending</button>
                  </div>
                  
                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="text"
                      placeholder="BindingSource.Find: Enter Order ID..."
                      value={indexedSearch}
                      onChange={(e) => setIndexedSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <OrderManager 
                   orders={orders}
                   externalFilter={orderFilter}
                   externalSearch={indexedSearch}
                   onNotify={showNotification}
                   onConfirm={confirmAction}
                   onUpdate={fetchOrdersInternal}
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
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-zinc-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setProductFilter('all')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          productFilter === 'all' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400'
                        }`}
                      >All</button>
                      <button 
                        onClick={() => setProductFilter('out_of_stock')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          productFilter === 'out_of_stock' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-400'
                        }`}
                      >Out of Stock</button>
                    </div>
                    
                    <div className="relative w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="text"
                        placeholder="BindingSource.Find: Enter SKU..."
                        value={indexedSearch}
                        onChange={(e) => setIndexedSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setActiveTab('add');
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/20"
                  >
                    <Plus size={18} />
                    ADD PRODUCT
                  </button>
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
                                onClick={() => deleteProduct(product.id)}
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
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                            No products found matching your search.
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
                onSuccess={() => {
                  fetchProducts();
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
                showHelp={showHelp}
                onUpdate={fetchCategories} 
                onNotify={showNotification}
                onConfirm={confirmAction}
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
                  onUpdate={fetchBlogPosts} 
                  onNotify={showNotification}
                  onConfirm={confirmAction}
                />
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <MessageManager 
                messages={messages} 
                onDelete={deleteMessage} 
              />
            )}

            {activeTab === 'policies' && (
              <PolicyManager 
                policies={policies} 
                onUpdate={fetchPolicies} 
                onNotify={showNotification}
                onConfirm={confirmAction}
              />
            )}

            {activeTab === 'erp' && (
              <ERPManager 
                products={products}
                onNotify={showNotification}
                onConfirm={confirmAction}
                onEditProduct={(p) => {
                  setEditingProduct(p);
                  setActiveTab('products');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SiteSettingsManager onNotify={showNotification} />
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
            className={`fixed bottom-8 left-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' 
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
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-900/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BIAnalytics = () => {
  const [data, setData] = useState<BIWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const analytics = await databaseService.getBIAnalytics();
        setData(analytics);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-zinc-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
          <Activity className="text-red-600" size={24} />
          Command Center
        </h3>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                timeRange === range ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Revenue" 
          value={`€${data.revenue.toLocaleString()}`} 
          trend={+12.5} 
          icon={<DollarSign className="text-emerald-600" />} 
        />
        <MetricCard 
          label="Net Profit" 
          value={`€${data.profit.toLocaleString()}`} 
          trend={+8.2} 
          icon={<TrendingUp className="text-blue-600" />} 
        />
        <MetricCard 
          label="Conversion Rate" 
          value={`${data.conversionRate.toFixed(2)}%`} 
          trend={-1.4} 
          icon={<Activity className="text-purple-600" />} 
        />
        <MetricCard 
          label="Avg. Order Value" 
          value={`€${data.avgOrderValue.toFixed(2)}`} 
          trend={+5.1} 
          icon={<ShoppingCart className="text-orange-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-black uppercase tracking-tighter">Sales Performance</h4>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-600 rounded-full" /> Revenue
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full" /> Orders
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesVelocity}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <h4 className="text-sm font-black uppercase tracking-tighter mb-8">Top Sellers</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.topSellers}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="sales"
                >
                  {data.topSellers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {data.topSellers.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-zinc-600 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-zinc-900">{item.sales} units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={18} />
              Low Stock Alerts
            </h4>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              {data.lowStockAlerts.length} Items
            </span>
          </div>
          <div className="space-y-4">
            {data.lowStockAlerts.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-zinc-200">
                    <Package size={20} className="text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">{item.name}</div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SKU: {item.sku}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-red-600">{item.stock} left</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Min: {item.minLevel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 text-white p-8 rounded-[32px] shadow-xl">
          <h4 className="text-sm font-black uppercase tracking-tighter mb-6">Recent Activity</h4>
          <div className="space-y-6">
            <ActivityItem 
              icon={<ShoppingCart size={16} className="text-emerald-500" />}
              title="New Order #ORD-8821"
              time="2 mins ago"
              desc="Customer purchased M4 Carbine Pro"
            />
            <ActivityItem 
              icon={<RefreshCw size={16} className="text-blue-500" />}
              title="Stock Sync Complete"
              time="15 mins ago"
              desc="ERP synchronized with Main Warehouse"
            />
            <ActivityItem 
              icon={<Users size={16} className="text-purple-500" />}
              title="New Customer Profile"
              time="1 hour ago"
              desc="Guest converted to Ghost Profile"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, trend, icon }: { label: string, value: string, trend: number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-[24px] border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-zinc-50 rounded-xl group-hover:bg-zinc-100 transition-colors">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-black text-zinc-900 tracking-tighter">{value}</div>
  </div>
);

const ActivityItem = ({ icon, title, time, desc }: { icon: React.ReactNode, title: string, time: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="mt-1">{icon}</div>
    <div>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-bold text-white">{title}</span>
        <span className="text-[10px] font-bold text-zinc-500 uppercase">{time}</span>
      </div>
      <p className="text-xs text-zinc-400">{desc}</p>
    </div>
  </div>
);

const PolicyManager = ({ policies, onUpdate, onNotify, onConfirm }: { 
  policies: PolicyPage[], 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void
}) => {
  const [editingPolicy, setEditingPolicy] = useState<Partial<PolicyPage> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const seedDefaultPolicies = async () => {
    setIsSeeding(true);
    try {
      const defaults = [
        {
          id: 'about-us',
          title: 'About Us',
          content: '# About Hristo Airsoft\n\nWelcome to Hristo Airsoft, your premier destination for high-quality airsoft equipment and tactical gear. Founded by enthusiasts for enthusiasts, we pride ourselves on offering the best selection of airsoft weapons, accessories, and professional service.\n\n## Our Mission\nTo provide the airsoft community with reliable equipment and expert knowledge to enhance their gaming experience.\n\n## Our Story\nStarted as a small local shop, we have grown into a leading regional provider of airsoft gear, serving thousands of satisfied customers.'
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          content: '# Privacy Policy\n\nLast updated: March 19, 2026\n\nAt Hristo Airsoft, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.\n\n## Information We Collect\n- Name and contact information\n- Shipping and billing addresses\n- Payment information (processed securely)\n- Order history\n\n## How We Use Your Information\nWe use your information to process orders, provide customer support, and improve our services.'
        },
        {
          id: 'terms-and-conditions',
          title: 'Terms & Conditions',
          content: '# Terms & Conditions\n\nBy using our website and purchasing our products, you agree to the following terms:\n\n## 1. Age Restriction\nYou must be at least 18 years old to purchase airsoft weapons.\n\n## 2. Safety\nAirsoft weapons must be used responsibly and in designated areas. Always wear eye protection.\n\n## 3. Shipping\nWe ship to countries where airsoft is legal. It is the customer\'s responsibility to know local laws.'
        },
        {
          id: 'shipping-policy',
          title: 'Shipping & Delivery',
          content: '# Shipping & Delivery\n\nWe offer fast and reliable shipping across Europe.\n\n## Delivery Times\n- Domestic: 1-3 business days\n- International: 5-10 business days\n\n## Tracking\nAll orders include a tracking number which will be sent to your email once the order is shipped.'
        },
        {
          id: 'refund-policy',
          title: 'Refund & Return Policy',
          content: '# Refund & Return Policy\n\nWe want you to be completely satisfied with your purchase.\n\n## Returns\nYou have 14 days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it.\n\n## Refunds\nOnce we receive your item, we will inspect it and notify you that we have received your returned item. If your return is approved, we will initiate a refund to your original method of payment.'
        }
      ];

      for (const policy of defaults) {
        await databaseService.savePolicy(policy);
      }
      onNotify('Default policies seeded successfully');
      onUpdate();
    } catch (err) {
      console.error('Failed to seed policies', err);
      onNotify('Failed to seed policies', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy || !editingPolicy.title || !editingPolicy.content) {
      onNotify('Please fill in both title and content', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const id = editingPolicy.id || editingPolicy.title.toLowerCase().replace(/\s+/g, '-');
      await databaseService.savePolicy({
        ...editingPolicy,
        id,
        lastUpdated: new Date().toISOString()
      } as PolicyPage);
      onNotify('Policy saved successfully');
      setEditingPolicy(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to save policy', err);
      onNotify('Failed to save policy', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    onConfirm('Are you sure you want to delete this policy?', async () => {
      try {
        await databaseService.deletePolicy(id);
        onNotify('Policy deleted successfully');
        onUpdate();
      } catch (err) {
        console.error('Failed to delete policy', err);
        onNotify('Failed to delete policy', 'error');
      }
    });
  };

  if (editingPolicy) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">{isNew ? 'New Policy' : 'Edit Policy'}</h3>
          <button onClick={() => setEditingPolicy(null)} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-6">
          {isNew && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Policy ID (slug, e.g. privacy-policy)</label>
              <input 
                type="text" 
                value={editingPolicy.id || ''}
                onChange={e => setEditingPolicy({ ...editingPolicy, id: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                placeholder="privacy-policy"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Title</label>
            <input 
              type="text" 
              value={editingPolicy.title || ''}
              onChange={e => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Content (Markdown supported)</label>
            <textarea 
              value={editingPolicy.content || ''}
              onChange={e => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-[400px] resize-none font-mono text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-100">
            <button 
              type="button" 
              onClick={() => setEditingPolicy(null)}
              className="px-8 py-3 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-12 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
            >
              Save Policy
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={seedDefaultPolicies}
            disabled={isSeeding}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
          >
            <Database size={20} />
            {isSeeding ? 'Seeding...' : 'Seed Default Policies'}
          </button>
        </div>
        <button 
          onClick={() => {
            setEditingPolicy({ title: '', content: '' });
            setIsNew(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
        >
          <Plus size={20} />
          New Policy
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map(policy => (
          <div key={policy.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <Shield size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingPolicy(policy);
                    setIsNew(false);
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                >
                  <Edit size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(policy.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{policy.title}</h3>
            <p className="text-zinc-500 text-sm line-clamp-3 mb-4">{policy.content.replace(/[#*`]/g, '')}</p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Zadnja izmjena: {policy.lastUpdated ? new Date(policy.lastUpdated).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MessageManager: React.FC<{ 
  messages: any[], 
  onDelete: (id: string) => void 
}> = ({ messages, onDelete }) => {
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Contact Messages</h2>
        <div className="px-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold text-zinc-600">
          Total: {messages.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedMessage?.id === msg.id 
                    ? 'bg-red-50 border-red-200 shadow-sm' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600">{msg.subject}</span>
                  <span className="text-[10px] font-bold text-zinc-400">{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-zinc-900 truncate">{msg.name}</h4>
                <p className="text-xs text-zinc-500 truncate">{msg.email}</p>
              </button>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-12 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No messages yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-8 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                      {selectedMessage.subject}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      {new Date(selectedMessage.date).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">{selectedMessage.name}</h3>
                  <p className="text-zinc-500 font-medium">{selectedMessage.email}</p>
                </div>
                <button 
                  onClick={() => { onDelete(selectedMessage.id); setSelectedMessage(null); }}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 min-h-[200px]">
                <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="flex gap-4">
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="px-6 py-3 bg-zinc-900 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all text-xs flex items-center gap-2"
                >
                  <Mail size={16} />
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-200">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300">
                <MessageSquare size={32} />
              </div>
              <div>
                <h4 className="text-zinc-900 font-bold">Select a message</h4>
                <p className="text-zinc-500 text-sm">Choose a message from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BlogManager = ({ posts, onUpdate, onNotify, onConfirm }: { 
  posts: BlogPost[], 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = editingPost?.image || '';
      if (imageFile) {
        const extension = imageFile.name.split('.').pop();
        const safeName = `blog_${Date.now()}.${extension}`;
        imageUrl = await databaseService.uploadFile(imageFile, `blog/images/${safeName}`);
      }

      const postToSave = {
        ...editingPost,
        image: imageUrl
      };

      await databaseService.saveBlogPost(postToSave);
      setIsEditing(false);
      setEditingPost(null);
      setImageFile(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to save blog post', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    onConfirm('Delete this post?', async () => {
      try {
        await databaseService.deleteBlogPost(id);
        onUpdate();
        onNotify('Post deleted successfully');
      } catch (err) {
        console.error('Failed to delete blog post', err);
        onNotify('Failed to delete blog post', 'error');
      }
    });
  };

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">{editingPost?.id ? 'Edit Post' : 'Create New Post'}</h3>
          <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Title</label>
              <input 
                type="text" 
                value={editingPost?.title || ''}
                onChange={e => setEditingPost({ ...editingPost, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Slug</label>
              <input 
                type="text" 
                value={editingPost?.slug || ''}
                onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Category</label>
              <select 
                value={editingPost?.category || ''}
                onChange={e => setEditingPost({ ...editingPost, category: e.target.value as any })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                required
              >
                <option value="">Select Category</option>
                {BLOG_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Author</label>
              <input 
                type="text" 
                value={editingPost?.author || ''}
                onChange={e => setEditingPost({ ...editingPost, author: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Excerpt</label>
            <textarea 
              value={editingPost?.excerpt || ''}
              onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-20 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Content (Markdown supported)</label>
            <textarea 
              value={editingPost?.content || ''}
              onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-64 resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Cover Image</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 transition-all cursor-pointer bg-zinc-50">
                <Upload size={24} className="text-zinc-400" />
                <span className="text-zinc-500 font-medium">
                  {imageFile ? imageFile.name : (editingPost?.image || 'Click to upload cover image')}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-100">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="px-8 py-3 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-12 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
            >
              Save Post
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => {
            setEditingPost({ title: '', slug: '', excerpt: '', content: '', category: 'News', author: 'Admin' });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Post</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {posts.map(post => (
              <tr key={post.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden flex items-center justify-center text-zinc-400">
                      {post.image ? (
                        <img src={post.image?.startsWith('http') ? post.image : post.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900">{post.title}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[300px]">{post.excerpt}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-500 text-sm">{post.date}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingPost(post);
                        setIsEditing(true);
                      }} 
                      className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                    >
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CategoryManager = ({ categories, showHelp, onUpdate, onNotify, onConfirm }: { 
  categories: Category[], 
  showHelp?: boolean, 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void
}) => {
  const [newCat, setNewCat] = useState<Partial<Category>>({ 
    name: '', 
    parent: '', 
    slots: [], 
    compatibleModuleCategories: [],
    filters: []
  });
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const categoryToSave = {
        ...newCat,
        id: editingCat ? editingCat.id : newCat.name?.toLowerCase().replace(/\s+/g, '_')
      };
      
      await databaseService.saveCategory(categoryToSave);
      setNewCat({ name: '', parent: '', slots: [], compatibleModuleCategories: [], filters: [] });
      setEditingCat(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to save category', err);
    }
  };

  const addFilter = () => {
    const filters = [...(newCat.filters || [])];
    filters.push({ id: `filter_${Date.now()}`, label: '', type: 'select', options: [] });
    setNewCat({ ...newCat, filters });
  };

  const removeFilter = (index: number) => {
    const filters = [...(newCat.filters || [])];
    filters.splice(index, 1);
    setNewCat({ ...newCat, filters });
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const filters = [...(newCat.filters || [])];
    filters[index] = { ...filters[index], [field]: value };
    setNewCat({ ...newCat, filters });
  };

  const addOption = (filterIndex: number) => {
    const filters = [...(newCat.filters || [])];
    const options = [...(filters[filterIndex].options || [])];
    options.push('');
    filters[filterIndex] = { ...filters[filterIndex], options };
    setNewCat({ ...newCat, filters });
  };

  const updateOption = (filterIndex: number, optionIndex: number, value: string) => {
    const filters = [...(newCat.filters || [])];
    const options = [...(filters[filterIndex].options || [])];
    options[optionIndex] = value;
    filters[filterIndex] = { ...filters[filterIndex], options };
    setNewCat({ ...newCat, filters });
  };

  const removeOption = (filterIndex: number, optionIndex: number) => {
    const filters = [...(newCat.filters || [])];
    const options = [...(filters[filterIndex].options || [])];
    options.splice(optionIndex, 1);
    filters[filterIndex] = { ...filters[filterIndex], options };
    setNewCat({ ...newCat, filters });
  };

  const toggleSlot = (slot: string) => {
    const currentSlots = newCat.slots || [];
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot];
    setNewCat({ ...newCat, slots: newSlots });
  };

  const toggleModuleCat = (cat: string) => {
    const currentCats = newCat.compatibleModuleCategories || [];
    const newCats = currentCats.includes(cat)
      ? currentCats.filter(c => c !== cat)
      : [...currentCats, cat];
    setNewCat({ ...newCat, compatibleModuleCategories: newCats });
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setNewCat(cat);
  };

  const handleDelete = async (id: string) => {
    onConfirm('Delete this category?', async () => {
      try {
        await databaseService.deleteCategory(id);
        onUpdate();
        onNotify('Category deleted successfully');
      } catch (err) {
        console.error('Failed to delete category', err);
        onNotify('Failed to delete category', 'error');
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{editingCat ? 'Edit Category' : 'Add New Category'}</h3>
          {showHelp && (
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest">
              Categories help organize your products and define 3D behavior
            </div>
          )}
        </div>
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder="Category Name"
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                required
              />
              {showHelp && <p className="text-[10px] text-zinc-400 font-medium px-1">Visible name of the category.</p>}
            </div>
            <div className="w-48 space-y-1">
              <select
                value={newCat.parent || ''}
                onChange={e => setNewCat({ ...newCat, parent: e.target.value || null })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
              >
                <option value="">No Parent</option>
                {categories.filter(c => !c.parent && c.id !== editingCat?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {showHelp && <p className="text-[10px] text-zinc-400 font-medium px-1">Main category (optional).</p>}
            </div>
            <div className="w-32 space-y-1">
              <input
                type="number"
                placeholder="Disc %"
                value={newCat.discount || 0}
                onChange={e => setNewCat({ ...newCat, discount: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                min="0"
                max="100"
              />
              {showHelp && <p className="text-[10px] text-zinc-400 font-medium px-1">Category discount.</p>}
            </div>
          </div>

          {/* Weapon Specific Settings */}
          {(newCat.id === 'weapons' || 
            newCat.parent === 'weapons' || 
            newCat.name?.toLowerCase().includes('weapon') ||
            categories.find(c => c.id === newCat.parent)?.name.toLowerCase().includes('weapon')
          ) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Weapon Slots</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-zinc-200">
                  {WEAPON_SLOTS.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        newCat.slots?.includes(slot)
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      {formatEnum(slot)}
                      {newCat.slots?.includes(slot) && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Compatible Module Categories</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-zinc-200">
                  {MODULE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleModuleCat(cat)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        newCat.compatibleModuleCategories?.includes(cat)
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      {formatEnum(cat)}
                      {newCat.compatibleModuleCategories?.includes(cat) && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Filters */}
          <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category-Specific Filters</label>
              <button 
                type="button" 
                onClick={addFilter}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-all"
              >
                <Plus size={14} />
                Add Filter
              </button>
            </div>

            <div className="space-y-4">
              {newCat.filters?.map((filter, fIndex) => (
                <div key={filter.id} className="p-4 bg-white border border-zinc-200 rounded-xl space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Filter Label (e.g. Color)"
                        value={filter.label}
                        onChange={e => updateFilter(fIndex, 'label', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div className="w-32">
                      <select
                        value={filter.type}
                        onChange={e => updateFilter(fIndex, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                      >
                        <option value="select">Select</option>
                        <option value="range">Range</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFilter(fIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {filter.type === 'select' && (
                    <div className="space-y-2 pl-4 border-l-2 border-zinc-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Options</span>
                        <button 
                          type="button" 
                          onClick={() => addOption(fIndex)}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {filter.options?.map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={e => updateOption(fIndex, oIndex, e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none"
                              placeholder="Option value"
                            />
                            <button 
                              type="button" 
                              onClick={() => removeOption(fIndex, oIndex)}
                              className="p-1.5 text-zinc-400 hover:text-red-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!newCat.filters || newCat.filters.length === 0) && (
                <p className="text-center py-4 text-xs text-zinc-400 italic">No custom filters defined for this category.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {editingCat && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingCat(null);
                  setNewCat({ name: '', parent: '', slots: [], compatibleModuleCategories: [] });
                }}
                className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold shadow-lg shadow-zinc-900/20">
              {editingCat ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Parent</th>
              <th className="px-6 py-4 font-semibold">Discount</th>
              <th className="px-6 py-4 font-semibold">Slots / Modules</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 font-medium">{cat.name}</td>
                <td className="px-6 py-4 text-zinc-500">{cat.parent || '-'}</td>
                <td className="px-6 py-4">
                  {cat.discount ? (
                    <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold">
                      -{cat.discount}%
                    </span>
                  ) : (
                    <span className="text-zinc-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Slots: {cat.slots?.length || 0}</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Modules: {cat.compatibleModuleCategories?.length || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(cat)} className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrderManager = ({ orders, onNotify, onConfirm, onUpdate, externalFilter, externalSearch }: { 
  orders: Order[],
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void,
  onUpdate: () => void,
  externalFilter?: string,
  externalSearch?: string
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredOrders = orders.filter(order => {
    // Еквівалент BindingSource.Filter
    const matchesStatus = externalFilter === 'all' || !externalFilter || order.status === externalFilter;

    // Еквівалент BindingSource.Find: пошук за проіндексованим ID замовлення
    if (externalSearch) {
       return order.id.toLowerCase().includes(externalSearch.toLowerCase());
    }
    
    return matchesStatus;
  });

  const handleStatusChange = async (orderId: string, status: Order['status'], reason?: string) => {
    try {
      await databaseService.updateOrderStatus(orderId, status, undefined);
      onUpdate(); // Refresh parent state
    } catch (error) {
      console.error(error);
    }
  };

  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    orderId: string;
  }>({
    isOpen: false,
    orderId: ''
  });
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const CANCEL_REASONS = [
    "Out of stock",
    "Customer request",
    "Payment failed",
    "Duplicate order",
    "Incorrect shipping address",
    "Other"
  ];

  const handleApproveCancel = (orderId: string) => {
    setCancelModal({ isOpen: true, orderId });
  };

  const confirmCancellation = async () => {
    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!finalReason) return;
    
    await handleStatusChange(cancelModal.orderId, 'cancelled', finalReason);
    setCancelModal({ isOpen: false, orderId: '' });
    setSelectedReason('');
    setCustomReason('');
  };

  const handleSyncCourier = async (orderId: string) => {
    setIsProcessing(true);
    try {
      await databaseService.syncCourierAPI(orderId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    try {
      const html = await databaseService.generateInvoice(orderId);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Order Management</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">
            Total: {filteredOrders.length}
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">
            New: {filteredOrders.filter(o => o.status === 'pending').length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Order</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-all group">
                <td className="p-4">
                  <div className="font-bold text-zinc-900">{order.orderNumber}</div>
                  <div className="text-[10px] text-zinc-400 font-medium">{new Date(order.createdAt).toLocaleString()}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-zinc-700">{order.shipping.fullName}</div>
                  <div className="text-[10px] text-zinc-400 font-medium">{order.shipping.email}</div>
                </td>
                <td className="p-4">
                  <div className="font-black text-zinc-900">€{order.total.toFixed(2)}</div>
                  <div className="text-[10px] text-zinc-400 font-medium">{order.items.length} items</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-600' :
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-zinc-100 text-zinc-600'
                    }`}>
                      {formatEnum(order.status)}
                    </span>
                    {order.cancelRequested && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                        Cancel Requested
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-all"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handlePrintInvoice(order.id!)}
                      className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-all"
                      title="Print Invoice"
                    >
                      <FileText size={16} />
                    </button>
                    {order.status === 'processing' && (
                      <button 
                        onClick={() => handleSyncCourier(order.id!)}
                        disabled={isProcessing}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-emerald-600 transition-all"
                        title="Sync with Courier"
                      >
                        <Truck size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {cancelModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter">Reason for Cancellation</h3>
                <button onClick={() => setCancelModal({ isOpen: false, orderId: '' })} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {CANCEL_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        selectedReason === reason 
                          ? 'border-red-600 bg-red-50 text-red-600' 
                          : 'border-zinc-100 hover:border-zinc-200 text-zinc-600'
                      }`}
                    >
                      <span className="text-sm font-bold uppercase tracking-widest">{reason}</span>
                    </button>
                  ))}
                </div>

                {selectedReason === 'Other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2"
                  >
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Enter specific reason..."
                      className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-sm font-bold focus:border-red-600 transition-all outline-none min-h-[100px]"
                    />
                  </motion.div>
                )}

                <button
                  onClick={confirmCancellation}
                  disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:hover:bg-red-600"
                >
                  Confirm Cancellation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Order Details</div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">{selectedOrder.orderNumber}</h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {selectedOrder.cancelRequested && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-600">
                      <AlertCircle size={20} />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Cancellation Requested</p>
                        <p className="text-[10px] font-medium">Customer requested to cancel this order on {new Date(selectedOrder.cancelRequestedAt!).toLocaleString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleApproveCancel(selectedOrder.id!)}
                      className="px-6 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                    >
                      Approve Cancellation
                    </button>
                  </div>
                )}
                {selectedOrder.status === 'cancelled' && selectedOrder.cancelReason && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                    <AlertCircle size={20} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Cancellation Reason</p>
                      <p className="text-[10px] font-medium">{selectedOrder.cancelReason}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Customer Info</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-zinc-700">{selectedOrder.shipping.fullName}</p>
                      <p className="text-sm text-zinc-500">{selectedOrder.shipping.email}</p>
                      <p className="text-sm text-zinc-500">{selectedOrder.shipping.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Shipping Address</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-500">{selectedOrder.shipping.address}</p>
                      <p className="text-sm text-zinc-500">{selectedOrder.shipping.city}, {selectedOrder.shipping.postalCode}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Payment</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-zinc-700 uppercase">{formatEnum(selectedOrder.payment.method)}</p>
                      <p className={`text-xs font-bold ${selectedOrder.payment.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatEnum(selectedOrder.payment.status)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Items</h4>
                  <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border-b border-zinc-50 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-900">{item.name}</div>
                            <div className="text-[10px] text-zinc-400 font-medium">SKU: {item.sku || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-zinc-900">€{(item.price * item.quantity).toFixed(2)}</div>
                          <div className="text-[10px] text-zinc-400 font-medium">{item.quantity} x €{item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Audit Trail</h4>
                  <div className="space-y-3">
                    {selectedOrder.auditTrail.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="w-2 h-2 rounded-full bg-zinc-300 mt-1.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">{formatEnum(log.action)}</span>
                            <span className="text-[10px] text-zinc-400 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-zinc-500">{log.details}</p>
                          <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase">By: {log.user}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex gap-2">
                  {selectedOrder.status === 'pending' && (
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id!, 'processing')}
                      className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button 
                      onClick={() => handleSyncCourier(selectedOrder.id!)}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      <Truck size={16} />
                      {isProcessing ? 'Syncing...' : 'Fulfill & Ship'}
                    </button>
                  )}
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <button 
                      onClick={() => handleApproveCancel(selectedOrder.id!)}
                      className="px-6 py-3 bg-white text-red-600 border border-red-100 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Amount</div>
                  <div className="text-3xl font-black text-zinc-900">€{selectedOrder.total.toFixed(2)}</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem = ({ icon, label, description, showHelp, active, onClick }: { icon: any, label: string, description?: string, showHelp?: boolean, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex flex-col gap-1 px-4 py-3 rounded-xl transition-all group ${
      active 
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

const ERPManager = ({ products, onNotify, onConfirm, onEditProduct }: { 
  products: Product[],
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void,
  onEditProduct: (product: Product) => void
}) => {
  const [subTab, setSubTab] = useState<'inventory' | 'procurement' | 'financials' | 'logs'>('inventory');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '', type: 'distribution' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contactName: '', email: '', phone: '', leadTimeDays: 7, brands: [] as string[] });
  const [newPO, setNewPO] = useState({
    supplierId: '',
    warehouseId: '',
    items: [] as { productId: string, quantity: number, unitCost: number }[],
    status: 'pending' as 'pending' | 'ordered' | 'received' | 'cancelled',
    currency: 'EUR',
    notes: ''
  });

  // Log Filtering State
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'in' | 'out' | 'reservation'>('all');

  // Quick Stock Entry State
  const [quickCode, setQuickCode] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [quickWarehouse, setQuickWarehouse] = useState('');
  const [quickReason, setQuickReason] = useState('Stock Adjustment');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const loadERPData = async () => {
    setIsLoading(true);
    try {
      const [w, s, po, st, l, r] = await Promise.all([
        databaseService.getWarehouses(),
        databaseService.getSuppliers(),
        databaseService.getPurchaseOrders(),
        databaseService.getStock(),
        databaseService.getInventoryLogs(),
        databaseService.getCurrencyRates()
      ]);
      setWarehouses(w || []);
      setSuppliers(s || []);
      setPurchaseOrders(po || []);
      setStock(st || []);
      setLogs(l || []);
      setRates(r || []);
      
      if (w && w.length > 0 && !quickWarehouse) {
        setQuickWarehouse(w[0].id);
      }
    } catch (err) {
      console.error('Failed to load ERP data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name) return;
    try {
      const id = `wh-${Date.now()}`;
      await databaseService.saveWarehouse({ ...newWarehouse, id });
      onNotify('Warehouse added successfully');
      setShowWarehouseModal(false);
      setNewWarehouse({ name: '', location: '', type: 'distribution' });
      loadERPData();
    } catch (err) {
      onNotify('Failed to add warehouse', 'error');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;
    try {
      const id = `sup-${Date.now()}`;
      await databaseService.saveSupplier({ ...newSupplier, id });
      onNotify('Supplier added successfully');
      setShowSupplierModal(false);
      setNewSupplier({ name: '', contactName: '', email: '', phone: '', leadTimeDays: 7, brands: [] });
      loadERPData();
    } catch (err) {
      onNotify('Failed to add supplier', 'error');
    }
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPO.supplierId || newPO.items.length === 0) {
      onNotify('Please select a supplier and add at least one item', 'error');
      return;
    }

    try {
      const totalCost = newPO.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
      const id = `PO-${Date.now()}`;
      await databaseService.savePurchaseOrder({
        ...newPO,
        id,
        totalCost,
        createdAt: new Date().toISOString()
      });
      onNotify('Purchase order created');
      setShowPOModal(false);
      setNewPO({
        supplierId: '',
        warehouseId: warehouses[0]?.id || '',
        items: [],
        status: 'pending',
        currency: 'EUR',
        notes: ''
      });
      loadERPData();
    } catch (err) {
      onNotify('Failed to create purchase order', 'error');
    }
  };

  const handleReceivePO = async (poId: string, warehouseId: string) => {
    onConfirm(`Are you sure you want to receive PO ${poId}? This will update stock levels.`, async () => {
      try {
        await databaseService.receivePurchaseOrder(poId, warehouseId);
        onNotify('Purchase order received and stock updated');
        loadERPData();
      } catch (err) {
        onNotify('Failed to receive purchase order', 'error');
      }
    });
  };

  const handleUpdateRate = async (code: string) => {
    const newRate = prompt(`Enter new rate for ${code} / EUR:`);
    if (newRate && !isNaN(Number(newRate))) {
      try {
        await databaseService.saveCurrencyRate({ code, rate: Number(newRate) });
        onNotify('Currency rate updated');
        loadERPData();
      } catch (err) {
        onNotify('Failed to update rate', 'error');
      }
    }
  };

  useEffect(() => {
    loadERPData();
  }, []);

  const handleQuickStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode || !quickWarehouse) {
      onNotify('Please enter a code and select a warehouse', 'error');
      return;
    }

    setIsUpdatingStock(true);
    try {
      await databaseService.updateStockByCode(quickCode, quickQty, quickWarehouse, quickReason);
      onNotify(`Stock updated successfully for ${quickCode}`);
      setQuickCode('');
      setQuickQty(1);
      loadERPData(); // Refresh data
    } catch (err) {
      console.error('Failed to update stock', err);
      onNotify(`Failed to update stock: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setSubTab('inventory')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'inventory' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Inventory & Stock
        </button>
        <button 
          onClick={() => setSubTab('procurement')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'procurement' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Procurement
        </button>
        <button 
          onClick={() => setSubTab('financials')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'financials' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Financials
        </button>
        <button 
          onClick={() => setSubTab('logs')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
            subTab === 'logs' ? 'bg-zinc-900 text-white shadow-xl' : 'bg-white text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          Audit Logs
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'inventory' && (
          <motion.div 
            key="inventory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 bg-zinc-900 text-white p-8 rounded-3xl shadow-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                      <Scan size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">Quick Stock Entry</h4>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Scan SKU or Barcode to adjust stock</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Scanner Ready</span>
                  </div>
                </div>

                <form onSubmit={handleQuickStockSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SKU / Barcode</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={quickCode}
                        onChange={e => setQuickCode(e.target.value)}
                        className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-lg"
                        placeholder="Scan or type code..."
                        autoFocus
                      />
                      <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantity (+/-)</label>
                    <input 
                      type="number" 
                      value={quickQty}
                      onChange={e => setQuickQty(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      disabled={isUpdatingStock}
                      className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUpdatingStock ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus size={20} />
                          Update
                        </>
                      )}
                    </button>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Warehouse</label>
                    <select 
                      value={quickWarehouse}
                      onChange={e => setQuickWarehouse(e.target.value)}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reason / Note</label>
                    <input 
                      type="text" 
                      value={quickReason}
                      onChange={e => setQuickReason(e.target.value)}
                      className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Stock Arrival, Correction..."
                    />
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Recent Activity</h4>
                  <button onClick={loadERPData} className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400">
                    <RefreshCw size={16} />
                  </button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[280px] pr-2 custom-scrollbar">
                  {logs.slice(0, 10).map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        log.quantityChange > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {log.quantityChange > 0 ? <Plus size={14} /> : <Minus size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-xs text-zinc-900 truncate">{log.productName || log.productId}</span>
                          <span className={`font-black text-xs ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{log.reason}</span>
                          <span className="text-[10px] text-zinc-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-10">
                      <Package size={32} className="mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Warehouses</h4>
                  <button 
                    onClick={() => setShowWarehouseModal(true)}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {warehouses.map(w => (
                    <div key={w.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm">{w.name}</div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{w.location}</div>
                      </div>
                      <div className="px-2 py-1 bg-zinc-200 rounded text-[10px] font-bold uppercase">{w.type}</div>
                    </div>
                  ))}
                  {warehouses.length === 0 && <div className="text-center py-8 text-zinc-400 text-sm">No warehouses defined</div>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h4 className="font-black uppercase tracking-tighter text-lg mb-6">Stock Overview</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-sm font-bold text-emerald-900">Total Units in Stock</span>
                    <span className="text-xl font-black text-emerald-900">{stock.reduce((acc, curr) => acc + (curr.quantity || 0), 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-sm font-bold text-amber-900">Reserved Units</span>
                    <span className="text-xl font-black text-amber-900">{stock.reduce((acc, curr) => acc + (curr.reservedQuantity || 0), 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h4 className="font-black uppercase tracking-tighter text-lg">Stock Inventory</h4>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">
                    Export CSV
                  </button>
                  <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">
                    Stock Audit
                  </button>
                </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Product</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Barcode</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Warehouse</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Quantity</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-zinc-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stock.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const warehouse = warehouses.find(w => w.id === item.warehouseId);
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900">{product?.name || 'Unknown Product'}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-bold text-zinc-500 uppercase tracking-widest">SKU: {product?.sku || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
                            <Barcode size={14} className="text-zinc-400" />
                            {product?.barcode || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          <div className="flex items-center gap-2">
                            <Truck size={14} className="text-zinc-400" />
                            {warehouse?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900 flex items-center gap-2">
                            {item.quantity}
                            {item.quantity < (product?.minStockLevel || 0) && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Low Stock" />
                            )}
                          </div>
                          {item.reservedQuantity > 0 && (
                            <div className="text-[10px] text-amber-600 font-bold uppercase">({item.reservedQuantity} reserved)</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                          }`}>
                            {formatEnum(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {product && (
                              <button 
                                onClick={() => onEditProduct(product)}
                                className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                                title="Edit Product"
                              >
                                <Package size={16} />
                              </button>
                            )}
                            <button className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all">
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {stock.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        No stock items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {subTab === 'procurement' && (
          <motion.div 
            key="procurement"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm md:col-span-1">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Suppliers</h4>
                  <button 
                    onClick={() => setShowSupplierModal(true)}
                    className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {suppliers.map(s => (
                    <div key={s.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="font-bold text-sm">{s.name}</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{s.email}</div>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {s.brands?.map((b: string) => (
                          <span key={b} className="px-1.5 py-0.5 bg-zinc-200 rounded text-[8px] font-bold uppercase">{b}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {suppliers.length === 0 && <div className="text-center py-8 text-zinc-400 text-sm">No suppliers defined</div>}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm md:col-span-2">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h4 className="font-black uppercase tracking-tighter text-lg">Purchase Orders</h4>
                  <button 
                    onClick={() => setShowPOModal(true)}
                    className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                  >
                    New PO
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-zinc-700">PO ID</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700">Supplier</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700">Total</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700">Status</th>
                      <th className="px-6 py-4 font-semibold text-zinc-700 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {purchaseOrders.map(po => {
                      const supplier = suppliers.find(s => s.id === po.supplierId);
                      return (
                        <tr key={po.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-zinc-500">{po.id}</td>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{supplier?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-600">{po.currency} {po.totalCost}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              po.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 
                              po.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                              po.status === 'ordered' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
                            }`}>
                              {formatEnum(po.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {po.status === 'ordered' && (
                                <button 
                                  onClick={() => handleReceivePO(po.id, po.warehouseId || warehouses[0]?.id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Receive Inventory"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button 
                                onClick={() => setSelectedPO(po)}
                                className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
                                title="View Details"
                              >
                                <FileText size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {purchaseOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-medium">
                          No purchase orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === 'financials' && (
          <motion.div 
            key="financials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h4 className="font-black uppercase tracking-tighter text-lg mb-6">Currency Rates</h4>
                <div className="space-y-3">
                  {rates.map(r => (
                    <div key={r.code} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div className="font-bold text-sm">{r.code} / EUR</div>
                      <div className="font-black text-zinc-900">{r.rate}</div>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleUpdateRate('USD')}
                    className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:border-zinc-900 hover:text-zinc-900 transition-all"
                  >
                    Update Rates
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl md:col-span-2">
                <h4 className="font-black uppercase tracking-tighter text-lg mb-6">Profitability Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-zinc-800 rounded-2xl border border-zinc-700">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Avg. Margin</div>
                    <div className="text-3xl font-black">
                      {(() => {
                        const totalMSRP = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
                        const totalCost = products.reduce((acc, p) => acc + ((p.landingCost || p.price * 0.7) * (p.stock || 0)), 0);
                        const margin = totalMSRP > 0 ? ((totalMSRP - totalCost) / totalMSRP) * 100 : 0;
                        return `${margin.toFixed(1)}%`;
                      })()}
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-800 rounded-2xl border border-zinc-700">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stock Value (MSRP)</div>
                    <div className="text-3xl font-black">
                      €{products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-emerald-400">Projected Profit</span>
                    <span className="text-2xl font-black text-emerald-400">
                      €{(() => {
                        const totalMSRP = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
                        const totalCost = products.reduce((acc, p) => acc + ((p.landingCost || p.price * 0.7) * (p.stock || 0)), 0);
                        return (totalMSRP - totalCost).toLocaleString();
                      })()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full" style={{ width: `${(() => {
                      const totalMSRP = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
                      const totalCost = products.reduce((acc, p) => acc + ((p.landingCost || p.price * 0.7) * (p.stock || 0)), 0);
                      return totalMSRP > 0 ? ((totalMSRP - totalCost) / totalMSRP) * 100 : 0;
                    })()}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="font-black uppercase tracking-tighter text-lg">Inventory Audit Trail</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Search SKU/Product..."
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-zinc-100 border-none rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-900 w-full sm:w-48"
                  />
                </div>
                <select 
                  value={logTypeFilter}
                  onChange={e => setLogTypeFilter(e.target.value as any)}
                  className="px-4 py-2 bg-zinc-100 border-none rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="all">All Types</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="reservation">Reservations</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {logs
                .filter(log => {
                  const matchesSearch = !logSearch || 
                    (log.sku?.toLowerCase().includes(logSearch.toLowerCase())) ||
                    (products.find(p => p.id === log.productId)?.name.toLowerCase().includes(logSearch.toLowerCase()));
                  const matchesType = logTypeFilter === 'all' || log.changeType === logTypeFilter;
                  return matchesSearch && matchesType;
                })
                .map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      log.changeType === 'in' ? 'bg-emerald-100 text-emerald-600' : 
                      log.changeType === 'out' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.changeType === 'in' ? <Plus size={20} /> : <X size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900">
                        {formatEnum(log.changeType)}: {products.find(p => p.id === log.productId)?.name || 'Unknown'}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleString()} • User: {log.userId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      New: {log.newQuantity}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-center py-12 text-zinc-400 font-medium">No audit logs found.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warehouse Modal */}
      {showWarehouseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
          >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">New Warehouse</h3>
              <button onClick={() => setShowWarehouseModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWarehouse} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Name</label>
                <input 
                  type="text" 
                  value={newWarehouse.name}
                  onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Main Warehouse"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Location</label>
                <input 
                  type="text" 
                  value={newWarehouse.location}
                  onChange={e => setNewWarehouse({...newWarehouse, location: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Address or City"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Type</label>
                <select 
                  value={newWarehouse.type}
                  onChange={e => setNewWarehouse({...newWarehouse, type: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="distribution">Distribution Center</option>
                  <option value="retail">Retail Store</option>
                  <option value="overflow">Overflow Storage</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all">
                Create Warehouse
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">New Supplier</h3>
              <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Company Name</label>
                  <input 
                    type="text" 
                    value={newSupplier.name}
                    onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contact Person</label>
                  <input 
                    type="text" 
                    value={newSupplier.contactName}
                    onChange={e => setNewSupplier({...newSupplier, contactName: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</label>
                  <input 
                    type="email" 
                    value={newSupplier.email}
                    onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone</label>
                  <input 
                    type="text" 
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lead Time (Days)</label>
                <input 
                  type="number" 
                  value={newSupplier.leadTimeDays}
                  onChange={e => setNewSupplier({...newSupplier, leadTimeDays: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <button type="submit" className="w-full py-4 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all mt-4">
                Create Supplier
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white shrink-0">
              <h3 className="text-xl font-black uppercase tracking-tighter">New Purchase Order</h3>
              <button onClick={() => setShowPOModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePO} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Supplier</label>
                  <select 
                    value={newPO.supplierId}
                    onChange={e => setNewPO({...newPO, supplierId: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Warehouse</label>
                  <select 
                    value={newPO.warehouseId}
                    onChange={e => setNewPO({...newPO, warehouseId: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Items</label>
                  <button 
                    type="button"
                    onClick={() => setNewPO({...newPO, items: [...newPO.items, { productId: '', quantity: 1, unitCost: 0 }]})}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newPO.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-end p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="col-span-6 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Product</label>
                        <select 
                          value={item.productId}
                          onChange={e => {
                            const updated = [...newPO.items];
                            updated[idx].productId = e.target.value;
                            setNewPO({...newPO, items: updated});
                          }}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-zinc-900"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Qty</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...newPO.items];
                            updated[idx].quantity = Number(e.target.value);
                            setNewPO({...newPO, items: updated});
                          }}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-zinc-900"
                          required
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Unit Cost</label>
                        <input 
                          type="number" 
                          value={item.unitCost}
                          onChange={e => {
                            const updated = [...newPO.items];
                            updated[idx].unitCost = Number(e.target.value);
                            setNewPO({...newPO, items: updated});
                          }}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-zinc-900"
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = newPO.items.filter((_, i) => i !== idx);
                            setNewPO({...newPO, items: updated});
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Notes</label>
                <textarea 
                  value={newPO.notes}
                  onChange={e => setNewPO({...newPO, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none"
                  placeholder="Additional instructions..."
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <div className="text-sm font-bold">
                  Total Cost: <span className="text-lg font-black">{newPO.currency} {newPO.items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0).toLocaleString()}</span>
                </div>
                <button 
                  type="submit"
                  className="px-8 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
                >
                  Create PO
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PO Details Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-900 text-white">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Purchase Order Details</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{selectedPO.id}</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Supplier</label>
                  <div className="font-bold text-sm">{suppliers.find(s => s.id === selectedPO.supplierId)?.name || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedPO.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 
                      selectedPO.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      selectedPO.status === 'ordered' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {selectedPO.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Created At</label>
                  <div className="font-bold text-sm">{new Date(selectedPO.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Items</label>
                <div className="border border-zinc-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest">Product</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-center">Qty</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-right">Unit Cost</th>
                        <th className="px-4 py-3 font-bold text-zinc-500 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedPO.items.map((item: any, idx: number) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-bold">{product?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{selectedPO.currency} {item.unitCost}</td>
                            <td className="px-4 py-3 text-right font-black">{selectedPO.currency} {(item.quantity * item.unitCost).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-50 font-black">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest">Total Cost</td>
                        <td className="px-4 py-3 text-right text-sm">{selectedPO.currency} {selectedPO.totalCost.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Notes</label>
                  <p className="text-xs text-zinc-600">{selectedPO.notes}</p>
                </div>
              )}

              <div className="flex gap-4">
                {selectedPO.status === 'pending' && (
                  <button 
                    onClick={async () => {
                      try {
                        await databaseService.savePurchaseOrder({...selectedPO, status: 'ordered'});
                        onNotify('PO status updated to Ordered');
                        setSelectedPO(null);
                        loadERPData();
                      } catch (err) {
                        onNotify('Failed to update PO status', 'error');
                      }
                    }}
                    className="flex-1 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
                  >
                    Mark as Ordered
                  </button>
                )}
                {selectedPO.status === 'ordered' && (
                  <button 
                    onClick={() => {
                      handleReceivePO(selectedPO.id, selectedPO.warehouseId || warehouses[0]?.id);
                      setSelectedPO(null);
                    }}
                    className="flex-1 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all"
                  >
                    Receive Inventory
                  </button>
                )}
                <button 
                  onClick={() => setSelectedPO(null)}
                  className="px-8 py-4 bg-zinc-100 text-zinc-600 font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ label, value, icon }: { label: string, value: any, icon: any }) => (
  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <span className="text-zinc-500 font-medium">{label}</span>
      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-zinc-900">{value}</div>
  </div>
);

const ProductForm = ({ initialData, categories, weapons, showHelp, onSuccess, onCancel, onNotify }: { 
  initialData: Product | null, 
  categories: Category[],
  weapons: Product[],
  showHelp?: boolean,
  onSuccess: () => void,
  onCancel: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Product>>(initialData || {
    name: '',
    description: '',
    type: 'weapon',
    category: '',
    subcategory: '',
    brand: '',
    model: '',
    sku: '',
    barcode: '',
    price: 0,
    landingCost: 0,
    msrp: 0,
    currency: 'EUR',
    stock: 0,
    minStockLevel: 0,
    tags: [],
    uid: '',
    model3D: '',
    model3DName: '',
    has3D: false,
    meshName: '',
    socketPoint: [0, 0, 0],
    slots: [],
    compatibleModuleCategories: [],
    attachmentSlot: '',
    compatibleWeapons: [],
    characteristics: []
  });
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [combinedImages, setCombinedImages] = useState<(string | File)[]>(() => {
    const existingImages = initialData?.images || [];
    const mainImage = initialData?.image;
    if (mainImage && !existingImages.includes(mainImage)) {
      return [mainImage, ...existingImages];
    }
    return existingImages;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState('');
  const [newCompatibleWeapon, setNewCompatibleWeapon] = useState('');
  const [newCompatibleCategory, setNewCompatibleCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newChar, setNewChar] = useState<Characteristic>({ emoji: '🎯', label: '', value: '' });
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (formData.category) {
      setActiveCategory(categories.find((c: any) => c.id === formData.category) || null);
    } else {
      setActiveCategory(null);
    }
  }, [formData.category, categories]);

  const handleCategoryFilterChange = (filterId: string, value: any) => {
    setFormData({
      ...formData,
      categoryFilters: {
        ...(formData.categoryFilters || {}),
        [filterId]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Starting product save process...');

    try {
      let modelUrl = formData.model3D || '';
      let modelName = formData.model3DName || '';
      const finalImageUrls: string[] = [];

      if (modelFile) {
        console.log('Uploading 3D model...', modelFile.name);
        setUploadingFile('3D Model');
        modelName = modelFile.name;
        try {
          const extension = modelFile.name.split('.').pop();
          const safeName = `model_${Date.now()}.${extension}`;
          modelUrl = await databaseService.uploadFile(modelFile, `products/3d/${safeName}`, (p) => setUploadProgress(p));
          console.log('3D model uploaded successfully:', modelUrl);
        } catch (uploadErr) {
          console.error('3D Model upload failed:', uploadErr);
          onNotify(`Failed to upload 3D model: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`, 'error');
          setIsSubmitting(false);
          setUploadingFile(null);
          return;
        }
      }

      // Handle multiple images
      for (let i = 0; i < combinedImages.length; i++) {
        const item = combinedImages[i];
        if (typeof item === 'string') {
          finalImageUrls.push(item);
        } else {
          console.log(`Uploading image ${i + 1}...`, item.name);
          setUploadingFile(`Image ${i + 1}`);
          setUploadProgress(0);
          try {
            const extension = item.name.split('.').pop();
            const safeName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const url = await databaseService.uploadFile(item, `products/2d/${safeName}`, (p) => setUploadProgress(p));
            finalImageUrls.push(url);
            console.log(`Image ${i + 1} uploaded successfully:`, url);
          } catch (uploadErr) {
            console.error(`Image ${i + 1} upload failed:`, uploadErr);
            onNotify(`Failed to upload image ${i + 1}: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`, 'error');
            setIsSubmitting(false);
            setUploadingFile(null);
            return;
          }
        }
      }

      setUploadingFile(null);

      const productToSave = {
        ...formData,
        model3D: modelUrl,
        model3DName: modelName,
        images: finalImageUrls,
        image: finalImageUrls[0] || '',
        has3D: formData.has3D
      };

      console.log('Starting product save process...');
      console.log('Saving product to Database...', productToSave);
      await databaseService.saveProduct(productToSave as any);
      console.log('Product saved successfully!');
      onNotify('Product saved successfully!');
      onSuccess();
    } catch (err) {
      console.error('Failed to save product:', err);
      onNotify(`Failed to save product: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSlot = () => {
    if (!newSlot) return;
    setFormData({
      ...formData,
      slots: [...(formData.slots || []), newSlot]
    });
    setNewSlot('');
  };

  const removeSlot = (slotToRemove: string) => {
    setFormData({
      ...formData,
      slots: formData.slots?.filter(s => s !== slotToRemove) || []
    });
  };

  const addCompatibleCategory = () => {
    if (!newCompatibleCategory) return;
    setFormData({
      ...formData,
      compatibleModuleCategories: [...(formData.compatibleModuleCategories || []), newCompatibleCategory]
    });
    setNewCompatibleCategory('');
  };

  const removeCompatibleCategory = (catToRemove: string) => {
    setFormData({
      ...formData,
      compatibleModuleCategories: formData.compatibleModuleCategories?.filter(c => c !== catToRemove) || []
    });
  };

  const addCompatibleWeapon = () => {
    if (!newCompatibleWeapon) return;
    setFormData({
      ...formData,
      compatibleWeapons: [...(formData.compatibleWeapons || []), newCompatibleWeapon]
    });
    setNewCompatibleWeapon('');
  };

  const removeCompatibleWeapon = (idToRemove: string) => {
    setFormData({
      ...formData,
      compatibleWeapons: formData.compatibleWeapons?.filter(id => id !== idToRemove) || []
    });
  };

  const addTag = () => {
    if (!newTag) return;
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), newTag]
    });
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tagToRemove) || []
    });
  };

  const addCharacteristic = () => {
    if (!newChar.label || !newChar.value) return;
    setFormData({
      ...formData,
      characteristics: [...(formData.characteristics || []), newChar]
    });
    setNewChar({ emoji: '🎯', label: '', value: '' });
  };

  const removeCharacteristic = (index: number) => {
    setFormData({
      ...formData,
      characteristics: formData.characteristics?.filter((_: any, i: number) => i !== index) || []
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Product Name</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">The name of the item as it will appear in the shop.</p>}
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Brand</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Manufacturer or brand name (e.g. Tokyo Marui).</p>}
            <input 
              type="text" 
              value={formData.brand}
              onChange={e => setFormData({...formData, brand: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Price (€)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Selling price in Euros.</p>}
            <input 
              type="number" 
              value={formData.price}
              onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Discount (%)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Percentage discount (0-100).</p>}
            <input 
              type="number" 
              value={formData.discount || 0}
              onChange={e => setFormData({...formData, discount: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Product Type</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Determines how the item is handled in the 3D configurator.</p>}
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            >
              <option value="weapon">Weapon</option>
              <option value="module">Module</option>
              <option value="gear">Gear</option>
              <option value="part">Internal Part</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Visual Mode</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Choose if this product has a 3D model or just a 2D image.</p>}
            <div className="flex gap-4 p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has3D: false })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${!formData.has3D ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                2D Image
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has3D: true })}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${formData.has3D ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                3D Model
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">SKU / Article</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Unique inventory identifier.</p>}
            <input 
              type="text" 
              value={formData.sku || ''}
              onChange={e => setFormData({...formData, sku: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
              placeholder="e.g. SA-E01-PRO"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Barcode</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">EAN-13 or other barcode for scanning.</p>}
            <input 
              type="text" 
              value={formData.barcode || ''}
              onChange={e => setFormData({...formData, barcode: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
              placeholder="e.g. 5901234567890"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Landing Cost (€)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Actual cost including shipping/customs.</p>}
            <input 
              type="number" 
              value={formData.landingCost || 0}
              onChange={e => setFormData({...formData, landingCost: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">MSRP (€)</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Manufacturer's Suggested Retail Price.</p>}
            <input 
              type="number" 
              value={formData.msrp || 0}
              onChange={e => setFormData({...formData, msrp: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Total Stock</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Aggregated stock across all warehouses.</p>}
            <input 
              type="number" 
              value={formData.stock}
              onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Min. Stock Level</label>
            {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Threshold for low stock alerts.</p>}
            <input 
              type="number" 
              value={formData.minStockLevel || 0}
              onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value, subcategory: '', categoryFilters: {}})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            >
              <option value="">Select Category</option>
              {categories.filter(c => !c.parent).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Subcategory</label>
            <select 
              value={formData.subcategory}
              onChange={e => setFormData({...formData, subcategory: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              required
            >
              <option value="">Select Subcategory</option>
              {categories.filter(c => c.parent === formData.category).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Category Filters */}
        {activeCategory?.filters && activeCategory.filters.length > 0 && (
          <div className="space-y-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category-Specific Attributes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory.filters.map(filter => (
                <div key={filter.id} className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">{filter.label}</label>
                  {filter.type === 'select' ? (
                    <select
                      value={(formData.categoryFilters?.[filter.id] as string) || ''}
                      onChange={e => handleCategoryFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none"
                    >
                      <option value="">Not set</option>
                      {filter.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : filter.type === 'boolean' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCategoryFilterChange(filter.id, true)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.categoryFilters?.[filter.id] === true ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryFilterChange(filter.id, false)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.categoryFilters?.[filter.id] === false ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 border border-zinc-200'}`}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={(formData.categoryFilters?.[filter.id] as string) || ''}
                      onChange={e => handleCategoryFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none"
                      placeholder="Enter value..."
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Description</label>
          {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Detailed information about the product.</p>}
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none"
            required
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700">Tags</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags?.map(tag => (
              <span key={tag} className="flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700">Characteristics</label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select 
              value={newChar.emoji}
              onChange={e => setNewChar({...newChar, emoji: e.target.value})}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            >
              {['🎯', '🔫', '🛡️', '🔋', '📦', '⚖️', '📏', '💨', '🔊', '🔦', '🔭', '🧤', '🪖', '🎒', '🛠️', '⚙️', '⚡', '🌡️', '💧'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Label (e.g. Weight)"
              value={newChar.label}
              onChange={e => setNewChar({...newChar, label: e.target.value})}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
            <input 
              type="text" 
              placeholder="Value (e.g. 2.5kg)"
              value={newChar.value}
              onChange={e => setNewChar({...newChar, value: e.target.value})}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
            />
            <button 
              type="button" 
              onClick={addCharacteristic}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold"
            >
              Add
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formData.characteristics?.map((char: Characteristic, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{char.emoji}</span>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">{char.label}</div>
                    <div className="text-sm font-bold text-zinc-700">{char.value}</div>
                  </div>
                </div>
                <button type="button" onClick={() => removeCharacteristic(index)} className="text-zinc-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-semibold text-zinc-700">Product Images (2D)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {combinedImages.map((item, index) => (
              <div key={index} className="relative group aspect-square bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden">
                <img 
                  src={typeof item === 'string' ? item : URL.createObjectURL(item)} 
                  alt={`Preview ${index}`} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newImages = [...combinedImages];
                        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                        setCombinedImages(newImages);
                      }}
                      className="p-1.5 bg-white text-zinc-900 rounded-lg hover:bg-zinc-100"
                    >
                      <ArrowUp size={14} />
                    </button>
                  )}
                  {index < combinedImages.length - 1 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newImages = [...combinedImages];
                        [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
                        setCombinedImages(newImages);
                      }}
                      className="p-1.5 bg-white text-zinc-900 rounded-lg hover:bg-zinc-100"
                    >
                      <ArrowDown size={14} />
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => {
                      const newImages = combinedImages.filter((_, i) => i !== index);
                      setCombinedImages(newImages);
                    }}
                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">
                    Primary
                  </div>
                )}
              </div>
            ))}
            <label className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 transition-all cursor-pointer bg-zinc-50">
              <Plus size={24} className="text-zinc-400" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Add Image</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setCombinedImages([...combinedImages, ...files]);
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData.has3D && (
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-700">3D Model File (.glb)</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 transition-all cursor-pointer bg-zinc-50">
                  <Upload size={24} className="text-zinc-400" />
                  <span className="text-zinc-500 font-medium">
                    {modelFile ? modelFile.name : formatModelName(formData.model3DName || formData.model3D)}
                  </span>
                  <input 
                    type="file" 
                    accept=".glb" 
                    className="hidden" 
                    onChange={e => setModelFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {formData.has3D && (
          <div className="space-y-4">
            <label className="text-sm font-semibold text-zinc-700">3D Configurator Settings</label>
            <div className="grid grid-cols-1 gap-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Unique ID (UID)</label>
                {showHelp && <p className="text-[10px] text-zinc-400 font-medium">Tarkov-style ID for compatibility logic (e.g. mount_picatinny_01).</p>}
                <input 
                  type="text" 
                  value={formData.uid || ''}
                  onChange={e => setFormData({...formData, uid: e.target.value})}
                  placeholder="e.g. sight_reflex_01"
                  className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {formData.type === 'weapon' && (
          <div className="space-y-6">
            {/* Attachment points are now managed automatically or via UID logic */}
          </div>
        )}

        {formData.type === 'module' && (
          <div className="space-y-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Attachment Slot</label>
              <select 
                value={formData.attachmentSlot}
                onChange={e => setFormData({...formData, attachmentSlot: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
              >
                <option value="">Select Slot Type</option>
                {WEAPON_SLOTS.map(slot => (
                  <option key={slot} value={slot}>{formatEnum(slot)}</option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">The slot ID on the weapon this module attaches to</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Compatible Weapons</label>
              <div className="flex gap-2">
                <select 
                  value={newCompatibleWeapon}
                  onChange={e => setNewCompatibleWeapon(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-xl outline-none"
                >
                  <option value="">Select Weapon</option>
                  {weapons
                    .filter(w => !formData.compatibleWeapons?.includes(w.uid))
                    .map(w => (
                      <option key={w.id} value={w.uid}>{w.name} ({w.brand})</option>
                    ))
                  }
                </select>
                <button 
                  type="button" 
                  onClick={addCompatibleWeapon}
                  disabled={!newCompatibleWeapon}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Add Weapon
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.compatibleWeapons?.map(uid => {
                  const weapon = weapons.find(w => w.uid === uid);
                  return (
                    <span key={uid} className="flex items-center gap-2 px-3 py-1 bg-white text-zinc-700 border border-zinc-200 rounded-full text-sm font-medium">
                      {weapon ? `${weapon.name} (${weapon.brand})` : uid}
                      <button type="button" onClick={() => removeCompatibleWeapon(uid)} className="text-zinc-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 pt-8 border-t border-zinc-100">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-8 py-4 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-12 py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50 relative overflow-hidden"
          >
            {isSubmitting && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            )}
            <Save size={20} />
            {isSubmitting ? (uploadingFile ? `Uploading ${uploadingFile}...` : 'Saving...') : 'Save Product'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
