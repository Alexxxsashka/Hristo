import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, X, FileText } from 'lucide-react';
import { PolicyPage } from '../../types';
import { databaseService } from '../../services/databaseService';

export const PolicyManager = ({ policies, onUpdate, onNotify, onConfirm }: { 
  policies: PolicyPage[], 
  onUpdate: () => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void,
  onConfirm: (msg: string, action: () => void) => void
}) => {
  const [editingPolicy, setEditingPolicy] = useState<Partial<PolicyPage> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy || !editingPolicy.title || !editingPolicy.content) {
      onNotify('Please fill in both title and content', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const id = editingPolicy.id || editingPolicy.title.toLowerCase().replace(/\s+/g, '-');
      await databaseService.savePolicy({
        ...editingPolicy,
        id,
        lastUpdated: new Date().toISOString()
      } as PolicyPage);
      onNotify('Policy saved successfully');
      setEditingPolicy(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to save policy', err);
      onNotify('Failed to save policy', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    onConfirm('Are you sure you want to delete this policy?', async () => {
      try {
        await databaseService.deletePolicy(id);
        onNotify('Policy deleted successfully');
        onUpdate();
      } catch (err) {
        console.error('Failed to delete policy', err);
        onNotify('Failed to delete policy', 'error');
      }
    });
  };

  if (editingPolicy) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">{isNew ? 'New Policy' : 'Edit Policy'}</h3>
          <button onClick={() => setEditingPolicy(null)} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {isNew && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Policy ID (slug, e.g. privacy-policy)</label>
              <input 
                type="text" 
                value={editingPolicy.id || ''}
                onChange={e => setEditingPolicy({ ...editingPolicy, id: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                placeholder="privacy-policy"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-lg w-fit">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">English (EN)</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Title</label>
                <input 
                  type="text" 
                  value={editingPolicy.title || ''}
                  onChange={e => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Content (Markdown)</label>
                <textarea 
                  value={editingPolicy.content || ''}
                  onChange={e => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-[300px] resize-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg w-fit">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Croatian (HR)</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Title (HR)</label>
                <input 
                  type="text" 
                  value={editingPolicy.title_hr || ''}
                  onChange={e => setEditingPolicy({ ...editingPolicy, title_hr: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Content (HR - Markdown)</label>
                <textarea 
                  value={editingPolicy.content_hr || ''}
                  onChange={e => setEditingPolicy({ ...editingPolicy, content_hr: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none h-[300px] resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-100">
            <button 
              type="button" 
              onClick={() => setEditingPolicy(null)}
              className="px-8 py-3 text-zinc-600 font-bold hover:bg-zinc-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-12 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button 
            onClick={() => {
              setIsNew(true);
              setEditingPolicy({ title: '', content: '' });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
          >
            <Plus size={20} />
            New Policy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map(policy => (
          <div key={policy.id} className="bg-white p-6 rounded-2xl border border-zinc-200 group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 group-hover:text-zinc-900 transition-colors">
                <FileText size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsNew(false);
                    setEditingPolicy(policy);
                  }}
                  className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(policy.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-lg mb-2">{policy.title}</h4>
            <p className="text-xs text-zinc-400 font-mono mb-4">ID: {policy.id}</p>
            <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Last Updated: {policy.lastUpdated ? new Date(policy.lastUpdated).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
