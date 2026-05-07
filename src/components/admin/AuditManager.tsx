import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ArrowRight,
  Eye,
  RefreshCw,
  Terminal,
  Database,
  Globe,
  ChevronRight
} from 'lucide-react';
import { AuditLog } from '../../types';

export const AuditManager = ({ logs, onRefresh }: { 
  logs: AuditLog[], 
  onRefresh: () => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
      const matchesType = typeFilter === 'all' || log.resourceType === typeFilter;
      
      return matchesSearch && matchesSeverity && matchesType;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchQuery, severityFilter, typeFilter]);

  const getSeverityStyle = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'error': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const getSeverityIcon = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle size={14} />;
      case 'error': return <AlertTriangle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      default: return <Info size={14} />;
    }
  };

  const uniqueTypes = Array.from(new Set(logs.map(l => l.resourceType)));

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none mb-2 flex items-center gap-4">
            <Shield size={36} className="text-[#ab1017]" />
            Security Audit Trail
          </h2>
          <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px]">Registry of all system events and administrative vectors</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm">
            <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Total Events</div>
            <div className="text-2xl font-black text-[var(--text-primary)] leading-none">{logs.length}</div>
          </div>
          <button 
            onClick={onRefresh}
            className="p-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-2xl hover:bg-[#ab1017] hover:text-white transition-all shadow-xl shadow-black/10 group active:scale-95"
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--text-primary)] transition-colors opacity-50" size={18} />
          <input 
            type="text" 
            placeholder="Search by user, action or payload..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl outline-none focus:ring-2 focus:ring-[#ab1017] transition-all font-bold text-sm text-[var(--text-primary)]"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" size={18} />
          <select 
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl outline-none appearance-none font-bold text-xs uppercase tracking-widest cursor-pointer hover:border-[#ab1017]/30 transition-all text-[var(--text-primary)]"
          >
            <option value="all" className="bg-[var(--bg-secondary)]">All Severities</option>
            <option value="critical" className="bg-[var(--bg-secondary)]">Critical</option>
            <option value="error" className="bg-[var(--bg-secondary)]">Error</option>
            <option value="warning" className="bg-[var(--bg-secondary)]">Warning</option>
            <option value="info" className="bg-[var(--bg-secondary)]">Info</option>
          </select>
        </div>

        <div className="relative">
          <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" size={18} />
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl outline-none appearance-none font-bold text-xs uppercase tracking-widest cursor-pointer hover:border-[#ab1017]/30 transition-all text-[var(--text-primary)]"
          >
            <option value="all" className="bg-[var(--bg-secondary)]">All Resources</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t} className="bg-[var(--bg-secondary)]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table View */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Timestamp</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Operator</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Action</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Severity</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredLogs.map(log => (
                    <motion.tr 
                      layout
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className={`group cursor-pointer hover:bg-[var(--bg-primary)] transition-colors ${selectedLog?.id === log.id ? 'bg-[var(--bg-primary)]' : ''}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-[var(--text-secondary)] opacity-30" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[var(--text-primary)]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50">{new Date(log.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[#ab1017] group-hover:text-white transition-all opacity-60 group-hover:opacity-100">
                            <User size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[var(--text-primary)]">{log.userName}</span>
                            <span className="text-[10px] text-[var(--text-secondary)] opacity-50 truncate max-w-[120px]">{log.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{log.action}</span>
                          <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter opacity-50">{log.resourceType} #{log.resourceId?.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getSeverityStyle(log.severity)}`}>
                          {getSeverityIcon(log.severity)}
                          {log.severity}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="p-2 text-[var(--text-secondary)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--text-primary)] transition-all">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center gap-4 text-[var(--text-secondary)] opacity-10">
                          <Terminal size={64} />
                          <p className="text-sm font-black uppercase tracking-widest">No audit signals matched the current filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="xl:col-span-1 h-fit sticky top-24">
          <AnimatePresence mode="wait">
            {selectedLog ? (
              <motion.div 
                key={selectedLog.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-[var(--bg-secondary)] rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-2xl shadow-black/5"
              >
                <div className="p-8 bg-[var(--text-primary)] text-[var(--bg-primary)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ab1017]/10 blur-[60px] rounded-full" />
                  <div className="relative z-10 space-y-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getSeverityStyle(selectedLog.severity)}`}>
                      {getSeverityIcon(selectedLog.severity)}
                      {selectedLog.severity}
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{selectedLog.action}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold opacity-60">
                      <span className="flex items-center gap-2"><Clock size={14} /> {new Date(selectedLog.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Operator Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Operator Integrity</h4>
                    <div className="p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-xl shadow-sm flex items-center justify-center text-[var(--text-primary)]">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{selectedLog.userName}</div>
                        <div className="text-xs text-[var(--text-secondary)] font-medium">{selectedLog.userEmail}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono opacity-50">ID: {selectedLog.userId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Context Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Contextual Vectors</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                        <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 opacity-50">IP Address</div>
                        <div className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <Globe size={12} className="opacity-30" />
                          {selectedLog.ipAddress || 'Internal Net'}
                        </div>
                      </div>
                      <div className="p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                        <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 opacity-50">Resource</div>
                        <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 capitalize">
                          <Database size={12} className="opacity-30" />
                          {selectedLog.resourceType}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payload Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Payload</h4>
                    <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      <div className="flex items-center gap-2 text-white/20 mb-4 pb-4 border-b border-white/5">
                        <Terminal size={14} />
                        <span className="font-bold tracking-widest uppercase text-[10px]">Registry Output</span>
                      </div>
                      {selectedLog.details}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[var(--bg-primary)] rounded-[32px] border-2 border-dashed border-[var(--border-color)] h-[600px] flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full shadow-xl flex items-center justify-center text-[var(--text-secondary)] mb-6 border border-[var(--border-color)] opacity-20">
                  <Activity size={32} />
                </div>
                <h4 className="text-[var(--text-primary)] font-black uppercase tracking-tighter text-xl">Registry Monitor</h4>
                <p className="text-[var(--text-secondary)] text-sm font-medium mt-2">Select a vector from the audit trail to analyze deep-packet event details and administrative footprint.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
      active 
        ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
        : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
    }`}
  >
    {icon}
    {label}
  </button>
);
