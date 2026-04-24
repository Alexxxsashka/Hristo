import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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

import { FloatingCompare } from './components/FloatingCompare';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useAuthStore } from './store/authStore';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Error Boundary for the whole app
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any; errorInfo: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Critical App Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Something went wrong</h1>
          <p className="text-zinc-500 mb-8 max-w-md">The application crashed during initialization. Please try refreshing the page.</p>
          
          {this.state.error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left max-w-2xl mx-auto overflow-auto max-h-64">
              <p className="text-red-500 font-mono text-sm whitespace-pre-wrap">
                {this.state.error.toString()}
              </p>
              {this.state.errorInfo && (
                <p className="text-zinc-600 font-mono text-[10px] mt-4 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </p>
              )}
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    console.log("App: Initializing auth...");
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-[#0a0a0a]">
          <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/configurator" element={<ConfiguratorPageV12 />} />
              <Route path="/configurator/:id" element={<ConfiguratorPageV12 />} />
              <Route 
                path="*" 
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/shop/:category" element={<ShopPage />} />
                      <Route path="/shop/:category/:subcategory" element={<ShopPage />} />
                      <Route path="/shop/:category/:subcategory/:id" element={<ProductPage />} />
                      <Route path="/shop/:category/:slug" element={<ProductPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/product/:id" element={<ProductPage />} />
                      <Route path="/product/:id/:slug" element={<ProductPage />} />
                      <Route path="/compare" element={<ComparePage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<ArticlePage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/about" element={<InfoPage />} />
                      <Route path="/terms" element={<InfoPage />} />
                      <Route path="/privacy" element={<InfoPage />} />
                      <Route path="/shipping" element={<InfoPage />} />
                      <Route path="/payment-methods" element={<InfoPage />} />
                      <Route path="/returns" element={<InfoPage />} />
                      <Route path="/online-payment" element={<InfoPage />} />
                      <Route path="/sizes" element={<InfoPage />} />
                      <Route path="/legal" element={<InfoPage />} />
                      <Route path="/account" element={<UserDashboard />} />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedAdminRoute>
                            <AdminDashboard />
                          </ProtectedAdminRoute>
                        } 
                      />
                    </Routes>
                  </main>
                  <Footer />
                </div>
                }
              />
            </Routes>
          </Suspense>
          <FloatingCompare />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
