'use client';

import { useState, useEffect } from 'react';
import { loginUser } from '@/app/actions/auth';
import { 
  Lock, User, AlertCircle, ShieldCheck, 
  Store, Sparkles, Eye, EyeOff, 
  CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const result = await loginUser(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Save username if remember me is checked
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-y-32 -translate-x-32"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/3 rounded-full blur-3xl"></div>
      
      {/* Animated Dots */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-indigo-400/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-3 h-3 bg-purple-400/20 rounded-full animate-pulse delay-700"></div>
      <div className="absolute top-1/3 right-20 w-1.5 h-1.5 bg-emerald-400/20 rounded-full animate-pulse delay-300"></div>
      <div className="absolute bottom-1/3 left-20 w-2 h-2 bg-amber-400/20 rounded-full animate-pulse delay-500"></div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-2xl shadow-indigo-100/50">
          
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200/50 relative">
                <ShieldCheck className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-500">Sign in to access your POS dashboard</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mt-4 bg-rose-50/80 border border-rose-200/80 text-rose-700 text-sm p-3.5 rounded-2xl flex items-center gap-3 font-medium backdrop-blur-sm animate-in slide-in-from-top-2 fade-in">
              <div className="p-1 bg-rose-100 rounded-full">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              </div>
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-rose-400 hover:text-rose-600 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50/80 border border-slate-200/60 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Demo Hint */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 border-2 border-slate-300 rounded-md peer-checked:bg-indigo-500 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-200 transition-all flex items-center justify-center">
                    {rememberMe && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">
                  Remember me
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Demo:</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">admin / admin123</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 flex items-center justify-center gap-2 mt-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Store className="w-3 h-3" />
                FABRIC POS System v2.0
              </p>
              <p className="text-[9px] text-slate-300 mt-0.5">
                Secure • Fast • Reliable
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} FABRIC POS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}