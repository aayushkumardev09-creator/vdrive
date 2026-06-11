import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Download, 
  Send, 
  ChevronRight, 
  X, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Clock,
  ArrowLeft,
  Terminal,
  UserCheck,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { getTierColor, getDecisionIcon, type ScoredCandidate } from '@/src/lib/matchingEngine';
import type { Job as JobType, RawCandidate } from '@/src/lib/matchingEngine';

import { chatWithGroq } from '@/src/lib/ai';

interface Job {
  id: string;
  job_title: string;
  location: string;
  experience: string;
  skills: string;
  role_overview: string;
  created_at: string;
  status: 'active' | 'paused';
  gmail_thread_id?: string;
  gmail_message_id?: string;
  visa?: string;
  _info?: string;
}

type Candidate = ScoredCandidate;

export default function SmartMatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<'jobs' | 'matching'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'sent'>('all');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [matchThreshold, setMatchThreshold] = useState<number>(85);
  const [isGettingInsight, setIsGettingInsight] = useState(false);

  const getAIInsight = async () => {
    if (!selectedJob || candidates.length === 0) return;
    setIsGettingInsight(true);
    
    const topCandidates = candidates.slice(0, 3);
    const prompt = `
      Analyze the match between this job and the top candidates.
      
      Job: ${selectedJob.job_title}
      Requirements: ${selectedJob.role_overview}
      Required Skills: ${selectedJob.skills}
      
      Top Candidates:
      ${topCandidates.map(c => `- ${c.name} (${c.tier}): ${c.skills}, ${c.experience} exp, match ${c.match_percentage}% - ${c.strengths}`).join('\n')}
      
      Provide a brief (max 3 sentences) executive summary of why these candidates are the best fit and any potential gaps to watch out for.
    `;

    const { content, error } = await chatWithGroq(prompt, "You are a senior recruitment strategist.");
    if (error) {
      setAiInsight(`AI Error: ${error}`);
    } else {
      setAiInsight(content);
    }
    setIsGettingInsight(false);
  };

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setJobs(data);
        
        // Auto-select job if passed via location state
        if (location.state?.jobId) {
          const job = data.find(j => j.id === location.state.jobId);
          if (job) {
            handleJobSelect(job);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidates = async (job: Job) => {
    setIsMatching(true);
    try {
      // Fetch all candidates from Supabase
      const { data: allCandidates, error: fetchError } = await supabase
        .from('candidates')
        .select('*');

      if (fetchError) throw fetchError;

      if (allCandidates && allCandidates.length > 50) {
        alert("Cannot process more than 50 candidates at a time. Please reduce your candidate pool in the database.");
        setIsMatching(false);
        return;
      }

      if (allCandidates && allCandidates.length > 0) {
        const response = await fetch("/api/match/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job, candidates: allCandidates })
        });
        
        if (!response.ok) {
          console.error("Matching API failed");
          setCandidates([]);
        } else {
          const data = await response.json();
          if (data.candidates) {
            setCandidates(data.candidates);
          }
        }
      } else {
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsMatching(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Load threshold from settings
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('workflow').single();
        if (data?.workflow?.matchThreshold) {
          setMatchThreshold(data.workflow.matchThreshold);
        } else {
          const local = localStorage.getItem('vdrive_settings');
          if (local) {
            const parsed = JSON.parse(local);
            if (parsed?.workflow?.matchThreshold) {
              setMatchThreshold(parsed.workflow.matchThreshold);
            }
          }
        }
      } catch (e) {
        console.warn('Could not load threshold settings', e);
      }
    };
    loadSettings();
  }, []);

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setView('matching');
    fetchCandidates(job);
  };

  const toggleCandidateSelect = (id: string) => {
    const next = new Set(selectedCandidateIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCandidateIds(next);
  };

  const toggleAllCandidates = () => {
    if (selectedCandidateIds.size === candidates.length) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(candidates.map(c => c.id)));
    }
  };

  const handleSendSubmissions = () => {
    if (!selectedJob) return;
    
    const selectedCandidates = candidates.filter(c => selectedCandidateIds.has(c.id));
    
    navigate('/submissions', { 
      state: { 
        job: selectedJob,
        candidates: selectedCandidates 
      } 
    });
  };

  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.job_title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(jobSearchQuery.toLowerCase());
    
    if (activeTab === 'new') return matchesSearch && job._info !== 'sent';
    if (activeTab === 'sent') return matchesSearch && job._info === 'sent';
    return matchesSearch;
  });

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skills.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <AnimatePresence mode="wait">
        {view === 'jobs' ? (
          <motion.div 
            key="jobs-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">V <span className="text-blue-600">Drive</span> Match</h1>
                <p className="text-slate-500 text-sm font-medium tracking-tight">AI-powered candidate alignment engine</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black font-medium tracking-tight rounded-xl transition-all",
                      activeTab === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    All Jobs
                  </button>
                  <button 
                    onClick={() => setActiveTab('new')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black font-medium tracking-tight rounded-xl transition-all",
                      activeTab === 'new' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    New
                  </button>
                  <button 
                    onClick={() => setActiveTab('sent')}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black font-medium tracking-tight rounded-xl transition-all",
                      activeTab === 'sent' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Sent
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search jobs..."
                    value={jobSearchQuery}
                    onChange={(e) => setJobSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500/30 transition-all w-64 shadow-sm"
                  />
                </div>
                <button onClick={fetchJobs} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <RefreshCw className={cn("w-4 h-4 text-slate-500", isLoading && "animate-spin")} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse shadow-sm" />
                ))
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <motion.div 
                    key={job.id}
                    layoutId={job.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col h-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Briefcase className="w-24 h-24" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-tight tracking-tight mb-1">{job.job_title}</h3>
                          <p className="text-xs font-bold text-slate-400 font-medium tracking-tight flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {job.location}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black font-medium tracking-tight",
                          job._info === 'sent' 
                            ? "bg-blue-50 text-blue-600 border border-blue-100" 
                            : job.status === 'active' 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                        )}>
                          {job._info === 'sent' ? 'Sent' : job.status === 'active' ? 'New' : job.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 line-clamp-2 overflow-hidden max-h-12">
                        {(job.skills || '').split(',').filter(Boolean).slice(0, 5).map((skill, idx) => (
                          <span key={`${skill.trim()}-${idx}`} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100 uppercase group-hover:bg-white transition-colors">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>

                      <p className="text-slate-500 text-sm line-clamp-3 font-medium leading-relaxed italic">
                        "{job.role_overview}"
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedJobForDetails(job)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100"
                        title="View Details"
                      >
                        <Briefcase className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleJobSelect(job)}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black font-medium tracking-tight shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-blue-200" />
                        Match Candidates
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900">No jobs found</h3>
                  <p className="text-slate-500">Try adjusting your search filters or add a new job position.</p>
                </div>
              )}
            </div>

            {/* Job Details Modal */}
            <AnimatePresence>
              {selectedJobForDetails && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedJobForDetails(null)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl bg-white rounded-[2.5rem] shadow-2xl z-[70] overflow-hidden border border-slate-100"
                  >
                    <div className="p-6 space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedJobForDetails.job_title}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-400 font-medium tracking-tight">
                              <MapPin className="w-3.5 h-3.5" />
                              {selectedJobForDetails.location}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-xs font-bold text-blue-600 font-medium tracking-tight">
                              {selectedJobForDetails.experience} Full-time
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedJobForDetails(null)}
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-full transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-[10px] font-black text-slate-400 font-medium tracking-tight mb-2">Role Overview</h3>
                          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                             <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                              "{selectedJobForDetails.role_overview}"
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[10px] font-black text-slate-400 font-medium tracking-tight mb-3">Required Stack</h3>
                          <div className="flex flex-wrap gap-2">
                            {(selectedJobForDetails.skills || '').split(',').filter(Boolean).map((skill, idx) => (
                              <span key={`${skill.trim()}-${idx}`} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase shadow-sm">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            handleJobSelect(selectedJobForDetails);
                            setSelectedJobForDetails(null);
                          }}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black font-medium tracking-tight shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                          <Sparkles className="w-5 h-5 text-blue-200" />
                          Proceed to Matching
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="matching-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('jobs')}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  Matching Results
                </h1>
                <p className="text-slate-500 text-sm font-medium">Position: <span className="text-blue-600 font-bold uppercase">{selectedJob?.job_title}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 font-medium tracking-tight mb-4">Job Specs</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Target Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedJob?.skills || '').split(',').filter(Boolean).map((skill, idx) => (
                          <span key={`${skill.trim()}-${idx}`} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black border border-blue-100 uppercase">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest leading-none">Experience</p>
                      <p className="text-sm font-bold text-slate-700">{selectedJob?.experience}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest leading-none">Location</p>
                      <p className="text-sm font-bold text-slate-700">{selectedJob?.location}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900 rounded-xl p-6 text-white overflow-hidden relative shadow-lg shadow-blue-100">
                  <Terminal className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5" />
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                      <Sparkles className={cn("w-6 h-6 text-blue-400", isGettingInsight && "animate-spin")} />
                    </div>
                    <div className="space-y-2">
                       <h4 className="font-bold text-sm italic">AI Strategic Insights</h4>
                       {aiInsight ? (
                         <p className="text-blue-100 text-[11px] font-medium leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 text-left">
                           {aiInsight}
                         </p>
                       ) : (
                         <p className="text-blue-200 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
                           Generate strategic analysis based on top-tier candidate profiles.
                         </p>
                       )}
                    </div>
                    <button 
                      onClick={getAIInsight}
                      disabled={isGettingInsight || candidates.length === 0}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black font-medium tracking-tight transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGettingInsight ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      {aiInsight ? "Refresh Analysis" : "Analyze Top Matches"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Filter matches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500/30 transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {selectedCandidateIds.size} Selected
                      </span>
                      <button 
                        disabled={selectedCandidateIds.size === 0}
                        onClick={handleSendSubmissions}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-xs font-black font-medium tracking-tight transition-all flex items-center gap-2 shadow-lg",
                          selectedCandidateIds.size > 0 
                            ? "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95" 
                            : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        )}
                      >
                        <Send className="w-4 h-4" />
                        Send Selection
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] border-b border-slate-100">
                        <tr>
                          <th className="w-16 px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedCandidateIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                              onChange={toggleAllCandidates}
                              className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4">Candidate</th>
                          <th className="w-32 px-6 py-4 text-center">Match %</th>
                          <th className="w-24 px-6 py-4 text-center">Tier</th>
                          <th className="px-6 py-4">Fit Assessment</th>
                          <th className="w-32 px-6 py-4 text-center">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isMatching && filteredCandidates.length === 0 ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-100 rounded animate-pulse" /></td>
                              <td className="px-6 py-4"><div className="w-48 h-8 bg-slate-100 rounded-lg animate-pulse" /></td>
                              <td className="px-6 py-4 text-center"><div className="w-16 h-8 bg-slate-100 rounded-lg animate-pulse mx-auto" /></td>
                              <td className="px-6 py-4 text-center"><div className="w-16 h-6 bg-slate-100 rounded-lg animate-pulse mx-auto" /></td>
                              <td className="px-6 py-4"><div className="w-full h-8 bg-slate-100 rounded-lg animate-pulse" /></td>
                              <td className="px-6 py-4 text-center"><div className="w-24 h-6 bg-slate-100 rounded-full animate-pulse mx-auto" /></td>
                            </tr>
                          ))
                        ) : filteredCandidates.map((c) => (
                          <tr 
                            key={c.id} 
                            className={cn(
                              "hover:bg-blue-50/20 transition-colors group cursor-default",
                              selectedCandidateIds.has(c.id) && "bg-blue-50/40"
                            )}
                          >
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                checked={selectedCandidateIds.has(c.id)}
                                onChange={() => toggleCandidateSelect(c.id)}
                                className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-white shadow-sm ring-1 ring-slate-100 uppercase text-xs">
                                  {(c.name || '??').split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-slate-900 truncate">{c.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold tracking-tight truncate">{c.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className={cn(
                                  "font-black tracking-tight",
                                  c.match_percentage >= matchThreshold ? "text-emerald-600" : 
                                  c.match_percentage >= (matchThreshold - 20) ? "text-amber-600" : "text-red-600"
                                )}>
                                  {c.match_percentage}%
                                </span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden relative">
                                  <div 
                                    className={cn(
                                      "absolute inset-y-0 left-0 rounded-full transition-all duration-1000",
                                      c.match_percentage >= matchThreshold ? "bg-emerald-500" : 
                                      c.match_percentage >= (matchThreshold - 20) ? "bg-amber-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${Math.min(c.match_percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "px-3 py-1.5 rounded-full text-[9px] font-black font-medium tracking-tight border shadow-sm inline-block",
                                c.tier === 'TIER_1' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                c.tier === 'TIER_2' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                c.tier === 'TIER_3' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-red-50 text-red-700 border-red-200"
                              )}>
                                {c.tier}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2 min-w-[200px]">
                                <div>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">AI Strengths</span>
                                  <p className="text-[10px] font-semibold text-slate-700 leading-relaxed">{c.strengths || "Strong overall match."}</p>
                                </div>
                                {c.gaps && c.gaps !== "Unknown" && c.gaps !== "None" && (
                                  <div className="pt-2 border-t border-slate-100/50">
                                    <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest block mb-0.5">Potential Gaps</span>
                                    <p className="text-[10px] text-slate-500 italic leading-relaxed">⚠️ {c.gaps}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[9px] font-black font-medium tracking-tight inline-flex items-center gap-1.5 border shadow-sm",
                                c.decision === 'INTERVIEW_IMMEDIATELY' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                c.decision === 'INTERVIEW' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                c.decision === 'CONSIDER_CAUTION' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                "bg-red-50 text-red-700 border-red-100"
                              )}>
                                {c.decision === 'INTERVIEW_IMMEDIATELY' ? '🟢 INTERVIEW' :
                                 c.decision === 'INTERVIEW' ? '🔵 INTERVIEW' :
                                 c.decision === 'CONSIDER_CAUTION' ? '🟡 CAUTION' :
                                 '🔴 PASS'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {!isMatching && filteredCandidates.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                        <UserCheck className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No matching candidates</h3>
                      <p className="text-slate-500 text-sm max-w-xs">AI could not find candidates matching these specific filters. Try broadening your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
