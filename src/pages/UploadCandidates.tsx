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
import * as XLSX from 'xlsx';

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
      complete: async (results) => {
        if (results.meta.fields && results.data.length > 0) {
          setCsvHeaders(results.meta.fields);
          setRawParsedData(results.data);
          
          setIsUploading(true);
          setUploadStatus({ type: 'success', message: 'Analyzing CSV structure with AI...' });

          try {
            const response = await fetch('/api/ai/map-csv', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                headers: results.meta.fields, 
                sampleRow: results.data[0] 
              })
            });

            if (!response.ok) throw new Error('AI Mapping failed');
            
            const data = await response.json();
            setMappings(data.mapping);
            
            processMappings(results.data, data.mapping);
          } catch (error: any) {
             console.error("AI Mapping error:", error);
             setUploadStatus({ type: 'error', message: 'AI Mapping failed. Please map manually.' });
             setCurrentStep('mapping');
          } finally {
             setIsUploading(false);
             setTimeout(() => setUploadStatus(null), 2000);
          }
        }
      }
    });
  };

  const parseExcel = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];
        
        if (json.length > 0) {
          const headers = Object.keys(json[0]);
          setCsvHeaders(headers);
          setRawParsedData(json);
          
          setIsUploading(true);
          setUploadStatus({ type: 'success', message: 'Analyzing Excel structure with AI...' });

          const response = await fetch('/api/ai/map-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              headers, 
              sampleRow: json[0] 
            })
          });

          if (!response.ok) throw new Error('AI Mapping failed');
          
          const responseData = await response.json();
          setMappings(responseData.mapping);
          
          processMappings(json, responseData.mapping);
        }
      } catch (error: any) {
         console.error("AI Mapping error:", error);
         setUploadStatus({ type: 'error', message: 'AI Mapping failed. Please map manually.' });
         setCurrentStep('mapping');
      } finally {
         setIsUploading(false);
         setTimeout(() => setUploadStatus(null), 2000);
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  const parseImage = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsUploading(true);
      setUploadStatus({ type: 'success', message: 'Extracting candidates from image with AI...' });

      try {
        const response = await fetch('/api/ai/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: base64String })
        });

        if (!response.ok) throw new Error('AI Image Parsing failed');
        
        const data = await response.json();
        
        const processedRows: ParsedRow[] = data.candidates.map((cand: any) => {
          const errors = [];
          if (!cand.name) errors.push('Missing Name');
          if (!cand.email) errors.push('Missing Email');
          
          return {
            id: crypto.randomUUID(),
            name: cand.name || '',
            email: cand.email || '',
            skills: cand.skills || '',
            experience: cand.experience || '',
            location: cand.location || '',
            resume: cand.resume || null,
            _info: cand._info || 'Extracted from image',
            created_at: new Date().toISOString(),
            status: errors.length > 0 ? 'invalid' : 'valid',
            errors
          };
        });

        setRows(processedRows);
        setCurrentStep('preview');

      } catch (error: any) {
         console.error("AI Image Parsing error:", error);
         setUploadStatus({ type: 'error', message: 'Failed to extract data from image.' });
      } finally {
         setIsUploading(false);
         setTimeout(() => setUploadStatus(null), 2000);
      }
    };
    reader.readAsDataURL(fileToParse);
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
    if (droppedFile) {
      const isCsv = droppedFile.name.endsWith('.csv');
      const isExcel = droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls');
      const isImage = droppedFile.type.startsWith('image/');

      if (isCsv || isExcel || isImage) {
        setFile(droppedFile);
        if (isCsv) {
          parseFile(droppedFile);
        } else if (isExcel) {
          parseExcel(droppedFile);
        } else if (isImage) {
          parseImage(droppedFile);
        }
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const isCsv = selectedFile.name.endsWith('.csv');
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      const isImage = selectedFile.type.startsWith('image/');
      
      if (isCsv) {
        parseFile(selectedFile);
      } else if (isExcel) {
        parseExcel(selectedFile);
      } else if (isImage) {
        parseImage(selectedFile);
      }
    }
  };

  const processMappings = (rawData = rawParsedData, currentMappings = mappings) => {
    const processedRows: ParsedRow[] = rawData.map((rawRow, index) => {
      const row: Partial<ParsedRow> = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      // Apply mappings
      (Object.entries(currentMappings) as [string, string][]).forEach(([csvHeader, targetKey]) => {
        if (targetKey && targetKey !== 'ignore') {
           const val = (rawRow as Record<string, any>)[csvHeader];
           (row as any)[targetKey] = val !== undefined && val !== null ? String(val) : '';
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
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      
      const errors = [];
      if (!updated.name || !updated.name.trim()) errors.push('Missing Name');
      if (!updated.email || !updated.email.trim()) errors.push('Missing Email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (updated.email && updated.email.trim() && !emailRegex.test(updated.email.trim())) errors.push('Invalid Email Format');

      updated.status = errors.length > 0 ? 'invalid' : 'valid';
      updated.errors = errors;
      return updated;
    }));
  };

  const revalidateAll = () => {
    setRows(prev => prev.map(r => {
      const errors = [];
      if (!r.name || !r.name.trim()) errors.push('Missing Name');
      if (!r.email || !r.email.trim()) errors.push('Missing Email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (r.email && r.email.trim() && !emailRegex.test(r.email.trim())) errors.push('Invalid Email Format');

      return {
        ...r,
        status: errors.length > 0 ? 'invalid' : 'valid',
        errors
      };
    }));
  };

  const removeInvalid = () => {
    setRows(prev => prev.filter(r => r.status === 'valid'));
  };

  const nextStep = () => {
    if (currentStep === 'upload' && file) setCurrentStep('mapping');
    else if (currentStep === 'mapping') processMappings();
  };

  const prevStep = () => {
    if (currentStep === 'mapping') setCurrentStep('upload');
    else if (currentStep === 'preview') setCurrentStep('mapping');
  };

  const finalizeUpload = async (forceAll: boolean = false) => {
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      const batchId = `batch_${new Date().toISOString().replace(/[:T.-]/g, '').slice(0, 14)}`;
      const targetRows = forceAll ? rows : rows.filter(r => r.status === 'valid');
      const formattedRows = targetRows.map(({ status, errors, ...rest }) => ({
        ...rest,
        name: rest.name ? String(rest.name).trim() || "NULL" : "NULL",
        email: rest.email ? String(rest.email).trim() || "NULL" : "NULL",
        skills: rest.skills ? String(rest.skills).trim() || "NULL" : "NULL",
        experience: rest.experience ? String(rest.experience).trim() || "NULL" : "NULL",
        location: rest.location ? String(rest.location).trim() || "NULL" : "NULL",
        batch_id: batchId,
        status: status === 'valid' ? 'Valid' : 'Incomplete',
      }));

      if (formattedRows.length === 0) {
        throw new Error(forceAll ? 'No candidates found to upload.' : 'No valid candidates found. Use Force Upload or fix errors.');
      }

      const { error } = await supabase
        .from('candidates')
        .insert(formattedRows);

      if (error) throw error;

      setUploadStatus({ type: 'success', message: `${formattedRows.length} candidates uploaded successfully!` });
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
                  isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div 
              key="step-upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 p-6 flex flex-col items-center justify-center text-center"
            >
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "w-full max-w-xl aspect-[16/9] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-500 group relative overflow-hidden bg-slate-50/50",
                  isDragging ? "border-blue-500 bg-blue-50/50 scale-105" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                )}
              >
                <UploadCloud className={cn(
                  "w-20 h-20 mb-6 transition-all duration-500",
                  isDragging ? "text-blue-600 scale-110" : "text-slate-300 group-hover:text-blue-400 group-hover:-translate-y-2"
                )} />
                <div className="space-y-2">
                  <p className="text-xl font-black text-slate-900">Drag & Drop Hotlist</p>
                  <p className="text-sm text-slate-500 font-medium">Support for .CSV, .XLS, .XLSX, .PNG, .JPG</p>
                </div>
                
                <input 
                  type="file" 
                  id="file-upload"
                  className="hidden" 
                  accept=".csv,.xlsx,.xls,image/png,image/jpeg" 
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-blue-600 transition-all hover:bg-blue-600 hover:text-white active:scale-95 shadow-sm"
                >
                  Browse Files
                </button>

                {file && (
                  <div className="absolute inset-0 bg-blue-600 text-white flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm ring-1 ring-white/50">
                      {file.name.endsWith('.csv') ? <FileText className="w-10 h-10" /> : <FileSpreadsheet className="w-10 h-10" />}
                    </div>
                    <p className="text-lg font-black tracking-tight">{file.name}</p>
                    <p className="text-xs font-bold text-blue-200 mt-1 font-medium tracking-tight">{(file.size / 1024).toFixed(1)} KB • Ready to Map</p>
                    <button 
                        onClick={() => setFile(null)}
                        className="mt-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors border border-white/20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-12 flex gap-6 items-center justify-center text-[10px] font-black text-slate-300 font-medium tracking-tight">
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
              className="flex-1 p-6"
            >
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 mb-8">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-bold text-blue-900 leading-tight">We found {csvHeaders.length} columns in your file. Please map them to our recruitment data fields.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {csvHeaders.map((col) => (
                    <div key={col} className="flex items-center gap-4 bg-slate-50 p-4 rounded-[20px] border border-slate-100 hover:border-blue-200 transition-colors group">
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                        <span className="text-sm font-bold text-slate-700">{col}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <div className="w-64">
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all tracking-tight"
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
                      <span className="text-[10px] font-black text-slate-600 font-medium tracking-tight">{rows.filter(r => r.status === 'valid').length} Valid</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-[10px] font-black text-slate-600 font-medium tracking-tight">{rows.filter(r => r.status !== 'valid').length} Errors</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={removeInvalid} className="text-[10px] font-black text-red-600 font-medium tracking-tight hover:underline px-2">Remove Invalid</button>
                     <button onClick={revalidateAll} className="flex items-center gap-1 text-[10px] font-black text-blue-600 font-medium tracking-tight hover:bg-white px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                        <RefreshCcw className="w-3 h-3" />
                        Re-validate
                     </button>
                  </div>
               </div>

               <div className="overflow-auto flex-1">
                 <table className="w-full text-left table-fixed min-w-[1200px]">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 w-16">#</th>
                        <th className="px-6 py-4 w-32">Status</th>
                        <th className="px-6 py-4 w-72">Candidate Info</th>
                        <th className="px-6 py-4 w-80">Skills & Exp</th>
                        <th className="px-6 py-4 w-48">Metadata</th>
                        <th className="px-6 py-4 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={row.id} className="hover:bg-slate-50/50 group transition-colors">
                          <td className="px-6 py-4 text-[10px] font-black text-slate-300">{i + 1}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[9px] font-black font-medium tracking-tight inline-flex items-center gap-1.5 shadow-sm border",
                              row.status === 'valid' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              row.status === 'duplicate' ? "bg-blue-50 text-blue-700 border-blue-100" :
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
                                  "w-full bg-transparent p-1 px-2 rounded-lg text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all tracking-tight truncate",
                                  row.status === 'incomplete' && !row.name ? "bg-red-50/50 ring-1 ring-red-200" : ""
                                 )}
                               />
                               <input 
                                 value={row.email} 
                                 onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                                 placeholder="Email Address"
                                 className={cn(
                                  "w-full bg-transparent p-1 px-2 rounded-lg text-[11px] font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-slate-400 truncate",
                                  (row.status === 'invalid' || row.status === 'duplicate') && !row.email ? "bg-red-50/50 ring-1 ring-red-200" : ""
                                 )}
                               />
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                   {(row.skills || '').split(/[,/]/).map(s => s.trim()).filter(Boolean).slice(0, 3).map((skill, idx) => (
                                     <span key={`${skill}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold tracking-tighter border border-slate-200/50 truncate max-w-[150px] inline-block">
                                       {skill}
                                     </span>
                                   ))}
                                   {(row.skills || '').split(/[,/]/).filter(Boolean).length > 3 && (
                                     <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-bold tracking-tighter">
                                       +{(row.skills || '').split(/[,/]/).filter(Boolean).length - 3}
                                     </span>
                                   )}
                                </div>
                                <div className="flex items-center gap-2">
                                   <input 
                                     value={row.experience} 
                                     onChange={(e) => updateRow(row.id, 'experience', e.target.value)}
                                     className="w-20 bg-transparent text-[10px] font-black text-blue-600 font-medium tracking-tight outline-none"
                                   />
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-slate-900 tracking-tight truncate max-w-[150px]" title={row.location}>{row.location}</span>
                               <span className="text-[9px] font-bold text-slate-400 font-medium tracking-tight">{row.created_at.split(' ')[0]}</span>
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
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all disabled:opacity-20 active:scale-95 font-medium tracking-tight"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-3">
             {uploadStatus?.type === 'success' ? (
                <button 
                  onClick={() => navigate('/candidates')}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 font-medium tracking-tight"
                >
                  View Candidate Pool
                  <ArrowRight className="w-4 h-4" />
                </button>
             ) : (
               <>
                 {currentStep === 'preview' && rows.some(r => r.status !== 'valid') && (
                    <button 
                      onClick={() => finalizeUpload(true)}
                      className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-black shadow-sm hover:bg-red-50 transition-all active:scale-95 font-medium tracking-tight"
                    >
                      Force Upload All
                    </button>
                 )}
                 <button 
                  onClick={currentStep === 'preview' ? () => finalizeUpload(false) : nextStep}
                  disabled={(currentStep === 'upload' && !file) || isUploading}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 font-medium tracking-tight"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      {currentStep === 'preview' ? 'Finalize Valid' : 'Continue'}
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
