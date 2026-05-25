import React, { useState } from 'react';
import { Mail, RefreshCcw, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function DriveMail() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const triggerSync = async () => {
    setIsSyncing(true);
    setLastSyncStatus('idle');
    setErrorMessage('');

    const webhookUrl = import.meta.env.VITE_DRIVEMAIL_SYNC_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl === 'your-sync-webhook-url') {
      setIsSyncing(false);
      setLastSyncStatus('error');
      setErrorMessage('The sync webhook URL is not configured. Please add VITE_DRIVEMAIL_SYNC_WEBHOOK_URL to your environment variables.');
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'V Drive Web App',
          timestamp: new Date().toISOString(),
          action: 'FETCH_JOBS'
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      setLastSyncStatus('success');
    } catch (error) {
      console.error('Sync Error:', error);
      setLastSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred during sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">DriveMail Sync</h1>
            <p className="text-slate-500 font-medium tracking-tight">Fetch fresh job listings from your connected inboxes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          
          <div className="relative z-10">
            <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              <RefreshCcw className={cn("w-6 h-6 text-indigo-600", isSyncing && "animate-spin")} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Discovery</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Trigger the secure sync engine to parse your recruitment emails, extract job data, and sync it directly to the dashboard.
            </p>

            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className={cn(
                "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]",
                isSyncing 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Sync...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-5 h-5" />
                  Fetch New Jobs
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {lastSyncStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-[28px] flex gap-4 items-start"
              >
                <div className="bg-emerald-500 rounded-xl p-2 text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Sync Triggered Successfully</h4>
                  <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                    The sync engine is now processing your inbox. New jobs will appear in the Jobs section shortly.
                  </p>
                </div>
              </motion.div>
            )}

            {lastSyncStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-rose-50 border border-rose-100 p-6 rounded-[28px] flex gap-4 items-start"
              >
                <div className="bg-rose-500 rounded-xl p-2 text-white">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">Workflow Error</h4>
                  <p className="text-rose-700 text-xs mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-slate-50 border border-slate-100 p-8 rounded-[32px] flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Real-time Integration</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our automated system continuously monitors your connected accounts to ensure your job pipeline is always up to date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
