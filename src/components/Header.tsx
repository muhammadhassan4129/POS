'use client';

import { logoutUser } from '@/app/actions/auth';
import { Clock, LogOut, User as UserIcon, Store, Shield, Sparkles } from 'lucide-react';

export default function Header({ currentUser }: { currentUser?: any }) {
  // Role ko cleanly format karna
  const formattedRole = currentUser?.role
    ? currentUser.role.replace('_', ' ')
    : 'USER';

  // Role-based color scheme
  const getRoleColor = (role: string) => {
    if (role.includes('MANAGER')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (role.includes('ADMIN')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (role.includes('SALES')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      {/* Store Status - Left Side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm shadow-indigo-200">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">POS Store</h1>
            <span className="text-[10px] text-slate-400 font-medium">v2.0 • Live</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Store Status:</span>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Store Mode
          </span>
        </div>
      </div>

      {/* Right Side: Date, User Info & Logout */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-slate-600 text-xs bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-medium">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Dynamic User Badge */}
        <div className={`flex items-center gap-2.5 bg-white border px-3 py-1.5 rounded-lg shadow-sm transition-all hover:shadow-md ${getRoleColor(formattedRole)}`}>
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-indigo-200">
              {currentUser?.name ? (
                currentUser.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
          </div>

          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-slate-800 max-w-[130px] truncate">
              {currentUser?.name || 'User'}
            </p>
            <div className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-indigo-500" />
              <p className="text-[10px] font-mono font-semibold text-indigo-600 uppercase">
                {formattedRole}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => logoutUser()}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 px-3.5 py-2 rounded-lg transition-all duration-200 group"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}