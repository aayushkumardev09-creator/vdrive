import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Briefcase, 
  CheckCircle2, 
  Loader2,
  MapPin,
  ArrowLeft,
  User,
  Clock,
  Send
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { getTierColor, getDecisionIcon } from '@/src/lib/matchingEngine';

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
  score?: number;
  matchData?: any;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: string;
  experience: string;
  location: string;
}

export default function ReverseMatchResults() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchCandidateAndJobs();
  }, [id]);

  const fetchCandidateAndJobs = async () => {
    setIsLoading(true);
    try {
      // Fetch Candidate
      const { data: candData, error: candError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();
      if (candError) throw candError;
      setCandidate(candData);

      // Fetch Jobs
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (jobError) throw jobError;

      // Run AI Reverse Match
      runReverseMatch(candData, jobData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  };

  const runReverseMatch = async (cand: Candidate, jobList: Job[]) => {
    setIsMatching(true);
    try {
      let allScoredJobs: any[] = [];
      const chunkSize = 20;

      for (let i = 0; i < jobList.length; i += chunkSize) {
        const chunk = jobList.slice(i, i + chunkSize);
        
        const response = await fetch('/api/match/score-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate: cand, jobs: chunk })
        });
        
        if (!response.ok) {
          console.error(`Failed to score jobs batch ${i/chunkSize + 1}`);
          continue;
        }
        
        const data = await response.json();
        if (data.jobs) {
          allScoredJobs = [...allScoredJobs, ...data.jobs];
          // Stream results immediately
          setJobs([...allScoredJobs].sort((a, b) => {
            const scoreA = a.matchData?.match_percentage || 0;
            const scoreB = b.matchData?.match_percentage || 0;
            return scoreB - scoreA;
          }));
        }
      }
      
      allScoredJobs.sort((a, b) => {
        const scoreA = a.matchData?.match_percentage || 0;
        const scoreB = b.matchData?.match_percentage || 0;
        return scoreB - scoreA;
      });
      
      setJobs(allScoredJobs);
    } catch (error) {
      console.error('Error running reverse match:', error);
    } finally {
      setIsMatching(false);
      setIsLoading(false);
    }
  };

  const handleSubmitToJob = (job: Job) => {
    if (!candidate) return;
    navigate('/submissions', {
      state: {
        job: job,
        candidates: [{ ...candidate, score: job.score || 0 }]
      }
    });
  };

  if (isLoading && !isMatching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse tracking-tight">Initializing Reverse Match...</p>
      </div>
    );
  }

  const filteredJobs = jobs.filter(j => 
    j.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.skills.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header section showing Candidate details */}
      {candidate && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-6">
              <button 
                onClick={() => navigate('/candidates')}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Back to Candidates
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 text-white font-black text-2xl uppercase border-2 border-white">
                  {candidate.name.substring(0,2)}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter">{candidate.name}</h1>
                  <p className="text-slate-500 text-sm font-medium tracking-tight flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" /> {candidate.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {candidate.skills.split(',').map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black tracking-tight rounded-lg">
                    {skill.trim()}
                  </span>
                ))}
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-tight rounded-lg flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {candidate.experience} Exp
                </span>
              </div>
            </div>

            {isMatching && (
              <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 p-6 rounded-2xl border border-blue-100 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse mb-3" />
                <span className="text-sm font-black tracking-tighter">AI Scanning Jobs...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs List */}
      {jobs.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Matching Jobs ({filteredJobs.length})
            </h2>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs or skills..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const match = job.matchData;
              const tierColor = match ? getTierColor(match.tier) : 'slate';
              const isBestFit = match?.tier === 'TIER_1' || match?.tier === 'TIER_2';

              return (
                <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start hover:border-slate-300 transition-colors group">
                  
                  {/* Score Circle */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl shadow-inner border-4 relative",
                      match?.tier === 'TIER_1' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      match?.tier === 'TIER_2' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      match?.tier === 'TIER_3' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {job.score || 0}%
                      {isBestFit && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                          <CheckCircle2 className={cn("w-4 h-4", match?.tier === 'TIER_1' ? "text-emerald-500" : "text-blue-500")} />
                        </div>
                      )}
                    </div>
                    {match && (
                      <span className={cn(
                        "text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full",
                        match.tier === 'TIER_1' ? "bg-emerald-100 text-emerald-700" :
                        match.tier === 'TIER_2' ? "bg-blue-100 text-blue-700" :
                        match.tier === 'TIER_3' ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {match.tier.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                        {job.job_title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.experience}</span>
                        {job.visa && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Visa: {job.visa}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.split(',').slice(0, 5).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold tracking-tight rounded-md">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.skills.split(',').length > 5 && (
                        <span className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold tracking-tight rounded-md">
                          +{job.skills.split(',').length - 5} more
                        </span>
                      )}
                    </div>

                    {match && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Strengths</span>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{match.strengths || "Matches core skills."}</p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potential Gaps</span>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{match.gaps || "No significant gaps."}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 justify-center h-full pt-4">
                    <button 
                      onClick={() => handleSubmitToJob(job)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black tracking-tight rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg shadow-blue-200"
                    >
                      <Send className="w-4 h-4" />
                      Submit to Job
                    </button>
                    {job.gmail_thread_id && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-center tracking-tight">
                        Direct Email Reply Available
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
            
            {filteredJobs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-900">No jobs match your search</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
