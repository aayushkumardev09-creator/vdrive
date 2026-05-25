import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, HelpCircle, Moon, Sun } from 'lucide-react';

export const TopNav = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Logic could go here to set dark class on html tag
    }
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center w-full max-w-md relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search candidates, jobs..." 
          className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>
        </button>
        <div className="h-9 w-9 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-700 border-2 border-white shadow-sm cursor-pointer hover:bg-slate-300 transition-colors">
          JD
        </div>
      </div>
    </header>
  );
};
