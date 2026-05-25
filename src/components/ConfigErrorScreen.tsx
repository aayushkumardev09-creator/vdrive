import React from 'react';
import { AlertTriangle } from 'lucide-react';

type MissingListProps = { missingKeys: string[] };

const MissingList = ({ missingKeys }: MissingListProps) => {
  return (
    <ul className="mt-4 list-disc list-inside text-slate-700 text-sm">
      {missingKeys.map((k) => (
        <li key={k} className="break-all">{k}</li>
      ))}
    </ul>
  );
};

export function ConfigErrorScreen(props: { missingKeys: string[] }) {
  const { missingKeys } = props;
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configuration Error</h1>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed">
              The app is running in production mode, but required environment variables are missing.
              Update your deployment environment variables and reload.
            </p>
          </div>
        </div>

        <MissingList missingKeys={missingKeys} />

        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-[12px] text-slate-600 font-bold uppercase tracking-widest">Required variables</p>
          <p className="text-sm text-slate-700 mt-2">
            VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_DRIVEMAIL_SYNC_WEBHOOK_URL, VITE_SUBMISSION_WEBHOOK_URL
          </p>
        </div>
      </div>
    </div>
  );
}

