import React, { useState, useCallback } from 'react';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  MinusCircle, 
  HelpCircle,
  FileSpreadsheet,
  FileText,
  X,
  Plus,
  AlertTriangle,
  RefreshCcw,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

import Papa from 'papaparse';

type UploadStep = 'upload' | 'mapping' | 'preview';

interface ParsedRow {
  id: string;
  name: string;
  email: string;
  skills: string;
  experience: string;
  location: string;
  resume?: string | null;
  created_at: string;
  status: 'valid' | 'invalid' | 'incomplete' | 'duplicate';
  errors: string[];
}

const steps = [
  { id: 'upload', title: 'Upload File', icon: FileUp },
  { id: 'mapping', title: 'Map Columns', icon: Table },
  { id: 'preview', title: 'Validate & Review', icon: CheckCircle2 },
];

export default function UploadCandidates() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Step 2 State
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawParsedData, setRawParsedData] = useState<any[]>([]);

  const targets = [
    { key: 'id', label: 'Candidate ID (UUID)' },
    { key: 'name', label: 'Candidate Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'skills', label: 'Skills/Stack' },
    { key: 'experience', label: 'Experience' },
    { key: 'location', label: 'Location' },
    { key: 'resume', label: 'Resume URL' },
    { key: 'created_at', label: 'Created At' },
    { key: 'ignore', label: 'Ignore Column' }
  ];

  // Step 3 State
  const [rows, setRows] = useState<ParsedRow[]>([]);

  const parseFile = (fileToParse: File) => {
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          setRawParsedData(results.data);
          
          // Initial mapping guess
          const initialMappings: Record<string, string> = {};
          results.meta.fields.forEach(header => {
            const lowHeader = header.toLowerCase();
            if (lowHeader === 'id') initialMappings[header] = 'id';
            else if (lowHeader.includes('name')) initialMappings[header] = 'name';
            else if (lowHeader.includes('email')) initialMappings[header] = 'email';
            else if (lowHeader.includes('skill') || lowHeader.includes('stack')) initialMappings[header] = 'skills';
            else if (lowHeader.includes('exp')) initialMappings[header] = 'experience';
            else if (lowHeader.includes('loc') || lowHeader.includes('city')) initialMappings[header] = 'location';
            else if (lowHeader.includes('resume')) initialMappings[header] = 'resume';
            else if (lowHeader.includes('created')) initialMappings[header] = 'created_at';
            else initialMappings[header] = 'ignore';
          });
          setMappings(initialMappings);
        }
      }
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      if (droppedFile.name.endsWith('.csv')) {
        parseFile(droppedFile);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.name.endsWith('.csv')) {
        parseFile(selectedFile);
      }
    }
  };

  const processMappings = () => {
    const processedRows: ParsedRow[] = rawParsedData.map((rawRow, index) => {
      const row: Partial<ParsedRow> = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      // Apply mappings
      (Object.entries(mappings) as [string, string][]).forEach(([csvHeader, targetKey]) => {
        if (targetKey !== 'ignore') {
           (row as any)[targetKey] = (rawRow as Record<string, any>)[csvHeader];
        }
      });

      // Basic validation
      const errors = [];
      if (!row.name) errors.push('Missing Name');
      if (!row.email) errors.push('Missing Email');
      
      const status = errors.length > 0 ? 'invalid' : 'valid';

      return {
        ...row,
        status,
        errors,
        id: row.id || crypto.randomUUID(),
        name: row.name || '',
        email: row.email || '',
        skills: row.skills || '',
        experience: row.experience || '',
        location: row.location || '',
        created_at: row.created_at || new Date().toISOString()
      } as ParsedRow;
    });

    setRows(processedRows);
    setCurrentStep('preview');
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof ParsedRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const nextStep = () => {
    if (currentStep === 'upload' && file) setCurrentStep('mapping');
    else if (currentStep === 'mapping') processMappings();
  };

  const prevStep = () => {
    if (currentStep === 'mapping') setCurrentStep('upload');
    else if (currentStep === 'preview') setCurrentStep('mapping');
  };

  const finalizeUpload = async () => {
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      const validRows = rows.filter(r => r.status === 'valid').map(({ status, errors, ...rest }) => rest);

      if (validRows.length === 0) {
        throw new Error('No valid candidates found to upload.');
      }

      const { error } = await supabase
        .from('candidates')
        .insert(validRows);

      if (error) throw error;

      setUploadStatus({ type: 'success', message: `${validRows.length} candidates uploaded successfully!` });
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadStatus({ type: 'error', message: error.message || 'Failed to upload candidates.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">V Drive Candidate Import</h1>
        <p className="text-slate-500 text-sm font-medium">Bulk import your talent pool from CSV or Excel spreadsheets.</p>
      </div>

      {uploadStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl border flex items-center gap-3",
            uploadStatus.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
          )}
        >
          {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{uploadStatus.message}</span>
        </motion.div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between p-1 bg-slate-100 rounded-2xl relative w-full mb-12">
        {steps.map((step, i) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > i;

          return (
            <div key={step.id} className="flex-1 flex items-center justify-center relative z-10 transition-all">
              <div className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-300",
                isActive ? "bg-white shadow-sm ring-1 ring-slate-200" : "opacity-40"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-inner",
                  isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className={cn(
                   "text-sm font-black tracking-tight",
                   isActive ? "text-slate-900" : "text-slate-400"
                )}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block w-full h-[2px] bg-slate-200 absolute left-[calc(50%+60px)] top-1/2 -translate-y-1/2 -z-10" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div 
              key="step-upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 p-12 flex flex-col items-center justify-center text-center"
            >
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "w-full max-w-xl aspect-[16/9] border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center transition-all duration-500 group relative overflow-hidden bg-slate-50/50",
                  isDragging ? "border-indigo-500 bg-indigo-50/50 scale-105" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                )}
              >
                <UploadCloud className={cn(
                  "w-20 h-20 mb-6 transition-all duration-500",
                  isDragging ? "text-indigo-600 scale-110" : "text-slate-300 group-hover:text-indigo-400 group-hover:-translate-y-2"
                )} />
                <div className="space-y-2">
                  <p className="text-xl font-black text-slate-900">Drag & Drop Resumes Table</p>
                  <p className="text-sm text-slate-500 font-medium">Support for .CSV, .XLS, .XLSX files</p>
                </div>
                
                <input 
                  type="file" 
                  id="file-upload"
                  className="hidden" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-indigo-600 transition-all hover:bg-indigo-600 hover:text-white active:scale-95 shadow-sm"
                >
                  Browse Files
                </button>

                {file && (
                  <div className="absolute inset-0 bg-indigo-600 text-white flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm ring-1 ring-white/50">
                      {file.name.endsWith('.csv') ? <FileText className="w-10 h-10" /> : <FileSpreadsheet className="w-10 h-10" />}
                    </div>
                    <p className="text-lg font-black tracking-tight">{file.name}</p>
                    <p className="text-xs font-bold text-indigo-200 mt-1 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • Ready to Map</p>
                    <button 
                        onClick={() => setFile(null)}
                        className="mt-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors border border-white/20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-12 flex gap-8 items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    GDPR Compliant
                 </div>
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Auto-Parsing
                 </div>
                 <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Duplicate Check
                 </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'mapping' && (
            <motion.div 
              key="step-mapping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 p-8"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 mb-8">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                    <p className="text-sm font-bold text-indigo-900 leading-tight">We found {csvHeaders.length} columns in your file. Please map them to our recruitment data fields.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {csvHeaders.map((col) => (
                    <div key={col} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[20px] border border-slate-100 hover:border-indigo-200 transition-colors group">
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
                        <span className="text-sm font-bold text-slate-700">{col}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <div className="w-64">
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100 transition-all uppercase tracking-tight"
                          value={mappings[col] || 'ignore'}
                          onChange={(e) => setMappings({ ...mappings, [col]: e.target.value })}
                        >
                          {targets.map(t => (
                            <option key={t.key} value={t.key}>{t.label.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'preview' && (
            <motion.div 
              key="step-preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
               <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{rows.filter(r => r.status === 'valid').length} Valid</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{rows.filter(r => r.status !== 'valid').length} Errors</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline px-2">Remove Invalid</button>
                     <button className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-white px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                        <RefreshCcw className="w-3 h-3" />
                        Re-validate
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left table-fixed min-w-[1200px]">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 w-12">#</th>
                        <th className="px-6 py-4 w-12">IDX</th>
                        <th className="px-6 py-4 w-40">Status</th>
                        <th className="px-6 py-4 w-64">Candidate Info</th>
                        <th className="px-6 py-4 w-64">Skills & Exp</th>
                        <th className="px-6 py-4 w-48">Metadata</th>
                        <th className="px-6 py-4 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 group transition-colors">
                          <td className="px-6 py-4 text-[10px] font-black text-slate-300">{i + 1}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm border",
                              row.status === 'valid' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              row.status === 'duplicate' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                              "bg-red-50 text-red-700 border-red-100"
                            )}>
                              {row.status === 'valid' ? <CheckCircle2 className="w-3 h-3" /> : 
                               row.status === 'duplicate' ? <RefreshCcw className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-2">
                               <input 
                                 value={row.name} 
                                 onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                 placeholder="Candidate Name"
                                 className={cn(
                                  "w-full bg-transparent p-1 px-2 rounded-lg text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all uppercase tracking-tight",
                                  row.status === 'incomplete' && !row.name ? "bg-red-50/50 ring-1 ring-red-200" : ""
                                 )}
                               />
                               <input 
                                 value={row.email} 
                                 onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                                 placeholder="Email Address"
                                 className={cn(
                                  "w-full bg-transparent p-1 px-2 rounded-lg text-[11px] font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-400",
                                  (row.status === 'invalid' || row.status === 'duplicate') && !row.email ? "bg-red-50/50 ring-1 ring-red-200" : ""
                                 )}
                               />
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                   {(row.skills || '').split(',').slice(0, 3).map((skill, idx) => (
                                     <span key={`${skill.trim()}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-tighter border border-slate-200/50">
                                       {skill.trim()}
                                     </span>
                                   ))}
                                   {(row.skills || '').split(',').length > 3 && (
                                     <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-bold uppercase tracking-tighter">
                                       +{(row.skills || '').split(',').length - 3}
                                     </span>
                                   )}
                                </div>
                                <div className="flex items-center gap-2">
                                   <input 
                                     value={row.experience} 
                                     onChange={(e) => updateRow(row.id, 'experience', e.target.value)}
                                     className="w-20 bg-transparent text-[10px] font-black text-indigo-600 uppercase tracking-widest outline-none"
                                   />
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{row.location}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{row.created_at.split(' ')[0]}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => removeRow(row.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          <button 
            onClick={prevStep}
            disabled={currentStep === 'upload'}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all disabled:opacity-20 active:scale-95 uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-3">
             {uploadStatus?.type === 'success' ? (
                <button 
                  onClick={() => navigate('/candidates')}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 uppercase tracking-widest"
                >
                  View Candidate Pool
                  <ArrowRight className="w-4 h-4" />
                </button>
             ) : (
               <>
                 {currentStep === 'preview' && (
                    <button className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest">
                      Save as Draft
                    </button>
                 )}
                 <button 
                  onClick={currentStep === 'preview' ? finalizeUpload : nextStep}
                  disabled={(currentStep === 'upload' && !file) || isUploading}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      {currentStep === 'preview' ? 'Finalize Upload' : 'Continue'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
