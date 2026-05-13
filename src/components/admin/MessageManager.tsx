import React, { useState } from 'react';
import { Trash2, Mail, MessageSquare, Wrench } from 'lucide-react';
import { ServiceRequest } from '../../types';
import { ServiceRequestManager } from './ServiceRequestManager';

export const MessageManager: React.FC<{ 
  messages: any[], 
  serviceRequests?: ServiceRequest[],
  onDelete: (id: string) => void,
  onConfirm: (message: string, action: () => void) => void,
  onDeleteServiceRequest?: (id: string) => void,
  onUpdateServiceRequestStatus?: (id: string, status: string, newUpdate?: string) => void
}> = ({ messages, serviceRequests = [], onDelete, onConfirm, onDeleteServiceRequest, onUpdateServiceRequestStatus }) => {
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'service-requests'>('messages');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Communications</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'messages' 
                ? 'bg-[#ab1017] text-white' 
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <MessageSquare size={16} />
            Contact Messages ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('service-requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'service-requests' 
                ? 'bg-[#ab1017] text-white' 
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <Wrench size={16} />
            Service Requests ({serviceRequests.length})
          </button>
        </div>
      </div>

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedMessage?.id === msg.id 
                      ? 'bg-red-500/10 border-[#ab1017]/30 shadow-sm' 
                      : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[#ab1017]/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ab1017]">{msg.subject}</span>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50">{new Date(msg.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-[var(--text-primary)] truncate">{msg.name}</h4>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{msg.email}</p>
                </button>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-primary)] rounded-3xl border-2 border-dashed border-[var(--border-color)]">
                  <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs opacity-50">No messages yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 space-y-8 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#ab1017]/10 text-[#ab1017] text-[10px] font-black uppercase tracking-widest rounded-md">
                        {selectedMessage.subject}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-secondary)] opacity-50">
                        {new Date(selectedMessage.date).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)]">{selectedMessage.name}</h3>
                    <p className="text-[var(--text-secondary)] font-medium">{selectedMessage.email}</p>
                  </div>
                  <button 
                    onClick={() => { 
                      onConfirm('Are you sure you want to delete this message?', () => {
                        onDelete(selectedMessage.id); 
                        setSelectedMessage(null); 
                      });
                    }}
                    className="p-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="p-6 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] min-h-[200px]">
                  <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex gap-4">
                  <a 
                    href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent('Re: ' + selectedMessage.subject)}`}
                    className="px-6 py-3 bg-[#ab1017] text-white font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all text-xs flex items-center gap-2"
                  >
                    <Mail size={16} />
                    Reply via Email
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-[var(--bg-primary)] rounded-[32px] border-2 border-dashed border-[var(--border-color)]">
                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-secondary)] opacity-20">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h4 className="text-[var(--text-primary)] font-bold">Select a message</h4>
                  <p className="text-[var(--text-secondary)] text-sm">Choose a message from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'service-requests' && (
        <div className="mt-6">
          <ServiceRequestManager 
            requests={serviceRequests}
            onConfirm={onConfirm}
            onDelete={onDeleteServiceRequest!}
            onUpdateStatus={onUpdateServiceRequestStatus!}
          />
        </div>
      )}
    </div>
  );
};
