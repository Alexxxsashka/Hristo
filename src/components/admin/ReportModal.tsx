import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, FileText, Download, AlertCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (startDate: Date, endDate: Date) => void;
  title: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onGenerate, title }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  const handleGenerate = () => {
    onGenerate(new Date(startDate), new Date(endDate));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] overflow-y-auto p-4 md:p-8 flex justify-center items-center">
          <div className="min-h-full flex items-center justify-center py-8 w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full overflow-hidden shadow-2xl border border-zinc-200 my-auto"
            >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-black text-zinc-900 uppercase tracking-tighter">Generate Report</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} />
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 font-bold text-sm transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} />
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 font-bold text-sm transition-all"
                  />
                </div>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4 flex gap-3 items-start">
                <AlertCircle className="text-zinc-400 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                  The report will include all data within the selected period. PDF will be generated and downloaded automatically.
                </p>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/20 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
