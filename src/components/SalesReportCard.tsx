'use client';

import { useState, Fragment } from 'react';
import {
  BarChart3, Search, X, Receipt, Banknote, CreditCard,
  ChevronDown, ChevronUp, ShoppingBag,
} from 'lucide-react';

type Chip = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL';

export default function SalesReportCard({
  data,
}: {
  data: {
    sales: any[];
    todayCount: number;
    todayRevenue: number;
    totalCount: number;
  };
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<Chip>('TODAY');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const chips: { key: Chip; label: string }[] = [
    { key: 'TODAY', label: 'Today' },
    { key: 'YESTERDAY', label: 'Yesterday' },
    { key: 'WEEK', label: 'This Week' },
    { key: 'MONTH', label: 'This Month' },
    { key: 'ALL', label: 'All Time' },
  ];

  const isInRange = (createdAt: string, chip: Chip) => {
    const d = new Date(createdAt);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (chip) {
      case 'TODAY':
        return d >= startOfToday;
      case 'YESTERDAY': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        return d >= start && d < startOfToday;
      }
      case 'WEEK': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        return d >= start;
      }
      case 'MONTH':
        return d >= new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return true;
    }
  };

  const filtered = data.sales.filter((s) => {
    if (!isInRange(s.createdAt, filter)) return false;
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      s.invoiceNo?.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q)
    );
  });

  const totalAmount = filtered.reduce((s, x) => s + x.netTotal, 0);
  const cashAmount = filtered
    .filter((x) => x.paymentType === 'CASH')
    .reduce((s, x) => s + x.netTotal, 0);
  const khataAmount = filtered
    .filter((x) => x.paymentType === 'INSTALLMENT')
    .reduce((s, x) => s + x.netTotal, 0);

  return (
    <>
      {/* ===== STAT CARD ===== */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          setFilter('TODAY');
          setSearchTerm('');
          setExpandedId(null);
        }}
        className="group text-left bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 hover:border-emerald-200/50 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sales Report
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 font-mono mt-2 tracking-tight">
              {data.todayCount}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 group-hover:scale-110 transition-transform duration-300">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1">
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
            Rs. {data.todayRevenue.toLocaleString()} today
          </span>
          <span className="text-[10px] text-slate-400">{data.totalCount} total</span>
        </div>
      </button>

      {/* ===== MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200/60 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Sales Report</h3>
                  <p className="text-xs text-slate-400">
                    Complete sales details with customer & payment info
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
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    filter === c.key
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="p-4 pb-3 border-b border-slate-200/60">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by invoice # or customer name..."
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
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200/60 flex items-center justify-between gap-3 flex-wrap text-xs">
              <span className="text-slate-500">
                <b className="text-slate-700">{filtered.length}</b> sales
              </span>
              <div className="flex items-center gap-3 font-mono flex-wrap">
                <span className="text-emerald-600 font-semibold">
                  💵 Cash: Rs. {cashAmount.toLocaleString()}
                </span>
                <span className="text-amber-600 font-semibold">
                  📋 Khata: Rs. {khataAmount.toLocaleString()}
                </span>
                <span className="font-bold text-slate-800">
                  Total: Rs. {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto px-4 pb-4 pt-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  {searchTerm ? (
                    <>
                      <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        No sale found for &quot;{searchTerm}&quot;
                      </p>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">
                        No sales found in this filter.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200/60 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date / Time</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3 text-center">Items</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((s) => (
                      <Fragment key={s.id}>
                        <tr
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedId(expandedId === s.id ? null : s.id)
                          }
                        >
                          <td className="p-3 font-mono font-bold text-indigo-600 whitespace-nowrap">
                            #{s.invoiceNo}
                          </td>
                          <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleDateString('en-GB')}{' '}
                            {new Date(s.createdAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">{s.customerName}</p>
                            {s.customerPhone && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {s.customerPhone}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            {s.paymentType === 'CASH' ? (
                              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit whitespace-nowrap">
                                <Banknote className="w-3 h-3" /> Cash
                              </span>
                            ) : s.paymentType === 'INSTALLMENT' ? (
                              <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit whitespace-nowrap">
                                <CreditCard className="w-3 h-3" /> Khata
                              </span>
                            ) : (
                              <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                {s.paymentType}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold font-mono">
                              {s.itemCount}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                            Rs. {s.netTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center text-slate-400">
                            {expandedId === s.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded Items Row */}
                        {expandedId === s.id && (
                          <tr className="bg-indigo-50/40">
                            <td colSpan={7} className="p-4">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                                Items Purchased ({s.itemCount})
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {s.items.map((it: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="bg-white border border-slate-200/60 rounded-lg px-3 py-2 text-xs flex justify-between items-center"
                                  >
                                    <span className="text-slate-700 font-medium truncate">
                                      <b className="text-indigo-600 font-mono mr-1.5">x{it.qty}</b>
                                      {it.name}
                                      {it.unitCode && (
                                        <span className="text-slate-400 font-mono text-[10px] ml-1">
                                          ({it.unitCode})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {s.discountAmount > 0 && (
                                <p className="text-[10px] text-rose-500 font-mono mt-2">
                                  Discount applied: -Rs. {s.discountAmount}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
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