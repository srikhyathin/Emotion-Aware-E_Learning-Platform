"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle, 
  Plus, BookOpen, Trash2, ExternalLink, X, AlertCircle, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const getSeededData = (id: string) => {
  const seed = (id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const data = [];
  for (let i = 0; i < 6; i++) {
    const val = (Math.sin(seed + i) * 25 + 65 + (i * 3));
    data.push({
      time: `T-${10 - i * 2}`,
      engagement: Math.min(100, Math.max(20, val)),
      confusion: Math.min(40, Math.max(5, 100 - val - 5))
    });
  }
  return data;
};

const SENTIMENT_DATA = [
  { name: 'Focused', value: 85, color: '#3b82f6' },
  { name: 'Confused', value: 12, color: '#f59e0b' },
  { name: 'Bored', value: 3, color: '#64748b' },
];

const MOCK_EVENTS = [
  { time: '2m ago', user: 'Alice', event: 'Primary state switched to FOCUSED', type: 'info' },
  { time: '5m ago', user: 'Bob', event: 'High Confusion detected - intervention recommended', type: 'warning' },
  { time: '8m ago', user: 'Alice', event: 'Entered the learning environment', type: 'success' },
];

const LEARNERS = [
  { id: 1, name: 'Alice Johnson', status: 'Focused', risk: 'Minimum', score: 'Exceptional' },
  { id: 2, name: 'Bob Smith', status: 'Confusion', risk: 'Moderate', score: 'Average' },
  { id: 3, name: 'Charlie Davis', status: 'Distracted', risk: 'Critical', score: 'Low' },
  { id: 4, name: 'Diana Prince', status: 'Active', risk: 'Minimum', score: 'High' },
];

const getErrorMessage = (error: any) => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message.trim()) return error.message;
  if (typeof error.details === 'string' && error.details.trim()) return error.details;
  if (typeof error.hint === 'string' && error.hint.trim()) return error.hint;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
};

const InstructorDashboard = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [realLearners, setRealLearners] = useState<any[]>([]);
  const [courseEvents, setCourseEvents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: 'AI', thumbnail_url: '', video_url: '' });
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isGlobalMode, setIsGlobalMode] = useState(true);
  const userRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn("Dashboard Auth Check:", authError.message);
        return;
      }
      
      userRef.current = user;
      if (user) {
        fetchCourses(user.id);
        fetchRealLearners(user.id);
      }
    };
    init();

    const interval = setInterval(() => {
      if (userRef.current) fetchRealLearners(userRef.current.id);
    }, 5000); // 5s auto-refresh for absolute reliability

    const channel = supabase
      .channel('live_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => {
        if (userRef.current?.id) fetchRealLearners(userRef.current.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRealLearners = async (userId: string) => {
    if (!userId) return;
    const { data: instructorCourses, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', userId);

    if (courseError) {
      setDbError(`ERROR_${courseError.code || 'COURSE_QUERY'}`);
      console.error("Instructor courses query error:", courseError);
      setRealLearners([]);
      return;
    }
    
    const courseIds = (instructorCourses || []).map(c => c.id);
    console.log("Monitoring Students. Global Mode:", isGlobalMode, "Instructor Course IDs:", courseIds);
    console.log("Monitoring Students for Courses:", courseIds);

    // DIAGNOSTIC Check: Count all sessions in the DB regardless of course ownership
    const { count: totalSessions } = await supabase
      .from('live_sessions')
      .select('*', { count: 'exact', head: true });
    console.log("Total Students in Database (Global):", totalSessions);

    // Get live sessions from DB.
    // `isGlobalMode` is kept as a diagnostic switch, but teacher view defaults to own courses.
    let query = supabase
      .from('live_sessions')
      .select('*');

    if (!isGlobalMode && courseIds.length > 0) {
      query = query.in('course_id', courseIds);
    }

    const { data: sessions, error: sessionError } = await query;
    if (sessionError) {
      if (sessionError.message?.includes('fetch')) {
        setDbError('NETWORK_OFFLINE');
      } else if (sessionError.code === '42P01' || sessionError.code === 'PGRST205') {
        setDbError('DATABASE_MISSING');
      } else {
        setDbError(`ERROR_${sessionError.code || 'UNKNOWN'}`);
      }
      console.error("Session Query Error Details:", sessionError);
      return;
    }
    setDbError(null);

    if (sessions && sessions.length > 0) {
      const sortedSessions = [...sessions].sort((a: any, b: any) => {
        const ta = a?.last_ping ? new Date(a.last_ping).getTime() : 0;
        const tb = b?.last_ping ? new Date(b.last_ping).getTime() : 0;
        return tb - ta;
      });

      // Fetch profiles for these sessions
      const studentIds = sortedSessions.map(s => s.student_id).filter(Boolean);
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', studentIds);

      const profileMap = (profs || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // Removed instructor filter to ensure visibility during testing
      const studentSessions = sortedSessions;

      console.log("Processing Sessions:", sessions);
      const formatted = studentSessions.map((item: any) => {
        const profileName = profileMap[item.student_id]?.full_name;
        const sessionName = item.student_name;
        const fallbackName = `Student ${String(item.student_id || '').slice(0, 8)}`;
        
        let finalName = (profileName || sessionName || fallbackName).trim();
        if (!finalName) finalName = fallbackName;

        return {
          id: item.student_id,
          name: finalName,
          status: item.primary_emotion || 'Online',
          risk: item.engagement_score < 0.4 ? 'Critical' : 'Minimum',
          score: item.engagement_score > 0.7 ? 'Exceptional' : 'Normal',
          course_id: item.course_id,
          isDemo: false
        };
      });
      setRealLearners(formatted);
    } else {
      setRealLearners([]);
    }
  };

  const handleCreateTestStudent = async () => {
    if (!userRef.current) return;
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', userRef.current.id)
      .limit(1);

    if (courseError) {
      const message = getErrorMessage(courseError);
      console.error("Test Student Course Query Error:", courseError);
      alert("Error: " + message);
      return;
    }

    if (!courses || courses.length === 0) {
      alert("No courses found. Please create a course first.");
      return;
    }
    
    const { error } = await supabase.from('live_sessions').upsert({
      student_id: userRef.current.id,
      course_id: courses[0].id,
      primary_emotion: 'Focused',
      engagement_score: 0.95,
      last_ping: new Date().toISOString(),
      status: 'Online'
    }, { onConflict: 'student_id' });

    if (error) {
      console.error("Test Student Error:", error);
      alert("Error: " + getErrorMessage(error));
    } else {
      fetchRealLearners(userRef.current.id);
    }
  };

  const handleSendNudge = async () => {
    if (!selectedStudent || !userRef.current) return;
    const { error } = await supabase.from('interventions').insert({
      student_id: selectedStudent.id,
      instructor_id: userRef.current.id,
      type: 'nudge',
      message: "You're doing great! Keep focusing on the core concepts – you've got this! 🚀"
    });
    if (error) alert("Error sending nudge: " + error.message);
    else alert("Motivational Nudge sent to " + (selectedStudent.name || "Student") + "!");
  };

  const fetchCourses = async (userId: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setCourses(data);
    setLoading(false);
  };

  const fetchCourseEvents = async (courseId: string) => {
    // Get students in this course
    const courseStudents = realLearners.filter(l => l.course_id === courseId).map(l => l.id);
    if (courseStudents.length === 0) {
      setCourseEvents([]);
      return;
    }
    
    const { data: events, error } = await supabase
      .from('interventions')
      .select(`
        id, type, message, created_at,
        profiles!interventions_student_id_fkey(full_name)
      `)
      .in('student_id', courseStudents)
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (events && !error) {
      setCourseEvents(events.map((ev: any) => ({
        time: new Date(ev.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        user: ev.profiles?.full_name || 'Student',
        event: ev.message,
        type: ev.type === 'nudge' ? 'success' : (ev.type === 'hint' ? 'info' : 'warning')
      })));
    } else {
      setCourseEvents([]);
    }
  };

  // Helper to calculate course specific sentiment data
  const getCourseSentiment = (courseId: string) => {
    const courseLearners = realLearners.filter(l => l.course_id === courseId);
    if (courseLearners.length === 0) return SENTIMENT_DATA; // Fallback to mock if empty
    
    let focused = 0, confused = 0, bored = 0;
    courseLearners.forEach(l => {
       if (['Focused', 'Optimizing', 'Active', 'Online'].includes(l.status)) focused++;
       else if (['Confusion', 'Struggling'].includes(l.status)) confused++;
       else bored++;
    });

    return [
      { name: 'Focused', value: (focused / courseLearners.length) * 100, color: '#3b82f6' },
      { name: 'Confused', value: (confused / courseLearners.length) * 100, color: '#f59e0b' },
      { name: 'Bored', value: (bored / courseLearners.length) * 100, color: '#64748b' },
    ];
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    if (course) {
      fetchCourseEvents(course.id);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Authentication error: Please log in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('courses').insert([
      { 
        ...newCourse, 
        instructor_id: user.id,
        thumbnail_url: newCourse.thumbnail_url || `https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop`
      }
    ]);

    if (error) {
      alert("Deployment Error: " + error.message);
    } else {
      setShowAddModal(false);
      setNewCourse({ title: '', description: '', category: 'AI', thumbnail_url: '', video_url: '' });
      if (userRef.current) fetchCourses(userRef.current.id);
    }
    setLoading(false);
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error && userRef.current) fetchCourses(userRef.current.id);
  };

  const stats = [
    { label: 'Learner Community', val: 'Expansive', icon: Users, color: 'blue', trend: 'Growing' },
    { label: 'Avg Engagement', val: 'Optimal', icon: TrendingUp, color: 'emerald', trend: 'Increasing' },
    { label: 'Active Sessions', val: 'Dynamic', icon: CheckCircle, color: 'purple', trend: 'Healthy' },
    { label: 'Risk Alerts', val: 'Minimal', icon: AlertTriangle, color: 'rose', trend: 'Improving' },
  ];

  return (
    <div className="p-10 space-y-10 min-h-screen">
      {/* Network Connectivity Warning */}
      {dbError === 'NETWORK_OFFLINE' && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[32px] space-y-4">
          <div className="flex items-center gap-4 text-rose-500">
             <AlertTriangle className="w-8 h-8" />
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Supabase Connectivity Lost</h3>
                <p className="text-sm font-bold opacity-70 italic">The browser failed to reach your Supabase API.</p>
             </div>
          </div>
          <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-xl space-y-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potential Cause A</p>
                   <p className="text-sm text-white font-bold">Ad-Blocker or Firewall blocking Supabase Domains.</p>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl space-y-2">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potential Cause B</p>
                   <p className="text-sm text-white font-bold">Supabase Project is paused or has run out of quota.</p>
                </div>
             </div>
             <p className="text-[10px] text-slate-500 font-mono">Current API URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
             <button 
               onClick={() => window.location.reload()}
               className="px-8 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
             >
               Hard Refresh Connection
             </button>
          </div>
        </div>
      )}

      {/* Database Health Warning */}
      {dbError === 'DATABASE_MISSING' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[32px] space-y-4"
        >
          <div className="flex items-center gap-4 text-rose-500">
             <AlertTriangle className="w-8 h-8" />
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Database Table Missing</h3>
                <p className="text-sm font-bold opacity-70 italic">The 'live_sessions' table was not found in your Supabase project.</p>
             </div>
          </div>
          <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execute this in your Supabase SQL Editor:</p>
             <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre p-2">
{`CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  primary_emotion TEXT,
  engagement_score FLOAT,
  status TEXT DEFAULT 'Online'
);
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON live_sessions FOR ALL USING (true);`}
             </pre>
             <button 
               onClick={() => { if (userRef.current) fetchRealLearners(userRef.current.id); }}
               className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
             >
               Retry Connection
             </button>
          </div>
        </motion.div>
      )}

      {dbError && dbError !== 'DATABASE_MISSING' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] flex items-center gap-4 text-amber-500">
           <AlertCircle className="w-6 h-6" />
           <p className="text-xs font-black uppercase tracking-widest">System Sync Delay: {dbError} - Check console for details</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-4 text-blue-500 font-bold uppercase text-[10px] tracking-[0.3em]">
            <span className="flex items-center gap-2">
              <span className="w-8 h-[1px] bg-blue-500/30" /> Overview
            </span>
            {realLearners.some(l => !l.isDemo) && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 text-[9px] animate-pulse flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Data Stream Connected
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Instructor Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitor your impact and manage your adaptive content.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { if(userRef.current) fetchRealLearners(userRef.current.id); }}
            className="px-6 py-4 bg-slate-900 border border-white/5 rounded-[20px] font-black text-blue-500 hover:bg-slate-800 transition-all text-xs"
          >
            Force Sync
          </button>
          <button 
            onClick={() => { setIsGlobalMode(!isGlobalMode); if(userRef.current) fetchRealLearners(userRef.current.id); }}
            className={`px-6 py-4 rounded-[20px] font-black transition-all text-xs border ${isGlobalMode ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-900 border-white/5 text-slate-400'}`}
          >
            {isGlobalMode ? 'Global Monitor: ON' : 'Global Monitor: OFF'}
          </button>
          <button 
            onClick={handleCreateTestStudent}
            className="px-6 py-4 bg-slate-900 border border-white/5 rounded-[20px] font-black text-slate-400 hover:text-white transition-all text-xs"
          >
            Add Test Student
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 rounded-[20px] font-black text-white hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Deploy New Course
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
            className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] group hover:border-blue-500/20 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl bg-slate-950 border border-white/5 text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
              stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
              stat.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-400'
            }`}>
              {stat.trend}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-black text-white">{stat.val}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
      {/* Engagement Trend Chart V3 (Purely Visual) */}
      <div className="xl:col-span-2 bg-slate-900/40 border border-white/5 p-10 rounded-[40px] space-y-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-30">
           <TrendingUp className="w-32 h-32 text-blue-500" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">Sentiment Distribution</h3>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Global Student Mindstate</p>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-2 text-[10px] uppercase font-black text-blue-400">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Optimized
            </span>
          </div>
        </div>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SENTIMENT_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                dy={10}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '24px',
                  padding: '16px'
                }}
                itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
              />
              <Bar 
                dataKey="value" 
                radius={[12, 12, 0, 0]}
                barSize={60}
              >
                {SENTIMENT_DATA.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

        {/* My Courses List */}
        <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[40px] flex flex-col gap-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white tracking-tight">Active Courses</h3>
            <div className="p-3 bg-slate-950 rounded-2xl border border-white/5">
               <BookOpen className="w-5 h-5 text-slate-500" />
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
            {courses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-16 h-16 bg-slate-800 rounded-[20px] flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <p className="font-bold">No active courses yet.</p>
              </div>
            ) : (
              courses.map((course) => (
                <div 
                  key={course.id} 
                  onClick={() => handleSelectCourse(course)}
                  className="p-5 bg-slate-950/40 border border-white/5 rounded-3xl group hover:border-blue-500/40 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-sm text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider">{course.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold line-clamp-1">{course.description}</p>
                    </div>
                    <div className="flex gap-1">
                       <button onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }} className="p-2 text-slate-600 hover:text-rose-500 transition-colors hover:bg-rose-500/5 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 bg-slate-950 border border-white/5 rounded-2xl text-xs font-black text-slate-400 hover:text-white hover:bg-slate-900 transition-all uppercase tracking-[0.2em]"
          >
            Quick Create +
          </button>
        </div>
      </div>

      {/* Live Student Monitoring Section */}
      <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[40px] shadow-2xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight italic">Live Emotional Sync</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Real-time Student Sentiment Analysis</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-xl border border-white/5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Optimizing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {realLearners.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-40">
               <Users className="w-12 h-12 mx-auto mb-4" />
               <p className="font-bold">No students currently enrolled or online.</p>
            </div>
          ) : (
            realLearners.map((learner) => (
              <div key={learner.id} className="p-6 bg-slate-950/40 border border-white/5 rounded-[32px] group hover:border-blue-500/40 transition-all flex flex-col gap-4">
                <div className="flex items-start w-full gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-xl font-black text-white/20 shrink-0">
                      {learner.name ? learner.name.charAt(0) : '?'}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-white font-black italic text-base leading-tight uppercase tracking-tight truncate">
                      {learner.name || "Unknown Identity"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center gap-2 opacity-80 mt-1">
                       <span className={`w-2 h-2 rounded-full ${learner.isDemo ? 'bg-slate-700' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse'}`} />
                       {learner.isDemo ? 'Demo Mode' : `Session ID: ${learner.id.slice(0, 8)}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        learner.status === 'Optimizing' || learner.status === 'Focused' ? 'text-emerald-400' : 
                        learner.status === 'Offline' ? 'text-slate-500' : 'text-amber-400'
                      }`}>{learner.status}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        learner.risk === 'Minimum' ? 'text-blue-400' : 'text-rose-400'
                      }`}>{learner.risk}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStudent(learner)}
                  className="w-full py-4 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 rounded-2xl text-[10px] font-black text-blue-500 hover:text-white uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/5 active:scale-95"
                >
                  Intervene Now
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Course Modal V2 */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[48px] p-10 relative z-10 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)]"
            >
              <div className="space-y-2 mb-8 text-center text-white">
                 <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                    <BookOpen className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-black tracking-tight">Deploy New Knowledge</h3>
                 <p className="text-slate-400 font-medium">Define your course parameters and launch to students.</p>
              </div>

              <form onSubmit={handleAddCourse} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Course Title</label>
                    <input 
                      type="text" 
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                      required
                      placeholder="e.g. Quantum Physics"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Category</label>
                    <select 
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 font-bold cursor-pointer hover:bg-slate-900 transition-colors"
                    >
                      <option className="bg-slate-950">AI</option>
                      <option className="bg-slate-950">Design</option>
                      <option className="bg-slate-950">Development</option>
                      <option className="bg-slate-950">Business</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">YouTube / Video URL</label>
                  <input 
                    type="url" 
                    value={newCourse.video_url}
                    onChange={(e) => setNewCourse({...newCourse, video_url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Thumbnail / Cover URL</label>
                    <input 
                      type="url" 
                      value={newCourse.thumbnail_url}
                      onChange={(e) => setNewCourse({...newCourse, thumbnail_url: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Summary</label>
                    <textarea 
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      rows={1}
                      placeholder="Brief description..."
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 pb-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-5 bg-slate-800 text-white rounded-3xl font-black hover:bg-slate-700 transition-all uppercase tracking-widest text-xs active:scale-95"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
                  >
                    {loading ? 'Deploying...' : 'Deploy Course'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl h-[80vh] bg-slate-900 border border-white/10 rounded-[48px] overflow-hidden flex flex-col shadow-3xl"
            >
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <div className="space-y-1">
                   <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20">Course Analytics</span>
                     <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">ID: {selectedCourse.id.slice(0, 8)}</span>
                   </div>
                   <h2 className="text-4xl font-black text-white italic tracking-tight">{selectedCourse.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

             <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                   <div className="bg-slate-950/40 p-8 rounded-[32px] border border-white/5 space-y-6">
                      <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Live Course Engagement</h4>
                      <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getCourseSentiment(selectedCourse.id)}>
                               <XAxis dataKey="name" hide />
                               <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none' }} />
                               <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                                  {getCourseSentiment(selectedCourse.id).map((entry, index) => (
                                     <Cell key={`cell-modal-${index}`} fill={entry.color} />
                                  ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: 'Active Learners', val: realLearners.filter(l => l.course_id === selectedCourse.id).length, icon: Users },
                        { label: 'Avg Satisfaction', val: 'Exquisite', icon: TrendingUp },
                        { label: 'Completion Rate', val: 'Momentum', icon: CheckCircle },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 text-center space-y-2">
                           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                              <item.icon className="w-5 h-5 text-blue-500" />
                           </div>
                           <p className="text-2xl font-black text-white">{item.val}</p>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Enrolled Students</h4>
                   <div className="space-y-4">
                      {realLearners.filter(l => l.course_id === selectedCourse.id).length === 0 ? (
                        <div className="py-10 text-center opacity-30 italic text-sm">No students currently tracked.</div>
                      ) : (
                        realLearners.filter(l => l.course_id === selectedCourse.id).map(learner => (
                          <div key={learner.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-black text-xs text-slate-500">
                                 {learner.name.charAt(0)}
                               </div>
                               <span className="text-sm font-black text-white">{learner.name}</span>
                             </div>
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{learner.status}</span>
                          </div>
                        ))
                      )}
                   </div>

                   <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest pt-4">Live Event Feed</h4>
                   <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {courseEvents.length === 0 ? (
                        <div className="text-center opacity-30 text-xs italic py-4">No recent events.</div>
                      ) : (
                        courseEvents.map((ev, i) => (
                          <div key={i} className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-[10px] space-y-1">
                             <div className="flex justify-between font-black uppercase tracking-widest">
                                <span className={ev.type === 'warning' ? 'text-amber-500' : (ev.type === 'info' ? 'text-emerald-500' : 'text-blue-500')}>{ev.user}</span>
                                <span className="text-slate-600">{ev.time}</span>
                             </div>
                             <p className="text-slate-400 font-bold">{ev.event}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Student Intervention Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[56px] overflow-hidden flex flex-col shadow-3xl"
            >
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl font-black text-blue-500 shadow-2xl shadow-blue-500/20">
                      {selectedStudent.name.charAt(0)}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 animate-pulse">Live Tracking</span>
                         <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest italic">{selectedStudent.id}</span>
                      </div>
                      <h2 className="text-4xl font-black text-white italic tracking-tighter">{selectedStudent.name}</h2>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div className="space-y-8 text-white">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active State</p>
                          <p className="text-xl font-black text-blue-500 italic">{selectedStudent.status}</p>
                       </div>
                       <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 space-y-1">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</p>
                          <p className={`text-xl font-black italic ${selectedStudent.risk === 'Critical' ? 'text-rose-500' : 'text-emerald-500'}`}>{selectedStudent.risk}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" /> Real-time Engagement Flux
                       </h4>
                        <div className="h-[200px] w-full bg-slate-950/20 rounded-[32px] border border-white/5 p-4">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={getSeededData(selectedStudent.id)}>
                                <defs>
                                   <linearGradient id="colorEngStudent" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={4} fill="url(#colorEngStudent)" animationDuration={1000} />
                                <Area type="monotone" dataKey="confusion" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-blue-600/10 p-8 rounded-[40px] border border-blue-500/20 space-y-4">
                       <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest italic">Intervention Protocol</h4>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed">
                          The student is currently showing **high cognitive load**. We suggest sending a supportive nudge or unlocking a simplified module.
                       </p>
                       <div className="grid gap-3 pt-4">
                          <button onClick={handleSendNudge} className="flex items-center justify-between px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition-all shadow-xl shadow-blue-500/20">
                             Send Motivational Nudge <BookOpen className="w-4 h-4 ml-2" />
                          </button>
                          <button onClick={() => alert("Audio Bridge initiated: Awaiting Student Connection...")} className="flex items-center justify-between px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs transition-all border border-white/5">
                             Open Audio Bridge <Users className="w-4 h-4 ml-2" />
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorDashboard;
