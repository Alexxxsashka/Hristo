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
  Cpu,
  ShieldCheck,
  Zap,
  Terminal,
  Trello
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Category, Product, BlogPost, PolicyPage, Order } from '../types';
import { databaseService } from '../services/databaseService';

// Component Imports
import { BIAnalytics } from '../components/admin/BIAnalytics';
import { BlogManager } from '../components/admin/BlogManager';
import { OrderManager } from '../components/admin/OrderManager';
import { ProductForm } from '../components/admin/ProductForm';
import { PolicyManager } from '../components/admin/PolicyManager';
import { ERPManager } from '../components/admin/ERPManager';
import { SiteSettingsManager } from '../components/admin/SiteSettingsManager';
import { CategoryManager } from '../components/admin/CategoryManager';
import { CategoryForm } from '../components/admin/CategoryForm';
import { MessageManager } from '../components/admin/MessageManager';

type AdminTab = 'intelligence' | 'arsenal' | 'logistics' | 'taxonomy' | 'intel' | 'comms' | 'protocols' | 'supply' | 'config';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('intelligence');
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [policies, setPolicies] = useState<PolicyPage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productFilter, setProductFilter] = useState<'all' | 'out_of_stock' | 'premium'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'shipped'>('all');
  const [indexedSearch, setIndexedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchBlogPosts(),
          fetchPolicies(),
          fetchOrdersInternal(),
          databaseService.getMessages().then(m => setMessages(m || []))
        ]);
      } catch (err) {
        console.error('Core data fetch failed', err);
      } finally {
        setIsLoading(false);
      }
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

  const fetchProducts = async () => databaseService.getProducts().then(p => setProducts(p as Product[] || []));
  const fetchCategories = async () => databaseService.getCategories().then(c => setCategories(c || []));
  const fetchBlogPosts = async () => databaseService.getBlogPosts().then(b => setBlogPosts(b as BlogPost[] || []));
  const fetchPolicies = async () => databaseService.getPolicies().then(pol => setPolicies(pol as PolicyPage[] || []));
  const fetchOrdersInternal = async () => databaseService.getAllOrders().then(o => setOrders(o || []));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const deleteProduct = async (id: string) => {
    confirmAction('Initiate permanent deletion of this asset?', async () => {
      try {
        await databaseService.deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
        showNotification('Asset purged from database');
      } catch (err) {
        showNotification('Purge failure', 'error');
      }
    });
  };

  const deleteMessage = async (id: string) => {
    confirmAction('Archive and remove this communication?', async () => {
      try {
        await databaseService.deleteMessage(id);
        setMessages(messages.filter(m => m.id !== id));
        showNotification('Message deleted');
      } catch (err) {
        showNotification('Deletion failure', 'error');
      }
    });
  };

  const filteredProducts = products.filter(p => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term);

    if (productFilter === 'out_of_stock') return matchesSearch && p.stock <= 0;
    if (productFilter === 'premium') return matchesSearch && p.price > 500;
    if (indexedSearch) return p.sku?.toLowerCase().includes(indexedSearch.toLowerCase()) || p.id.toLowerCase().includes(indexedSearch.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-300 font-sans selection:bg-red-600 selection:text-white">
      {/* Sidebar Overlay for Mobile */}
      
      <aside className="w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col sticky top-0 h-screen z-50">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <Terminal className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl text-white leading-none tracking-tighter uppercase italic">Hristo</span>
              <span className="text-[10px] text-red-600 font-black uppercase tracking-[0.3em] mt-1">Command Core</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 mt-6">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Main Operations</span>
          </div>
          
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Intelligence"
            id="intelligence"
            active={activeTab === 'intelligence'}
            onClick={() => setActiveTab('intelligence')}
          />
          <SidebarItem
            icon={<ShoppingCart size={20} />}
            label="Logistics"
            id="logistics"
            active={activeTab === 'logistics'}
            onClick={() => setActiveTab('logistics')}
          />
          <SidebarItem
            icon={<Crosshair size={20} />}
            label="Arsenal"
            id="arsenal"
            active={activeTab === 'arsenal'}
            onClick={() => setActiveTab('arsenal')}
          />
          <SidebarItem
            icon={<Layers size={20} />}
            label="Taxonomy"
            id="taxonomy"
            active={activeTab === 'taxonomy'}
            onClick={() => setActiveTab('taxonomy')}
          />

          <div className="px-4 mb-4 mt-8">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Communication</span>
          </div>
          
          <SidebarItem
            icon={<FileText size={20} />}
            label="Intel Feed"
            id="intel"
            active={activeTab === 'intel'}
            onClick={() => setActiveTab('intel')}
          />
          <SidebarItem
            icon={<MessageSquare size={20} />}
            label="Comms"
            id="comms"
            active={activeTab === 'comms'}
            onClick={() => setActiveTab('comms')}
          />
          
          <div className="px-4 mb-4 mt-8">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Systems</span>
          </div>
          
          <SidebarItem
            icon={<ShieldCheck size={20} />}
            label="Protocols"
            id="protocols"
            active={activeTab === 'protocols'}
            onClick={() => setActiveTab('protocols')}
          />
          <SidebarItem
            icon={<Database size={20} />}
            label="Supply Chain"
            id="supply"
            active={activeTab === 'supply'}
            onClick={() => setActiveTab('supply')}
          />
          <SidebarItem
            icon={<Globe size={20} />}
            label="Website" // The requested label
            id="config"
            active={activeTab === 'config'}
            onClick={() => setActiveTab('config')}
          />
        </nav>

        <div className="p-6 mt-auto border-t border-zinc-900 space-y-4 bg-zinc-950/80 backdrop-blur-md">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`group w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-transparent ${
              showHelp ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-900/50 text-zinc-500 hover:text-white hover:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Zap size={16} className={showHelp ? 'animate-pulse' : ''} />
              Intel Overlays
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 bg-zinc-900/30 text-zinc-600 hover:text-red-600 hover:bg-red-600/10 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            End Session
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">System Online v2.4.0</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-900 px-10 py-7 flex items-center justify-between sticky top-0 z-40">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {editingProduct ? 'Asset Modification' : activeTab}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1 h-1 bg-red-600 rounded-full" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Authorized: {user?.callsign || user?.username || 'Commander'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
               <input 
                 type="text" 
                 placeholder="Search operations..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3 text-xs font-medium text-white placeholder:text-zinc-700 focus:border-red-600 outline-none transition-all w-64"
               />
             </div>
             <button className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all">
                <Activity size={20} />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pb-32">
          <AnimatePresence mode="wait">
            {activeTab === 'intelligence' && (
              <motion.div
                key="intelligence"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-10"
              >
                <BIAnalytics orders={orders} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[48px] relative overflow-hidden group">
                    <div className="relative z-10">
                      <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-4 italic">Deployment Center</h3>
                      <p className="text-zinc-500 leading-relaxed max-w-sm mb-10 font-medium text-sm">
                        Welcome to the command interface. Monitor assets, logistics, and intelligence feeds from this centralized operational hub.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <QuickLink
                          title="New Asset"
                          onClick={() => setActiveTab('arsenal')}
                          icon={<Plus size={18} />}
                        />
                        <QuickLink
                          title="Intel Comms"
                          onClick={() => setActiveTab('comms')}
                          icon={<MessageSquare size={18} />}
                        />
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Terminal size={200} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <StatusCard label="Active Orders" value={orders.filter(o => o.status === 'pending').length} variant="red" />
                    <StatusCard label="Arsenal Count" value={products.length} variant="zinc" />
                    <StatusCard label="Comms Queue" value={messages.length} variant="zinc" />
                    <StatusCard label="Active Site" value="LIVE" variant="green" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logistics' && (
              <motion.div key="logistics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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

            {activeTab === 'arsenal' && (
              <motion.div key="arsenal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {/* Product Inventory Interface */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                   <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
                      {['all', 'out_of_stock', 'premium'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setProductFilter(f as any)}
                          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            productFilter === f ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          {f.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                   <button
                     onClick={() => setActiveTab('arsenal')} // Temporary
                     className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all"
                   >
                     REGISTER ASSET
                   </button>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-[40px] overflow-hidden backdrop-blur-sm">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-950/50 border-b border-zinc-800">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Specification</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Serial / SKU</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Allocation</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Valuation</th>
                        <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-red-600/5 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-zinc-950 rounded-2xl border border-zinc-800/50 flex items-center justify-center text-zinc-700 group-hover:border-red-600/30 group-hover:text-red-600 transition-all">
                                {product.image ? (
                                  <img src={product.image} className="w-full h-full object-contain p-2" />
                                ) : <Package size={24} />}
                              </div>
                              <div>
                                <div className="font-black text-white text-lg tracking-tighter uppercase">{product.name}</div>
                                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-mono text-zinc-500 text-xs">{product.sku || 'UNASSIGNED'}</td>
                          <td className="px-8 py-6">
                            <div className={`text-lg font-black ${product.stock <= (product.minStockLevel || 0) ? 'text-red-600' : 'text-white'}`}>
                              {product.stock} <span className="text-[10px] text-zinc-600 tracking-widest">UNIT</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-white font-black">€{product.price.toLocaleString()}</div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingProduct(product)} className="p-3 bg-zinc-800 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="p-3 bg-zinc-800 text-zinc-500 hover:bg-red-950 hover:text-red-600 rounded-xl transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'taxonomy' && (
              <motion.div key="taxonomy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <CategoryManager
                  categories={categories}
                  onUpdate={fetchCategories}
                  onNotify={showNotification}
                  onConfirm={confirmAction}
                  onAddCategory={() => setActiveTab('taxonomy')} // Placeholder
                  onEditCategory={(cat) => setEditingCategory(cat)}
                />
              </motion.div>
            )}

            {activeTab === 'intel' && (
              <motion.div key="intel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <BlogManager posts={blogPosts} onUpdate={fetchBlogPosts} onNotify={showNotification} onConfirm={confirmAction} />
              </motion.div>
            )}

            {activeTab === 'comms' && (
              <motion.div key="comms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <MessageManager messages={messages} onDelete={deleteMessage} />
              </motion.div>
            )}

            {activeTab === 'protocols' && (
              <motion.div key="protocols" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <PolicyManager policies={policies} onUpdate={fetchPolicies} onNotify={showNotification} onConfirm={confirmAction} />
              </motion.div>
            )}

            {activeTab === 'supply' && (
              <motion.div key="supply" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ERPManager products={products} onNotify={showNotification} onConfirm={confirmAction} onEditProduct={(p) => setEditingProduct(p)} />
              </motion.div>
            )}

            {activeTab === 'config' && (
              <motion.div key="config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SiteSettingsManager onNotify={showNotification} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Notifications and Overlays */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className={`fixed bottom-12 left-1/2 z-[100] px-8 py-5 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 backdrop-blur-3xl border ${
              notification.type === 'success' ? 'bg-emerald-600/90 border-emerald-500 group' : 'bg-red-600/90 border-red-500'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {notification.type === 'success' ? <CheckCircle size={18} className="text-white" /> : <X size={18} className="text-white" />}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xs uppercase tracking-widest text-white">{notification.message}</span>
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-tight">Operation Executed</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border-2 border-zinc-800 p-12 rounded-[56px] max-w-xl w-full shadow-[0_0_100px_rgba(0,0,0,0.8)] text-center"
            >
              <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-600/30">
                 <AlertTriangle size={48} className="text-red-600 animate-pulse" />
              </div>
              <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">Critical Directive</h3>
              <p className="text-zinc-500 mb-12 leading-relaxed font-medium text-lg">{confirmDialog.message}</p>
              <div className="flex gap-6">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all border border-zinc-700"
                >
                  ABORT
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="flex-1 py-6 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_15px_30px_rgba(220,38,38,0.2)]"
                >
                  EXECUTE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem = ({ icon, label, id, active, onClick }: { icon: any, label: string, id: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative overflow-hidden ${
      active
        ? 'bg-zinc-900 text-white border border-zinc-800 shadow-xl'
        : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div className={`transition-all ${active ? 'text-red-600 scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    <span className={`font-black text-[11px] uppercase tracking-[0.15em] transition-all ${active ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
      {label}
    </span>
    {active && <Zap size={10} className="ml-auto text-red-600 animate-pulse" />}
  </button>
);

const QuickLink = ({ title, onClick, icon }: { title: string, onClick: () => void, icon: any }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 px-8 py-5 bg-zinc-950 border border-zinc-800 hover:border-red-600/50 hover:bg-red-600/5 rounded-3xl transition-all group"
  >
    <div className="w-12 h-12 bg-zinc-900 group-hover:bg-red-600 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-all shadow-inner">
      {icon}
    </div>
    <div className="font-black text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{title}</div>
  </button>
);

const StatusCard = ({ label, value, variant }: { label: string, value: string | number, variant: 'red' | 'zinc' | 'green' }) => {
  const colors = {
    red: 'border-red-600/30 bg-red-600/5 text-red-600',
    zinc: 'border-zinc-800 bg-zinc-900/50 text-white',
    green: 'border-emerald-600/30 bg-emerald-600/5 text-emerald-500'
  };
  
  return (
    <div className={`p-8 border-2 rounded-[40px] flex flex-col items-center justify-center text-center transition-all hover:scale-105 ${colors[variant]}`}>
       <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</span>
       <span className="text-4xl font-black tabular-nums tracking-tighter italic">{value}</span>
    </div>
  );
};
