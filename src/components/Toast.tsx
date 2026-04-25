import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastType } from '../store/toastStore';

const ICON_MAP: Record<ToastType, any> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: 'text-green-500 bg-green-500/10 border-green-500/20',
  error: 'text-red-500 bg-red-500/10 border-red-500/20',
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICON_MAP[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[320px] ${COLOR_MAP[toast.type]}`}
            >
              <div className="shrink-0">
                <Icon size={24} />
              </div>
              <p className="flex-1 text-sm font-bold uppercase tracking-widest">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
