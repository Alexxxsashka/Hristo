import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  ArrowRight, 
  MessageSquare, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { BlogPost } from '../types';
import { BLOG_CATEGORIES } from '../constants';
import { NoImage } from '../components/NoImage';

import { SEO } from '../components/SEO';
import { databaseService } from '../services/databaseService';

export const BlogPage: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [page, category]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await databaseService.getBlogPosts(category || undefined, 100);
      if (data) {
        let filtered = data as BlogPost[];
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchLower) || 
            p.excerpt.toLowerCase().includes(searchLower)
          );
        }
        
        setTotal(filtered.length);
        const limit = 6;
        setTotalPages(Math.ceil(filtered.length / limit));
        setPosts(filtered.slice((page - 1) * limit, page * limit));
      }
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <SEO 
        title="Airsoft Blog & News"
        description="The latest airsoft news, guides, and reviews. Stay up to date with the newest tactical equipment and airsoft technology."
        keywords="airsoft blog, airsoft news, airsoft reviews, tactical guides"
      />
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-900/40 to-zinc-950 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)]" />
        <div className="relative z-20 text-center space-y-4 px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white"
          >
            {t('blog')} <span className="text-red-600">&</span> NEWS
          </motion.h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
            Najnovije vijesti, vodiči i recenzije iz svijeta airsofta
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-12 relative z-30">
        {/* Search & Filter Bar */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-4 rounded-3xl mb-12 flex flex-col md:row items-center gap-4">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="text" 
              placeholder="Pretraži članke..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-red-600 transition-all"
            />
          </form>
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button 
              onClick={() => { setCategory(''); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                category === '' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Sve
            </button>
            {BLOG_CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  category === cat ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl h-[450px] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {posts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-600/50 transition-all group flex flex-col"
                  >
                    <Link to={`/blog/${post.slug}`} className="relative h-64 overflow-hidden block">
                      {post.image?.startsWith('http') ? (
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <NoImage className="w-full h-full" iconSize={48} />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          {post.category}
                        </span>
                      </div>
                    </Link>
                    
                    <div className="p-8 space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-red-600" />
                          {post.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-red-600" />
                          {post.author}
                        </div>
                      </div>
                      
                      <Link to={`/blog/${post.slug}`} className="block">
                        <h2 className="text-2xl font-black text-white leading-tight group-hover:text-red-500 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>
                      
                      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                      
                      <div className="pt-6 flex items-center justify-between border-t border-zinc-800">
                        <Link 
                          to={`/blog/${post.slug}`}
                          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white hover:text-red-500 transition-colors"
                        >
                          {t('read_more')}
                          <ArrowRight size={16} />
                        </Link>
                        <div className="flex items-center gap-1 text-zinc-600">
                          <MessageSquare size={14} />
                          <span className="text-[10px] font-bold">0</span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {posts.length === 0 && (
              <div className="text-center py-20 bg-zinc-900/30 rounded-[40px] border border-zinc-800 border-dashed">
                <p className="text-zinc-500 font-bold uppercase tracking-widest">Nema pronađenih članaka</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white disabled:opacity-30 hover:bg-zinc-800 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        page === i + 1 ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white disabled:opacity-30 hover:bg-zinc-800 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Newsletter Section */}
        <div className="mt-20 bg-red-600 rounded-[40px] p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-red-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 space-y-2 text-center lg:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">{t('newsletter_subscribe')}</h2>
            <p className="text-red-100 font-medium">{t('newsletter_desc')}</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <input 
              type="email" 
              placeholder={t('email_placeholder')}
              className="flex-1 lg:w-80 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all"
            />
            <button className="px-8 py-4 bg-white text-red-600 font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-colors shadow-lg whitespace-nowrap">
              {t('subscribe')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
