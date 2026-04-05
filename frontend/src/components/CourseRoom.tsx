"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EmotionMonitor from './EmotionMonitor';
import { EmotionResult } from '@/lib/emotion-engine';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Volume2, Maximize, MessageSquare, 
  Lightbulb, Coffee, RefreshCw, X,
  Activity, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmotionEngine } from '@/lib/emotion-engine';

const CourseRoom = ({ course, onComplete }: { course: any, onComplete: () => void }) => {
  const [currentEmotions, setCurrentEmotions] = useState<EmotionResult | null>(null);
  const [intervention, setIntervention] = useState<{
    id?: number;
    type: string;
    message: string;
    action: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');
  const [syncStatus, setSyncStatus] = useState<string>('Connecting...');
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Adaptive Engine Refs
  const lastEmotionRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const currentEmotionsRef = useRef<EmotionResult | null>(null);
  const isSyncingRef = useRef(false);
  const userRef = useRef<any>(null);
  const emotionBufferRef = useRef<string[]>([]);
  const router = useRouter();

  const INTERVENTION_LIBRARY: Record<string, { type: string; message: string; action: string; id?: number }[]> = {
    "Uninterested": [
      { type: 'joke', message: "Why did the computer go to the doctor? It had a virus!", action: 'dismiss' },
      { type: 'joke', message: "How do you direct a computer? You use its mouse!", action: 'dismiss' },
      { type: 'quote', message: "Focus on the step you are taking, not the whole staircase.", action: 'dismiss' },
      { type: 'mcq', message: "You seem a bit distracted. Let's do a quick knowledge check!", action: 'take_mcq' }
    ],
    "Needs Help": [
      { type: 'hint', message: "The last section covered the Schrödinger equation. Would you like a quick recap?", action: 'show_hint' },
      { type: 'break', message: "You've been tackling a tough concept. How about a 30-second 'Brain Reset'?", action: 'take_break' },
      { type: 'quote', message: "It's normal to feel confused when learning something new. Stick with it!", action: 'dismiss' }
    ],
    "Struggling": [
      { type: 'quote', message: "Take a deep breath. You are capable of amazing things.", action: 'dismiss' },
      { type: 'quote', message: "Every error is just another lesson in disguise.", action: 'dismiss' },
      { type: 'hint', message: "Try breaking this problem down into smaller, manageable chunks.", action: 'show_hint' }
    ],
    "Blocked/Frustrated": [
      { type: 'quote', message: "Frustration is the first step towards a new learning breakthrough. Keep going!", action: 'dismiss' },
      { type: 'break', message: "Take a step back. A fresh perspective works wonders.", action: 'take_break' }
    ],
    "Disheartened": [
      { type: 'quote', message: "Don't let this discourage you. Every expert was once a beginner.", action: 'dismiss' },
      { type: 'joke', message: "Why did the programmer quit his job? Because he didn't get arrays!", action: 'dismiss' }
    ],
    "Happy & Engaged": [
      { type: 'joke', message: "You're doing fantastic! Keep up this amazing positive energy!", action: 'dismiss' },
      { type: 'quote', message: "Your dedication is paying off. You're learning exceptionally well!", action: 'dismiss' }
    ],
    "Highly Focused": [
      { type: 'hint', message: "You are absolutely dialed in. Great focus!", action: 'dismiss' },
      { type: 'mcq', message: "You're in the zone! Ready to ace a quick pop quiz on this topic?", action: 'take_mcq' },
      { type: 'quote', message: "Incredible concentration. Keep riding this wave of productivity!", action: 'dismiss' }
    ]
  };

  const authInitializedRef = useRef(false);

  useEffect(() => {
    if (authInitializedRef.current) return;
    authInitializedRef.current = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      userRef.current = user;
    });
  }, []);

  const handleEmotionUpdate = useCallback(async (emotions: EmotionResult) => {
    setCurrentEmotions(emotions);
    currentEmotionsRef.current = emotions;
    
    // Simulation for backend engagement logic
/* DISABLED: Real backend currently not running locally to avoid console spam
    if (Math.random() > 0.95) {
      try {
        const res = await fetch('http://localhost:8000/session/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: 'demo-session', emotions })
        });
        const data = await res.json();
        if (data.intervention) setIntervention(data.intervention);
      } catch (e) {}
    }
*/
  }, []);

  useEffect(() => {
    if (!course?.id || !userRef.current?.id) return;

    const pingSession = async () => {
      if (!userRef.current || isSyncingRef.current || !currentEmotionsRef.current) return;
      isSyncingRef.current = true;

      try {
        await supabase.from('profiles').upsert({
          id: userRef.current.id,
          full_name: userRef.current.user_metadata?.full_name || userRef.current.email?.split('@')[0] || 'Learning Student'
        }, { onConflict: 'id' });
      } catch (pErr) {}

      try {
        const { error } = await supabase.from('live_sessions').upsert({
          student_id: userRef.current.id,
          course_id: course.id,
          primary_emotion: EmotionEngine.getPrimaryEmotion(currentEmotionsRef.current),
          engagement_score: currentEmotionsRef.current.engagement,
          last_ping: new Date().toISOString(),
          status: 'Online'
        }, { onConflict: 'student_id' });

        if (error) {
           console.error("Critical Sync Error (Live Sessions):", error.message);
           setSyncStatus(`Sync Error: Schema Mismatch`);
        } else {
           setSyncStatus('Live Sync Active');
        }
      } catch (err) {
        setSyncStatus('Network Offline');
      } finally {
        isSyncingRef.current = false;
      }
    };

    const interval = setInterval(pingSession, 10000);
    pingSession(); 

    return () => clearInterval(interval);
  }, [course?.id, userRef.current?.id]);

  useEffect(() => {
    if (!userRef.current?.id) return;

    const channel = supabase
      .channel('student_interventions')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'interventions',
        filter: `student_id=eq.${userRef.current.id}`
      }, (payload) => {
        console.log("New Intervention Received:", payload);
        setIntervention({
          type: payload.new.type,
          message: payload.new.message,
          action: 'dismiss'
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRef.current?.id]);

  // Adaptive Monitoring Loop
  useEffect(() => {
    if (!currentEmotions || intervention) return;

    const rawPrimary = EmotionEngine.getPrimaryEmotion(currentEmotions);
    
    // Smooth the emotion signal over the last 60 frames (~1-2 seconds) to prevent micro-flicker resets
    emotionBufferRef.current.push(rawPrimary);
    if (emotionBufferRef.current.length > 60) {
      emotionBufferRef.current.shift();
    }
    
    const counts = emotionBufferRef.current.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primary = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    const now = Date.now();
    const trackedStates = [
      "Uninterested", "Needs Help", "Struggling", "Blocked/Frustrated", 
      "Disheartened", "Happy & Engaged", "Highly Focused"
    ];

    if (trackedStates.includes(primary)) {
      if (lastEmotionRef.current !== primary) {
        lastEmotionRef.current = primary;
        startTimeRef.current = now;
        console.log(`%c Adaptive Engine: Entering ${primary} state. `, 'color: #3b82f6; font-weight: bold;');
      } else {
        const duration = (now - startTimeRef.current) / 1000;
        
        let threshold = 8;
        if (primary === 'Uninterested') threshold = 12;
        if (['Happy & Engaged', 'Highly Focused'].includes(primary)) threshold = 15; // Requires longer to popup for positive

        // Log every 2 seconds to avoid spam but show progress
        if (Math.floor(duration) % 2 === 0 && duration > 0.5) {
          console.log(`%c Monitoring ${primary}: ${duration.toFixed(1)}s / ${threshold}s `, 'color: #94a3b8;');
        }

        if (duration >= threshold) {
          const options = INTERVENTION_LIBRARY[primary];
          if (options) {
            const selected = options[Math.floor(Math.random() * options.length)];
            setIntervention({ ...selected, id: Date.now() });
            startTimeRef.current = now; // Reset timer to prevent double-trigger
            emotionBufferRef.current = []; // Clear buffer after trigger
            console.log(`%c Adaptive TRIGGERED: ${primary} `, 'background: #3b82f6; color: #fff; font-weight: bold; padding: 2px 5px; border-radius: 4px;');
            
            // Persist the triggered intervention
            if (userRef.current?.id) {
              supabase.from('interventions').insert({
                student_id: userRef.current.id,
                type: selected.type,
                message: selected.message
              }).then(res => {
                if (res.error) console.error("Intervention persistence error", res.error);
              });
            }
          }
        }
      }
    } else {
      // Reset if we move to a 'Positive' or 'Neutral' state solidly
      lastEmotionRef.current = primary;
      startTimeRef.current = now;
    }
  }, [currentEmotions, intervention]);

  const handleCompleteSession = async () => {
    if (userRef.current) {
      try {
        await supabase.from('live_sessions').delete().eq('student_id', userRef.current.id);
        onComplete();
      } catch (err) {
        console.error("Session Completion Error:", err);
        onComplete();
      }
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-screen max-h-screen pt-24">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Course Video Player */}
        <div className="relative flex-1 bg-black rounded-[40px] overflow-hidden group shadow-2xl border border-white/5">
          {course?.video_url ? (
            <div className="w-full h-full relative">
              {course.video_url.includes('youtube.com') || course.video_url.includes('youtu.be') ? (
                <iframe 
                  src={`https://www.youtube.com/embed/${course.video_url.split('v=')[1] || course.video_url.split('/').pop()}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={course.video_url} controls className="w-full h-full object-cover" />
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center space-y-4">
                  <Play className="w-20 h-20 text-blue-500 mx-auto opacity-50 animate-pulse" />
                  <p className="text-slate-500 font-black uppercase tracking-widest text-sm">{course?.title || 'Resource Ready'}</p>
               </div>
            </div>
          )}
          
          {/* Custom Controls (Simplified) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <div className="w-96 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: isPlaying ? '100%' : '30%' }}
                    transition={{ duration: 600, ease: "linear" }}
                    className="h-full bg-blue-500" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Volume2 className="w-5 h-5 opacity-60" />
                <Maximize className="w-5 h-5 opacity-60" />
              </div>
            </div>
          </div>

          {/* Intervention Overlay */}
          <AnimatePresence>
            {intervention && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-slate-900 p-10 rounded-[40px] border-2 border-slate-700 max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] min-w-[450px]"
                >
                <div className="flex gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    intervention.type === 'joke' ? 'bg-emerald-500/20' : 
                    intervention.type === 'mcq' ? 'bg-rose-500/20' :
                    intervention.type === 'quote' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                  }`}>
                    {intervention.type === 'hint' ? <Lightbulb className="w-7 h-7 text-blue-400 text-glow" /> : 
                     intervention.type === 'joke' ? <RefreshCw className="w-7 h-7 text-emerald-400 text-glow" /> :
                     intervention.type === 'mcq' ? <MessageSquare className="w-7 h-7 text-rose-400 text-glow" /> :
                     intervention.type === 'quote' ? <Activity className="w-7 h-7 text-purple-400 text-glow" /> : <Coffee className="w-7 h-7 text-orange-400 text-glow" />}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 opacity-80">AI Insight</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <h3 className="font-black text-xl italic text-white leading-tight">
                      {intervention.type === 'joke' ? 'Quick Mood Boost!' : 
                       intervention.type === 'quote' ? 'Wisdom for the Journey' : 
                       intervention.type === 'mcq' ? 'Pop Quiz Challenge!' :
                       intervention.type === 'break' ? 'Time for a Brain Reset?' : 'Proactive Support'}
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">{intervention.message}</p>
                    <div className="flex gap-3 pt-3">
                      {intervention.action !== 'dismiss' && (
                        <button 
                          onClick={() => {
                            if (intervention.action === 'take_mcq') {
                              setShowQuiz(true);
                            } else {
                              alert("Action initiated!");
                            }
                            setIntervention(null);
                          }}
                          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${intervention.action === 'take_mcq' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                          {intervention.action === 'show_hint' ? 'Reveal Hint' : intervention.action === 'take_mcq' ? 'Take Quiz' : 'Start Break'}
                        </button>
                      )}
                      <button 
                        onClick={() => setIntervention(null)}
                        className="px-6 py-3 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
                      >
                        {intervention.action === 'dismiss' ? 'Got it!' : 'Maybe Later'}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setIntervention(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
             </div>
            )}
          </AnimatePresence>

          {/* Quiz Overlay */}
          <AnimatePresence>
            {showQuiz && (
              <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-slate-900 border-2 border-slate-700 p-10 rounded-[40px] max-w-2xl w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
                >
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-rose-500/20 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Pop Quiz</span>
                       <span className="text-slate-400 text-sm font-bold">Knowledge Check</span>
                    </div>
                    <button onClick={() => setShowQuiz(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black text-white italic leading-tight">What is the primary advantage of using a Hash Table over an Array?</h2>
                    
                    <div className="grid gap-3 pt-4">
                      {["O(1) average time complexity for lookups", "Requires strictly less memory space", "Maintains elements in a sorted order organically", "Does not suffer from memory leaks"].map((opt, i) => (
                        <button key={i} onClick={() => { 
                           alert(i === 0 ? "Correct! Hash tables provide ultra-fast O(1) lookups." : "Incorrect! Hash tables utilize key-value pairs for O(1) lookups."); 
                           setShowQuiz(false); 
                        }} className="w-full text-left p-5 rounded-2xl border border-white/10 bg-slate-950/50 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all text-slate-300 hover:text-white font-medium group">
                          <span className="inline-block w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs text-center leading-6 mr-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">{['A', 'B', 'C', 'D'][i]}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Tabs */}
        <div className="h-1/3 glass-morphism rounded-3xl p-6 flex flex-col gap-4 border-white/5">
          <div className="flex gap-6 border-b border-white/5 pb-2">
            <button className="text-blue-500 font-bold border-b-2 border-blue-500 pb-2">Course Notes</button>
            <button className="text-slate-500 font-medium pb-2">Transcript</button>
            <button className="text-slate-500 font-medium pb-2">Resources</button>
          </div>
          <div className="overflow-y-auto text-slate-300 space-y-4">
            <p>Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles...</p>
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold uppercase text-[10px] tracking-widest">
                <Lightbulb className="w-3 h-3" /> Key Concept
              </div>
              <p className="text-blue-100/80">Schrödinger equation: Hψ = Eψ. The wave function completely describes the physical state of a system.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div 
          style={{ width: '100%', height: '400px', minHeight: '400px' }} 
          className="rounded-[40px] overflow-hidden border border-white/10 shadow-3xl bg-slate-900 relative z-30"
        >
           <EmotionMonitor onEmotionUpdate={handleEmotionUpdate} />
        </div>

        {/* Engagement Analytics V2 (No Hard Numbers) */}
        <div className="flex-1 glass-morphism rounded-[40px] p-8 flex flex-col gap-6 border-white/5 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black flex items-center gap-3 tracking-widest uppercase text-xs">
              <Activity className="w-4 h-4 text-blue-500" /> Cognitive Sync
            </h3>
            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">Active</span>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cognitive Load</p>
                <span className="text-white font-black uppercase tracking-widest text-sm">
                  {currentEmotions ? (currentEmotions.engagement * 100).toFixed(0) + '%' : 'Optimal'}
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(currentEmotions?.engagement || 0.8) * 100}%` }}
                   className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                 />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 space-y-2">
                 <p className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Focus</p>
                 <p className="text-xl font-black text-white italic">
                   {!currentEmotions ? 'Searching' : 
                    currentEmotions.boredom > 0.4 ? 'Drifting' :
                    currentEmotions.confusion > 0.4 ? 'Wavering' :
                    currentEmotions.engagement > 0.7 ? 'Deep' : 'Stable'}
                 </p>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 space-y-2">
                 <p className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Stability</p>
                 <p className="text-xl font-black text-white italic">
                   {!currentEmotions ? 'Syncing' :
                    currentEmotions.frustration > 0.5 ? 'Frustrated' :
                    currentEmotions.confusion > 0.5 ? 'Testing' :
                    currentEmotions.engagement > 0.5 ? 'Strong' : 'Exceptional'}
                 </p>
              </div>
            </div>

            <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Behavioral Insight</p>
              <div className="flex items-start gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 <p className="text-xs text-slate-400 font-bold leading-relaxed italic">
                   "Visual baseline suggests peak performance state. Content delivery speed is matched perfectly."
                 </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCompleteSession}
            className="w-full py-5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
          >
            Complete Session <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseRoom;
