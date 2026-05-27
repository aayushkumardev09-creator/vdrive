import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  RefreshCcw, 
  Plus, 
  MoreVertical, 
  Sparkles, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  X,
  ExternalLink,
  Mail,
  ChevronRight,
  Clock,
  Code
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

interface Job {
  idx?: number;
  id: string;
  job_title: string;
  location: string;
  experience: string;
  visa?: string;
  skills: string; // Stored as comma-separated string in DB
  role_overview: string;
  raw_email: string;
  source?: string;
  created_at: string;
  status: 'active' | 'paused'; // UI state
  gmail_thread_id?: string;
  gmail_message_id?: string;
  _info?: string;
}


export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setJobs(data as Job[]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'pending') return matchesSearch && job._info !== 'sent';
    if (statusFilter === 'sent') return matchesSearch && job._info === 'sent';
    return matchesSearch;
  });

  const navigate = useNavigate();

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, status: newStatus as 'active' | 'paused' } : job
      ));
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 relative overflow-x-hidden min-h-[calc(100vh-120px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">V Drive Jobs</h1>
          <p className="text-slate-500 text-sm font-medium">Pipeline for all active and paused talent requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className={cn(
              "p-2 bg-white border border-slate-200 text-slate-500 rounded-lg shadow-sm hover:bg-slate-50 transition-all active:scale-95",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by job title or recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['all', 'pending', 'sent'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    statusFilter === s 
                      ? (s === 'sent' ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-900 text-white shadow-sm")
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Required Skills</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4 text-right">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr 
                  key={job.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{job.job_title}</span>
                      <span className="text-[10px] font-medium text-slate-400">{job.location} • {job.source || 'Direct'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
                      job._info === 'sent' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                      job.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        job._info === 'sent' ? "bg-indigo-500" : 
                        job.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      )} />
                      {job._info === 'sent' ? 'Sent' : job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {job.skills.split(',').slice(0, 3).map((skill, idx) => (
                        <span key={`${skill.trim()}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.skills.split(',').length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[10px] font-bold">
                          +{job.skills.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{job.experience}</td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {job.created_at.split(' ')[0]}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        title="Match Candidates"
                        onClick={() => navigate('/smart-match', { state: { jobId: job.id } })}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(job.id, job.status)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        title={job.status === 'active' ? 'Pause Job' : 'Resume Job'}
                      >
                        {job.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4 text-emerald-500" />}
                      </button>
                      <button className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer Detail */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedJob.job_title}</h2>
                    <p className="text-xs text-slate-500 font-medium">{selectedJob.location} • {selectedJob.visa || 'Any Visa'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 selection:bg-indigo-100">
                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    Role Overview
                  </h3>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 leading-relaxed text-sm">
                    "{selectedJob.role_overview}"
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedJob.skills.split(',').map((skill, idx) => (
                      <span key={`${skill.trim()}-${idx}`} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-2 border border-indigo-100/50">
                        <Code className="w-3 h-3" />
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Internal Communication
                  </h3>
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200 rounded-full" />
                    <div className="ml-6 font-mono text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
                      {selectedJob.raw_email}
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group font-sans">
                  <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1">V Drive Smart Match</h4>
                      <p className="text-slate-400 text-xs">Ready to scan 1,280 candidates for this role.</p>
                    </div>
                    <button 
                      onClick={() => navigate('/smart-match', { state: { jobId: selectedJob.id } })}
                      className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-black shadow-sm active:scale-95 transition-all"
                    >
                      RUN MATCH
                    </button>
                  </div>
                </section>
                
                <section className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-slate-900">{selectedJob.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created At</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-300" />
                      <span className="text-sm font-bold text-slate-900">{selectedJob.created_at.split(' ')[0]}</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Public Posting
                </button>
                <button className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
