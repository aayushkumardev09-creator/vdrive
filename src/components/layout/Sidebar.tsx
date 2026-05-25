import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UserPlus, 
  Sparkles, 
  Send, 
  Mail,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Briefcase, label: 'Jobs', path: '/jobs' },
  { icon: Mail, label: 'DriveMail', path: '/drivemail' },
  { icon: Users, label: 'Candidates', path: '/candidates' },
  { icon: UserPlus, label: 'Upload Candidates', path: '/upload' },
  { icon: Sparkles, label: 'Smart Match', path: '/smart-match' },
  { icon: Send, label: 'Submissions', path: '/submissions' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 z-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-100 italic">
            V
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group">V <span className="text-indigo-600">Drive</span></span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50/50" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                "group-hover:text-indigo-600"
              )} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
            isActive 
              ? "bg-slate-100 text-slate-900" 
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
};
