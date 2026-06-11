import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Send, 
  Mail, 
  Plus,
  FileUp,
  History,
  MoreVertical,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: string;
  job_title: string;
  location: string;
  status: string;
  created_at: string;
  _info?: string;
  client_email?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  created_at: string;
  _info?: string;
}

interface Stats {
  totalCandidates: number;
  activeJobs: number;
  sentSubmissions: number;
  totalJobs: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalCandidates: 0,
    activeJobs: 0,
    sentSubmissions: 0,
    totalJobs: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Stats
      const [
        { count: candCount },
        { count: pendingJobCount },
        { count: sentJobCount },
        { count: totalJobCount },
        { data: jobsData },
        { data: candData }
      ] = await Promise.all([
        supabase.from('candidates').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).or('_info.is.null,_info.neq.sent'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('_info', 'sent'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('candidates').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        totalCandidates: candCount || 0,
        activeJobs: pendingJobCount || 0,
        sentSubmissions: sentJobCount || 0,
        totalJobs: totalJobCount || 0
      });

      setRecentJobs((jobsData as Job[]) || []);
      setRecentCandidates((candData as Candidate[]) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Synchronizing performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">V Drive Operations</h1>
          <p className="text-slate-500 text-sm font-medium">Global talent pipeline performance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/upload')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 text-sm"
          >
            <FileUp className="w-4 h-4" />
            Import Batch
          </button>
          <button 
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create New Job
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Candidates', value: stats.totalCandidates.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Jobs', value: stats.activeJobs.toString(), icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sent Submissions', value: stats.sentSubmissions.toString(), icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Jobs', value: stats.totalJobs.toString(), icon: Mail, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">Live</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-400" />
              Recent Jobs
            </h3>
            <button 
              onClick={() => navigate('/jobs')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
            >
              All Jobs
            </button>
          </div>
          <div className="space-y-3">
            {recentJobs.length > 0 ? (
              recentJobs.map((job) => (
                <div key={job.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {job.job_title ? job.job_title.charAt(0) : '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-none mb-1">{job.job_title || 'Untitled Position'}</h4>
                      <p className="text-xs text-slate-400 font-medium">{job.location || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold font-medium tracking-tight",
                        job._info === 'sent' ? "bg-blue-50 text-blue-700" :
                        job.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {job._info === 'sent' ? 'Sent' : job.status}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">{formatDate(job.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-medium">No recent jobs found</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Candidates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              New Candidates
            </h3>
            <button 
              onClick={() => navigate('/candidates')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
            >
              View Pool
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100">Candidate Name</th>
                  <th className="px-5 py-3 border-b border-slate-100 uppercase">Status</th>
                  <th className="px-5 py-3 border-b border-slate-100 text-right">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCandidates.length > 0 ? (
                  recentCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", candidate._info === 'sent' ? "bg-blue-500" : "bg-emerald-500")} />
                          <span className="text-xs font-bold text-slate-900">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold font-medium tracking-tight",
                          candidate._info === 'sent' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {candidate._info === 'sent' ? 'Sent' : 'New'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                          {formatDate(candidate.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm font-medium italic">
                      No candidates in pool
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Sent Submissions (Recent Sent Jobs) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-slate-400" />
            Recent Sent Submissions
          </h3>
          <button 
            onClick={() => navigate('/match')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
          >
            Review Smart Match
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-slate-100">Job Title</th>
                  <th className="px-6 py-4 border-b border-slate-100">Client Contact</th>
                  <th className="px-6 py-4 border-b border-slate-100">Location</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-right">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJobs.filter(j => j._info === 'sent').length > 0 ? (
                  recentJobs.filter(j => j._info === 'sent').map((job) => (
                    <tr key={job.id} onClick={() => navigate('/match')} className="hover:bg-slate-50 transition-colors hover:cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 font-bold text-[10px] text-blue-600">
                            {job.job_title ? job.job_title.charAt(0) : '?'}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{job.job_title || 'Untitled Position'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-600">{job.client_email || 'No email'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-400">{job.location || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium tracking-tight border border-blue-100">
                          {formatDate(job.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm font-medium bg-slate-50/50">
                      No sent submissions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
