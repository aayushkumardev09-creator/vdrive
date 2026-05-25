import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  ChevronRight,
  MapPin,
  Clock,
  Layers,
  Briefcase,
  X,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

type DataStatus = 'Valid' | 'Incomplete' | 'Skipped' | 'Sent';

interface Candidate {
  id: string;
  name: string;
  email: string;
  skills: string;
  experience: string;
  location: string;
  resume?: string | null;
  created_at: string;
  _info?: string;
  dataStatus?: DataStatus;
}

const mockCandidates: Candidate[] = [];

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<DataStatus | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    skills: '',
    experience: '',
    location: '',
  });

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedData = data.map(item => {
          let status: DataStatus = 'Valid';
          if (item._info === 'sent') {
            status = 'Sent';
          } else if (!item.name || !item.email) {
            status = 'Incomplete';
          }
          
          return {
            ...item,
            dataStatus: status
          };
        });
        setCandidates(mappedData);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.dataStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const updateStatus = (id: string, status: DataStatus) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, dataStatus: status } : c));
  };

  const deleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    const nextSelected = new Set(selectedIds);
    nextSelected.delete(id);
    setSelectedIds(nextSelected);
  };

  const bulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .in('id', idsToDelete);
      
      if (error) throw error;
      
      setCandidates(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error deleting candidates:', error);
      alert('Failed to delete candidates');
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return;
    
    const selectedData = candidates.filter(c => selectedIds.has(c.id));
    const headers = ['Name', 'Email', 'Skills', 'Experience', 'Location', 'Status', 'Sync Date'];
    
    const sanitize = (val: string | undefined | null) => {
      if (!val) return '""';
      // Escape double quotes by doubling them
      const escaped = val.toString().replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvContent = [
      headers.join(','),
      ...selectedData.map(c => [
        sanitize(c.name),
        sanitize(c.email),
        sanitize(c.skills),
        sanitize(c.experience),
        sanitize(c.location),
        sanitize(c._info || 'new'),
        sanitize(c.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.email) {
      alert('Name and Email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([{
          name: newCandidate.name,
          email: newCandidate.email,
          skills: newCandidate.skills,
          experience: newCandidate.experience,
          location: newCandidate.location,
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCandidates(prev => [{
          ...data,
          dataStatus: 'Valid'
        }, ...prev]);
        setShowAddModal(false);
        setNewCandidate({
          name: '',
          email: '',
          skills: '',
          experience: '',
          location: '',
        });
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Failed to add candidate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: DataStatus) => {
    switch (status) {
      case 'Valid': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Incomplete': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'Skipped': return <MinusCircle className="w-3.5 h-3.5" />;
      case 'Sent': return <CheckCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">V Drive Candidates Pool</h1>
          <p className="text-slate-500 text-sm font-medium">Verify talent integrity and profile verification.</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mr-2" />}
          <button 
            onClick={fetchCandidates}
            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          <button 
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 rotate-180" />
            Import CSV
          </button>
          <button 
            onClick={handleExportSelected}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Selected
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 bg-slate-50/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500/30 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
              {(['All', 'Sent', 'Valid', 'Incomplete', 'Skipped'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    statusFilter === s 
                      ? (s === 'Sent' ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-900 text-white shadow-sm")
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
              <Layers className="w-3.5 h-3.5" />
              Batch ID
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
              <Filter className="w-3.5 h-3.5" />
              More Filters
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">{selectedIds.size} Selected</span>
                <div className="h-4 w-px bg-indigo-200 mx-1" />
                <button className="text-[10px] font-bold text-indigo-600 hover:underline">Mark as Valid</button>
                <button className="text-[10px] font-bold text-indigo-600 hover:underline">Move Batch</button>
              </div>
              <button 
                onClick={bulkDelete}
                className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto min-w-[1200px]">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-100/50">
              <tr>
                <th className="w-16 px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                  />
                </th>
                <th className="px-6 py-4">Candidate Profile</th>
                <th className="px-6 py-4">Skills & Exp</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Batch Info</th>
                <th className="px-6 py-4">Data Status</th>
                <th className="px-6 py-4 text-right">Last Sync</th>
                <th className="w-20 px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((c) => (
                <tr 
                  key={c.id} 
                  className={cn(
                    "hover:bg-slate-50 group transition-all",
                    selectedIds.has(c.id) ? "bg-indigo-50/20" : "bg-white"
                  )}
                >
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-600 border border-white shadow-sm ring-1 ring-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase">
                        {c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{c.name}</span>
                        <span className="text-[10px] font-medium text-slate-400 lowercase">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1">
                        {(c.skills || '').split(',').slice(0, 3).map((skill, idx) => (
                          <span key={`${skill.trim()}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-tighter">
                            {skill.trim()}
                          </span>
                        ))}
                        {(c.skills || '').split(',').length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-bold uppercase tracking-tighter">
                            +{(c.skills || '').split(',').length - 3} more
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {c.experience}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      {c.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg w-fit border border-slate-100 group-hover:bg-white transition-colors">
                        <Layers className="w-3.4 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">ID: {c.id.slice(0, 8)}...</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
                        c.dataStatus === 'Sent' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                        c.dataStatus === 'Valid' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                        c.dataStatus === 'Incomplete' ? "bg-amber-50 text-amber-700 border-amber-100" : 
                        "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {getStatusIcon(c.dataStatus || 'Valid')}
                        {c.dataStatus || 'Valid'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">{c.created_at.split(' ')[0]}</span>
                      <span className="text-[11px] font-black text-slate-900">{c.created_at.split(' ')[1] || '00:00:00'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => updateStatus(c.id, 'Valid')}
                         disabled={c.dataStatus === 'Valid'}
                         className={cn(
                           "p-2 rounded-lg transition-colors",
                           c.dataStatus === 'Valid' ? "text-slate-200" : "text-emerald-500 hover:bg-emerald-50"
                         )}
                         title="Mark Valid"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Profile"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteCandidate(c.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCandidates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50">
              <Users className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold text-sm">No candidates found for this selection.</p>
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                className="mt-4 text-indigo-600 font-bold text-xs hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-auto p-4 border-t border-slate-100 bg-white flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          <span>Showing {filteredCandidates.length} of {candidates.length} talent profiles</span>
          <div className="flex items-center gap-4">
             <button className="hover:text-slate-600 disabled:opacity-30" disabled>Previous</button>
             <div className="flex items-center gap-1">
                <span className="text-indigo-600">1</span>
                <span>/</span>
                <span>1</span>
             </div>
             <button className="hover:text-slate-600 disabled:opacity-30" disabled>Next</button>
          </div>
        </div>
      </div>
      {/* Add Candidate Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight">Manual Profile Addition</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Talent Sync v2.4</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCandidate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                      placeholder="e.g. John Smith"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500/30 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                      placeholder="e.g. john@company.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Skills (Comma separated)</label>
                  <input 
                    type="text" 
                    value={newCandidate.skills}
                    onChange={(e) => setNewCandidate({ ...newCandidate, skills: e.target.value })}
                    placeholder="e.g. React, Node.js, Python"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500/30 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience</label>
                    <input 
                      type="text" 
                      value={newCandidate.experience}
                      onChange={(e) => setNewCandidate({ ...newCandidate, experience: e.target.value })}
                      placeholder="e.g. 5+ Years"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500/30 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={newCandidate.location}
                      onChange={(e) => setNewCandidate({ ...newCandidate, location: e.target.value })}
                      placeholder="e.g. London, UK"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Synchronizing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Finalize & Add to Pool
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
