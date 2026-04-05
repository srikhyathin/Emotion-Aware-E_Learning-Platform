"use client";

import { motion } from "framer-motion";
import { 
  Brain, Zap, BarChart3, Shield, CheckCircle, 
  Play, Info, ArrowRight, Mail, Globe, Sparkles,
  MessageSquare, User, Activity, Fingerprint, Lock
} from "lucide-react";

const FeatureCard = ({ icon: Icon, title, desc, delay, className = "" }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className={`bg-white/[0.02] border border-white/5 p-10 rounded-[64px] group hover:border-blue-500/20 transition-all relative overflow-hidden backdrop-blur-3xl ${className}`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
    <div className="p-4 bg-slate-950 rounded-2xl w-fit border border-white/5 mb-8 text-blue-500 group-hover:scale-110 transition-transform">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-3xl font-black text-white mb-4 tracking-tighter italic">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed text-lg">{desc}</p>
  </motion.div>
);

const SectionHeading = ({ sub, title, desc, centered = true }: any) => (
  <div className={`space-y-6 max-w-4xl ${centered ? 'mx-auto text-center' : ''}`}>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex items-center gap-3 text-blue-500 font-black uppercase text-[10px] tracking-[0.5em] ${centered ? 'justify-center' : ''}`}
    >
       <span className="w-12 h-[1px] bg-blue-500/30" /> {sub}
    </motion.div>
    <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9]">{title}</h2>
    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">{desc}</p>
  </div>
);

const Nav = ({ user, onGetStarted }: any) => (
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100] h-20 glass-morphism rounded-[32px] px-10 flex justify-between items-center border border-white/10 shadow-2xl">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
        <Brain className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-black tracking-tighter text-white italic">EmotionSense</span>
    </div>
    <div className="flex items-center gap-10">
      {["Intelligence", "Security", "Vision"].map((link) => (
        <button key={link} className="text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-[0.3em] hidden lg:block">
          {link}
        </button>
      ))}
      <button 
        onClick={onGetStarted}
        className="px-8 py-3 bg-white text-slate-950 hover:bg-blue-50 rounded-full font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/5"
      >
        {user ? 'Dashboard' : 'Initialize'}
      </button>
    </div>
  </nav>
);

export default function Landing({ user, onGetStarted }: { user?: any, onGetStarted: () => void }) {
  return (
    <div className="bg-[#020617] text-slate-50 overflow-x-hidden min-h-screen selection:bg-blue-500 selection:text-white">
      <Nav user={user} onGetStarted={onGetStarted} />
      
      {/* Neural Background Components */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-[10%] w-[1000px] h-[1000px] bg-blue-600/10 neural-glow rounded-full -translate-y-1/2" />
        <div className="absolute bottom-0 left-[5%] w-[800px] h-[800px] bg-indigo-600/10 neural-glow rounded-full translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 min-h-screen flex flex-col items-center justify-center text-center z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
           className="space-y-16 max-w-7xl mx-auto"
        >
          <div className="space-y-8">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="inline-flex items-center gap-3 px-6 py-2.5 bg-blue-500/5 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/10 backdrop-blur-xl animate-float"
             >
              <Sparkles className="w-3 h-3" /> Neural Intelligence v2.0
             </motion.div>
             <h1 className="text-7xl md:text-[180px] font-black tracking-tighter leading-[0.75] text-white italic">
               AI that <br /> 
               <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-400 to-indigo-600">
                 Feels.
               </span>
             </h1>
          </div>
          
          <div className="space-y-10">
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed opacity-80 uppercase tracking-tight">
              EmotionSense is the world's most sophisticated <span className="text-white italic">emotion-aware</span> ecosystem. 
              Bridging the gap between cognitive load and digital delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={onGetStarted}
                className="px-14 py-7 bg-white text-slate-950 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all hover:scale-110 active:scale-95 shadow-[0_40px_80px_-20px_rgba(255,255,255,0.15)]"
              >
                {user ? 'Enter Command Center' : 'Initialize Session'} <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-14 py-7 bg-slate-900/50 border border-white/10 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all hover:bg-slate-800 backdrop-blur-xl group">
                Watch Tech Brief <Play className="w-5 h-5 fill-current group-hover:text-blue-400" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Neural Preview Component (Mock) */}
        <motion.div 
           initial={{ opacity: 0, y: 100 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8, duration: 1 }}
           className="mt-32 w-full max-w-5xl aspect-video bg-slate-900/40 rounded-[64px] border border-white/10 p-2 overflow-hidden shadow-3xl relative group"
        >
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 z-10 pointer-events-none" />
           <div className="w-full h-full bg-slate-950 rounded-[60px] overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="relative z-20 text-center space-y-4">
                 <div className="w-24 h-24 bg-blue-600/10 rounded-full border border-blue-500/20 flex items-center justify-center mx-auto animate-pulse">
                    <Brain className="w-10 h-10 text-blue-500" />
                 </div>
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Neural Interface Active</p>
                 <div className="flex gap-2 justify-center">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-blue-500/40 rounded-full" />)}
                 </div>
              </div>
              {/* Floating UI Elements */}
              <div className="absolute top-12 left-12 p-6 glass-morphism rounded-3xl border border-white/10 space-y-2 animate-float">
                 <p className="text-[9px] font-black text-slate-500 uppercase">Attention Score</p>
                 <p className="text-2xl font-black text-white italic">98.4%</p>
              </div>
              <div className="absolute bottom-12 right-12 p-6 glass-morphism rounded-3xl border border-white/10 space-y-2 animate-float" style={{ animationDelay: '2s' }}>
                 <p className="text-[9px] font-black text-slate-500 uppercase">Cognitive Load</p>
                 <p className="text-2xl font-black text-emerald-500 italic">Optimal</p>
              </div>
           </div>
        </motion.div>
      </section>

      {/* Bento Logic Section */}
      <section className="py-48 px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-24">
          <SectionHeading 
            sub="Platform Capabilities"
            title="Intelligence, Refined."
            desc="Moving beyond simple metrics. Our neural architecture decodes 468 facial points 
                  to map cognitive engagement in real-time."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              className="md:col-span-2"
              icon={Zap}
              title="Hyper-Dynamic Latency"
              desc="Sub-10ms response times for emotion detection, processed entirely on-device for maximum throughput and zero lag."
              delay={0.1}
            />
            <FeatureCard 
              icon={Shield}
              title="Encrypted Vision"
              desc="Zero-knowledge biometric processing. We never store video data, only anonymous sentiment metadata."
              delay={0.2}
            />
            <FeatureCard 
              icon={Fingerprint}
              title="Identity Integrity"
              desc="Biometric profiling ensures that the learner's journey is unique and strictly authenticated."
              delay={0.3}
            />
            <FeatureCard 
              className="md:col-span-2"
              icon={Activity}
              title="Cognitive Auto-Pilot"
              desc="Advanced algorithms that automatically shift course parameters when boredom or burnout is detected by the neural engine."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Trust & Privacy Section */}
      <section className="py-48 px-6 bg-slate-900/20 border-y border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-32">
           <div className="flex-1 space-y-12">
              <SectionHeading 
                centered={false}
                sub="Security First"
                title="Your Mind. Your Data."
                desc="In an era of invasive AI, we chose a different path. Personal intelligence shouldn't come at the cost of personal privacy."
              />
              <div className="grid grid-cols-2 gap-8">
                 <div className="p-8 bg-slate-950 border border-white/5 rounded-[40px] space-y-3">
                    <Lock className="w-8 h-8 text-blue-500" />
                    <h5 className="font-black text-white uppercase text-xs tracking-widest">Local-Only</h5>
                    <p className="text-sm text-slate-500 font-medium">No biometric data leaves your hardware. Ever.</p>
                 </div>
                 <div className="p-8 bg-slate-950 border border-white/5 rounded-[40px] space-y-3">
                    <Shield className="w-8 h-8 text-emerald-500" />
                    <h5 className="font-black text-white uppercase text-xs tracking-widest">Compliant</h5>
                    <p className="text-sm text-slate-500 font-medium">Fully GDPR and COPPA compliant architecture.</p>
                 </div>
              </div>
           </div>
           <div className="flex-1 w-full max-w-xl aspect-square relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" />
              <div className="relative w-full h-full glass-morphism rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 border-t border-blue-500/20 border-dashed rounded-full" 
                 />
                 <Brain className="w-32 h-32 text-blue-500 opacity-50" />
              </div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-64 px-6 text-center">
        <motion.div 
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="max-w-5xl mx-auto glass-morphism p-32 rounded-[100px] border-blue-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full -mt-[400px]" />
          <SectionHeading 
            sub="Join the Revolution"
            title="The Future is Feeling."
            desc="Unlock the most advanced educational technology on the planet. 
                  Designed for those who want to learn without limits."
          />
          <div className="mt-16 flex flex-col items-center gap-8 relative z-10">
            <button 
              onClick={onGetStarted}
              className="px-20 py-8 bg-white text-slate-950 rounded-full font-black text-2xl hover:scale-110 active:scale-95 transition-all shadow-3xl flex items-center gap-4"
            >
              Launch Platform <ArrowRight className="w-8 h-8" />
            </button>
            <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em]">Autonomous Deployment Ready</p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-12 border-t border-white/5 bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-32">
          <div className="space-y-10 max-w-sm">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                 <Brain className="w-7 h-7 text-white" />
               </div>
               <span className="text-3xl font-black tracking-tighter text-white italic">EmotionSense</span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed text-lg italic">
              Empowering intelligence through emotion-aware neural technology. The future is personal.
            </p>
            <div className="flex gap-5">
              {[Mail, Globe, MessageSquare, Shield].map((Icon, i) => (
                <button key={i} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-slate-400 hover:text-white hover:border-blue-500/30 transition-all backdrop-blur-xl hover:scale-110">
                  <Icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-20 flex-1 max-w-2xl">
            {[
              { title: "Platform", links: ["Intelligence", "Security", "Vision", "Nexus"] },
              { title: "Network", links: ["Research", "Enterprise", "Education", "Status"] },
              { title: "Protocol", links: ["Privacy", "Security", "Legal", "Compliance"] }
            ].map((col, i) => (
              <div key={i} className="space-y-8 text-left">
                <h4 className="text-[10px] font-black uppercase text-white tracking-[0.4em] opacity-40">{col.title}</h4>
                <div className="flex flex-col gap-5">
                  {col.links.map((link, j) => (
                    <button key={j} className="text-sm font-bold text-slate-500 hover:text-blue-400 transition-colors text-left">{link}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between text-slate-700 font-black text-[10px] uppercase tracking-[0.3em] gap-8">
           <span>© 2026 Neural Intelligence Platform. Fully Autonomous.</span>
           <div className="flex gap-12">
              <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Global Grid Active</span>
              <button className="hover:text-white transition-colors">Emergency Protocol</button>
           </div>
        </div>
      </footer>
    </div>
  );
}
