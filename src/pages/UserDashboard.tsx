import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Crosshair, 
  TrendingUp, 
  Wrench, 
  Settings, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  Clock, 
  Truck, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  User as UserIcon,
  ShoppingBag,
  Smartphone,
  Mail,
  Key,
  Github,
  Chrome,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useConfiguratorStore, SavedBuild } from '../store/configuratorStore';
import { databaseService } from '../services/databaseService';
import { Order, Loadout, ServiceRequest, UserProfile, Address, Product } from '../types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getAuthErrorMessage } from '../utils/authErrors';
import { useTranslation } from '../hooks/useTranslation';

const TACTICAL_COLORS = {
  bg: 'bg-[#0a0a0a]',
  card: 'bg-zinc-900/50',
  border: 'border-zinc-800',
  accent: 'text-red-600',
  accentBg: 'bg-red-600',
  muted: 'text-zinc-500',
  odGreen: 'text-[#556b2f]',
  coyote: 'text-[#c2b280]',
};

type Tab = 'dashboard' | 'orders' | 'loyalty' | 'service' | 'settings' | 'address' | 'security';

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'orders', 'loyalty', 'service', 'settings', 'address', 'security'].includes(tab)) {
      setActiveTab(tab as Tab);
    }
  }, [location.search]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userProfile, userBuilds, userOrders, userLoadouts, userServices] = await Promise.all([
        databaseService.getUserProfile(user.id),
        databaseService.getUserBuilds(user.id),
        databaseService.getUserOrders(user.id),
        databaseService.getUserLoadouts(user.id),
        databaseService.getUserServiceRequests(user.id)
      ]);

      setProfile(userProfile as UserProfile);
      setOrders(userOrders as Order[]);
      setLoadouts(userLoadouts as Loadout[]);
      setServiceRequests(userServices as ServiceRequest[]);
      useConfiguratorStore.setState({ savedBuilds: (userBuilds || []) as SavedBuild[] });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: t('command_center'), icon: LayoutDashboard },
    { id: 'orders', label: t('order_history'), icon: Package },
    { id: 'loyalty', label: t('loyalty_and_rank'), icon: TrendingUp },
    { id: 'service', label: t('service_and_repairs'), icon: Wrench },
    { id: 'address', label: t('address_book'), icon: MapPin },
    { id: 'settings', label: t('profile_center'), icon: UserIcon },
    { id: 'security', label: t('security_and_auth'), icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden sticky top-28">
            <div className="p-6 border-b border-zinc-800 bg-gradient-to-br from-zinc-800/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                  <UserIcon className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="font-black text-lg tracking-tighter uppercase leading-none">
                    {profile?.callsign || user?.username}
                  </h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    {profile?.teamName || 'NO TEAM'}
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-4">
              <ul className="space-y-1">
                {sidebarItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                        activeTab === item.id 
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-zinc-500 group-hover:text-red-500'} />
                      {item.label}
                      {activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-4 border-t border-zinc-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview profile={profile} orders={orders} />}
              {activeTab === 'orders' && <OrderHistory orders={orders} setConfirmModal={setConfirmModal} />}
              {activeTab === 'loyalty' && <LoyaltyRank profile={profile} />}
              {activeTab === 'service' && <ServiceRepairs requests={serviceRequests} onRefresh={fetchData} />}
              {activeTab === 'address' && <AddressBook profile={profile} onRefresh={fetchData} />}
              {activeTab === 'settings' && <AccountSettings profile={profile} />}
              {activeTab === 'security' && <SecuritySettings profile={profile} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${confirmModal.type === 'danger' ? 'bg-red-600/20 text-red-600' : 'bg-amber-600/20 text-amber-600'}`}>
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{confirmModal.title}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Tactical Confirmation Required</p>
                </div>
              </div>
              
              <p className="text-zinc-300 text-sm leading-relaxed mb-8 font-medium">
                {confirmModal.message}
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-zinc-700"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-6 py-4 ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'} text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl`}
                >
                  {t('confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DashboardOverview: React.FC<{ profile: UserProfile | null, orders: Order[] }> = ({ profile, orders }) => {
  const { t } = useTranslation();
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
          {t('welcome_back')}, <span className="text-red-600">{profile?.callsign || t('operator')}</span>!
        </h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
          {t('status')}: <span className="text-green-500">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</span> • {t('team')}: {profile?.teamName || t('freelancer')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <Package className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">{t('active_orders')}</h3>
          </div>
          <p className="text-3xl font-black">{activeOrders.length}</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">
            {activeOrders.length > 0 ? t('in_transit_processing') : t('no_active_orders')}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">{t('loyalty_points')}</h3>
          </div>
          <p className="text-3xl font-black">{profile?.points || 0}</p>
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">
            {t('current_discount')}: {profile?.discountLevel || 0}%
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
              <Shield className="text-red-600" size={20} />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">{t('rank')}</h3>
          </div>
          <p className="text-3xl font-black uppercase tracking-tighter">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</p>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${((profile?.points || 0) / (profile?.nextRankThreshold || 1000)) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-black uppercase tracking-widest text-sm">{t('recent_activity')}</h3>
          <Link to="/shop" className="text-[10px] font-black text-red-600 hover:text-red-500 uppercase tracking-widest">
            {t('gear_up')}
          </Link>
        </div>
        <div className="p-6">
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-900">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="text-zinc-500" size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t('order')} #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">€{order.total.toFixed(2)}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-red-600/10 text-red-600'
                    }`}>
                      {t(`status_${order.status.toLowerCase().replace(/ /g, '_')}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto text-zinc-800 mb-4" size={48} />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">{t('your_arsenal_is_empty')}</p>
              <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                {t('shop_new_arrivals')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderHistory: React.FC<{ 
  orders: Order[], 
  setConfirmModal: React.Dispatch<React.SetStateAction<any>> 
}> = ({ orders, setConfirmModal }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  const handleReorderItem = (item: any) => {
    addToCart({
      productId: item.productId,
      productName: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      sku: item.sku,
      landingCost: item.landingCost,
      selectedParts: [],
      totalPrice: item.price * item.quantity,
      selectedVariant: item.selectedVariant
    });
    setReorderedId(`${item.productId}-${Date.now()}`);
    setTimeout(() => setReorderedId(null), 2000);
  };

  const handleReorderAll = (order: Order) => {
    order.items.forEach(item => {
      handleReorderItem(item);
    });
  };

  const handleRequestCancel = async (orderId: string) => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: t('request_cancellation'),
      message: t('confirm_request_cancellation'),
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setRequestingId(orderId);
        try {
          await databaseService.requestOrderCancellation(orderId, user.id);
        } catch (error) {
          console.error('Error requesting cancellation:', error);
        } finally {
          setRequestingId(null);
        }
      }
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: t('cancel_order'),
      message: t('confirm_cancel_order'),
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setCancellingId(orderId);
        try {
          await databaseService.cancelOrder(orderId);
        } catch (error) {
          console.error('Error cancelling order:', error);
        } finally {
          setCancellingId(null);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{t('order_history')}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('track_and_manage_past_purchases')}</p>
        </div>
      </header>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('order_id')}</p>
                    <p className="font-black text-sm">#{order.id.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('date')}</p>
                    <p className="font-black text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('total')}</p>
                    <p className="font-black text-sm text-red-600">€{order.total.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {order.cancelRequested ? (
                    <span className="px-4 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase">
                      {t('cancellation_requested')}
                    </span>
                  ) : (
                    (order.status === 'pending' || order.status === 'processing') && (
                      <button 
                        onClick={() => handleRequestCancel(order.id)}
                        disabled={requestingId === order.id}
                        className="px-4 py-1 bg-red-600/10 text-red-600 hover:bg-red-600/20 rounded-full text-[10px] font-black uppercase transition-all disabled:opacity-50"
                      >
                        {requestingId === order.id ? t('sending') : t('request_cancellation')}
                      </button>
                    )
                  )}
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 
                    order.status === 'cancelled' ? 'bg-zinc-800 text-zinc-500' :
                    'bg-red-600/10 text-red-600'
                  }`}>
                    {t(`status_${order.status.toLowerCase().replace(/ /g, '_')}`)}
                  </span>
                  <button className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                    <ExternalLink size={16} />
                  </button>
                  <button 
                    onClick={() => handleReorderAll(order)}
                    className="px-4 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-full transition-all"
                  >
                    {t('reorder_all')}
                  </button>
                </div>
              </div>
              {order.status === 'cancelled' && order.cancelReason && (
                <div className="px-6 pb-4">
                  <div className="p-4 bg-red-600/5 border border-red-600/10 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">{t('cancellation_reason')}</p>
                    <p className="text-sm text-zinc-400">{order.cancelReason}</p>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-950 rounded-xl border border-zinc-800 p-2">
                        <img src={item.image || 'https://picsum.photos/seed/gear/200/200'} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.name}</p>
                        {item.selectedVariant && (
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {Object.entries(item.selectedVariant.attributes).map(([key, value]) => (
                              <span key={key} className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{t('qty')}: {item.quantity} • €{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {reorderedId?.startsWith(item.productId) && (
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-bold text-emerald-500 uppercase"
                          >
                            {t('reorder_success')}
                          </motion.span>
                        )}
                        <button 
                          onClick={() => handleReorderItem(item)}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                          {t('reorder')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {order.shipping.trackingNumber && (
                  <div className="mt-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Truck className="text-red-600" size={20} />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('tracking_number')} ({order.shipping.method})</p>
                        <p className="font-black text-sm">{order.shipping.trackingNumber}</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black text-red-600 hover:text-red-500 uppercase tracking-widest">
                      {t('track_live')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
          <Package className="mx-auto text-zinc-800 mb-4" size={64} />
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{t('no_orders_found')}</h3>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">{t('no_purchases_yet')}</p>
          <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
            {t('start_shopping')}
          </Link>
        </div>
      )}
    </div>
  );
};

const SavedBuilds: React.FC = () => {
  const { t } = useTranslation();
  const { savedBuilds } = useConfiguratorStore();
  return (
    <div className="space-y-6 mt-12">
      <h2 className="text-3xl font-black tracking-tighter uppercase">{t('saved_builds')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savedBuilds.length > 0 ? savedBuilds.map(build => (
          <div key={build.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
            <h3 className="font-black uppercase tracking-tighter text-lg">{build.name}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(build.date).toLocaleDateString()}</p>
          </div>
        )) : (
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{t('no_saved_builds')}</p>
        )}
      </div>
    </div>
  );
};

const LoyaltyRank: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const { t } = useTranslation();
  const ranks = [
    { name: t('rank_recruit'), threshold: 0, discount: 0 },
    { name: t('rank_private'), threshold: 500, discount: 3 },
    { name: t('rank_sergeant'), threshold: 1500, discount: 5 },
    { name: t('rank_special_forces'), threshold: 3000, discount: 10 },
    { name: t('rank_operator'), threshold: 5000, discount: 15 },
    { name: t('rank_commander'), threshold: 10000, discount: 20 },
  ];

  const currentPoints = profile?.points || 0;
  const nextRank = ranks.find(r => r.threshold > currentPoints) || ranks[ranks.length - 1];
  const progress = Math.min((currentPoints / nextRank.threshold) * 100, 100);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase">{t('loyalty_and_rank')}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('earn_points_unlock_discounts')}</p>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t('current_rank')}</p>
            <h3 className="text-5xl font-black uppercase tracking-tighter text-red-600">{profile?.rank ? t(`rank_${profile.rank.toLowerCase().replace(/ /g, '_')}`) : t('rank_recruit')}</h3>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{t('total_points')}</p>
            <h3 className="text-5xl font-black uppercase tracking-tighter">{currentPoints}</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-xs font-bold uppercase tracking-widest">{t('progress_to')} {nextRank.name}</p>
            <p className="text-xs font-black text-red-600">€{(nextRank.threshold - currentPoints).toFixed(0)} {t('more_to_rank_up')}</p>
          </div>
          <div className="w-full h-4 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            />
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
            {t('spend_more_to_reach')} '{nextRank.name}' {t('rank_and_get_discount')} ({nextRank.discount}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ranks.map((rank, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${
            currentPoints >= rank.threshold ? 'bg-red-600/10 border-red-600/50' : 'bg-zinc-900/50 border-zinc-800 opacity-50'
          }`}>
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">{t('rank')} {idx + 1}</p>
            <h4 className="font-black uppercase tracking-tighter text-sm mb-2">{rank.name}</h4>
            <p className="text-lg font-black">{rank.discount}%</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">{t('discount')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServiceRepairs: React.FC<{ requests: ServiceRequest[]; onRefresh: () => void }> = ({ requests, onRefresh }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [weaponName, setWeaponName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await databaseService.createServiceRequest({
        userId: user.id,
        weaponName,
        description,
        status: 'Pending',
        date: new Date().toLocaleDateString(),
        updates: []
      });
      setShowModal(false);
      setWeaponName('');
      setDescription('');
      onRefresh();
    } catch (error) {
      console.error('Error creating service request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{t('service_and_repairs')}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('track_weapon_upgrades')}</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-all"
        >
          <Plus size={14} /> {t('request_service')}
        </button>
      </header>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800">
                    <Wrench className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tighter text-lg">{request.weaponName}</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('ticket')} #{request.id.toUpperCase()}</p>
                  </div>
                </div>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                  request.status === 'Ready for Pickup' ? 'bg-green-500/10 text-green-500' : 'bg-red-600/10 text-red-600'
                }`}>
                  {t(`status_${request.status.toLowerCase().replace(/ /g, '_')}`)}
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {request.updates.map((update, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-px bg-zinc-800 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600" />
                      </div>
                      <div className="pb-4">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{update.date}</p>
                        <p className="text-sm text-zinc-300">{update.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
          <Wrench className="mx-auto text-zinc-800 mb-4" size={64} />
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{t('no_active_service_tickets')}</h3>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">{t('need_upgrade_repair')}</p>
          <button 
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
          >
            {t('open_service_ticket')}
          </button>
        </div>
      )}

      {/* Service Request Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">{t('request_service')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('weapon_name')}</label>
                  <input 
                    required
                    type="text" 
                    value={weaponName}
                    onChange={e => setWeaponName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600"
                    placeholder="e.g. M4A1 Carbine"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('description')}</label>
                  <textarea 
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 h-32 resize-none"
                    placeholder={t('describe_issue_or_upgrade')}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {loading ? t('submitting') : t('submit_request')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-700 transition-all"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AddressBook: React.FC<{ profile: UserProfile | null; onRefresh: () => void }> = ({ profile, onRefresh }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setLabel('');
    setFullName('');
    setAddress('');
    setCity('');
    setPhone('');
    setIsDefault(false);
    setEditingAddress(null);
  };

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setFullName(addr.fullName);
    setAddress(addr.address);
    setCity(addr.city);
    setPhone(addr.phone);
    setIsDefault(addr.isDefault);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const addressData: Omit<Address, 'id'> = {
        label,
        fullName,
        address,
        city,
        phone,
        isDefault
      };

      if (editingAddress) {
        await databaseService.updateAddress(user.id, { ...addressData, id: editingAddress.id });
      } else {
        await databaseService.addAddress(user.id, addressData);
      }

      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm(t('confirm_delete_address'))) return;
    try {
      await databaseService.deleteAddress(user.id, id);
      onRefresh();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">{t('address_book')}</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('manage_shipping_billing')}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
        >
          <Plus size={14} /> {t('add_address')}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profile?.addressBook?.map(address => (
          <div key={address.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative group">
            {address.isDefault && (
              <span className="absolute top-4 right-4 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase rounded">{t('default')}</span>
            )}
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500 mb-4">{address.label}</h3>
            <div className="space-y-1">
              <p className="font-black text-lg tracking-tighter uppercase">{address.fullName}</p>
              <p className="text-sm text-zinc-400">{address.address}</p>
              <p className="text-sm text-zinc-400">{address.city}</p>
              <p className="text-sm text-zinc-400">{address.phone}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handleEdit(address)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
              >
                {t('edit')}
              </button>
              <button 
                onClick={() => handleDelete(address.id)}
                className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-lg transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">
              {editingAddress ? t('edit_address') : t('add_new_address')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('label')} (e.g. Home, Office)</label>
                <input 
                  type="text" 
                  required
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('full_name')}</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('address')}</label>
                <input 
                  type="text" 
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('city')}</label>
                <input 
                  type="text" 
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('phone')}</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="isDefault"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-600"
                />
                <label htmlFor="isDefault" className="text-xs font-bold uppercase tracking-widest text-zinc-400 cursor-pointer">
                  {t('set_as_default_address')}
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw size={14} className="animate-spin" />}
                  {editingAddress ? t('update_address') : t('save_address')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AccountSettings: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const { t } = useTranslation();
  const { user, updateProfile, linkGoogle, linkApple, unlinkProvider, updateEmail } = useAuthStore();
  const [callsign, setCallsign] = useState(profile?.callsign || '');
  const [teamName, setTeamName] = useState(profile?.teamName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [newEmail, setNewEmail] = useState('');
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await updateProfile({ callsign, teamName, displayName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setLoading(true);
    setEmailError('');
    setEmailSuccess(false);
    try {
      await updateEmail(newEmail);
      setEmailSuccess(true);
      setShowEmailChange(false);
      setNewEmail('');
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (error: any) {
      setEmailError(error.code ? getAuthErrorMessage(error.code) : (error.message || t('failed_to_update_email')));
    } finally {
      setLoading(false);
    }
  };

  const isLinked = (providerId: string) => user?.linkedProviders.includes(providerId);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase">{t('profile_center')}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('manage_operator_identity')}</p>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('callsign')}</label>
              <input 
                type="text" 
                value={callsign}
                onChange={e => setCallsign(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                placeholder={t('eg_ghost')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('team_name')}</label>
              <input 
                type="text" 
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                placeholder={t('eg_task_force')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('display_name')}</label>
              <input 
                type="text" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('email_address')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="email" 
                    value={user?.email}
                    disabled
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-500 cursor-not-allowed"
                  />
                  {user?.isEmailVerified ? (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                  ) : (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500" size={16} />
                  )}
                </div>
                {!user?.isEmailVerified && (
                  <button 
                    type="button"
                    onClick={() => useAuthStore.getState().sendVerificationEmail()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700"
                  >
                    {t('verify')}
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowEmailChange(!showEmailChange)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-700"
                >
                  {t('change')}
                </button>
              </div>
              {showEmailChange && (
                <div className="mt-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('new_email_address')}</p>
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="new@example.com"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={handleEmailChange}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                    >
                      {t('update')}
                    </button>
                  </div>
                  {emailError && <p className="text-red-500 text-[10px] font-bold uppercase">{emailError}</p>}
                  <p className="text-[10px] text-zinc-500 italic">{t('reauth_note')}</p>
                </div>
              )}
              {emailSuccess && (
                <p className="mt-2 text-green-500 text-[10px] font-bold uppercase flex items-center gap-2">
                  <CheckCircle2 size={12} /> {t('verification_email_sent')}
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 flex justify-between items-center">
            {success && (
              <p className="text-green-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} /> {t('profile_updated_successfully')}
              </p>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="ml-auto px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {loading && <RefreshCw size={14} className="animate-spin" />}
              {t('save_changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SecuritySettings: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const { t } = useTranslation();
  const { user, deleteAccount, resetPassword, linkGoogle, linkApple, unlinkProvider } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [googleLogo, setGoogleLogo] = useState<string>('');

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const url = await databaseService.getFileURL('site/2d/Google__G__logo.svg.png');
        setGoogleLogo(url);
      } catch (err) {
        console.error('Failed to fetch Google logo:', err);
      }
    };
    fetchLogo();
  }, []);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      window.location.href = '/';
    } catch (error: any) {
      setDeleteError(error.message || 'Failed to delete account. Re-authentication might be required.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (user?.email) {
      try {
        console.log('Initiating password reset for:', user.email);
        await resetPassword(user.email);
        setSecurityMessage({ type: 'success', text: t('password_reset_email_sent') });
        setTimeout(() => setSecurityMessage(null), 5000);
      } catch (error: any) {
        console.error('Error sending reset email:', error);
        const errorMessage = error.code ? getAuthErrorMessage(error.code) : (error.message || t('failed_to_send_reset_email'));
        setSecurityMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setSecurityMessage(null), 5000);
      }
    } else {
      console.warn('Cannot reset password: No email associated with user account');
      setSecurityMessage({ type: 'error', text: t('no_email_associated') });
      setTimeout(() => setSecurityMessage(null), 5000);
    }
  };

  const handleLinkProvider = async (provider: 'google' | 'apple') => {
    try {
      if (provider === 'google') await linkGoogle();
      else await linkApple();
      setSecurityMessage({ type: 'success', text: t('account_linked_successfully') });
    } catch (error: any) {
      setSecurityMessage({ type: 'error', text: error.message || t('failed_to_link_account') });
    }
  };

  const handleUnlinkProvider = async (providerId: string) => {
    try {
      await unlinkProvider(providerId);
      setSecurityMessage({ type: 'success', text: t('account_unlinked_successfully') });
    } catch (error: any) {
      setSecurityMessage({ type: 'error', text: error.message || t('failed_to_unlink_account') });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tighter uppercase">{t('security_and_auth')}</h2>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-1">{t('protect_account_manage_access')}</p>
      </header>

      {securityMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border ${
            securityMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          } text-[10px] font-black uppercase tracking-widest flex items-center gap-3`}
        >
          {securityMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {securityMessage.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Lock className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">{t('password')}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('last_changed_recently')}</p>
            </div>
          </div>
          <button 
            onClick={handlePasswordReset}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {t('change_password')}
          </button>
        </div>

        {/* MFA Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Smartphone className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">{t('two_factor_auth')}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {t('status')}: <span className={user?.isMfaEnabled ? 'text-green-500' : 'text-red-500'}>
                  {user?.isMfaEnabled ? t('enabled') : t('disabled')}
                </span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSecurityMessage({ type: 'error', text: 'MFA setup requires phone verification. Please contact support for assistance.' })}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {user?.isMfaEnabled ? t('manage_mfa') : t('enable_mfa')}
          </button>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <h3 className="font-black uppercase tracking-widest text-sm mb-6">{t('linked_accounts')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Google */}
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden">
                {googleLogo ? (
                  <img src={googleLogo} alt="Google" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Google</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {user?.linkedProviders.includes('google.com') ? t('connected') : t('not_connected')}
                </p>
              </div>
            </div>
            {user?.linkedProviders.includes('google.com') ? (
              <button 
                onClick={() => handleUnlinkProvider('google.com')}
                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
              >
                {t('unlink')}
              </button>
            ) : (
              <button 
                onClick={() => handleLinkProvider('google')}
                className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest"
              >
                {t('link')}
              </button>
            )}
          </div>

          {/* Apple */}
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Apple</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {user?.linkedProviders.includes('apple.com') ? t('connected') : t('not_connected')}
                </p>
              </div>
            </div>
            {user?.linkedProviders.includes('apple.com') ? (
              <button 
                onClick={() => handleUnlinkProvider('apple.com')}
                className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest"
              >
                {t('unlink')}
              </button>
            ) : (
              <button 
                onClick={() => handleLinkProvider('apple')}
                className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest"
              >
                {t('link')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black uppercase tracking-widest text-sm">{t('active_sessions')}</h3>
          <button 
            onClick={() => setSecurityMessage({ type: 'error', text: 'To sign out from all devices, please reset your password.' })}
            className="text-[10px] font-black text-red-600 hover:text-red-500 uppercase tracking-widest"
          >
            {t('sign_out_all_devices')}
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                <Smartphone className="text-zinc-500" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">{t('current_device')}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {navigator.userAgent.includes('Windows') ? 'Chrome on Windows' : 'Mobile Device'} • {t('active_now')}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-black uppercase rounded">{t('this_device')}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-600/5 border border-red-600/20 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <AlertCircle className="text-red-600" size={24} />
          <h3 className="font-black uppercase tracking-widest text-sm">{t('danger_zone')}</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-6">{t('delete_account_warning')}</p>
        
        {!showDeleteConfirm ? (
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-3 bg-red-600/10 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-xl border border-red-600/20 hover:bg-red-600/20 transition-all"
          >
            {t('delete_account')}
          </button>
        ) : (
          <div className="space-y-4 max-w-sm">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{t('confirm_deletion_password')}</p>
            <input 
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder={t('confirm_password')}
              className="w-full bg-zinc-950 border border-red-600/50 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-red-600 transition-colors"
            />
            {deleteError && <p className="text-red-500 text-[10px] font-bold uppercase">{deleteError}</p>}
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
              >
                {deleteLoading ? t('deleting') : t('confirm_delete')}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-700 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
