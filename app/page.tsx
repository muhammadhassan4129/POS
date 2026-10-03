import { getDashboardStats } from '@/app/actions/dashboard';
import { getCurrentUser } from '@/app/actions/auth'; // Farz karein aapke paas current user nikalne ka action hai
import { redirect } from 'next/navigation';
import { DollarSign, ShoppingBag, AlertTriangle, CreditCard, ArrowUpRight, Clock, User, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  // 1. Current logged-in user aur uski permissions fetch karein
  // (Apne auth action ke mutabiq ise adjust karlein agar function ka naam mukhtalif hai)
  const user = await getCurrentUser();

  // 2. Agar user Super Admin nahi hai, toh check karein ke kya uske paas '/' ka access hai
  if (user && user.role !== 'SUPER_ADMIN') {
    const homePermission = user.permissions?.find((p: any) => p.pageRoute === '/');
    
    // Agar dashboard ka access false ya missing hai
    if (!homePermission || !homePermission.canAccess) {
      // Us pehle page ko dhoondein jiska access user ke paas available ho
      const firstAllowed = user.permissions?.find((p: any) => p.canAccess);
      
      if (firstAllowed) {
        redirect(firstAllowed.pageRoute); // Misal ke tor par /pos ya /inventory par bhej dein
      } else {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200/65 text-center max-w-md">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
              <p className="text-sm text-slate-500 mt-1">
                Aapke paas kisi bhi system page ka access nahi hai. Baraye meharbani Administrator se rabta karein.
              </p>
            </div>
          </div>
        );
      }
    }
  }

  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          POS Store Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Overview of inventory performance, market receivables, and sales metrics.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-indigo-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Sales Revenue
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 font-mono mt-2 tracking-tight">
                Rs. {stats.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +12.5%
            </span>
            <span className="text-[10px] text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-amber-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Market Outstanding
              </p>
              <h3 className="text-2xl font-bold text-amber-600 font-mono mt-2 tracking-tight">
                Rs. {stats.totalOutstanding.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {stats.totalOutstanding > 0 ? '⚠️ Pending' : '✅ Clear'}
            </span>
          </div>
        </div>

        {/* Active Products */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-indigo-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Products
              </p>
              <h3 className="text-2xl font-bold text-indigo-600 font-mono mt-2 tracking-tight">
                {stats.totalProducts}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              🟢 Live Inventory
            </span>
          </div>
        </div>

        {/* Low Stock */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-red-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Low Stock Alerts
              </p>
              <h3 className="text-2xl font-bold text-red-500 font-mono mt-2 tracking-tight">
                {stats.lowStockCount}
              </h3>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-xl border border-red-100 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {stats.lowStockCount > 0 ? '❗ Needs attention' : '✅ All good'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Low Stock */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 p-6">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-4 mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" /> 
              Low Stock Warning
              <span className="text-[10px] font-normal text-slate-400 ml-1">(&le; 10 Units)</span>
            </h2>
            <Link 
              href="/inventory" 
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 transition-colors"
            >
              Manage Stock <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.lowStockProducts.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-slate-200/60">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <p className="font-medium text-slate-700">All stock levels are healthy!</p>
                <p className="text-[11px] text-slate-400">No items need restocking right now.</p>
              </div>
            ) : (
              stats.lowStockProducts.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 hover:border-red-200 transition-all duration-200 flex items-center justify-between text-xs group"
                >
                  <div>
                    <p className="font-semibold text-slate-800 group-hover:text-slate-900">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Rs. {p.salePrice} / {p.unit.shortCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-mono font-bold text-sm">
                      {p.stockQty} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Sales */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 p-6">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-4 mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-indigo-600" /> 
              Recent Sales Activity
            </h2>
            <Link 
              href="/sales" 
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 transition-colors"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-0.5 space-y-3">
            {stats.recentSales.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-sm font-medium text-slate-700">No transactions yet</p>
                <p className="text-xs text-slate-400 mt-1">Sales will appear here once recorded.</p>
              </div>
            ) : (
              stats.recentSales.map((sale) => (
                <div 
                  key={sale.id} 
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 hover:border-indigo-200 transition-all duration-200 flex items-center justify-between text-xs group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-indigo-600 font-bold text-sm">
                        #{sale.invoiceNo}
                      </span>
                      <span className="text-slate-600 text-[11px] flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200/60">
                        <User className="w-3 h-3 text-slate-400" />
                        {sale.customer ? sale.customer.name : 'Walking Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200/60">
                        {sale.items.length} Items
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                      {new Date(sale.createdAt).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <span className="font-bold text-emerald-600 font-mono text-base block">
                      Rs. {sale.netTotal}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/60">
                      {sale.paymentType}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}