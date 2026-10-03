'use client';

import { useState, useEffect } from 'react';
import { createSale, addCustomerQuick } from '@/app/actions/pos';
import { 
  Search, ShoppingCart, UserPlus, Printer, X, 
  CreditCard, Banknote, Trash2, Wallet, 
  Sparkles, Plus, Minus, BadgeCheck, 
  Store, Clock, Tag, Users, Coins, Package
} from 'lucide-react';

export default function PosClient({
  products,
  customers,
  settings,
}: {
  products: any[];
  customers: any[];
  settings?: any;
}) {
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [discount, setDiscount] = useState(0);

  // Partial Payment State for Udhaar / Khata
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);

  // Quick Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Receipt Print Modal State
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Load cart from localStorage on page mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it updates
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Reset advance amount if payment type changes
  useEffect(() => {
    if (paymentType === 'CASH') {
      setAdvanceAmount(0);
    }
  }, [paymentType]);

  // Cart Functions
  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, qty: item.qty + 1, totalPrice: (item.qty + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          unitCode: product.unit?.shortCode || 'm',
          unitPrice: product.salePrice,
          qty: 1,
          totalPrice: product.salePrice,
        },
      ]);
    }
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, qty, totalPrice: qty * item.unitPrice } : item
        )
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('pos_cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const netTotal = Math.max(0, subtotal - discount);
  const calculatedAdvance = paymentType === 'INSTALLMENT' ? Math.min(advanceAmount, netTotal) : 0;
  const remainingBalance = paymentType === 'INSTALLMENT' ? Math.max(0, netTotal - calculatedAdvance) : 0;

  // Fast Customer Registration
  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', custName);
    formData.append('phone', custPhone);

    const newCust = await addCustomerQuick(formData);
    if (newCust) {
      customers.push(newCust);
      setSelectedCustomer(newCust.id);
      setIsCustomerModalOpen(false);
      setCustName('');
      setCustPhone('');
    }
  };

  // Process Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentType === 'INSTALLMENT' && !selectedCustomer) {
      alert('Udhaar sale ke liye customer select karna zaroori hai!');
      return;
    }

    const saleData = {
      customerId: selectedCustomer || undefined,
      items: cart.map((c) => ({
        productId: c.productId,
        qty: c.qty,
        unitPrice: c.unitPrice,
        isSaleApplied: false,
        totalPrice: c.totalPrice,
      })),
      subtotal,
      discountAmount: discount,
      netTotal,
      paymentType,
      advancePaid: calculatedAdvance,
      remainingAmount: remainingBalance,
    };

    const res = await createSale(saleData);
    setCompletedSale({
      ...res,
      items: cart,
      customerName: customers.find((c) => c.id === selectedCustomer)?.name || null,
      advancePaid: calculatedAdvance,
      remainingAmount: remainingBalance,
    });

    // Clear Cart & Persistence
    clearCart();
    setDiscount(0);
    setAdvanceAmount(0);
    setSelectedCustomer('');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-indigo-600" />
              Point of Sale
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quick billing & inventory management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200/60">
              <span className="text-xs text-slate-500">Today's Sales</span>
              <p className="text-sm font-bold text-emerald-600">Rs. 12,450</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thermal Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-container,
          #thermal-receipt-container * {
            visibility: visible !important;
          }
          #thermal-receipt-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 78mm !important;
            max-width: 78mm !important;
            padding: 0 2mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Grid */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search fabric name, code or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
  {filteredProducts.length === 0 ? (
    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200/60">
      <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
      <p className="text-sm text-slate-500">No products found</p>
      <p className="text-xs text-slate-400">Try adjusting your search</p>
    </div>
  ) : (
    filteredProducts.map((p) => (
      <div
        key={p.id}
        onClick={() => addToCart(p)}
        className="group bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-lg hover:border-indigo-200 cursor-pointer transition-all duration-200 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between mb-1">
            <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {p.name}
            </p>
          </div>

          {/* Category Name Badge */}
          {p.category?.name && (
            <span className="inline-block text-[10px] font-medium text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md mb-2 border border-indigo-100/50">
              {p.category.name}
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="font-bold text-indigo-600 text-sm">Rs. {p.salePrice}</p>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg ${
              p.stockQty <= 10 
                ? 'bg-red-50 text-red-600 border border-red-200' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {p.stockQty} {p.unit?.shortCode || 'm'}
            </span>
          </div>

          <button 
            className="mt-3 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Plus className="w-3 h-3 inline mr-1" /> Add to Cart
          </button>
        </div>
      </div>
    ))
  )}
</div>
        </div>

        {/* Right Column: Checkout Cart */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 space-y-4 sticky top-6">
            {/* Cart Header */}
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" /> 
                  Current Order
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{cart.length} items in cart</p>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">Your cart is empty</p>
                  <p className="text-xs text-slate-300">Add products from the grid</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Rs. {item.unitPrice} / {item.unitCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-lg transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            step="1"
                            min="0.1"
                            value={item.qty}
                            onChange={(e) => updateQty(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-12 bg-transparent text-center font-mono text-slate-800 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-mono text-emerald-600 font-bold text-sm min-w-[70px] text-right">
                          Rs. {item.totalPrice}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Payment Section */}
            <div className="border-t border-slate-200/60 pt-4 space-y-3">
              {/* Customer Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Customer
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">🚶 Walking Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors border border-indigo-200"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> New
                  </button>
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('CASH')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      paymentType === 'CASH'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                        : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Full Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('INSTALLMENT')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      paymentType === 'INSTALLMENT'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-white border-slate-200/60 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Udhaar / Khata
                  </button>
                </div>
              </div>

              {/* Advance Payment Field */}
              {paymentType === 'INSTALLMENT' && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded-xl">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> Advance Cash Paid:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={netTotal}
                      value={advanceAmount || ''}
                      placeholder="0"
                      onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                      className="w-32 bg-white border border-amber-200/60 rounded-lg px-3 py-1.5 text-right font-mono text-amber-800 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">
                    Max advance: Rs. {netTotal}
                  </p>
                </div>
              )}

              {/* Calculations */}
              <div className="space-y-1.5 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount:</span>
                  <input
                    type="number"
                    value={discount || ''}
                    placeholder="0"
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-slate-200/60 rounded-lg px-2 py-1 text-right font-mono text-slate-800 text-xs focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-600 pt-2 border-t border-slate-200/60">
                  <span>Net Total:</span>
                  <span>Rs. {netTotal.toLocaleString()}</span>
                </div>

                {paymentType === 'INSTALLMENT' && (
                  <>
                    <div className="flex justify-between text-xs text-emerald-600 pt-1 border-t border-slate-200/60">
                      <span>Advance Received:</span>
                      <span>Rs. {calculatedAdvance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-amber-600">
                      <span>Balance Due:</span>
                      <span>Rs. {remainingBalance.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 flex items-center justify-center gap-2"
            >
              <BadgeCheck className="w-4 h-4" />
              Complete Sale & Generate Bill
            </button>
          </div>
        </div>
      </div>

      {/* QUICK CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200/60">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" /> 
                New Customer
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickCustomerSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Customer Name *"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <input
                type="text"
                placeholder="Phone Number (Optional)"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50"
              >
                Save & Select Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* THERMAL PRINT RECEIPT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div
              id="thermal-receipt-container"
              className="bg-white text-black p-3 font-mono text-[11px] leading-tight"
            >
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {settings?.storeName || 'FABRIC POS SHOP'}
                </h2>
                {settings?.address && <p className="text-[10px]">{settings.address}</p>}
                {settings?.phone && <p className="text-[10px]">Tel: {settings.phone}</p>}
                <p className="text-[8px] text-gray-600 mt-1">━━━━━━━━━━━━━━━━━━━━━━━━</p>
              </div>

              {/* Invoice Meta Data */}
              <div className="border-b border-dashed border-black pb-2 mb-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Inv #:</span>
                  <span className="font-bold">#{completedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>
                    {new Date().toLocaleDateString('en-GB')}{' '}
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {completedSale.customerName && (
                  <div className="flex justify-between">
                    <span>Cust:</span>
                    <span className="font-bold truncate max-w-[120px]">{completedSale.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="font-bold">{completedSale.paymentType}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left mb-2 text-[10px]">
                <thead>
                  <tr className="border-b border-black">
                    <th className="pb-1 w-[45%]">Item</th>
                    <th className="pb-1 text-center w-[25%]">Qty</th>
                    <th className="pb-1 text-right w-[30%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {completedSale.items.map((it: any) => (
                    <tr key={it.productId}>
                      <td className="py-1 pr-1 align-top">
                        <div className="font-bold break-words">{it.name}</div>
                        <div className="text-[8px] text-gray-700">@{it.unitPrice}/{it.unitCode}</div>
                      </td>
                      <td className="py-1 text-center align-top font-bold">
                        {it.qty} {it.unitCode}
                      </td>
                      <td className="py-1 text-right align-top font-bold">
                        {it.totalPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-black pt-1.5 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {completedSale.subtotal}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Discount:</span>
                    <span>-Rs. {completedSale.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold border-t border-black pt-1 mt-1">
                  <span>NET TOTAL:</span>
                  <span>Rs. {completedSale.netTotal}</span>
                </div>

                {/* Advance & Due Breakdown for Khata Sales */}
                {completedSale.paymentType === 'INSTALLMENT' && (
                  <div className="border-t border-dotted border-black pt-1 mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Advance Cash Paid:</span>
                      <span className="font-bold">Rs. {completedSale.advancePaid || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span>Balance (Khata Due):</span>
                      <span>Rs. {completedSale.remainingAmount || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="text-center text-[8px] border-t border-dashed border-black pt-2 mt-2 space-y-0.5 uppercase">
                <p className="font-bold">
                  {settings?.receiptFooterMsg || 'Thank you for shopping!'}
                </p>
                <p className="text-[7px] text-gray-500">Visit again!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2.5 px-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200/50"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}