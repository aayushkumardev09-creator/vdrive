import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Zap, 
  FileUp, 
  Mail, 
  Save, 
  Bell, 
  Globe, 
  CreditCard,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { supabase } from '@/src/lib/supabase';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form States
  const [profile, setProfile] = useState({
    fullName: 'vdrive',
    jobTitle: 'Recruitment Operations',
    email: '',
    location: ''
  });

  const [workflow, setWorkflow] = useState({
    refreshInterval: 'Every 5 Minutes',
    matchThreshold: 85,
    smartPrioritization: true
  });

  const [emailSettings, setEmailSettings] = useState({
    signature: 'Regards,\nvdrive'
  });

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (data) {
        setProfile(data.profile || profile);
        setWorkflow(data.workflow || workflow);
        setEmailSettings(data.emailSettings || emailSettings);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('vdrive_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(parsed.profile || profile);
          setWorkflow(parsed.workflow || workflow);
          setEmailSettings(parsed.emailSettings || emailSettings);
        }
      }
    } catch (error) {
      console.warn('Could not load from DB, using local fallback:', error);
      const saved = localStorage.getItem('vdrive_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(parsed.profile || profile);
        setWorkflow(parsed.workflow || workflow);
        setEmailSettings(parsed.emailSettings || emailSettings);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    const settingsData = { profile, workflow, emailSettings };
    
    try {
      // Save locally first for instant feedback
      localStorage.setItem('vdrive_settings', JSON.stringify(settingsData));

      // Try saving to Supabase
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 1, // Assume single settings row for now
          ...settingsData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to sync settings to DB:', error);
      // Still show success if local save worked, but warn in console
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'workflow', icon: Zap, label: 'Workflow' },
    { id: 'upload', icon: FileUp, label: 'Upload' },
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'security', icon: Lock, label: 'Security' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">vdrive Settings</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your V Drive preferences and recruiting workflow configurations.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50",
            success ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isLoading ? "Saving..." : success ? "Changes Saved" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                activeTab === tab.id 
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn(
                  "w-4 h-4 transition-colors",
                  activeTab === tab.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )} />
                {tab.label}
              </div>
              <ChevronRight className={cn(
                "w-3 h-3 transition-transform opacity-0",
                activeTab === tab.id ? "opacity-100 translate-x-0" : "group-hover:opacity-40 group-hover:translate-x-0.5"
              )} />
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-8">
              {activeTab === 'profile' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                    <div className="h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-100 uppercase">
                      {profile.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Platform Identity</h3>
                      <p className="text-xs text-slate-500 font-medium mb-3">Update your V Drive instance identity for the talent portal.</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Change Photo</button>
                        <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Remove</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Title</label>
                      <input 
                        type="text" 
                        value={profile.jobTitle}
                        onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                      <select 
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      >
                        <option>London (GMT+1)</option>
                        <option>New York (EST)</option>
                        <option>San Francisco (PST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'workflow' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                      <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-indigo-900">Operational Automation</p>
                        <p className="text-xs text-indigo-700/70 font-medium">Configure how the system processes job data and candidate matching algorithms.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Auto-Refresh Interval</p>
                          <p className="text-xs text-slate-500 font-medium text-balance">Update dashboard metrics and new batch results automatically.</p>
                        </div>
                        <select 
                          value={workflow.refreshInterval}
                          onChange={(e) => setWorkflow({ ...workflow, refreshInterval: e.target.value })}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none uppercase tracking-tight"
                        >
                           <option>Every 5 Minutes</option>
                           <option>Every 15 Minutes</option>
                           <option>Manual Only</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">AI Match Threshold</p>
                          <p className="text-xs text-slate-500 font-medium text-balance">Minimum required score to highlight a candidate as a 'Top Match'.</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <input 
                             type="range" 
                             className="accent-indigo-600 h-1.5 w-32 bg-slate-200 rounded-full appearance-none cursor-pointer" 
                             value={workflow.matchThreshold} 
                             onChange={(e) => setWorkflow({ ...workflow, matchThreshold: parseInt(e.target.value) })}
                             min={50} 
                             max={100} 
                           />
                           <span className="text-sm min-w-[32px] font-black text-indigo-600 italic">{workflow.matchThreshold}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Smart Prioritization</p>
                          <p className="text-xs text-slate-500 font-medium text-balance">Automatically rank new jobs based on priority and submission deadlines.</p>
                        </div>
                        <div 
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={() => setWorkflow({ ...workflow, smartPrioritization: !workflow.smartPrioritization })}
                        >
                          <div className={cn(
                            "w-11 h-6 rounded-full transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
                            workflow.smartPrioritization ? "bg-indigo-600 after:translate-x-full after:border-white" : "bg-slate-200"
                          )}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">AI Intelligence Engine</p>
                          <p className="text-xs text-slate-500 font-medium text-balance">Current provider: <strong>Groq</strong>. Used for strategic insights and copy generation.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           {process.env.GROQ_API_KEY ? (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                               <CheckCircle2 className="w-3 h-3" />
                               <span className="text-[10px] font-black uppercase tracking-tight">Connected</span>
                             </div>
                           ) : (
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                               <Info className="w-3 h-3" />
                               <span className="text-[10px] font-black uppercase tracking-tight">Key Required</span>
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <FileUp className="w-4 h-4 text-indigo-500" />
                       Allowed File Formats
                    </h3>
                    <div className="flex flex-wrap gap-2">
                       {['CSV', 'JSON', 'XLSX', 'PDF Profile', 'DOX (Experimental)'].map(format => (
                         <div key={format} className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest group cursor-pointer hover:border-indigo-200 hover:text-indigo-600 transition-all">
                           <input type="checkbox" defaultChecked={format !== 'DOX (Experimental)'} className="accent-indigo-600" />
                           {format}
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden group">
                     <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform duration-500" />
                     <div className="relative z-10">
                        <h4 className="font-bold text-lg mb-2">Automated Data Validation</h4>
                        <p className="text-indigo-200 text-xs mb-6 max-w-lg">Enable AI scanning during upload to automatically detect missing skills, duplicate emails, and incorrect location data.</p>
                        <button className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/20 hover:bg-indigo-400 transition-all">Enable Full Scanning</button>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Signature</label>
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 shadow-inner">
                         <textarea 
                           className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-600 h-24 mb-4 resize-none"
                           value={emailSettings.signature}
                           onChange={(e) => setEmailSettings({ signature: e.target.value })}
                         />
                         <div className="flex gap-2">
                            <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Bold</button>
                            <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Italic</button>
                            <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Add Link</button>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center justify-between">
                         Client Submission Templates
                         <button className="text-indigo-600 font-bold hover:underline">Create New</button>
                      </h3>
                      <div className="space-y-3">
                         {[
                            { name: 'Standard Shortlist', status: 'Default' },
                            { name: 'High Priority Match', status: 'Active' },
                            { name: 'Follow-up / Feedback', status: 'Active' }
                         ].map(template => (
                           <div key={template.name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                   <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-900">{template.name}</span>
                             </div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{template.status}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                           <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Shield className="w-5 h-5 text-indigo-600" />
                           </div>
                           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">Enabled</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">Two-Factor Auth</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Secure your account with a secondary verification code via SMS or app.</p>
                        <button className="text-xs font-bold text-indigo-600 hover:underline">Configuration Settings</button>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                        <div className="flex items-center justify-between mb-4">
                           <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Globe className="w-5 h-5 text-slate-400" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded uppercase tracking-wider">Enterprise Only</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">SSO Login</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Login via Okta, Google Workspace, or Azure AD for your entire team.</p>
                        <button disabled className="text-xs font-bold text-slate-400 cursor-not-allowed">Contact Sales</button>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                        <h4 className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">Danger Zone</h4>
                        <p className="text-xs text-red-600/70 font-medium mb-4">Permanently delete your recruiter account and all associated hiring history.</p>
                        <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all">Deactivate Account</button>
                     </div>
                   </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
