import React from 'react';
import { useWishlistStore } from '../store/wishlistStore';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '../components/SEO';

export const WishlistPage: React.FC = () => {
  const { items } = useWishlistStore();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24">
      <SEO 
        title="My Wishlist"
        description="View and manage your favorite airsoft products."
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <Heart size={24} className="text-white" fill="currentColor" />
          </div>
          <div>
            <span className="text-red-600 text-[10px] font-black tracking-[0.3em] uppercase mb-1 block">YOUR COLLECTION</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">WISHLIST</h1>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-zinc-900/30 rounded-[40px] border border-zinc-800 border-dashed"
          >
            <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-zinc-800">
              <Heart size={40} className="text-zinc-800" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-4">Your wishlist is empty</h2>
            <p className="text-zinc-500 font-medium max-w-sm mx-auto mb-12">
              Explore our catalog and add your favorite products to your collection to keep track of them.
            </p>
            <Link 
              to="/shop"
              className="inline-flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white text-xs font-black tracking-widest uppercase rounded-2xl transition-all shadow-2xl shadow-red-900/20 group"
            >
              START SHOPPING
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};
