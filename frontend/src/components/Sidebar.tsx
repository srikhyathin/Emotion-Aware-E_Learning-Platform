"use client";

import { 
  LayoutDashboard, BookOpen, Users, Shield, 
  Settings, LogOut, Brain, ChevronRight 
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  role: 'student' | 'teacher' | 'admin';
  user: any;
  activeView: string;
  onViewChange: (view: string) => void;
  onSignOut: () => void;
}

export default function Sidebar({ role, user, activeView, onViewChange, onSignOut }: SidebarProps) {
  const menuItems = {
    student: [
      { id: 'dashboard', label: 'My Learning', icon: LayoutDashboard },
      { id: 'courses', label: 'Explore', icon: BookOpen },
    ],
    teacher: [
      { id: 'dashboard', label: 'Insight Portal', icon: LayoutDashboard },
      { id: 'courses', label: 'My Courses', icon: BookOpen },
      { id: 'students', label: 'Students', icon: Users },
    ],
    admin: [
      { id: 'dashboard', label: 'System Health', icon: LayoutDashboard },
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'security', label: 'Security', icon: Shield },
    ]
  };

  const navItems = menuItems[role] || [];

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-slate-950/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-40">
      {/* Brand */}
      <button 
        onClick={() => onViewChange('landing')}
        className="p-8 flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity group"
      >
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight group-hover:text-blue-400 transition-colors">EmotionSense</h2>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{role} portal</span>
        </div>
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
              activeView === item.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'text-slate-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${activeView === item.id ? '' : 'group-hover:text-blue-400'}`} />
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            {activeView === item.id && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </nav>

      {/* User & Footer */}
      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-white/5">
            {user?.full_name?.substring(0, 2).toUpperCase() || 'ES'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@emotionsense.ai'}</p>
          </div>
        </div>

        <div className="space-y-1">
          <button 
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${
              activeView === 'settings' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
              : 'text-slate-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
