import React, { useState } from 'react';
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
  Menu
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 z-20 transition-all duration-300 relative",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("p-4", !isCollapsed && "p-6")}>
        <div className={cn("flex items-center gap-3 mb-8 px-1 transition-all duration-300", isCollapsed ? "justify-center" : "")}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 shrink-0 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 transition-colors shadow-sm"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {!isCollapsed && <span className="font-bold text-xl tracking-tight text-slate-900 group whitespace-nowrap overflow-hidden">V <span className="text-indigo-600">Drive</span></span>}
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
                "w-5 h-5 shrink-0 transition-colors",
                "group-hover:text-indigo-600"
              )} />
              {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={cn("mt-auto p-4 border-t border-slate-200")}>
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
            isActive 
              ? "bg-slate-100 text-slate-900" 
              : "text-slate-600 hover:bg-slate-100",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
