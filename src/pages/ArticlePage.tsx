import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  ChevronLeft, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin,
  Clock,
  Tag,
  ArrowRight,
  Package
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '../hooks/useTranslation';
import { BlogPost, Product } from '../types';
import { firebaseService } from '../services/firebaseService';

import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const posts = await firebaseService.getBlogPosts();
      const data = posts?.find((p: BlogPost) => p.slug === slug);
      
      if (data) {
        setPost(data);
        
        // Fetch related products if any
        if (data.relatedProductIds && data.relatedProductIds.length > 0) {
          const allProducts = await firebaseService.getProducts();
          if (allProducts) {
            setRelatedProducts(allProducts.filter((p: Product) => data.relatedProductIds?.includes(p.id)));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch post', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Članak nije pronađen</h2>
        <Link to="/blog" className="flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest hover:text-red-500 transition-colors">
          <ChevronLeft size={20} />
          Povratak na blog
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: post.category, path: `/blog?category=${post.category}` },
    { label: post.title, path: `/blog/${post.slug}` }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": [post.image || 'https://picsum.photos/seed/article/1200/630'],
    "datePublished": post.date,
    "author": [{
      "@type": "Person",
      "name": post.author
    }]
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <SEO 
        title={post.title}
        description={post.excerpt}
        keywords={`${post.title}, ${post.category}, airsoft blog`}
        ogType="article"
        ogImage={post.image}
        structuredData={structuredData}
      />
      
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-end pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-10" />
        <img 
          src={post.image?.startsWith('http') ? post.image : (post.image || 'https://picsum.photos/seed/article/1920/1080')} 
          alt={post.title} 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        
        <div className="max-w-4xl mx-auto px-8 relative z-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Link to="/blog" className="inline-flex items-center gap-2 text-red-600 font-bold uppercase tracking-widest text-xs hover:text-red-500 transition-colors mb-4">
              <ChevronLeft size={16} />
              {post.category}
            </Link>
            
            <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-zinc-400 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-red-600" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-red-600" />
                {post.author}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-red-600" />
                5 min čitanja
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          <div className="prose prose-invert prose-red max-w-none">
            <div className="text-zinc-300 text-lg leading-relaxed space-y-6">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="pt-12 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Podijeli članak:</span>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all">
                  <Facebook size={18} />
                </button>
                <button className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all">
                  <Twitter size={18} />
                </button>
                <button className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all">
                  <Linkedin size={18} />
                </button>
                <button className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
              <Tag size={14} className="text-red-600" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{post.category}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-12">
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Package size={20} className="text-red-600" />
                Povezani proizvodi
              </h3>
              <div className="space-y-4">
                {relatedProducts.map(product => (
                  <Link 
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-red-600/30 transition-all group"
                  >
                    <div className="w-20 h-20 bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center">
                      <img 
                        src={product.image?.startsWith('http') ? product.image : (product.image || (product.model3D ? `https://picsum.photos/seed/${product.id}/200` : 'https://placehold.co/200x200?text=No+Image'))} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate group-hover:text-red-500 transition-colors">{product.name}</h4>
                      <p className="text-red-600 font-black text-sm mt-1">€{product.price}</p>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold uppercase mt-1">
                        Pogledaj <ArrowRight size={10} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter Sidebar */}
          <div className="bg-red-600 p-8 rounded-[32px] space-y-6 shadow-2xl shadow-red-600/20">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
              Ne propustite nove objave
            </h3>
            <p className="text-red-100 text-sm font-medium">
              Pretplatite se na naš newsletter i primajte najnovije vodiče i recenzije direktno u svoj inbox.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Vaša email adresa"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all text-sm"
              />
              <button className="w-full py-3 bg-white text-red-600 font-black uppercase tracking-widest rounded-xl hover:bg-zinc-100 transition-colors shadow-lg text-xs">
                Prijavi se
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
