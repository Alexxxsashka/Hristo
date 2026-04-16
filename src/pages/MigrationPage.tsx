import React, { useState } from 'react';
import { migrateData } from '../utils/migration';

export const MigrationPage: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleMigrate = async () => {
    setStatus('migrating');
    addLog('Starting migration...');
    try {
      // Override console.log to capture logs
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        addLog(args.join(' '));
        originalLog(...args);
      };
      console.error = (...args) => {
        addLog(`ERROR: ${args.join(' ')}`);
        originalError(...args);
      };
      console.warn = (...args) => {
        addLog(`WARN: ${args.join(' ')}`);
        originalWarn(...args);
      };

      await migrateData();

      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      setStatus('success');
      addLog('Migration completed successfully!');
    } catch (error) {
      setStatus('error');
      addLog(`Migration failed: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Database Migration to Firebase</h1>
      <div className="bg-[#1a1a1a] p-6 rounded-lg border border-white/10">
        <p className="mb-4 text-gray-400">
          This tool will fetch all data from the current JSON-based API and upload it to Firestore.
        </p>
        
        <button
          onClick={handleMigrate}
          disabled={status === 'migrating'}
          className={`px-6 py-3 rounded-lg font-bold transition-colors ${
            status === 'migrating' 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {status === 'migrating' ? 'Migrating...' : 'Start Migration'}
        </button>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Migration Log</h2>
          <div className="bg-black p-4 rounded border border-white/5 h-64 overflow-y-auto font-mono text-sm">
            {log.length === 0 ? (
              <span className="text-gray-600">No logs yet...</span>
            ) : (
              log.map((entry, i) => (
                <div key={i} className="mb-1">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
