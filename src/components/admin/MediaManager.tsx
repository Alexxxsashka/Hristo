import React, { useState } from 'react';
import { Database, X, Folder, File as FileIcon, Plus, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { firebaseService } from '../../services/firebaseService';

export const MediaManager = ({ onNotify, onConfirm }: { onNotify: any, onConfirm: any }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const folders = [
    { id: 'products/2d', label: 'Product Images (2D)', category: 'Products' },
    { id: 'products/3d', label: 'Product Models (3D)', category: 'Products' },
    { id: 'site/2d', label: 'Branding & Graphics (2D)', category: 'Website' },
    { id: 'site/3d', label: 'Global 3D Assets', category: 'Website' },
    { id: 'site/videos', label: 'Promotion Videos', category: 'Website' },
    { id: 'blog/images', label: 'Blog Media', category: 'Content' },
  ];

  const initializeFolders = async () => {
    onConfirm('Create placeholder files in Google Cloud Storage? This will make the "site/" and "blog/" folders visible in your bucket console.', async () => {
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
        
        onNotify('Bucket structure initialized! You can now see the "site/" folder in your Firebase console.');
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
      className="space-y-12"
    >
      <div className="bg-white p-8 md:p-16 rounded-[48px] border border-zinc-200 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 bg-red-600/10 rounded-[32px] flex items-center justify-center mx-auto mb-10">
            <Database size={48} className="text-red-600" />
          </div>
          <h3 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-6">Cloud Storage Structure</h3>
          <p className="text-zinc-500 font-medium mb-12 leading-relaxed text-lg">
            To see the <span className="text-red-600 font-bold">site/</span> folder in your Google Cloud Storage console (as shown in your screenshot), you must initialize the folder structure. Storage buckets only display "folders" if they contain at least one file. 
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 text-left">
            {['Products', 'Website', 'Content'].map(cat => (
              <div key={cat} className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 px-1">{cat} STRUCTURE</h4>
                <div className="space-y-2">
                  {folders.filter(f => f.category === cat).map(folder => (
                    <div key={folder.id} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-red-600/20 transition-all">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-red-600 shadow-sm border border-zinc-100">
                        <Folder size={16} />
                      </div>
                      <span className="text-xs font-black text-zinc-800 uppercase tracking-tight">{folder.id}/</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-8 bg-zinc-50/50 p-8 rounded-[32px] border border-zinc-100 border-dashed">
            {uploading ? (
              <div className="w-full max-w-sm mx-auto space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <span>CREATING STRUCTURE...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden border border-white">
                  <motion.div 
                    className="h-full bg-red-600" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                  Click below to create <code className="text-red-500 font-bold">.keep</code> placeholder files in all directories. This will make them visible in your Firebase console.
                </p>
                <button
                  onClick={initializeFolders}
                  disabled={uploading}
                  className="px-16 py-6 bg-red-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-2xl shadow-red-600/20 disabled:opacity-50 active:scale-95"
                >
                  Sync Folder Structure
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[48px] p-12 overflow-hidden relative">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h4 className="text-white text-2xl font-black uppercase tracking-tighter mb-4">Why Google Storage?</h4>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Your previous local storage was temporary and would be lost on every application update. By using Google Cloud Storage, all website assets (Logos, Hero Images, Banners) are persisted securely and delivered via high-speed CDN.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center animate-pulse">
              <RefreshCw size={32} className="text-red-500" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      </div>
    </motion.div>
  );
};
