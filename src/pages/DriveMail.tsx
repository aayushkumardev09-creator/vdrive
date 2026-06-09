import React, { useState, useEffect } from 'react';
import { Mail, RefreshCcw, CheckCircle2, AlertCircle, Loader2, ExternalLink, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';

const ALL_TIMEFRAMES = [
  { value: '24h', label: 'Last 24 Hours', days: 1 },
  { value: '2d', label: 'Last 2 Days', days: 2 },
  { value: '3d', label: 'Last 3 Days', days: 3 },
  { value: '4d', label: 'Last 4 Days', days: 4 },
  { value: '5d', label: 'Last 5 Days', days: 5 },
  { value: '6d', label: 'Last 6 Days', days: 6 },
  { value: '1w', label: 'Last 1 Week', days: 7 },
];

export default function DriveMail() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [lockedToday, setLockedToday] = useState(false);
  const [maxDaysSyncedToday, setMaxDaysSyncedToday] = useState(0);

  useEffect(() => {
    const checkDailyLock = async () => {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('system_logs')
          .select('*')
          .eq('event_type', 'DRIVEMAIL_SYNC')
          .gte('created_at', startOfToday.toISOString())
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Failed to check system logs:", error);
          return;
        }

        let maxDays = 0;
        data?.forEach(log => {
          const tf = log.metadata?.timeframe;
          const match = ALL_TIMEFRAMES.find(t => t.value === tf);
          if (match && match.days > maxDays) {
            maxDays = match.days;
          }
        });

        setMaxDaysSyncedToday(maxDays);

        if (maxDays >= 7) {
          setLockedToday(true);
        } else {
          setLockedToday(false);
          const nextAvailable = ALL_TIMEFRAMES.find(t => t.days > maxDays);
          if (nextAvailable) {
            setTimeframe(nextAvailable.value);
          }
        }
      } catch (e) {
        console.error('Error fetching sync data', e);
      }
    };
    
    checkDailyLock();
  }, []);

  const availableTimeframes = ALL_TIMEFRAMES.filter(t => t.days > maxDaysSyncedToday);

  const triggerSync = async () => {
    if (lockedToday) return;
    
    setIsSyncing(true);
    setLastSyncStatus('idle');
    setErrorMessage('');

    const webhookUrl = '/api/webhooks/drivemail';

    if (!webhookUrl) {
      setIsSyncing(false);
      setLastSyncStatus('error');
      setErrorMessage('The sync webhook URL is not configured.');
      return;
    }

    const getAfterDate = (tf: string) => {
      const d = new Date();
      if (tf === '24h') d.setDate(d.getDate() - 1);
      else if (tf === '2d') d.setDate(d.getDate() - 2);
      else if (tf === '3d') d.setDate(d.getDate() - 3);
      else if (tf === '4d') d.setDate(d.getDate() - 4);
      else if (tf === '5d') d.setDate(d.getDate() - 5);
      else if (tf === '6d') d.setDate(d.getDate() - 6);
      else if (tf === '1w') d.setDate(d.getDate() - 7);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'vdrive',
          timestamp: new Date().toISOString(),
          action: 'FETCH_JOBS',
          timeframe: timeframe,
          after_date: getAfterDate(timeframe)
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      setLastSyncStatus('success');

      // Log to database instead of localStorage
      await supabase.from('system_logs').insert([{
        event_type: 'DRIVEMAIL_SYNC',
        metadata: {
          timeframe: timeframe,
          after_date: getAfterDate(timeframe)
        }
      }]);

      const match = ALL_TIMEFRAMES.find(t => t.value === timeframe);
      if (match && match.days > maxDaysSyncedToday) {
        setMaxDaysSyncedToday(match.days);
        if (match.days >= 7) {
          setLockedToday(true);
        } else {
          const nextAvailable = ALL_TIMEFRAMES.find(t => t.days > match.days);
          if (nextAvailable) {
            setTimeframe(nextAvailable.value);
          }
        }
      }

      
    } catch (error) {
      console.error('Sync Error:', error);
      setLastSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred during sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-6">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">DriveMail Sync</h1>
            <p className="text-slate-500 font-medium tracking-tight">Fetch fresh job listings from your connected inboxes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          
          <div className="relative z-10 flex-1">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
              {lockedToday ? (
                <Lock className="w-6 h-6 text-blue-600" />
              ) : (
                <RefreshCcw className={cn("w-6 h-6 text-blue-600", isSyncing && "animate-spin")} />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Discovery</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Trigger the secure sync engine to parse your recruitment emails, extract job data, and sync it directly to the dashboard.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fetch Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={isSyncing || lockedToday}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {availableTimeframes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            
            {lockedToday && (
              <div className="mb-4 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>You have already scanned the last 7 days of emails. Syncing is paused until tomorrow to prevent duplicates.</p>
              </div>
            )}
          </div>

          <button
            onClick={triggerSync}
            disabled={isSyncing || lockedToday}
            className={cn(
              "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] mt-auto relative z-10",
              (isSyncing || lockedToday)
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100"
            )}
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Sync...
              </>
            ) : lockedToday ? (
              <>
                <Lock className="w-5 h-5" />
                Limit Reached
              </>
            ) : (
              <>
                <RefreshCcw className="w-5 h-5" />
                Fetch New Jobs
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {lastSyncStatus === 'success' && !lockedToday && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex gap-4 items-start"
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

            {lastSyncStatus === 'success' && lockedToday && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex gap-4 items-start"
              >
                <div className="bg-emerald-500 rounded-xl p-2 text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Full Week Sync Complete!</h4>
                  <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                    You've successfully fetched the last 7 days of emails. Come back tomorrow to sync the newest 24 hours.
                  </p>
                </div>
              </motion.div>
            )}

            {lastSyncStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-rose-50 border border-rose-100 p-6 rounded-xl flex gap-4 items-start"
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

          <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Duplicate Prevention</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our automated system locks the fetch timeframe to ensure your pipeline stays clean and doesn't pull identical jobs multiple times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
