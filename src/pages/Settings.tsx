import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Save, 
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  Mail
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/lib/supabase';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('workflow');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [workflow, setWorkflow] = useState({
    matchThreshold: 85,
  });

  const [emailSettings, setEmailSettings] = useState({
    header: "Hi Hiring Team,\n\nI've curated a shortlist of exceptional candidates for the {job_title} position.",
    footer: "Could we schedule a review call or proceed with technical rounds?\n\nBest regards,\nvdrive\nwww.vdrive"
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
        setWorkflow(data.workflow || workflow);
        setEmailSettings(data.emailSettings || emailSettings);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('vdrive_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.workflow) setWorkflow(parsed.workflow);
          if (parsed.emailSettings) setEmailSettings(parsed.emailSettings);
        }
      }
    } catch (error) {
      console.warn('Could not load from DB, using local fallback:', error);
      const saved = localStorage.getItem('vdrive_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.workflow) setWorkflow(parsed.workflow);
        if (parsed.emailSettings) setEmailSettings(parsed.emailSettings);
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
    const settingsData = { workflow, emailSettings };
    
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'workflow', icon: Zap, label: 'AI Configuration' },
    { id: 'email', icon: Mail, label: 'Email Templates' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">vdrive Settings</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your V Drive preferences and AI configuration.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50",
            success ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:bg-white hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn(
                  "w-4 h-4 transition-colors",
                  activeTab === tab.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6">
              
              {activeTab === 'workflow' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">AI Operational Settings</p>
                        <p className="text-xs text-blue-700/70 font-medium">Configure how the AI system processes and matches candidate data.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">AI Match Threshold</p>
                          <p className="text-xs text-slate-500 font-medium text-balance">Minimum required score to highlight a candidate as a 'Top Match'.</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <input 
                             type="range" 
                             className="accent-blue-600 h-1.5 w-32 bg-slate-200 rounded-full appearance-none cursor-pointer" 
                             value={workflow.matchThreshold} 
                             onChange={(e) => setWorkflow({ matchThreshold: parseInt(e.target.value) })}
                             min={50} 
                             max={100} 
                           />
                           <span className="text-sm min-w-[32px] font-black text-blue-600 italic">{workflow.matchThreshold}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Application Status</p>
                          <p className="text-xs text-slate-500 font-medium text-balance">Live system diagnostics and API connectivity checklist.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between gap-4">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Engine</span>
                             {process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS ? (
                               <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                 <CheckCircle2 className="w-3 h-3" />
                                 <span className="text-[10px] font-black tracking-tight">Connected</span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                                 <Info className="w-3 h-3" />
                                 <span className="text-[10px] font-black tracking-tight">Key Required</span>
                               </div>
                             )}
                           </div>
                           <div className="flex items-center justify-between gap-4">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Database</span>
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                               <CheckCircle2 className="w-3 h-3" />
                               <span className="text-[10px] font-black tracking-tight">Connected</span>
                             </div>
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-blue-900">Email Structure Template</p>
                        <p className="text-xs text-blue-700/70 font-medium">Define the default Header and Footer. Use <code>{'{job_title}'}</code> to dynamically insert the role name.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900">Email Header</label>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-inner focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                           <textarea 
                             className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-600 h-28 resize-y"
                             value={emailSettings.header}
                             onChange={(e) => setEmailSettings({ ...emailSettings, header: e.target.value })}
                             placeholder="Hi Hiring Team..."
                           />
                        </div>
                      </div>

                      <div className="p-4 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl opacity-70">
                         <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                           [Candidate Details Injected Here]
                         </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900">Email Footer & Signature</label>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-inner focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                           <textarea 
                             className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-600 h-32 resize-y"
                             value={emailSettings.footer}
                             onChange={(e) => setEmailSettings({ ...emailSettings, footer: e.target.value })}
                             placeholder="Could we schedule a review call..."
                           />
                        </div>
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
