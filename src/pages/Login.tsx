import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Direct check against the hardcoded admin_users table
      const { data, error: queryError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (queryError || !data) {
        setError('Invalid username or password');
        setIsLoading(false);
        return;
      }

      // Valid login
      login();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-600 rounded-b-[40%] opacity-10 blur-3xl transform -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl transform translate-y-1/2 translate-x-1/4"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-6 transform rotate-3">
          <ShieldCheck className="w-8 h-8 text-white transform -rotate-3" />
        </div>
        <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          vdrive admin
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Sign in to access your secure dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-4 shadow-xl border border-slate-100 rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 text-center font-bold flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all font-medium"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className={cn(
                  "w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-white tracking-widest uppercase transition-all active:scale-[0.98]",
                  (isLoading || !username || !password)
                    ? "bg-slate-300 shadow-none cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
