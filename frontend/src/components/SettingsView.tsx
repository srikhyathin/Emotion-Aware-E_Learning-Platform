"use client";

import { User, Bell, Shield, Palette, Save, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsView({ user }: { user: any }) {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio: bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Error updating profile: " + error.message);
    }
  };
  return (
    <div className="p-10 space-y-10 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tight">Account Settings</h1>
        <p className="text-slate-500 font-medium">Manage your profile, notifications, and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        <div className="xl:col-span-1 space-y-2">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'appearance', label: 'Appearance', icon: Palette },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                item.id === activeTab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </div>

        <div className="xl:col-span-3 bg-slate-900/40 border border-white/5 rounded-[40px] p-10 shadow-2xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Email Address</label>
              <input 
                type="text" 
                defaultValue={user?.email}
                disabled
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Bio</label>
            <textarea 
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-10 py-4 bg-blue-600 rounded-full font-black text-white hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {loading ? "Saving..." : success ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
