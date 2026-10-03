'use client';

import { useState, useEffect } from 'react';
import { getStoreSettings, updateStoreSettings } from '@/app/actions/settings';
import { 
  Store, Phone, MapPin, FileText, Save, CheckCircle2, 
  Sparkles, Building2, Globe, Mail, Clock, Printer,
  Settings as SettingsIcon, Shield, Award, X
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [receiptFooterMsg, setReceiptFooterMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      const data = await getStoreSettings();
      if (data) {
        setStoreName(data.storeName);
        setPhone(data.phone);
        setAddress(data.address);
        setReceiptFooterMsg(data.receiptFooterMsg);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageType('success');

    const res = await updateStoreSettings({
      storeName,
      phone,
      address,
      receiptFooterMsg,
    });

    if (res.success) {
      setMessage('Settings updated successfully! ✅');
      setMessageType('success');
      setTimeout(() => setMessage(''), 4000);
    } else {
      setMessage('Failed to update settings. Please try again.');
      setMessageType('error');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm text-slate-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">

      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200/50">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              Store & Receipt Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your store details, contact information, and receipt preferences
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-600 font-medium">Settings are saved instantly</span>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
          messageType === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <X className="w-5 h-5 text-rose-500" />
          )}
          {message}
          <button 
            onClick={() => setMessage('')} 
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 space-y-5">

        {/* Store Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Store Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-indigo-500" /> 
              Store Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. FABRIC POS STORE"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">This name appears on receipts and invoices</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-indigo-500" /> 
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0300-1234567"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">Customer support contact number</p>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-500" /> 
            Store Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Shop #5, Main Market, Lahore"
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <p className="text-[10px] text-slate-400 mt-1">Physical location of your store</p>
        </div>

        {/* Receipt Footer Message */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" /> 
            Receipt Footer / Return Policy Message
          </label>
          <textarea
            rows={3}
            value={receiptFooterMsg}
            onChange={(e) => setReceiptFooterMsg(e.target.value)}
            placeholder="e.g. Return valid within 7 days with original bill. Items must be in original condition."
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">This message appears at the bottom of all printed receipts</p>
        </div>

        {/* Preview Section */}
        <div className="border-t border-slate-200/60 pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-indigo-500" />
            Receipt Preview
          </p>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 max-w-xs font-mono text-[11px]">
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <p className="font-bold text-slate-800">{storeName || 'STORE NAME'}</p>
              <p className="text-[10px] text-slate-500">{address || 'Store Address'}</p>
              <p className="text-[10px] text-slate-500">{phone || 'Phone Number'}</p>
            </div>
            <div className="py-2 text-slate-400 text-center text-[10px]">
              <p>━━━━━━━━━━━━━━━━━━━━━━</p>
              <p className="text-slate-600 mt-1">{receiptFooterMsg || 'Thank you for shopping!'}</p>
              <p className="text-[8px] text-slate-400 mt-1">Software Developed By FullStack</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Live preview of how your receipt will look</p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300/50 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Settings
              </>
            )}
          </button>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Changes are applied immediately
          </span>
        </div>
      </form>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Building2, label: 'Store Identity', desc: 'Name, address & contact details' },
          { icon: Printer, label: 'Receipt Settings', desc: 'Customize receipt footer message' },
          { icon: Shield, label: 'Data Security', desc: 'All settings are stored securely' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}