import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, X, Upload, Calendar, User, Tag } from 'lucide-react';
import { BlogPost } from '../../types';
import { databaseService } from '../../services/databaseService';
import { BLOG_CATEGORIES } from '../../constants';

export const BlogManager = ({ posts, onUpdate, onNotify, onConfirm }: { 
  posts: BlogPost[], 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'title':
        if (!value?.trim()) error = 'Title is required';
        break;
      case 'content':
        if (!value?.trim()) error = 'Content is required';
        break;
      case 'author':
        if (!value?.trim()) error = 'Author name is required';
        break;
    }
    return error;
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditingPost(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title') {
        next.slug = value.toLowerCase().replace(/\s+/g, '-');
      }
      return next;
    });
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errors: Record<string, string> = {};
    const fieldsToValidate = ['title', 'content', 'author'];
    fieldsToValidate.forEach(key => {
      const error = validateField(key, editingPost?.[key as keyof BlogPost]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      onNotify('Please fill in all required fields', 'error');
      return;
    }

    const action = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        if (!editingPost?.id && posts.some(p => p.slug === editingPost?.slug)) {
          throw new Error('A post with this slug already exists.');
        }

        let imageUrl = editingPost?.image || '';
        if (imageFile) {
          const extension = imageFile.name.split('.').pop();
          const safeName = `blog_${Date.now()}.${extension}`;
          imageUrl = await databaseService.uploadFile(imageFile, `blog/images/${safeName}`);
        }

        const postToSave = {
          ...editingPost,
          image: imageUrl,
          date: editingPost?.date || new Date().toISOString()
        };

        await databaseService.saveBlogPost(postToSave as any);
        setIsEditing(false);
        setEditingPost(null);
        setImageFile(null);
        setFieldErrors({});
        onUpdate();
        onNotify('Post saved successfully');
      } catch (err: any) {
        console.error('Failed to save blog post', err);
        onNotify(err.message || 'Failed to save blog post', 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    onConfirm(
      editingPost?.id 
        ? 'Save changes to this post?' 
        : 'Are you sure you want to publish this new post?', 
      action
    );
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

  // SCORCHED EARTH: Forcibly remove 'required' 
  React.useEffect(() => {
    if (isEditing) {
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.removeAttribute('required'));
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">{editingPost?.id ? 'Edit Post' : 'Create New Post'}</h3>
          <button onClick={() => { setIsEditing(false); setFieldErrors({}); }} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form 
          onSubmit={handleSave} 
          noValidate 
          onInvalid={(e) => e.preventDefault()}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Title</label>
              <input 
                type="text" 
                value={editingPost?.title || ''}
                onChange={e => handleFieldChange('title', e.target.value)}
                className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 ${
                  fieldErrors.title ? 'border-red-500' : 'border-zinc-200'
                }`}
              />
              <AnimatePresence>
                {fieldErrors.title && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[11px] font-medium flex items-center gap-1">
                    <X size={12} /> {fieldErrors.title}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Slug</label>
              <input 
                type="text" 
                value={editingPost?.slug || ''}
                onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
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
                onChange={e => handleFieldChange('author', e.target.value)}
                className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 ${
                  fieldErrors.author ? 'border-red-500' : 'border-zinc-200'
                }`}
              />
              <AnimatePresence>
                {fieldErrors.author && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[11px] font-medium flex items-center gap-1">
                    <X size={12} /> {fieldErrors.author}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Excerpt</label>
            <textarea 
              value={editingPost?.excerpt || ''}
              onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Content (Markdown supported)</label>
            <textarea 
              value={editingPost?.content || ''}
              onChange={e => handleFieldChange('content', e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-50 border rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 h-64 resize-none ${
                fieldErrors.content ? 'border-red-500' : 'border-zinc-200'
              }`}
            />
            <AnimatePresence>
              {fieldErrors.content && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[11px] font-medium flex items-center gap-1">
                  <X size={12} /> {fieldErrors.content}
                </motion.p>
              )}
            </AnimatePresence>
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
              onClick={() => { setIsEditing(false); setFieldErrors({}); }}
              className="px-8 py-3 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-12 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Post'}
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
            setEditingPost({ title: '', slug: '', category: BLOG_CATEGORIES[0], author: '', excerpt: '', content: '' });
            setIsEditing(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden group hover:shadow-xl transition-all">
            <div className="aspect-video relative overflow-hidden bg-zinc-100">
              {post.image ? (
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                  <Upload size={32} />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => {
                    setEditingPost(post);
                    setIsEditing(true);
                  }}
                  className="p-2 bg-white/90 backdrop-blur text-zinc-900 rounded-lg hover:bg-white transition-all shadow-lg"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-2 bg-white/90 backdrop-blur text-red-600 rounded-lg hover:bg-white transition-all shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold uppercase tracking-widest">
                  {post.category}
                </span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(post.date).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-lg line-clamp-2">{post.title}</h4>
              <p className="text-sm text-zinc-500 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-50">
                <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">
                  {post.author[0]}
                </div>
                <span className="text-xs font-bold text-zinc-700">{post.author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
