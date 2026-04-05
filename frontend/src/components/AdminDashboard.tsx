"use client";

import { Users, BookOpen, Shield, BarChart3, Settings, AlertCircle, Activity, MoreVertical, Search as SearchIcon, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Users", value: "1,248", icon: Users, color: "blue", trend: "+5.2%" },
    { label: "Course Volume", value: "84", icon: BookOpen, color: "emerald", trend: "+2.1%" },
    { label: "Threat Level", value: "Normal", icon: Shield, color: "purple", trend: "0.0%" },
    { label: "System Health", value: "99.9%", icon: Activity, color: "rose", trend: "Stable" },
  ];

  return (
    <div className="p-10 space-y-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-rose-500 font-bold uppercase text-[10px] tracking-[0.3em]">
            <span className="w-8 h-[1px] bg-rose-500/30" /> System Control
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Platform Administration</h1>
          <p className="text-slate-500 font-medium">Global oversight of users, infrastructure, and security protocols.</p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 font-bold hover:text-white transition-all uppercase text-[10px] tracking-widest">
            <BarChart3 className="w-4 h-4" /> Download Report
          </button>
          <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 font-bold hover:text-white transition-all uppercase text-[10px] tracking-widest">
            <Settings className="w-4 h-4" /> Engine Config
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] group hover:border-rose-500/20 transition-all relative overflow-hidden shadow-2xl"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 blur-[40px] rounded-full -mr-16 -mt-16`} />
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl bg-slate-950 border border-white/5 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.trend}</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/20">
            <div className="flex items-center gap-3">
               <Users className="w-5 h-5 text-blue-500" />
               <h3 className="text-xl font-black text-white tracking-tight">Recent Registrations</h3>
            </div>
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="Find a user..."
                className="bg-slate-950 border border-white/5 rounded-xl pl-12 pr-6 py-2.5 text-sm text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 w-64 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase text-slate-500 font-black tracking-widest bg-slate-950/40">
                <tr>
                  <th className="px-8 py-5">Node Identity</th>
                  <th className="px-8 py-5">Authorization</th>
                  <th className="px-8 py-5">Heartbeat</th>
                  <th className="px-8 py-5 text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: "Dr. Aris Thorne", email: "athor@platform.io", role: "Admin", status: "Active" },
                  { name: "Marcus Vane", email: "mvane@edu.net", role: "Teacher", status: "Idle" },
                  { name: "Sarah Connor", email: "scon@future.com", role: "Student", status: "Active" },
                  { name: "Jack Reacher", email: "jack@unknown.org", role: "Student", status: "Suspended" },
                ].map((u, i) => (
                  <tr key={i} className="text-sm text-slate-300 hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center font-black text-rose-500 text-xs">
                           {u.name.substring(0, 1)}
                        </div>
                        <div>
                          <div className="font-black text-white group-hover:text-blue-400 transition-colors">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                         u.role === 'Admin' ? 'bg-rose-500/10 text-rose-500' : 
                         u.role === 'Teacher' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800 text-slate-400'
                       }`}>
                         {u.role}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${
                           u.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 
                           u.status === 'Idle' ? 'bg-amber-500' : 'bg-rose-500'
                         }`} />
                         <span className="text-[10px] font-bold text-slate-500">{u.status}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-slate-950 rounded-lg text-slate-500 hover:text-white transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-950/40 text-center">
            <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all">
               View Global Ledger
            </button>
          </div>
        </div>

        {/* System Monitoring */}
        <div className="space-y-10">
          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
             <div className="flex items-center gap-3 mb-8">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <h3 className="text-xl font-black text-white tracking-tight">Active Alerts</h3>
             </div>
             <div className="space-y-6">
                {[
                  { title: "Node Congestion", detail: "Region US-East scaling necessary", priority: "High" },
                  { title: "Schema Mismatch", detail: "Auth service reported bypass attempt", priority: "Critical" },
                ].map((a, i) => (
                  <div key={i} className={`p-6 bg-slate-950/60 border-l-4 rounded-2xl ${
                    a.priority === 'Critical' ? 'border-rose-500' : 'border-amber-500'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                       <span className="text-xs font-black text-white">{a.title}</span>
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{a.priority}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">{a.detail}</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[40px] shadow-2xl">
             <h3 className="text-xl font-black text-white tracking-tight mb-8">Rapid Ops</h3>
             <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Neural Reset", icon: Activity },
                  { label: "Vault Sync", icon: Shield },
                  { label: "Audit Purge", icon: Trash2 },
                  { label: "Global Ping", icon: BarChart3 }
                ].map((op, i) => (
                  <button key={i} className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-3xl border border-white/5 hover:border-blue-500/30 group transition-all">
                     <op.icon className="w-6 h-6 text-slate-600 group-hover:text-blue-500 mb-3 transition-colors" />
                     <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest">{op.label}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
