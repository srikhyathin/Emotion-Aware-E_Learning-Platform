"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Shield, GraduationCap, School } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-morphism p-8 space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {isLogin ? 'Welcome Back' : 'Join EmotionSense'}
          </h2>
          <p className="text-slate-400">
            {isLogin ? 'Sign in to continue your journey' : 'Create an account to start learning'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">
               <Shield className="w-3 h-3" /> Select Your Role
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['student', 'teacher', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === r 
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]' 
                    : 'border-white/5 bg-slate-900/40 text-slate-500 hover:border-white/10'
                  }`}
                >
                  {r === 'student' && <GraduationCap className="w-5 h-5 mb-1" />}
                  {r === 'teacher' && <School className="w-5 h-5 mb-1" />}
                  {r === 'admin' && <Shield className="w-5 h-5 mb-1" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)]"
          >
            {loading ? 'Processing...' : isLogin ? `Login as ${role}` : `Join as ${role}`}
          </button>
        </form>

        {message && (
          <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {message.text}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
