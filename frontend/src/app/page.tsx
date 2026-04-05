"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Settings, Play, Info, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import CourseRoom from "@/components/CourseRoom";
import InstructorDashboard from "@/components/InstructorDashboard";
import StudentDashboard from "@/components/StudentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import Auth from "@/components/Auth";
import Sidebar from "@/components/Sidebar";
import SettingsView from "@/components/SettingsView";
import Landing from "@/components/Landing";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [view, setView] = useState('landing');
  const [loading, setLoading] = useState(true);

  const authInitializedRef = useRef(false);

  useEffect(() => {
    if (authInitializedRef.current) return;
    authInitializedRef.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setProfileError(null);
        setSelectedCourse(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setProfileError("Profile not found. Please ensure you have run the SQL schema in Supabase.");
        } else {
          setProfileError(error.message);
        }
        setProfile(null);
      } else {
        setProfile(data);
        setProfileError(null);
      }
    } catch (err: any) {
      setProfileError("Database connection error. Check your Supabase configuration.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('landing');
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setView('course');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Routing Logic
  if (!session) {
    if (view === 'auth') return (
      <div className="fixed inset-0 z-[100]">
        <Auth />
        <button 
           onClick={() => setView('landing')}
           className="absolute top-8 left-8 p-3 bg-slate-900/50 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-xl border border-white/5"
        >
          ← Back to Landing
        </button>
      </div>
    );
    return <Landing onGetStarted={() => setView('auth')} />;
  }

  if (session && profile) {
    if (view === 'landing') {
      return <Landing user={profile} onGetStarted={() => setView('dashboard')} />;
    }

    if (view === 'course') return (
       <div className="bg-slate-950 min-h-screen">
          <nav className="fixed top-0 w-full z-50 glass-morphism px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <Brain className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold tracking-tight text-white">EmotionSense</span>
            </div>
            <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold">
              ← Back to Dashboard
            </button>
          </nav>
          <div className="pt-24 min-h-screen">
            <CourseRoom course={selectedCourse} onComplete={() => setView('dashboard')} />
          </div>
       </div>
    );

    return (
      <div className="bg-slate-950 min-h-screen flex">
         <Sidebar 
            role={profile.role} 
            user={{...profile, email: session.user.email}} 
            activeView={view} 
            onViewChange={setView} 
            onSignOut={handleSignOut} 
         />
         <main className="flex-1 ml-72">
            {view === 'dashboard' ? (
              profile.role === 'teacher' ? <InstructorDashboard /> :
              profile.role === 'admin' ? <AdminDashboard /> :
              <StudentDashboard onSelectCourse={handleSelectCourse} />
            ) : view === 'courses' ? (
              <StudentDashboard onSelectCourse={handleSelectCourse} />
            ) : view === 'users' ? (
              <AdminDashboard />
            ) : view === 'students' ? (
              <InstructorDashboard />
            ) : view === 'settings' ? (
              <SettingsView user={{...profile, email: session.user.email}} />
            ) : (
              <div className="p-20 text-center text-slate-500">View under construction</div>
            )}
         </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
       <h1 className="text-2xl font-black text-rose-500 mb-2">Profile Missing</h1>
       <p className="text-slate-400 max-w-md mx-auto mb-8 font-medium italic">
         We found your session but couldn't retrieve your learner profile. 
         Please ensure you have executed the platform's initial database schema.
       </p>
       <button onClick={handleSignOut} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold border border-white/10">Sign Out</button>
    </div>
  );
}
