import { useEffect, lazy, Suspense } from 'react';
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

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a]">
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/configurator" element={<ConfiguratorPageV12 />} />
            <Route path="/configurator/:id" element={<ConfiguratorPageV12 />} />
            <Route path="/configurator/v1.2" element={<ConfiguratorPageV12 />} />
            <Route path="/configurator/v1.2/:id" element={<ConfiguratorPageV12 />} />
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
  );
}
