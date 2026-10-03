'use client';

import { useState } from 'react';
import { returnSale, returnSaleItem } from '@/app/actions/sales';
import {
  Receipt,
  RotateCcw,
  User,
  Calendar,
  CreditCard,
  Banknote,
  ShoppingBag,
  X,
  AlertTriangle,
  Loader2,
  Tag,
  Undo2,
  Printer,
  TrendingUp,
  Search,
} from 'lucide-react';

export default function SalesClient({ sales }: { sales: any[] }) {
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<any>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [refundMethod, setRefundMethod] = useState<'KHATA' | 'CASH'>('KHATA');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  // Full Return Modal States
  const [selectedSaleForFullReturn, setSelectedSaleForFullReturn] = useState<any>(null);
  const [fullRefundMethod, setFullRefundMethod] = useState<'KHATA' | 'CASH'>('KHATA');
  const [loadingSaleId, setLoadingSaleId] = useState<string | null>(null);
  
  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter sales strictly by Invoice Number
  const filteredSales = sales.filter((sale) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return sale.invoiceNo?.toString().toLowerCase().includes(query);
  });

  const totalRevenue = sales.reduce((sum, s) => sum + s.netTotal, 0);
  const totalSales = sales.length;
  const totalItems = sales.reduce((sum, s) => sum + s.items.length, 0);

  const handleOpenReturnModal = (item: any) => {
    setSelectedItemForReturn(item);
    setReturnQty(item.qty);
    setRefundMethod('KHATA');
  };

  const handleProcessItemReturn = async () => {
    if (!selectedItemForReturn || returnQty <= 0) return;
    try {
      setLoadingItemId(selectedItemForReturn.id);
      await returnSaleItem(selectedItemForReturn.id, returnQty, refundMethod);
      setSelectedItemForReturn(null);
    } catch (error: any) {
      alert(error?.message || 'Failed to process item return');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleOpenFullReturnModal = (sale: any) => {
    setSelectedSaleForFullReturn(sale);
    setFullRefundMethod('KHATA');
  };

  const handleProcessFullReturn = async () => {
    if (!selectedSaleForFullReturn) return;
    try {
      setLoadingSaleId(selectedSaleForFullReturn.id);
      await returnSale(selectedSaleForFullReturn.id);
      setSelectedSaleForFullReturn(null);
    } catch (error: any) {
      alert(error?.message || 'Failed to process full return');
    } finally {
      setLoadingSaleId(null);
    }
  };

  // Reprint Receipt Handler
  const handlePrintReceipt = (sale: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Please allow popups for this website to print receipts.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${sale.invoiceNo}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: #000;
              width: 58mm;
              margin: 0;
              padding: 5px;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { font-size: 11px; text-align: left; padding: 2px 0; }
            th { border-bottom: 1px solid #000; }
            .right { text-align: right; }
            .mt-2 { margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="text-center border-b">
            <h3 style="margin: 0; font-size: 14px;">STORE RECEIPT</h3>
            <p style="margin: 2px 0;">Invoice #${sale.invoiceNo}</p>
            <p style="margin: 2px 0; font-size: 10px;">${new Date(sale.createdAt).toLocaleString('en-GB')}</p>
          </div>

          <div class="border-b" style="font-size: 11px;">
            <p style="margin: 2px 0;"><strong>Customer:</strong> ${sale.customer ? sale.customer.name : 'Walking Customer'}</p>
            <p style="margin: 2px 0;"><strong>Payment:</strong> ${sale.paymentType}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td class="right">${item.qty}</td>
                  <td class="right">${item.totalPrice}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="border-b mt-2"></div>

          <div style="font-size: 11px;">
            <div class="flex"><span>Subtotal:</span> <span>Rs. ${sale.subtotal}</span></div>
            ${sale.discountAmount > 0 ? `<div class="flex"><span>Discount:</span> <span>-Rs. ${sale.discountAmount}</span></div>` : ''}
            <div class="flex font-bold" style="font-size: 12px; margin-top: 4px;">
              <span>Net Total:</span> <span>Rs. ${sale.netTotal}</span>
            </div>
          </div>

          <div class="text-center mt-2" style="font-size: 10px; margin-top: 15px;">
            <p>Thank you for your business!</p>
            <p>Software Developed By FullStack</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200/50">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              Sales History & Returns
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View past sales invoices, item breakdowns, and process full or item-wise returns
            </p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200/60 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Total Revenue</p>
              <p className="text-lg font-bold text-emerald-600 font-mono">
                Rs. {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Sales', value: totalSales, icon: Receipt, color: 'indigo' },
          { label: 'Total Items Sold', value: totalItems, icon: ShoppingBag, color: 'blue' },
          { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'emerald' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-0.5">
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

      {/* Search Bar Component (Invoice Only) */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice No (e.g. 1001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2.5 rounded-xl transition-all font-medium cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sales Invoices List */}
      <div className="space-y-4">
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600">No invoice found matching "#{searchQuery}"</p>
            <p className="text-sm text-slate-400">Please check the invoice number and try again</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 space-y-4 transition-all hover:shadow-md">
              
              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg text-sm font-mono font-bold">
                    #{sale.invoiceNo}
                  </span>
                  <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(sale.createdAt).toLocaleString('en-GB')}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {sale.customer ? sale.customer.name : 'Walking Customer'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Payment Type Badge */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 ${
                      sale.paymentType === 'CASH'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : sale.paymentType === 'CARD'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}
                  >
                    {sale.paymentType === 'CASH' ? (
                      <Banknote className="w-3.5 h-3.5" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    {sale.paymentType}
                  </span>

                  {/* Print Receipt Button */}
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(sale)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                    title="Print Receipt"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>

                  {/* Full Return Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenFullReturnModal(sale)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Full Return
                  </button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sale.items.map((item: any) => {
                  const hasReturnedBefore = (item.returnedQty || 0) > 0;
                  const isFullyReturned = item.qty <= 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs transition-all hover:border-indigo-200"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                          <ShoppingBag className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{item.product.name}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-white text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            Qty: {item.qty} {item.product.unit?.shortCode || 'm'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            @ Rs. {item.unitPrice}
                          </span>

                          {/* Returned Badge */}
                          {hasReturnedBefore && !isFullyReturned && (
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5">
                              <Undo2 className="w-3 h-3" /> Ret: {item.returnedQty}
                            </span>
                          )}
                          {isFullyReturned && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5">
                              <Undo2 className="w-3 h-3" /> Fully Returned
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-1.5 ml-2 flex-shrink-0">
                        <span className="font-bold text-slate-800 font-mono text-sm block">
                          Rs. {item.totalPrice}
                        </span>

                        {item.qty > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReturnModal({ ...item, sale })}
                            className="bg-white hover:bg-amber-50 text-amber-600 border border-amber-200 text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw className="w-3 h-3" /> Return
                          </button>
                        ) : (
                          <span className="text-[10px] text-rose-500 italic block">Returned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Invoice Summary */}
              <div className="flex flex-wrap justify-end items-center gap-4 pt-2 border-t border-slate-200/60 text-xs font-mono">
                <span className="text-slate-500">
                  Subtotal: <strong className="text-slate-700">Rs. {sale.subtotal}</strong>
                </span>
                {sale.discountAmount > 0 && (
                  <span className="text-rose-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Discount: -Rs. {sale.discountAmount}
                  </span>
                )}
                <span className="text-sm font-bold text-emerald-600">
                  Net Paid: Rs. {sale.netTotal}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ====== ITEM-WISE RETURN MODAL ====== */}
      {selectedItemForReturn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200/60 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  Return Item
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Process item return and restock</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForReturn(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item Details */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1 text-xs">
              <p className="font-bold text-slate-800 text-sm">{selectedItemForReturn.product.name}</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Available to Return:</span>
                <span className="text-indigo-600 font-mono font-bold">
                  {selectedItemForReturn.qty} {selectedItemForReturn.product.unit?.shortCode || 'm'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Price:</span>
                <span className="text-slate-700 font-mono">Rs. {selectedItemForReturn.unitPrice}</span>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Return Quantity ({selectedItemForReturn.product.unit?.shortCode || 'm'}):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedItemForReturn.qty}
                value={returnQty}
                onChange={(e) => setReturnQty(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            {/* Refund Method Selection for Khata Customers */}
            {selectedItemForReturn.sale?.customerId && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                <label className="block text-xs font-semibold text-slate-700">Refund Method (Khata Customer):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('KHATA')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      refundMethod === 'KHATA'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Deduct from Khata
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('CASH')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      refundMethod === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Pay Cash Refund
                  </button>
                </div>
              </div>
            )}

            {/* Refund Amount */}
            <div className="bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-xl flex justify-between text-xs font-mono">
              <span className="text-amber-700 font-medium">Refund Amount:</span>
              <span className="font-bold text-amber-700">
                Rs. {(returnQty * selectedItemForReturn.unitPrice).toFixed(2)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={
                  loadingItemId === selectedItemForReturn.id ||
                  returnQty <= 0 ||
                  returnQty > selectedItemForReturn.qty
                }
                onClick={handleProcessItemReturn}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loadingItemId === selectedItemForReturn.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {loadingItemId === selectedItemForReturn.id ? 'Processing...' : 'Confirm Return'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemForReturn(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== FULL RETURN MODAL ====== */}
      {selectedSaleForFullReturn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200/60 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  Full Invoice Return
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Return entire invoice #{selectedSaleForFullReturn.invoiceNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleForFullReturn(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sale Details Summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1 text-xs">
              <p className="font-bold text-slate-800">Customer: {selectedSaleForFullReturn.customer ? selectedSaleForFullReturn.customer.name : 'Walking Customer'}</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Items:</span>
                <span className="text-slate-700 font-mono">{selectedSaleForFullReturn.items.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Invoice Amount:</span>
                <span className="text-emerald-600 font-mono font-bold">Rs. {selectedSaleForFullReturn.netTotal}</span>
              </div>
            </div>

            {/* Refund Method Selection for Khata Customers on Full Return */}
            {selectedSaleForFullReturn.customerId && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                <label className="block text-xs font-semibold text-slate-700">Full Return Refund Method (Khata Customer):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFullRefundMethod('KHATA')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      fullRefundMethod === 'KHATA'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Deduct from Khata
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullRefundMethod('CASH')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      fullRefundMethod === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Pay Cash Refund
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={loadingSaleId === selectedSaleForFullReturn.id}
                onClick={handleProcessFullReturn}
                className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loadingSaleId === selectedSaleForFullReturn.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {loadingSaleId === selectedSaleForFullReturn.id ? 'Processing...' : 'Confirm Full Return'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSaleForFullReturn(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}