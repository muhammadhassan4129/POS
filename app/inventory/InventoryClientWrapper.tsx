'use client';

import { useState, useMemo } from 'react';
import { deleteProduct, updateProduct } from '@/app/actions/inventory';
import { 
  Trash2, Tag, Edit, X, Ruler, 
  Package, Search, Filter, 
  AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown,
  PlusCircle, Save, 
  Box, Layers, Grid3x3,
  ChevronDown, ChevronUp,
  Eye, EyeOff, RotateCcw
} from 'lucide-react';

export default function InventoryClientWrapper({ products, categories, units }: { products: any[]; categories: any[]; units: any[] }) {
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Stats with animations
  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => p.stockQty > 0 && p.stockQty <= 10).length,
    outOfStock: products.filter(p => p.stockQty <= 0).length,
    onSale: products.filter(p => p.isOnSale).length,
    totalValue: products.reduce((sum, p) => sum + (p.salePrice * p.stockQty), 0),
  }), [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? p.categoryId === filterCategory : true;
      const matchesStock = filterStock === 'all' ? true :
                          filterStock === 'low' ? (p.stockQty > 0 && p.stockQty <= 10) :
                          filterStock === 'out' ? p.stockQty <= 0 :
                          filterStock === 'healthy' ? p.stockQty > 10 : true;
      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, filterCategory, filterStock, sortField, sortDirection]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Stock status helper
  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'rose', icon: <TrendingDown className="w-3 h-3" /> };
    if (qty <= 10) return { label: 'Low Stock', color: 'amber', icon: <AlertTriangle className="w-3 h-3" /> };
    return { label: 'In Stock', color: 'emerald', icon: <CheckCircle className="w-3 h-3" /> };
  };

  // Bulk action for selected products
  const handleBulkAction = async (action: 'delete' | 'markSale') => {
    if (selectedProducts.length === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selectedProducts.length} products?`)) return;
    
    for (const id of selectedProducts) {
      if (action === 'delete') {
        await deleteProduct(id);
      } else if (action === 'markSale') {
        // Bulk mark as sale - you'll need to implement this in your actions
        console.log('Mark as sale:', id);
      }
    }
    setSelectedProducts([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 p-6 space-y-6">
      {/* Page Header with Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200/50">
                <Package className="w-6 h-6 text-white" />
              </div>
              Inventory Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {products.length} products • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="p-2 bg-white border border-slate-200/60 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              {viewMode === 'table' ? <Grid3x3 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </button>
            <button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-indigo-300/50 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Hover Effects */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Products', value: stats.total, icon: Box, color: 'indigo' },
          { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'amber' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: TrendingDown, color: 'rose' },
          { label: 'On Sale', value: stats.onSale, icon: Tag, color: 'emerald' },
          { label: 'Total Value', value: `Rs. ${stats.totalValue.toLocaleString()}`, icon: TrendingUp, color: 'purple' },
        ].map((stat, idx) => (
          <div key={idx} className={`group bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-${stat.color}-200/50 transition-all duration-300 hover:-translate-y-0.5 cursor-default`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
              </div>
              <div className={`p-2.5 bg-${stat.color}-50 rounded-xl text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search, Filter & Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, code, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200/60 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none min-w-[140px]">
            <Filter className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-slate-200/60 rounded-xl pl-10 pr-8 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 md:flex-none min-w-[130px]">
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="w-full bg-white border border-slate-200/60 rounded-xl px-3 py-3 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm appearance-none"
            >
              <option value="all">All Stock</option>
              <option value="healthy">✅ Healthy</option>
              <option value="low">⚠️ Low</option>
              <option value="out">🚫 Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-white rounded-xl p-3 border border-indigo-200/60 shadow-sm flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-slate-700">
            {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('markSale')}
              className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all"
            >
              <Tag className="w-3 h-3 inline mr-1" /> Mark Sale
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-3 h-3 inline mr-1" /> Delete
            </button>
            <button
              onClick={() => setSelectedProducts([])}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Display */}
      {viewMode === 'table' ? (
        // TABLE VIEW
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleAllProducts}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('name')}>
                    Product {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('categoryId')}>
                    Category {sortField === 'categoryId' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('unitId')}>
                    Unit {sortField === 'unitId' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('purchasePrice')}>
                    Cost {sortField === 'purchasePrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('salePrice')}>
                    Sale Price {sortField === 'salePrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:text-indigo-600" onClick={() => toggleSort('stockQty')}>
                    Stock {sortField === 'stockQty' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No products found</p>
                        <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                        <button className="mt-2 text-indigo-600 text-sm font-medium hover:underline">
                          <PlusCircle className="w-4 h-4 inline mr-1" /> Add New Product
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const status = getStockStatus(p.stockQty);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors group ${selectedProducts.includes(p.id) ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(p.id)}
                            onChange={() => toggleProductSelection(p.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-800">{p.name}</p>
                            {p.code && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{p.code}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                            {p.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs hidden lg:table-cell">
                          {p.unit?.shortCode || 'm'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs hidden lg:table-cell">
                          Rs. {p.purchasePrice || p.costPrice || 0}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                          Rs. {p.salePrice}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-${status.color}-50 text-${status.color}-600 border border-${status.color}-200`}>
                            {status.icon}
                            {p.stockQty} {p.unit?.shortCode || 'm'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {p.isOnSale ? (
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] px-2.5 py-1 rounded-full font-semibold border border-rose-200">
                              <Tag className="w-3 h-3" /> SALE
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-0.5">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <form action={deleteProduct.bind(null, p.id)} className="inline-block">
                              <button 
                                type="submit" 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Table Footer with Pagination */}
          <div className="px-6 py-3 border-t border-slate-200/60 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 rounded hover:bg-slate-100 transition-all">Previous</button>
              <button className="px-3 py-1 rounded bg-indigo-600 text-white font-semibold">1</button>
              <button className="px-2 py-1 rounded hover:bg-slate-100 transition-all">2</button>
              <button className="px-2 py-1 rounded hover:bg-slate-100 transition-all">3</button>
              <button className="px-2 py-1 rounded hover:bg-slate-100 transition-all">Next</button>
            </div>
          </div>
        </div>
      ) : (
        // GRID VIEW
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const status = getStockStatus(p.stockQty);
            return (
              <div key={p.id} className="group bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                      {p.code && <p className="text-[10px] text-slate-400 font-mono">#{p.code}</p>}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.id)}
                    onChange={() => toggleProductSelection(p.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200 mt-1"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category</span>
                    <span className="text-slate-700 font-medium">{p.category?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unit</span>
                    <span className="text-slate-700 font-mono">{p.unit?.shortCode || 'm'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sale Price</span>
                    <span className="font-bold text-indigo-600">Rs. {p.salePrice}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Stock</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-${status.color}-50 text-${status.color}-600 border border-${status.color}-200`}>
                      {status.icon} {p.stockQty} {p.unit?.shortCode || 'm'}
                    </span>
                  </div>
                  {p.isOnSale && (
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">
                        <Tag className="w-3 h-3" /> ON SALE
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingProduct(p)}
                    className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <form action={deleteProduct.bind(null, p.id)} className="flex-1">
                    <button 
                      type="submit" 
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT PRODUCT MODAL - Enhanced */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl border border-slate-200/60 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <Edit className="w-4 h-4 text-indigo-600" />
                  </div>
                  Edit Product
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update product details and pricing</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await updateProduct(formData);
                setEditingProduct(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingProduct.id} />

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Category
                  </label>
                  <select
                    name="categoryId"
                    defaultValue={editingProduct.categoryId}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Unit
                  </label>
                  <select
                    name="unitId"
                    defaultValue={editingProduct.unitId}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.shortCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchasePrice"
                    defaultValue={editingProduct.purchasePrice || editingProduct.costPrice || 0}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Sale Price <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    defaultValue={editingProduct.salePrice}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Stock Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="stockQty"
                    defaultValue={editingProduct.stockQty}
                    required
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 p-3 bg-rose-50/50 rounded-xl border border-rose-200/60">
                <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isOnSale"
                    value="true"
                    defaultChecked={editingProduct.isOnSale}
                    className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-2 focus:ring-rose-200"
                  />
                  <Tag className="w-4 h-4 text-rose-500" />
                  <span>Mark as Sale Item</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 hover:shadow-indigo-300/50"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}