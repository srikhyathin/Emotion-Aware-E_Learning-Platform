"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Search, Filter, Play, Clock, Star, User } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentDashboard({ onSelectCourse }: { onSelectCourse?: (course: any) => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let result = courses;
    if (activeCategory !== "All") {
      result = result.filter(c => c.category === activeCategory);
    }
    if (searchQuery) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    setFilteredCourses(result);
  }, [searchQuery, activeCategory, courses]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (data) {
        setCourses(data);
        setFilteredCourses(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", "Design", "Development", "Business", "Marketing", "AI"];

  return (
    <div className="p-8 space-y-12 min-h-screen bg-slate-950/20">
      {/* Featured Section */}
      <section className="relative h-[400px] rounded-[48px] overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600/90 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          alt="Featured"
        />
        
        <div className="relative z-20 h-full p-16 flex flex-col justify-center max-w-2xl space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-200 font-bold uppercase text-[10px] tracking-[0.4em]"
          >
            <span className="w-12 h-[1px] bg-blue-400" /> AI Recommended
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black text-white leading-[1.1] tracking-tight"
          >
            Advanced <br /> Neural Patterns
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg font-medium max-w-md leading-relaxed"
          >
            Dive deep into the architecture of modern LLMs and learn to build adaptive AI systems.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-fit px-10 py-5 bg-white text-blue-600 rounded-[24px] font-black text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
          >
            Start Now <Play className="w-5 h-5 fill-current" />
          </motion.button>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-10 right-10 z-20 flex flex-col gap-4">
          <div className="glass-morphism px-6 py-3 rounded-2xl border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-bold text-xs uppercase tracking-widest">1.2k Active Now</span>
          </div>
        </div>
      </section>

      {/* Explorer Tools */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-4">
        <div className="space-y-3">
          <h3 className="text-4xl font-black text-white tracking-tight">Discover Learning</h3>
          <p className="text-slate-500 font-medium text-lg">Personalized paths based on your emotional engagement.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="group relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text"
              placeholder="What do you want to learn?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border border-white/5 rounded-[24px] pl-14 pr-8 py-5 text-base text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 w-[400px] transition-all backdrop-blur-xl"
            />
          </div>
          <button className="p-5 bg-slate-900/50 border border-white/5 rounded-[24px] hover:bg-slate-800 transition-all backdrop-blur-xl group">
            <Filter className="w-6 h-6 text-slate-500 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-4 rounded-[20px] text-sm font-black transition-all shrink-0 border uppercase tracking-widest ${
              activeCategory === cat 
              ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20 scale-105' 
              : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-slate-600 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
          {[1,2,3].map(i => (
            <div key={i} className="h-[500px] bg-slate-900/50 rounded-[40px] animate-pulse border border-white/10" />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10 pb-20">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -15 }}
              className="bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden group hover:border-blue-500/40 hover:bg-slate-900/60 transition-all duration-500 flex flex-col shadow-2xl"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={course.thumbnail_url || `https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop`}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                
                {/* Category Badge */}
                <div className="absolute top-6 left-6 z-20">
                  <span className="px-4 py-2 bg-slate-950/80 backdrop-blur-xl rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border border-blue-500/30">
                    {course.category || 'Advanced'}
                  </span>
                </div>

                {/* Engagement Indicator */}
                <div className="absolute top-6 right-6 z-20">
                  <div className="w-10 h-10 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center text-amber-400">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                  <button 
                    onClick={() => onSelectCourse?.(course)}
                    className="w-20 h-20 bg-blue-600 text-white rounded-[30px] flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:bg-blue-500 transition-colors"
                  >
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </button>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {course.title}
                  </h4>
                  <p className="text-slate-400 text-base font-medium line-clamp-3 leading-relaxed opacity-70">
                    {course.description}
                  </p>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-slate-500 overflow-hidden shadow-inner">
                       {course.instructor?.full_name ? (
                         <div className="w-full h-full flex items-center justify-center bg-blue-600/10 text-blue-400">
                           {course.instructor.full_name.substring(0, 1).toUpperCase()}
                         </div>
                       ) : (
                         <User className="w-6 h-6" />
                       )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Instructor</p>
                      <p className="text-sm font-bold text-white">{course.instructor?.full_name || 'Dr. Sarah Johnson'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Enrollment</p>
                    <p className="text-sm font-bold text-blue-400">5.0k+</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center space-y-8">
          <div className="relative w-32 h-32 mx-auto">
             <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full" />
             <div className="relative w-full h-full bg-slate-900 rounded-[40px] flex items-center justify-center border border-white/10">
               <Search className="w-12 h-12 text-slate-700" />
             </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-3xl font-black text-white tracking-tight">Search fell short</h4>
            <p className="text-slate-500 text-lg font-medium">We couldn't find any courses matching "{searchQuery}".</p>
          </div>
          <button 
            onClick={() => {setSearchQuery(""); setActiveCategory("All")}}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all border border-white/5"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
