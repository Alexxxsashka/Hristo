import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { FloatingCompare } from './components/FloatingCompare';
import { ToastContainer } from './components/Toast';
import { useThemeStore } from './store/themeStore';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then(m => ({ default: m.ProductPage })));
const ConfiguratorPageV12 = lazy(() => import('./pages/ConfiguratorPageV12').then(m => ({ default: m.ConfiguratorPageV12 })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const ArticlePage = lazy(() => import('./pages/ArticlePage').then(m => ({ default: m.ArticlePage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const InfoPage = lazy(() => import('./pages/InfoPage').then(m => ({ default: m.InfoPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const UserDashboard = lazy(() => import('./pages/UserDashboard').then(m => ({ default: m.UserDashboard })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })));

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Error Boundary — typed to avoid useDefineForClassFields conflicts
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  declare readonly props: Readonly<{ children: React.ReactNode }>;
  declare state: Readonly<{ hasError: boolean }>;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('App Error Boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-2xl font-black mb-4">Something went wrong.</h1>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 rounded-lg">Reload Page</button>
      </div>
    );
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  // Using includes for the widest possible detection of configurator
  const isConfigurator = location.pathname.toLowerCase().includes('/configurator');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {!isConfigurator && <Navbar />}
      <main id="main-content" className={`flex-grow flex flex-col ${isConfigurator ? '' : 'pt-20'}`} role="main">
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:category" element={<ShopPage />} />
            <Route path="/shop/:category/:subcategory" element={<ShopPage />} />
            <Route path="/product/:id/:slug" element={<ProductPage />} />
            
            {/* Configurator Routes - using wildcard to ensure matching even with deep paths */}
            <Route path="/configurator/*" element={<ConfiguratorPageV12 />} />
            
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<ArticlePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/info/:pageId" element={<InfoPage />} />
            <Route path="/about" element={<InfoPage />} />
            <Route path="/terms" element={<InfoPage />} />
            <Route path="/privacy" element={<InfoPage />} />
            <Route path="/shipping" element={<InfoPage />} />
            <Route path="/payment-methods" element={<InfoPage />} />
            <Route path="/returns" element={<InfoPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/account" element={<UserDashboard />} />
            
            <Route 
              path="/admin/*" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
            {/* Catch-all redirect to home */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isConfigurator && <Footer />}
      {!isConfigurator && <FloatingCompare />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { initialize } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return (
    <Router>
      <ScrollToTop />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}
