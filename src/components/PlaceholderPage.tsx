import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 relative">
        <Icon className="w-10 h-10 text-indigo-600" />
        <div className="absolute -top-2 -right-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{title}</h1>
      <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 border-dashed animate-pulse flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Section {i}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
