'use client';

import { useState } from 'react';
import { UserX, Search, X, CheckCircle, CalendarDays, Layers } from 'lucide-react';

export default function KhataDefaultersCard({
  data,
}: {
  data: {
    defaulters: any[];
    allPending: any[];
    count: number;
    totalCount: number;
    totalDue: number;
    totalAllDue: number;
  };
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'MONTH' | 'ALL'>('MONTH');

  const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Filter ke hisaab se active list
  const activeList = filter === 'MONTH' ? data.defaulters : data.allPending;

  const filtered = activeList.filter((d) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name?.toLowerCase().includes(q) ||
      d.fname?.toLowerCase().includes(q) ||
      d.village?.toLowerCase().includes(q) ||
      d.phone?.includes(q)
    );
  });

  return (
    <>
      {/* ===== STAT CARD ===== */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          setFilter('MONTH');
          setSearchTerm('');
        }}
        className="group text-left bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-rose-200/50 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Khata Defaulters
            </p>
            <h3 className="text-2xl font-bold text-rose-500 font-mono mt-2 tracking-tight">
              {data.count}
            </h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 group-hover:scale-110 transition-transform duration-300">
            <UserX className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1">
          <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
            {data.count > 0 ? '❗ No payment this month' : '✅ All clear'}
          </span>
        </div>
      </button>

      {/* ===== MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200/60 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                  <UserX className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Khata Defaulters</h3>
                  <p className="text-xs text-slate-400">
                    {filter === 'MONTH' ? (
                      <>No payment received in <b>{monthName}</b></>
                    ) : (
                      <>All customers with pending khata balance</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chip Filters */}
            <div className="px-5 pt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('MONTH')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  filter === 'MONTH'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                    : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Current Month
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  filter === 'MONTH' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {data.count}
                </span>
              </button>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Pending Khata
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  filter === 'ALL' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {data.totalCount}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-200/60 pb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, father name, village or phone..."
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Summary Strip */}
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing <b className="text-slate-700">{filtered.length}</b> of {activeList.length}
                {filter === 'MONTH' ? ' defaulters' : ' pending khata'}
              </span>
              <span className={`font-mono font-bold ${filter === 'MONTH' ? 'text-rose-600' : 'text-indigo-600'}`}>
                Total Due: Rs. {filtered.reduce((s, d) => s + d.totalDue, 0).toLocaleString()}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-y-auto px-4 pb-4 pt-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  {searchTerm ? (
                    <>
                      <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        No customer found for &quot;{searchTerm}&quot;
                      </p>
                    </>
                  ) : filter === 'MONTH' ? (
                    <>
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">Sab clear hai!</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Is month sab customers ne payment kar di hai
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">Koi pending khata nahi</p>
                    </>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200/60 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Village</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3 text-center">Pending Bills</th>
                      <th className="p-3">Items / Suits</th>
                      <th className="p-3">Last Bill</th>
                      {filter === 'ALL' && <th className="p-3 text-center">This Month</th>}
                      <th className="p-3 text-right">Total Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{d.name}</p>
                          {d.fname && (
                            <p className="text-[10px] text-slate-400">s/o {d.fname}</p>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">{d.village || '-'}</td>
                        <td className="p-3 font-mono text-slate-600">{d.phone || '-'}</td>
                        <td className="p-3 text-center">
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-bold">
                            {d.pendingBills}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[200px]">
                          <p className="truncate">
                            {d.itemsPurchased.slice(0, 3).join(', ') || '-'}
                          </p>
                          {d.itemsPurchased.length > 3 && (
                            <p className="text-[10px] text-indigo-500 font-medium">
                              +{d.itemsPurchased.length - 3} more items
                            </p>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {d.lastBillDate
                            ? new Date(d.lastBillDate).toLocaleDateString('en-GB')
                            : '-'}
                        </td>
                        {/* ALL mode me ye extra column dikhega */}
                        {filter === 'ALL' && (
                          <td className="p-3 text-center">
                            {d.paidThisMonth > 0 ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold text-[10px] whitespace-nowrap">
                                ✅ Rs. {d.paidThisMonth.toLocaleString()}
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                                ❌ No Payment
                              </span>
                            )}
                          </td>
                        )}
                        <td className="p-3 text-right font-mono font-bold text-rose-600">
                          Rs. {d.totalDue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}