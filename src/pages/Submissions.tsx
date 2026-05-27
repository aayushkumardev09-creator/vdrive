import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Users, 
  Mail, 
  FileText, 
  Save, 
  X, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  User,
  Layout,
  Briefcase,
  History,
  Clock,
  Sparkles,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { chatWithGroq } from '@/src/lib/ai';

interface Job {
  id: string;
  job_title: string;
  location: string;
  experience: string;
  skills: string;
  role_overview: string;
  gmail_thread_id?: string;
  gmail_message_id?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: string;
  experience: string;
  score: number;
  location: string;
}

export default function Submissions() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract data from state
  const passedJob = location.state?.job as Job | undefined;
  const passedCandidates = location.state?.candidates as Candidate[] | undefined;

  // State management
  const [candidates] = useState<Candidate[]>(passedCandidates || []);
  const [job] = useState<Job | null>(passedJob || null);
  const [clientEmail, setClientEmail] = useState('hiring.manager@techcorp.com');
  const [recruiterNotes, setRecruiterNotes] = useState('These candidates were selected specifically for their strong alignment with your project requirements and technical stack.');
  
  const [emailBody, setEmailBody] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Redirect if no data
  useEffect(() => {
    if (!passedJob || !passedCandidates) {
      console.warn('Submissions page accessed without job/candidate state. Redirecting.');
      navigate('/smart-match', { replace: true });
    }
  }, [passedJob, passedCandidates, navigate]);

  const isReply = !!job?.gmail_thread_id;

  // Initialize subject
  useEffect(() => {
    if (job) {
      setSubject(isReply ? `Re: ${job.job_title} - Shortlist` : `Candidate Shortlist: ${job.job_title}`);
    }
  }, [job, isReply]);

  // Generate dynamic email body
  const generateTemplate = (notes: string) => {
    if (!job) return '';

    const candidateSections = candidates.map(c => 
      `• ${c.name} (${c.experience} Exp)\n  Skills: ${c.skills}\n  Location: ${c.location}\n  V Drive AI Score: ${c.score}%`
    ).join('\n\n');

    const intro = isReply 
      ? `Following up on our thread regarding the ${job.job_title} position.`
      : `I've curated a shortlist of exceptional candidates for the ${job.job_title} position.`;

    return `Hi Hiring Team,
    
${intro}

Selected Candidates:
${candidateSections}

Recruiter Notes:
${notes}

Could we schedule a review call or proceed with technical rounds?

Best regards,
 vdrive
www.vdrive`;
  };

  useEffect(() => {
    setEmailBody(generateTemplate(recruiterNotes));
  }, [candidates, job, recruiterNotes, isReply]);

  const enhanceWithAI = async () => {
    if (!job || candidates.length === 0) return;
    setIsEnhancing(true);

    const prompt = `
      Job Title: ${job.job_title}
      Job Requirements: ${job.role_overview}
      Job Skills: ${job.skills}
      
      Candidates:
      ${candidates.map(c => `- ${c.name}: ${c.skills}, ${c.experience} exp, score ${c.score}%`).join('\n')}
      
      Current Recruiter Notes: "${recruiterNotes}"
      
      Please rewrite the recruiter notes to be more professional, persuasive, and highlight why these specific candidates are a great fit for this role. Keep it concise (2-3 sentences).
    `;

    const { content, error } = await chatWithGroq(prompt, "You are a professional recruiting copywriter.");
    
    if (error) {
      alert(`AI Error: ${error}`);
    } else if (content) {
      setRecruiterNotes(content.trim());
    }
    setIsEnhancing(false);
  };

  const handleSend = async () => {
    if (!job) return;
    setIsSending(true);
    
    try {
      // Prepare clean subject
      const cleanSubject = subject.replace(/^(Re:\s*)+/gi, '').trim();

      // Call Submission Webhook
      const webhookUrl = import.meta.env.VITE_SUBMISSION_WEBHOOK_URL;
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            subject: cleanSubject,
            mail_content: emailBody,
            thread_id: job.gmail_thread_id,
            message_id: job.gmail_message_id,
            to: clientEmail,
            mode: isReply ? 'REPLY' : 'NEW_THREAD'
          })
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }
      } else {
        console.warn('Submission webhook URL not configured. Skipping external call.');
      }

      // Wait a bit to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSent(true);
    } catch (error) {
      console.error('Failed to finalize submission:', error);
      alert('Failed to update submission status. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <div className="p-6 bg-slate-50 rounded-full border border-slate-200">
          <Sparkles className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No Selection Data</h2>
        <p className="text-slate-500 max-w-sm">Please select a job and candidates from the Matching terminal to begin the submission process.</p>
        <button 
          onClick={() => navigate('/smart-match')}
          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
        >
          Return to Matching
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">vdrive Submission Terminal</h1>
            <p className="text-slate-500 text-sm font-medium">Finalize candidate submission to the hiring manager.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95">
             <Save className="w-4 h-4" />
             Save Draft
          </button>
          <button 
            disabled={isSending || isSent}
            onClick={handleSend}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95",
              isSent ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
            )}
          >
            {isSending ? (
              <History className="w-4 h-4 animate-spin" />
            ) : isSent ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSending ? "Sending..." : isSent ? "Sent Successfully" : "Send Submission"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Job Card and Candidates List */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Job Card */}
          <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <Briefcase className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Target Position</span>
                <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold uppercase">Active</span>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{job.job_title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                    {job.experience}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" />
                Shortlisted Candidates
              </h3>
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{candidates.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {candidates.map((c) => (
                <div key={c.id} className="p-4 hover:bg-indigo-50/30 transition-colors group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500 border border-white shadow-sm ring-1 ring-slate-100 uppercase transition-transform group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none mb-1">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{c.experience} Exp</p>
                    </div>
                    <div className="ml-auto text-right">
                       <span className={cn(
                         "text-[10px] font-black italic",
                         c.score >= 80 ? "text-emerald-600" : "text-amber-600"
                       )}>
                         {c.score}%
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(c.skills || '').split(',').slice(0, 3).map((s, idx) => (
                      <span key={`${s.trim()}-${idx}`} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-bold uppercase border border-slate-100">
                        {s.trim()}
                      </span>
                    ))}
                    {(c.skills || '').split(',').length > 3 && (
                      <span className="text-[9px] font-black text-slate-300">+{(c.skills || '').split(',').length - 3}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Email Composer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
               <div className="flex items-center gap-4 bg-white/80 p-1.5 rounded-2xl border border-slate-100 mb-2">
                  <div className="px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isReply ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    )} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {isReply ? "Reply Mode" : "New Thread"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 italic">
                    {isReply ? `Syncing with Gmail thread ${job.gmail_thread_id?.slice(0, 8)}...` : "Initiating new candidate discussion"}
                  </span>
                  {isReply && <History className="ml-auto w-4 h-4 text-slate-300" />}
               </div>

               <div className="flex items-center gap-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 shrink-0">To</label>
                 <input 
                   type="email" 
                   value={clientEmail}
                   onChange={(e) => setClientEmail(e.target.value)}
                   className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                 />
               </div>
               <div className="flex items-center gap-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 shrink-0">Subject</label>
                 <input 
                   type="text" 
                   value={subject}
                   onChange={(e) => setSubject(e.target.value)}
                   className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                 />
               </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[400px] relative">
              <div className="p-6 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 flex items-center justify-between">
                <span>Message Body (Editable)</span>
                <div className="flex gap-4">
                  <button className="hover:text-indigo-600">B</button>
                  <button className="hover:text-indigo-600 italic">I</button>
                  <button className="hover:text-indigo-600 underline">U</button>
                </div>
              </div>
              <textarea 
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="flex-1 p-8 text-sm text-slate-700 leading-relaxed font-medium outline-none resize-none bg-slate-50/30 selection:bg-indigo-100 selection:text-indigo-900"
                placeholder="Type your submission message..."
              />
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white">
               <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic relative group">
                  <FileText className="w-5 h-5 text-indigo-500 absolute -left-2.5 top-4 bg-white rounded-full p-1 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 italic">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Internal Recruiter Notes</p>
                      <button 
                        onClick={enhanceWithAI}
                        disabled={isEnhancing}
                        className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 disabled:opacity-50"
                      >
                        <Sparkles className={cn("w-3 h-3", isEnhancing && "animate-pulse")} />
                        {isEnhancing ? "Enhancing..." : "Suggest with AI"}
                      </button>
                    </div>
                    <textarea 
                      value={recruiterNotes}
                      onChange={(e) => setRecruiterNotes(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-slate-500 text-xs font-medium resize-none h-16 leading-relaxed"
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 px-6 bg-amber-50 rounded-2xl border border-amber-100">
             <Info className="w-5 h-5 text-amber-600 shrink-0" />
             <p className="text-xs font-bold text-amber-700 leading-snug">
               Remember to verify that all candidate personal info (PII) is removed from the email body if following strict compliance rules.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
