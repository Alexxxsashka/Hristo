import React, { useState } from 'react';
import { Trash2, Wrench, RefreshCw, Send } from 'lucide-react';
import { ServiceRequest } from '../../types';

export const ServiceRequestManager: React.FC<{ 
  requests: ServiceRequest[], 
  onUpdateStatus: (id: string, status: string, newUpdate?: string) => void,
  onDelete: (id: string) => void,
  onConfirm: (message: string, action: () => void) => void
}> = ({ requests, onUpdateStatus, onDelete, onConfirm }) => {
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [newUpdateMessage, setNewUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(selectedRequest.id, status, newUpdateMessage || undefined);
      setSelectedRequest(prev => prev ? { 
        ...prev, 
        status: status as any, 
        updates: newUpdateMessage ? [...prev.updates, { date: new Date().toLocaleDateString(), message: newUpdateMessage }] : prev.updates 
      } : null);
      setNewUpdateMessage('');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Service Requests</h2>
        <div className="px-4 py-2 bg-[var(--bg-primary)] rounded-xl text-xs font-bold text-[var(--text-secondary)]">
          Total: {requests.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
            {requests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedRequest?.id === req.id 
                    ? 'bg-red-500/10 border-[#ab1017]/30 shadow-sm' 
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[#ab1017]/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    req.status === 'Ready for Pickup' ? 'bg-green-500/10 text-green-500' : 'bg-[#ab1017]/10 text-[#ab1017]'
                  }`}>
                    {req.status}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50">
                    {new Date(req.createdAt || req.date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-bold text-[var(--text-primary)] truncate">{req.weaponName}</h4>
                <p className="text-xs text-[var(--text-secondary)] truncate">User ID: {req.userId}</p>
              </button>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 bg-[var(--bg-primary)] rounded-3xl border-2 border-dashed border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs opacity-50">No service requests</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 space-y-8 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)] opacity-50">
                      ID: {selectedRequest.id}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">{selectedRequest.weaponName}</h3>
                  <p className="text-[var(--text-secondary)] font-medium">User ID: {selectedRequest.userId}</p>
                </div>
                <button 
                  onClick={() => { 
                    onConfirm('Are you sure you want to delete this service request?', () => {
                      onDelete(selectedRequest.id); 
                      setSelectedRequest(null); 
                    });
                  }}
                  className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="p-6 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] min-h-[100px]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">Description</h4>
                <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Updates Timeline</h4>
                {selectedRequest.updates?.map((update, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-px bg-[var(--border-color)] relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#ab1017] shadow-[0_0_8px_rgba(171,16,23,0.5)]" />
                    </div>
                    <div className="pb-4">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{update.date}</p>
                      <p className="text-sm text-[var(--text-primary)] font-medium">{update.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Manage Status</h4>
                
                <textarea
                  value={newUpdateMessage}
                  onChange={(e) => setNewUpdateMessage(e.target.value)}
                  placeholder="Optional update message to the customer..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#ab1017] transition-colors resize-none"
                  rows={2}
                />

                <div className="flex flex-wrap gap-2">
                  {['Pending', 'In Progress', 'Completed', 'Ready for Pickup'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isUpdating}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                        selectedRequest.status === status
                          ? 'bg-[#ab1017] text-white border-[#ab1017]'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-[var(--bg-primary)] rounded-[32px] border-2 border-dashed border-[var(--border-color)]">
              <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-secondary)] opacity-20">
                <Wrench size={32} />
              </div>
              <div>
                <h4 className="text-[var(--text-primary)] font-bold">Select a request</h4>
                <p className="text-[var(--text-secondary)] text-sm">Choose a service request from the list to manage it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
