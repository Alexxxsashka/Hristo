import React, { useState } from 'react';
import { Database, X, Folder, File as FileIcon, Plus, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { firebaseService } from '../../services/firebaseService';

export const MediaManager = ({ onNotify, onConfirm }: { onNotify: any, onConfirm: any }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const folders = [
    { id: 'products/2d', label: 'Product Images (2D)' },
    { id: 'products/3d', label: 'Product Models (3D)' },
    { id: 'site/2d', label: 'Site Assets (2D)' },
    { id: 'site/3d', label: 'Site Assets (3D)' },
    { id: 'site/videos', label: 'Site Videos' },
    { id: 'blog/images', label: 'Blog Images' },
    { id: 'blog/videos', label: 'Blog Videos' },
  ];

  const initializeFolders = async () => {
    onConfirm('This will create placeholder files in all necessary storage folders. Continue?', async () => {
      setUploading(true);
      setProgress(0);
      
      try {
        const placeholder = new Blob(['placeholder'], { type: 'text/plain' });
        const fileToUpload = new File([placeholder], '.keep', { type: 'text/plain' });
        
        for (let i = 0; i < folders.length; i++) {
          const folder = folders[i];
          const path = `${folder.id}/.keep`;
          await firebaseService.uploadFile(fileToUpload, path);
          setProgress(((i + 1) / folders.length) * 100);
        }
        
        onNotify('All folders initialized successfully!');
      } catch (err) {
        console.error('Initialization failed', err);
        onNotify('Initialization failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white p-12 rounded-[48px] border border-zinc-200 shadow-sm text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Database size={40} className="text-zinc-900" />
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 mb-4">Storage Management</h3>
          <p className="text-zinc-500 font-medium mb-12 leading-relaxed">
            Manual file uploading has been disabled as requested. Use this tool to initialize the required folder structure in Firebase Storage. This ensures all features of the site (Products, Blog, etc.) have the necessary directory structure to function correctly.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {folders.map(folder => (
              <div key={folder.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Folder</div>
                <div className="text-xs font-bold text-zinc-900 truncate">{folder.label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {uploading && (
              <div className="w-full max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Initializing folders...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-900 transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={initializeFolders}
              disabled={uploading}
              className="px-12 py-5 bg-zinc-900 text-white rounded-[24px] font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 disabled:opacity-50"
            >
              Initialize Folder Structure
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
