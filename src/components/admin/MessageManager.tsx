import React, { useState } from 'react';
import { Trash2, Mail, MessageSquare } from 'lucide-react';

export const MessageManager: React.FC<{ 
  messages: any[], 
  onDelete: (id: string) => void 
}> = ({ messages, onDelete }) => {
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Contact Messages</h2>
        <div className="px-4 py-2 bg-zinc-100 rounded-xl text-xs font-bold text-zinc-600">
          Total: {messages.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedMessage?.id === msg.id 
                    ? 'bg-red-50 border-red-200 shadow-sm' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600">{msg.subject}</span>
                  <span className="text-[10px] font-bold text-zinc-400">{new Date(msg.date).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-zinc-900 truncate">{msg.name}</h4>
                <p className="text-xs text-zinc-500 truncate">{msg.email}</p>
              </button>
            ))}
            {messages.length === 0 && (
              <div className="text-center py-12 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No messages yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white border border-zinc-200 rounded-[32px] p-8 space-y-8 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                      {selectedMessage.subject}
                    </span>
                    <span className="text-xs font-bold text-zinc-400">
                      {new Date(selectedMessage.date).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">{selectedMessage.name}</h3>
                  <p className="text-zinc-500 font-medium">{selectedMessage.email}</p>
                </div>
                <button 
                  onClick={() => { onDelete(selectedMessage.id); setSelectedMessage(null); }}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 min-h-[200px]">
                <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              <div className="flex gap-4">
                <a 
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="px-6 py-3 bg-zinc-900 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all text-xs flex items-center gap-2"
                >
                  <Mail size={16} />
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-200">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-300">
                <MessageSquare size={32} />
              </div>
              <div>
                <h4 className="text-zinc-900 font-bold">Select a message</h4>
                <p className="text-zinc-500 text-sm">Choose a message from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
