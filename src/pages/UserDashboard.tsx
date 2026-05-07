import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Wrench, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  AlertCircle,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useConfiguratorStore, SavedBuild } from '../store/configuratorStore';
import { databaseService } from '../services/databaseService';
import { Order, ServiceRequest, UserProfile } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

// Modularized Components
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { OrderHistory } from '../components/dashboard/OrderHistory';
import { LoyaltyRank } from '../components/dashboard/LoyaltyRank';
import { ServiceRepairs } from '../components/dashboard/ServiceRepairs';
import { AddressBook } from '../components/dashboard/AddressBook';
import { AccountSettings } from '../components/dashboard/AccountSettings';
import { SecuritySettings } from '../components/dashboard/SecuritySettings';

type Tab = 'dashboard' | 'orders' | 'loyalty' | 'service' | 'settings' | 'address' | 'security';

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
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
      const [userProfile, userBuilds, userOrders, userServices] = await Promise.all([
        databaseService.getUserProfile(user.id),
        databaseService.getUserBuilds(user.id),
        databaseService.getUserOrders(user.id),
        databaseService.getUserServiceRequests(user.id)
      ]);

      setProfile(userProfile as UserProfile);
      setOrders(userOrders as Order[]);
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ab1017] border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-24 pb-12 px-4 sm:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-[var(--bg-secondary)] backdrop-blur-xl border border-[var(--border-color)] rounded-3xl overflow-hidden sticky top-28 shadow-xl">
            <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-br from-[#ab1017]/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#ab1017] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ab1017]/20">
                  <UserIcon className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="font-black text-lg tracking-tighter uppercase leading-none">
                    {profile?.callsign || user?.username}
                  </h2>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
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
                          ? 'bg-[#ab1017] text-white shadow-lg shadow-[#ab1017]/20' 
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[#ab1017]'} />
                      {item.label}
                      {activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-4 border-t border-[var(--border-color)]">
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
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ab1017] to-transparent opacity-50" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${confirmModal.type === 'danger' ? 'bg-[#ab1017]/20 text-[#ab1017]' : 'bg-amber-600/20 text-amber-600'}`}>
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)]">{confirmModal.title}</h3>
                  <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest mt-1">Tactical Confirmation Required</p>
                </div>
              </div>
              
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 font-medium">
                {confirmModal.message}
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-6 py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-[var(--border-color)]"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-6 py-4 ${confirmModal.type === 'danger' ? 'bg-[#ab1017] hover:bg-[#8e0d13] shadow-[#ab1017]/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'} text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl`}
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
