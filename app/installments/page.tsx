'use client';

import { useState, useEffect } from 'react';
import { getInstallmentsData, addCustomer, recordCustomerPayment, deleteCustomer, getInvoiceByNumber } from '@/app/actions/installments';
import {
  CreditCard, UserPlus, Phone, CheckCircle, DollarSign, Trash2,
  History, Wallet, ShoppingBag,
  User, Search, X, Users, TrendingUp,
  Calendar, FileText, PlusCircle, Sparkles, MessageSquare
} from 'lucide-react';

export default function InstallmentsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fname: '',
    village: '',
    reference: '',
    phone: '',
    cnic: ''
  });

  // Invoice Search States
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getInstallmentsData();
        setCustomers(data.customers || []);
        if (data.customers && data.customers.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data.customers[0].id);
        }
      } catch (error) {
        console.error('Failed to load installments:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [refreshKey]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm) ||
      c.village?.toLowerCase().includes(searchTerm.toLowerCase());
    const customerDue = (c.installments || []).reduce(
      (sum: number, inst: any) => sum + (inst.remainingAmount || 0), 0
    );
    const displayDue = c.totalDue ?? customerDue;
    const matchesStatus = filterStatus === 'all' ? true :
      filterStatus === 'hasDue' ? displayDue > 0 :
        filterStatus === 'cleared' ? displayDue === 0 : true;
    return matchesSearch && matchesStatus;
  });

  const totalUdhaar = customers.reduce((sum: number, customer: any) => {
    const customerDue = (customer.installments || []).reduce(
      (instSum: number, inst: any) => instSum + (inst.remainingAmount || 0), 0
    );
    return sum + (customer.totalDue ?? customerDue);
  }, 0);

  const totalCustomers = customers.length;
  const activeDueCustomers = customers.filter(c => {
    const due = (c.installments || []).reduce((s: number, inst: any) => s + (inst.remainingAmount || 0), 0);
    return (c.totalDue ?? due) > 0;
  }).length;

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataObj = new FormData();
    formDataObj.append('name', formData.name);
    formDataObj.append('fname', formData.fname || '');
    formDataObj.append('village', formData.village || '');
    formDataObj.append('reference', formData.reference || '');
    formDataObj.append('phone', formData.phone || '');
    formDataObj.append('cnic', formData.cnic || '');

    await addCustomer(formDataObj);
    setRefreshKey(prev => prev + 1);
    setIsModalOpen(false);
    setFormData({ name: '', fname: '', village: '', reference: '', phone: '', cnic: '' });
  };

  // Fixed Delete Customer Handler
  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Kya aap waqai is customer aur iska poora khata delete karna chahte hain?')) {
      const data = new FormData();
      data.append('id', customerId);
      await deleteCustomer(data);
      setSelectedCustomerId(null);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleKhataPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    await recordCustomerPayment(formData);
    formElement.reset();
    setRefreshKey(prev => prev + 1);
  };

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const sanitizedQuery = invoiceQuery.replace('#', '').trim();
      const res = await getInvoiceByNumber(sanitizedQuery);

      if (res.success && res.sale) {
        const sale = res.sale;
        const customerId = sale.customer?.id;

        if (customerId) {
          setSelectedCustomerId(customerId);
          setInvoiceQuery('');
        } else {
          setSearchError('This invoice is not linked to any customer account.');
        }
      } else {
        setSearchError(res.message || 'Invoice not found.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Error searching invoice.');
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm text-slate-500 font-medium">Loading khata data...</p>
        </div>
      </div>
    );
  }

  const allCustomerPayments = selectedCustomer
    ? (selectedCustomer.installments || []).flatMap((inst: any) =>
      (inst.payments || []).map((p: any) => ({ ...p, invoiceNo: inst.sale?.invoiceNo }))
    ).sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    : [];

  const customerTotalDue = selectedCustomer
    ? (selectedCustomer.totalDue ?? (selectedCustomer.installments || []).reduce((s: number, i: any) => s + (i.remainingAmount || 0), 0))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Page Header */}
      <div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200/50">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Customer Khata & Shopping Ledger
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Centralized account management with tabular shopping history and payment records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearchInvoice} className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-slate-200/60 flex-1 lg:flex-none">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                placeholder="Search Invoice #"
                className="flex-1 lg:w-36 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {searchLoading ? '...' : 'Find'}
              </button>
            </form>

            <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200/60 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Outstanding</p>
                <p className="text-lg font-bold text-amber-600 font-mono">Rs. {totalUdhaar.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {searchError && (
          <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <X className="w-4 h-4" />
            {searchError}
            <button onClick={() => setSearchError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'indigo' },
          { label: 'Active Due', value: activeDueCustomers, icon: TrendingUp, color: 'amber' },
          { label: 'Cleared Accounts', value: totalCustomers - activeDueCustomers, icon: CheckCircle, color: 'emerald' },
          { label: 'Total Outstanding', value: `Rs. ${totalUdhaar.toLocaleString()}`, icon: CreditCard, color: 'rose' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
              </div>
              <div className={`p-2.5 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-200/60 bg-slate-50/80">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Customer List
                </h3>
                <span className="text-xs font-normal text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {customers.length}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, village..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-400"
                >
                  <option value="all">All</option>
                  <option value="hasDue">Has Due</option>
                  <option value="cleared">Cleared</option>
                </select>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg shadow-indigo-200/50 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">No customers found</p>
                </div>
              ) : (
                filteredCustomers.map((customer: any) => {
                  const customerDue = (customer.installments || []).reduce(
                    (sum: number, inst: any) => sum + (inst.remainingAmount || 0), 0
                  );
                  const displayDue = customer.totalDue ?? customerDue;
                  const isSelected = selectedCustomerId === customer.id;

                  return (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`w-full text-left p-3.5 transition-all cursor-pointer ${isSelected
                          ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                          : 'hover:bg-slate-50/80'
                        }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {customer.name} {customer.fname ? <span className="text-xs text-slate-400 font-normal">s/o {customer.fname}</span> : ''}
                          </p>
                          {customer.village && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">Village: {customer.village}</p>
                          )}
                          {customer.phone && (
                            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </p>
                          )}
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <p className="text-[10px] text-slate-400">Total Due</p>
                          <p className={`font-mono font-semibold text-sm ${displayDue > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                            Rs. {displayDue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Customer Table View & Details */}
        <div className="lg:col-span-8">
          {!selectedCustomer ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-600">Select a customer</p>
              <p className="text-sm text-slate-400">Choose a customer from the list to view their complete ledger table</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Customer Info & Top Summary Banner */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedCustomer.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                      {selectedCustomer.fname && <span><b>Father:</b> {selectedCustomer.fname}</span>}
                      {selectedCustomer.village && <span><b>Village:</b> {selectedCustomer.village}</span>}
                      {selectedCustomer.reference && <span><b>Ref:</b> <span className="text-indigo-600 font-semibold">{selectedCustomer.reference}</span></span>}
                      {selectedCustomer.phone && <span className="font-mono"><b>Phone:</b> {selectedCustomer.phone}</span>}
                    </div>
                  </div>
                  {/* Fixed Delete Button */}
                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Delete Customer Khata"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/60">
                  <div>
                    <p className="text-[11px] text-amber-800 uppercase font-bold tracking-wider">Overall Remaining Dues (Khata Balance)</p>
                    <p className="text-2xl font-bold text-amber-600 font-mono mt-0.5">
                      Rs. {customerTotalDue.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 font-semibold shadow-sm">
                    {(selectedCustomer.installments || []).length} Shopping Bills Recorded
                  </span>
                </div>
              </div>

              {/* CENTRALIZED PAYMENT & MESSAGE BOX */}
              {customerTotalDue > 0 && (
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 shadow-xl text-white space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/30 rounded-lg">
                      <DollarSign className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Receive Khata Payment & Add Message</h4>
                      <p className="text-xs text-slate-300">Payment will be adjusted automatically across overall balance with custom note</p>
                    </div>
                  </div>

                  <form onSubmit={handleKhataPayment} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    <input type="hidden" name="customerId" value={selectedCustomer.id} />

                    <div className="sm:col-span-4">
                      <input
                        type="number"
                        step="1"
                        name="amount"
                        required
                        placeholder="Enter Amount (Rs.)"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 font-mono"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <div className="relative">
                        <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          name="notes"
                          placeholder="Message / Details (e.g. Cash received by shopkeeper)"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 🌟 TABLE VIEW FOR SHOPPING HISTORY WITH ADVANCE COLUMN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden space-y-3">
                <div className="p-4 border-b border-slate-200/60 bg-slate-50/80 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Shopping History Table
                  </h4>
                  <span className="text-xs text-slate-400 bg-white px-2.5 py-0.5 rounded-full font-mono border border-slate-200">
                    {(selectedCustomer.installments || []).length} bills
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200/60 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="p-3">Invoice #</th>
                        <th className="p-3">Shopping Date</th>
                        <th className="p-3">Items Purchased</th>
                        <th className="p-3 text-right">Advance Paid</th>
                        <th className="p-3 text-right">Bill Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!selectedCustomer.installments || selectedCustomer.installments.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                            No shopping records found for this customer
                          </td>
                        </tr>
                      ) : (
                        selectedCustomer.installments.map((inst: any) => {
                          const saleItems = inst.sale?.items || [];
                          const netAmount = inst.totalAmount || 0;
                          // Handle advance amount from common variations (`advanceAmount`, `paidAmount`, or `advance`)
                          // Shopping History Table ke andar ye line update karein:
                          const advancePaid = inst.sale?.advancePaid ?? inst.sale?.advance ?? inst.advanceAmount ?? 0;
                          const dateStr = inst.createdAt ? new Date(inst.createdAt).toLocaleDateString('en-GB') : 'N/A';

                          return (
                            <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-mono font-bold text-indigo-600">
                                #{inst.sale?.invoiceNo || 'N/A'}
                              </td>
                              <td className="p-3 font-mono text-slate-600 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {dateStr}
                              </td>
                              <td className="p-3">
                                <div className="space-y-1 max-w-xs">
                                  {saleItems.map((item: any, idx: number) => {
                                    const qty = item.quantity ?? item.qty ?? 1;
                                    const name = item.productName || item.product?.name || item.name || 'Product';
                                    return (
                                      <div key={idx} className="text-slate-700 truncate">
                                        <span className="font-mono font-bold text-indigo-600 mr-1.5">x{qty}</span>
                                        {name}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                                {advancePaid > 0 ? `Rs. ${advancePaid.toLocaleString()}` : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800">
                                Rs. {netAmount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overall Payment & Message Log Table / List */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  Overall Payment & Message History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allCustomerPayments.length === 0 ? (
                    <p className="text-slate-400 text-xs italic py-2">No payment transactions recorded yet</p>
                  ) : (
                    allCustomerPayments.map((pmt: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-mono font-bold text-sm">+ Rs. {pmt.amountPaid.toLocaleString()}</span>
                            {pmt.invoiceNo && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono">
                                Ref Invoice #{pmt.invoiceNo}
                              </span>
                            )}
                          </div>
                          {pmt.notes && (
                            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> {pmt.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {pmt.paymentDate ? new Date(pmt.paymentDate).toLocaleDateString('en-GB') : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====== ADD CUSTOMER MODAL ====== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl border border-slate-200/60 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  Register New Customer
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Father's Name (Walid ka Naam)</label>
                <input
                  type="text"
                  value={formData.fname}
                  onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                  placeholder="e.g. Muhammad Akram"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Village / Area (Gaoon / Ilaka)</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="e.g. Chak No. 42"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reference (Reference Shakhs)</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g. Uncle Name"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 md-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">CNIC Number</label>
                <input
                  type="text"
                  value={formData.cnic}
                  onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  placeholder="17301-XXXXXXX-X"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200/60">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Save Customer
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel: Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}