'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Wallet, Search, X, Banknote, Undo2, MessageSquare,
  User, CalendarDays, ArrowUpRight,
} from 'lucide-react';

type Chip = 'TODAY' | 'MONTH' | 'ALL';

export default function KhataHistoryCard({
  data,
}: {
  data: {
    payments: any[];
    todayCount: number;
    todayTotal: number;
    totalCount: number;
  };
}) {
  const [filter, setFilter] = useState<Chip>('TODAY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const chips: { key: Chip; label: string }[] = [
    { key: 'TODAY', label: 'Today' },
    { key: 'MONTH', label: 'This Month' },
    { key: 'ALL', label: 'All' },
  ];

  // Agar koi bhi date select hui hai to custom range mode ON
  const hasCustomDate = startDate !== '' || endDate !== '';

  const isInRange = (dateStr: string) => {
    // Custom date range chips se zyada priority rakhta hai
    if (hasCustomDate) {
      const d = new Date(dateStr).getTime();
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if (d < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`).getTime();
        if (d > end) return false;
      }
      return true;
    }

    const d = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'TODAY':
        return d >= startOfToday;
      case 'MONTH':
        return d >= new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return true;
    }
  };

  const filtered = data.payments.filter((p) => {
    if (!isInRange(p.paymentDate)) return false;

    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      p.customerName?.toLowerCase().includes(q) ||
      p.customerVillage?.toLowerCase().includes(q) ||
      p.customerPhone?.includes(q) ||
      p.invoiceNo?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  const totalReceived = filtered.reduce((s, p) => s + p.amountPaid, 0);
  const cashTotal = filtered
    .filter((p) => p.type === 'CASH')
    .reduce((s, p) => s + p.amountPaid, 0);
  const returnTotal = filtered
    .filter((p) => p.type === 'RETURN_ADJUST')
    .reduce((s, p) => s + p.amountPaid, 0);

  // "Return Adjustment: message" se sirf message nikalta hai
  const getDisplayNote = (notes: string | null) => {
    if (!notes) return null;
    if (notes.startsWith('Return Adjustment')) {
      return notes.replace('Return Adjustment:', '').trim() || 'Khata adjusted for return';
    }
    return notes;
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/60 p-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-4 mb-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
          <Wallet className="w-4 h-4 text-violet-600" />
          Khata History
          <span className="text-[10px] font-normal text-slate-400 ml-1">(Payments & Adjustments)</span>
        </h2>
        <Link
          href="/installments"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 transition-colors"
        >
          Khata Ledger <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Chip Filters */}
      <div className="flex gap-2 flex-wrap mb-3">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setFilter(c.key);
              clearDates();
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
              filter === c.key && !hasCustomDate
                ? 'bg-violet-50 border-violet-300 text-violet-700 shadow-sm'
                : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-[11px] text-slate-700 focus:outline-none font-mono w-[100px] cursor-pointer"
          />
        </div>
        <span className="text-[11px] text-slate-400 font-medium">to</span>
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1.5">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-[11px] text-slate-700 focus:outline-none font-mono w-[100px] cursor-pointer"
          />
        </div>
        {hasCustomDate && (
          <button
            onClick={clearDates}
            className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customer, invoice, note..."
          className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Summary Strip */}
      <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-2 flex-wrap text-[11px]">
        <span className="text-slate-500">
          <b className="text-slate-700">{filtered.length}</b> payments
        </span>
        <div className="flex items-center gap-2.5 font-mono flex-wrap">
          <span className="text-emerald-600 font-semibold">💵 Rs. {cashTotal.toLocaleString()}</span>
          <span className="text-blue-600 font-semibold">🔄 Rs. {returnTotal.toLocaleString()}</span>
          <span className="font-bold text-slate-800">Total: Rs. {totalReceived.toLocaleString()}</span>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-slate-200/60">
            <Wallet className="w-8 h-8 text-slate-300" />
            <p className="font-medium text-slate-600">No account payment found.</p>
            <p className="text-[11px] text-slate-400">
              {searchTerm
                ? `No result for "${searchTerm}"`
                : 'No payment records found.'}
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const displayNote = getDisplayNote(p.notes);
            return (
              <div
                key={p.id}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 hover:border-violet-200 transition-all duration-200 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Customer + Note */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {p.customerName}
                      </span>
                      {p.invoiceNo && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono border border-indigo-100">
                          #{p.invoiceNo}
                        </span>
                      )}
                    </div>
                    {p.customerVillage && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.customerVillage}</p>
                    )}
                    {displayNote && (
                      <p className="text-[11px] text-slate-600 mt-1.5 flex items-start gap-1.5 bg-white border border-slate-200/60 rounded-lg px-2 py-1.5">
                        <MessageSquare className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="font-medium">{displayNote}</span>
                      </p>
                    )}
                  </div>

                  {/* Right: Amount + Type + Time */}
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-emerald-600 text-sm block whitespace-nowrap">
                      + Rs. {p.amountPaid.toLocaleString()}
                    </span>
                    <div className="mt-1 flex flex-col items-end gap-1">
                      {p.type === 'CASH' ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 whitespace-nowrap">
                          <Banknote className="w-2.5 h-2.5" /> Cash Payment
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 whitespace-nowrap">
                          <Undo2 className="w-2.5 h-2.5" /> Return Adjust
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('en-GB')}{' '}
                        {new Date(p.paymentDate).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}