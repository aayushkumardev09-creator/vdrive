import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-24 h-24 bg-white shadow-xl shadow-slate-200/50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 rotate-12 hover:rotate-0 transition-all duration-500">
          <Compass className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-700 mb-2">
          Page Not Found
        </h2>
        
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Take Me Home
        </button>
      </div>
    </div>
  );
}
