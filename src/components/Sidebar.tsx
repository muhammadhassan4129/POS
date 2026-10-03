'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  CreditCard,
  RotateCcw,
  Users,
  Settings,
  Store,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS Billing', href: '/pos', icon: ShoppingCart },
  { name: 'Inventory & Stock', href: '/inventory', icon: Package },
  { name: 'Categories & Units', href: '/categories', icon: Tags },
  { name: 'Installments (Khata)', href: '/installments', icon: CreditCard },
  { name: 'Sales & Returns', href: '/sales', icon: RotateCcw },
  { name: 'User Management', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({
  currentUser,
  settings,
}: {
  currentUser?: any;
  settings?: any;
}) {
  const pathname = usePathname();

  // Dynamic Shop Name & Initial Icon Calculation
  const shopName = settings?.shopName || 'FABRIC POS';
  const shopInitial = shopName.trim().charAt(0).toUpperCase();

  // Filter routes based on user role & permissions
  const filteredNavItems = navItems.filter((item) => {
    // Agar user nahi hai ya Super Admin hai toh sab dikhao
    if (!currentUser || currentUser.role === 'SUPER_ADMIN') {
      return true;
    }

    // Yahan se `if (item.href === '/') return true;` hata diya gaya hai 
    // taake Dashboard bhi baqi pages ki tarah permissions ke hisab se filter ho.

    const perm = currentUser.permissions?.find(
      (p: any) => p.pageRoute === item.href
    );
    return perm ? perm.canAccess : false;
  });

  // Role text formatting for footer card
  const userRoleText = currentUser?.role
    ? currentUser.role.replace('_', ' ')
    : 'No Role';

  // Role-based color for user card
  const getRoleColor = (role: string) => {
    if (role.includes('SUPER_ADMIN')) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (role.includes('MANAGER')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (role.includes('ADMIN')) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (role.includes('SALES')) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-sm border-r border-slate-200/60 flex flex-col h-full shadow-sm">
      {/* Brand Header - Dynamic Store Name */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200/60 gap-3 bg-gradient-to-r from-white to-slate-50/50">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-200/50 uppercase text-sm">
            {shopInitial}
          </div>
          <div className="absolute -top-0.5 -right-0.5">
            <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm text-slate-800 tracking-tight truncate uppercase">
            {settings?.storeName || 'FABRIC POS'}
          </h1>
          <p className="text-[10px] text-emerald-600 font-mono font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ONLINE
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'
              }`} />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-white/70" />
              )}
              {!isActive && (
                <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logged In User Profile Box */}
      <div className="p-4 border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50">
        <div className={`rounded-xl p-3 flex items-center gap-3 border transition-all hover:shadow-md ${getRoleColor(userRoleText)}`}>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-indigo-200">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {currentUser?.name || 'Logged User'}
            </p>
            <p className="text-[10px] font-mono font-semibold uppercase flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                userRoleText.includes('SUPER_ADMIN') ? 'bg-rose-500' :
                userRoleText.includes('MANAGER') ? 'bg-purple-500' :
                userRoleText.includes('ADMIN') ? 'bg-indigo-500' :
                'bg-blue-500'
              }`}></span>
              {userRoleText}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}